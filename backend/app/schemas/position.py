from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class PositionBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None


class PositionCreate(PositionBase):
    """Payload tạo chức vụ."""


class PositionUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None


class PositionOut(PositionBase):
    id: int

    class Config:
        orm_mode = True
