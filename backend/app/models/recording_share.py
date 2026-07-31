from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RecordingShare(Base):
    __tablename__ = "recording_shares"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recording_id: Mapped[int] = mapped_column(Integer, ForeignKey("recordings.id", ondelete="CASCADE"), nullable=False, index=True)
    shared_with_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    shared_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
