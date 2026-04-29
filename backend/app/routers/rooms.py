import json
import logging
import secrets
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.room import Room
from app.models.user import User
from app.utils.security import decode_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rooms", tags=["Rooms"])

# In-process signaling hub: room_code -> set of connected sockets
_hub: dict[str, set[WebSocket]] = {}


class RoomResponse(BaseModel):
    id: int
    room_code: str
    created_by: int
    is_active: bool

    model_config = {"from_attributes": True}


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
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    code = secrets.token_urlsafe(8)[:12]
    room = Room(room_code=code, created_by=current_user.id)
    db.add(room)
    await db.commit()
    await db.refresh(room)
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
    await db.commit()


@router.websocket("/{code}/ws")
async def room_ws(
    code: str,
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    # Auth via query param — HTTPBearer doesn't work over WS
    payload = decode_token(token) if token else None
    if not payload:
        await websocket.close(code=4001)
        return

    result = await db.execute(select(User).where(User.id == int(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        await websocket.close(code=4001)
        return

    # Verify room exists and is active
    result = await db.execute(
        select(Room).where(Room.room_code == code, Room.is_active.is_(True))
    )
    if not result.scalar_one_or_none():
        await websocket.close(code=4004)
        return

    await websocket.accept()

    peers = _hub.setdefault(code, set())
    peers.add(websocket)

    # Notify others that a peer joined
    await _broadcast(code, {"event": "peer-joined", "peerId": user.id, "name": user.name}, exclude=websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            # Forward all signaling messages to every other peer in the room
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
            dead.add(ws)
    peers -= dead
