from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentOut

router = APIRouter()

# API lấy danh sách phòng ban
@router.get("/", response_model=list[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

# API tạo mới phòng ban
@router.post("/", response_model=DepartmentOut)
def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    db_department = Department(**department.dict())
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

# API cập nhật phòng ban
@router.put("/{department_id}", response_model=DepartmentOut)
def update_department(department_id: int, department: DepartmentUpdate, db: Session = Depends(get_db)):
    db_department = db.query(Department).filter(Department.id == department_id).first()
    if not db_department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    for key, value in department.dict(exclude_unset=True).items():
        setattr(db_department, key, value)
    
    db.commit()
    db.refresh(db_department)
    return db_department

# API xóa phòng ban
@router.delete("/{department_id}")
def delete_department(department_id: int, db: Session = Depends(get_db)):
    db_department = db.query(Department).filter(Department.id == department_id).first()
    if not db_department:
        raise HTTPException(status_code=404, detail="Department not found")

    db.delete(db_department)
    db.commit()
    return {"detail": "Department deleted successfully"}
