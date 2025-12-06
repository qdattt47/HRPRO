from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeOut, EmployeeUpdate
from app.services.employee_code import generate_employee_code

router = APIRouter()


def serialize_employee(employee: Employee) -> EmployeeOut:
    return EmployeeOut(
        id=employee.id,
        code=employee.code,
        name=employee.name,
        department_id=employee.department_id,
        position_id=employee.position_id,
        department_name=employee.department.name if employee.department else None,
        position_name=employee.position.name if employee.position else None,
        base_salary=float(employee.base_salary),
        status=employee.status,
        join_order=employee.join_order,
        joined_at=employee.joined_at,
        photo_url=employee.photo_url,
        account=employee.account,
        password_hash=employee.password_hash,
        created_at=employee.created_at,
        updated_at=employee.updated_at,
    )


@router.get("/", response_model=list[EmployeeOut])
def list_employees(db: Session = Depends(get_db)):
    employees = (
        db.query(Employee)
        .options(joinedload(Employee.department), joinedload(Employee.position))
        .order_by(Employee.created_at.desc())
        .all()
    )
    return [serialize_employee(emp) for emp in employees]


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = (
        db.query(Employee)
        .options(joinedload(Employee.department), joinedload(Employee.position))
        .filter(Employee.id == employee_id)
        .first()
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return serialize_employee(employee)


@router.post("/", response_model=EmployeeOut)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    employee_code, join_order = generate_employee_code(
        db, employee.department_id, employee.position_id
    )

    db_employee = Employee(
        code=employee_code,
        name=employee.name,
        department_id=employee.department_id,
        position_id=employee.position_id,
        base_salary=employee.base_salary,
        status=employee.status,
        join_order=join_order,
        account=employee.account,
        password_hash=employee.password,
        photo_url=employee.photo_url,
    )

    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return serialize_employee(db_employee)


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)
):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if payload.department_id or payload.position_id:
        new_dept_id = payload.department_id or db_employee.department_id
        new_pos_id = payload.position_id or db_employee.position_id
        if new_dept_id != db_employee.department_id or new_pos_id != db_employee.position_id:
            new_code, new_join_order = generate_employee_code(db, new_dept_id, new_pos_id)
            db_employee.code = new_code
            db_employee.join_order = new_join_order
            db_employee.department_id = new_dept_id
            db_employee.position_id = new_pos_id

    if payload.name is not None:
        db_employee.name = payload.name
    if payload.base_salary is not None:
        db_employee.base_salary = payload.base_salary
    if payload.status is not None:
        db_employee.status = payload.status
    if payload.account is not None:
        db_employee.account = payload.account
    if payload.password is not None:
        db_employee.password_hash = payload.password
    if payload.photo_url is not None:
        db_employee.photo_url = payload.photo_url

    db.commit()
    db.refresh(db_employee)
    return serialize_employee(db_employee)


@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(db_employee)
    db.commit()
    return {"detail": "Employee deleted successfully"}
