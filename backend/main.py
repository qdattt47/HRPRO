from fastapi import FastAPI
from app.api.v1 import departments, positions, employees, work_sessions, salaries

app = FastAPI()

# Đăng ký các router
app.include_router(departments.router, prefix="/api/v1/departments", tags=["Departments"])
app.include_router(positions.router, prefix="/api/v1/positions", tags=["Positions"])
app.include_router(employees.router, prefix="/api/v1/employees", tags=["Employees"])
app.include_router(work_sessions.router, prefix="/api/v1/work_sessions", tags=["Work Sessions"])
app.include_router(salaries.router, prefix="/api/v1/salaries", tags=["Salaries"])
