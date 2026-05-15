import json
import logging
import os
import secrets
import tempfile
from datetime import date, datetime, timezone
from typing import Optional

from dateutil import parser as dateutil_parser

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.meeting import MeetingNote, NoteSource
from app.models.room import Room
from app.models.task import Task
from app.models.user import User
from app.services.email_service import send_meeting_invite
from app.services.nlp_service import extract_tasks_ner, urgency_score
from app.services.transcription_service import transcribe_audio
from app.utils.security import decode_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rooms", tags=["Rooms"])

# In-process signaling hub: room_code → set of connected WebSocket connections.
# Scoped to this process — not shared across workers, which is fine for a single-server
# deployment. Multi-server would need a Redis pub/sub backend instead.
_hub: dict[str, set[WebSocket]] = {}


class RoomCreate(BaseModel):
    title: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    invite_emails: list[str] = []


class RoomResponse(BaseModel):
    id: int
    room_code: str
    created_by: int
    is_active: bool
    title: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    transcript: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    participant_count: int = 0

    model_config = {"from_attributes": True}


class TranscribeResponse(BaseModel):
    note_id: int
    transcript: str
    task_count: int


def _parse_deadline(raw: str | None) -> date | None:
    """Try to parse a free-form date string from NER into a date object.
    Returns None if the string is absent or unparseable rather than raising."""
    if not raw:
        return None
    try:
        return dateutil_parser.parse(raw, fuzzy=True).date()
    except Exception:
        return None


async def _get_active_room(code: str, db: AsyncSession) -> Room:
    result = await db.execute(
        select(Room).where(Room.room_code == code, Room.is_active.is_(True))
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found.")
    return room


@router.post("", response_model=RoomResponse, status_code=201)
async def create_room(
    payload: RoomCreate = RoomCreate(),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    code = secrets.token_urlsafe(8)[:12]
    room = Room(
        room_code=code,
        created_by=current_user.id,
        title=payload.title or None,
        scheduled_at=payload.scheduled_at or None,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)

    for email in payload.invite_emails:
        try:
            send_meeting_invite(
                to_email=email,
                title=payload.title or "Meeting",
                scheduled_at=payload.scheduled_at,
                room_code=code,
                invited_by=current_user.name,
            )
        except Exception:
            logger.warning("invite email failed for %s", email)

    return room


@router.get("/{code}", response_model=RoomResponse)
async def get_room(
    code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_active_room(code, db)


@router.delete("/{code}", status_code=204)
async def close_room(
    code: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    room = await _get_active_room(code, db)
    if room.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the host can close this room.")
    room.is_active = False
    room.ended_at = datetime.now(timezone.utc)
    await db.commit()


@router.post("/{code}/transcribe", response_model=TranscribeResponse)
async def transcribe_room(
    code: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept a WebM/WAV audio blob, run Whisper, and auto-create a note + tasks.

    The audio is written to a temp file because Whisper's Python API expects a
    file path, not a bytes buffer. The temp file is deleted in the finally block
    regardless of whether transcription succeeds.

    Accepts inactive rooms -- transcription is often triggered right as the last
    peer disconnects, so requiring is_active=True would cause spurious 404s.
    """
    result = await db.execute(select(Room).where(Room.room_code == code))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found.")

    raw = await file.read()
    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    logger.info("transcribe: received file=%s size=%d suffix=%s user=%s room=%s",
                file.filename, len(raw), suffix, current_user.email, code)

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(raw)
        tmp_path = tmp.name

    try:
        logger.info("transcribe: running whisper on %s", tmp_path)
        text = transcribe_audio(tmp_path)
        logger.info("transcribe: whisper result: %r", text[:200])
    except Exception as exc:
        logger.error("transcribe: whisper failed: %s", exc, exc_info=True)
        raise
    finally:
        os.unlink(tmp_path)

    room.transcript = text
    now = datetime.now(timezone.utc)
    if not room.ended_at:
        room.ended_at = now
    await db.commit()

    meeting_label = room.started_at.strftime("%b %d, %Y %H:%M") if room.started_at else now.strftime("%b %d, %Y %H:%M")
    note = MeetingNote(
        user_id=current_user.id,
        title=f"Meeting {code} -- {meeting_label}",
        content=text,
        source=NoteSource.transcript,
    )
    db.add(note)
    await db.flush()

    previews = extract_tasks_ner(text)
    logger.info("transcribe: NLP extracted %d tasks from transcript", len(previews))
    for p in previews:
        logger.info("  task: %r  assignee=%s  deadline_raw=%s  priority=%s",
                    p.title, p.assignee_name, p.deadline_raw, p.priority)

    workload_result = await db.execute(
        select(Task).where(Task.user_id == current_user.id, Task.is_complete.is_(False))
    )
    workload = len(workload_result.scalars().all())

    for i, p in enumerate(previews):
        deadline = _parse_deadline(p.deadline_raw)
        score = urgency_score(deadline, workload + i)
        logger.info("  saving task %d: deadline=%s score=%s", i, deadline, score)
        task = Task(
            user_id=current_user.id,
            meeting_note_id=note.id,
            title=p.title,
            assignee_name=p.assignee_name,
            deadline=deadline,
            priority=p.priority,
            urgency_score=score,
        )
        db.add(task)

    await db.commit()
    await db.refresh(note)
    logger.info("transcribe: done note_id=%d task_count=%d", note.id, len(previews))
    return TranscribeResponse(note_id=note.id, transcript=text, task_count=len(previews))


@router.websocket("/{code}/ws")
async def room_ws(
    code: str,
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """WebSocket signaling channel for WebRTC peer negotiation.

    Auth is via a ?token= query param instead of an Authorization header because
    the browser WebSocket API does not support custom headers — only query params
    and cookies are available at connection time.

    The hub forwards all messages to every other peer in the room. Peers use these
    forwarded messages to exchange PeerJS peer IDs, then negotiate WebRTC directly
    without further server involvement.
    """
    payload = decode_token(token) if token else None
    if not payload:
        await websocket.close(code=4001)
        return

    result = await db.execute(select(User).where(User.id == int(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        await websocket.close(code=4001)
        return

    result = await db.execute(
        select(Room).where(Room.room_code == code, Room.is_active.is_(True))
    )
    if not result.scalar_one_or_none():
        await websocket.close(code=4004)
        return

    await websocket.accept()

    peers = _hub.setdefault(code, set())
    peers.add(websocket)

    # Record the meeting start time when the first peer connects.
    # Re-fetch room inside the WS handler because the db session from the route
    # dependency is a fresh session, not shared with the REST routes.
    ws_room_result = await db.execute(select(Room).where(Room.room_code == code))
    ws_room = ws_room_result.scalar_one_or_none()
    if ws_room:
        if ws_room.started_at is None:
            ws_room.started_at = datetime.now(timezone.utc)
        # Track the peak number of simultaneous participants.
        if len(peers) > ws_room.participant_count:
            ws_room.participant_count = len(peers)
        await db.commit()

    await _broadcast(code, {"event": "peer-joined", "peerId": user.id, "name": user.name}, exclude=websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            await _broadcast(code, msg, exclude=websocket)
    except WebSocketDisconnect:
        pass
    finally:
        peers.discard(websocket)
        if not peers:
            _hub.pop(code, None)
        await _broadcast(code, {"event": "peer-left", "peerId": user.id, "name": user.name})


async def _broadcast(code: str, payload: dict, exclude: Optional[WebSocket] = None) -> None:
    peers = _hub.get(code, set())
    dead: set[WebSocket] = set()
    for ws in peers:
        if ws is exclude:
            continue
        try:
            await ws.send_text(json.dumps(payload))
        except Exception:
            # Socket died mid-send — collect and remove after iteration.
            dead.add(ws)
    peers -= dead
