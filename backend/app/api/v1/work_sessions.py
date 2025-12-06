from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.work_session import WorkSession
from app.schemas.work_session import WorkSessionCreate, WorkSessionOut
from datetime import datetime

router = APIRouter()

# Lấy danh sách chấm công
@router.get("/", response_model=list[WorkSessionOut])
def get_work_sessions(db: Session = Depends(get_db)):
    return db.query(WorkSession).all()

# Tạo chấm công mới
@router.post("/", response_model=WorkSessionOut)
def create_work_session(work_session: WorkSessionCreate, db: Session = Depends(get_db)):
    db_work_session = WorkSession(**work_session.dict())
    db.add(db_work_session)
    db.commit()
    db.refresh(db_work_session)
    return db_work_session

# Cập nhật giờ làm việc
@router.put("/{work_session_id}", response_model=WorkSessionOut)
def update_work_session(work_session_id: int, work_session: WorkSessionCreate, db: Session = Depends(get_db)):
    db_work_session = db.query(WorkSession).filter(WorkSession.id == work_session_id).first()
    if not db_work_session:
        raise HTTPException(status_code=404, detail="Work session not found")

    for key, value in work_session.dict(exclude_unset=True).items():
        setattr(db_work_session, key, value)

    db.commit()
    db.refresh(db_work_session)
    return db_work_session
