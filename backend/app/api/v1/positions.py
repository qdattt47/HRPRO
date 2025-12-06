from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.position import Position
from app.schemas.position import PositionCreate, PositionUpdate, PositionOut

router = APIRouter()

# Lấy danh sách chức vụ
@router.get("/", response_model=list[PositionOut])
def get_positions(db: Session = Depends(get_db)):
    return db.query(Position).all()

# Tạo chức vụ mới
@router.post("/", response_model=PositionOut)
def create_position(position: PositionCreate, db: Session = Depends(get_db)):
    db_position = Position(**position.dict())
    db.add(db_position)
    db.commit()
    db.refresh(db_position)
    return db_position

# Cập nhật chức vụ
@router.put("/{position_id}", response_model=PositionOut)
def update_position(position_id: int, position: PositionUpdate, db: Session = Depends(get_db)):
    db_position = db.query(Position).filter(Position.id == position_id).first()
    if not db_position:
        raise HTTPException(status_code=404, detail="Position not found")

    for key, value in position.dict(exclude_unset=True).items():
        setattr(db_position, key, value)

    db.commit()
    db.refresh(db_position)
    return db_position

# Xóa chức vụ
@router.delete("/{position_id}")
def delete_position(position_id: int, db: Session = Depends(get_db)):
    db_position = db.query(Position).filter(Position.id == position_id).first()
    if not db_position:
        raise HTTPException(status_code=404, detail="Position not found")

    db.delete(db_position)
    db.commit()
    return {"detail": "Position deleted successfully"}
