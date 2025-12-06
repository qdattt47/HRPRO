from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class WorkSessionBase(BaseModel):
    employee_id: int
    checkin: datetime
    checkout: Optional[datetime] = None


class WorkSessionCreate(WorkSessionBase):
    """Payload tạo/cập nhật phiên chấm công."""


class WorkSessionOut(WorkSessionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
