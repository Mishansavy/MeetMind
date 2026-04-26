from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MeetingNoteCreate(BaseModel):
    title: str
    content: str
    source: str = "text"


class MeetingNoteResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    source: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
