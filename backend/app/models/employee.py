from sqlalchemy import Column, Integer, String, ForeignKey, DECIMAL, Enum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)  # Mã nhân viên
    name = Column(String(150), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    position_id = Column(Integer, ForeignKey("positions.id"), nullable=False)
    base_salary = Column(DECIMAL(15, 2), nullable=False)
    status = Column(Enum("active", "inactive", name="status_enum"), default="active")
    visible = Column(Integer, default=1)  # 1: hiển thị, 0: ẩn
    join_order = Column(Integer, nullable=False)  # Thứ tự vào công ty
    joined_at = Column(DateTime, server_default=func.now())  # Ngày vào công ty
    photo_url = Column(String(255), nullable=True)  # Hình ảnh nhân viên
    account = Column(String(100), nullable=False)  # Tên tài khoản
    password_hash = Column(String(255), nullable=False)  # Mật khẩu (đã băm)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    department = relationship("Department", back_populates="employees")
    position = relationship("Position", back_populates="employees")
    salaries = relationship("Salary", back_populates="employee", cascade="all,delete-orphan")
