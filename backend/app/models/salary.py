from sqlalchemy import Column, Integer, ForeignKey, DECIMAL, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Salary(Base):
    __tablename__ = "monthly_salaries"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    total_hours = Column(DECIMAL(10, 2), nullable=False)
    overtime_hours = Column(DECIMAL(10, 2), nullable=False)
    base_salary = Column(DECIMAL(15, 2), nullable=False)
    overtime_salary = Column(DECIMAL(15, 2), nullable=False)
    total_salary = Column(DECIMAL(15, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee", back_populates="salaries")
