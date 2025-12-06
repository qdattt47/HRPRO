from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class DepartmentBase(BaseModel):
    code: str
    name: str
    founded_year: Optional[int] = None
    status: str = "active"


class DepartmentCreate(DepartmentBase):
    """Payload khi tạo phòng ban."""


class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    founded_year: Optional[int] = None
    status: Optional[str] = None


class DepartmentOut(DepartmentBase):
    id: int

    class Config:
        orm_mode = True
