from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class SalaryBase(BaseModel):
    employee_id: int
    year: int
    month: int
    total_hours: Decimal
    overtime_hours: Decimal
    base_salary: Decimal
    overtime_salary: Decimal
    total_salary: Decimal


class SalaryCreate(SalaryBase):
    """Payload tạo bản ghi lương theo tháng."""


class SalaryOut(SalaryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
