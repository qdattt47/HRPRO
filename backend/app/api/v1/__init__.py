"""Versioned API routers."""

from . import department as departments
from . import positions
from . import employees
from . import work_sessions
from . import salaries

__all__ = [
    "departments",
    "positions",
    "employees",
    "work_sessions",
    "salaries",
]
