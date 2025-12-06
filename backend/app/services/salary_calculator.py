from sqlalchemy.orm import Session
from app.models.salary import Salary
from app.models.employee import Employee
from app.models.work_session import WorkSession
from datetime import datetime

def calculate_salary_for_employee(
    db: Session, employee: Employee, year: int, month: int
) -> Salary:
    # Tính tổng số giờ làm trong tháng
    start_date = datetime(year, month, 1)
    end_date = datetime(year, month + 1, 1) if month != 12 else datetime(year + 1, 1, 1)
    
    work_sessions = db.query(WorkSession).filter(
        WorkSession.employee_id == employee.id,
        WorkSession.checkin >= start_date,
        WorkSession.checkout < end_date
    ).all()

    total_hours = sum((ws.checkout - ws.checkin).total_seconds() / 3600 for ws in work_sessions)

    # Lương cơ bản
    base_salary = employee.base_salary

    # Tính lương làm thêm
    overtime_hours = total_hours - 40
    if overtime_hours > 0:
        base_rate_per_hour = base_salary / 40
        overtime_salary = overtime_hours * base_rate_per_hour * 1.5
    else:
        overtime_hours = 0
        overtime_salary = 0

    total_salary = base_salary + overtime_salary

    # Lưu lương vào bảng monthly_salaries
    salary = Salary(
        employee_id=employee.id,
        year=year,
        month=month,
        total_hours=total_hours,
        overtime_hours=overtime_hours,
        base_salary=base_salary,
        overtime_salary=overtime_salary,
        total_salary=total_salary
    )

    db.add(salary)
    db.commit()
    db.refresh(salary)
    
    return salary
