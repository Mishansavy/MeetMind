from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.models.task import TaskPriority


class TaskCreate(BaseModel):
    title: str
    assignee_name: Optional[str] = None
    deadline: Optional[date] = None
    priority: TaskPriority = TaskPriority.medium
    meeting_note_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    assignee_name: Optional[str] = None
    deadline: Optional[date] = None
    priority: Optional[TaskPriority] = None
    is_complete: Optional[bool] = None


class TaskResponse(BaseModel):
    id: int
    user_id: int
    meeting_note_id: Optional[int]
    title: str
    assignee_name: Optional[str]
    deadline: Optional[date]
    priority: TaskPriority
    is_complete: bool
    urgency_score: Optional[float]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExtractedTaskPreview(BaseModel):
    title: str
    assignee_name: Optional[str] = None
    deadline: Optional[date] = None
    priority: TaskPriority = TaskPriority.medium
    urgency_score: Optional[float] = None


