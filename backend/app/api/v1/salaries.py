from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.salary import Salary
from app.schemas.salary import SalaryOut, SalaryCreate
from app.services.salary_calculator import calculate_salary_for_employee
from datetime import datetime
from app.models.employee import Employee

router = APIRouter()

# Tính lương tháng cho nhân viên
@router.post("/", response_model=SalaryOut)
def calculate_salary(
    year: int,
    month: int,
    employee_id: int,
    db: Session = Depends(get_db)
):
    # Lấy nhân viên từ database
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Tính lương bằng service
    salary = calculate_salary_for_employee(db, employee, year, month)
    return salary

# Lấy lương tháng của nhân viên
@router.get("/{employee_id}/{year}/{month}", response_model=SalaryOut)
def get_salary(employee_id: int, year: int, month: int, db: Session = Depends(get_db)):
    salary = db.query(Salary).filter(
        Salary.employee_id == employee_id,
        Salary.year == year,
        Salary.month == month
    ).first()
    
    if not salary:
        raise HTTPException(status_code=404, detail="Salary not found")

    return salary
