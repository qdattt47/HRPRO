from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class EmployeeBase(BaseModel):
    name: str
    department_id: int
    position_id: int
    base_salary: float
    status: str = "active"
    account: str
    photo_url: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    password: str  # Plain password được lưu/nén ở tầng service


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    department_id: Optional[int] = None
    position_id: Optional[int] = None
    base_salary: Optional[float] = None
    status: Optional[str] = None
    account: Optional[str] = None
    password: Optional[str] = None
    photo_url: Optional[str] = None


class EmployeeOut(BaseModel):
    id: int
    code: str
    name: str
    department_id: int
    position_id: int
    department_name: Optional[str] = None
    position_name: Optional[str] = None
    base_salary: float
    status: str
    join_order: int
    joined_at: datetime
    photo_url: Optional[str] = None
    account: str
    password_hash: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
