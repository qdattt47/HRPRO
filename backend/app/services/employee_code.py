from sqlalchemy.orm import Session
from app.models.department import Department
from app.models.position import Position
from app.models.employee import Employee

def generate_employee_code(db: Session, department_id: int, position_id: int) -> tuple[str, int]:
    """
    Sinh mã nhân viên theo định dạng: <Mã phòng><Mã chức vụ><Thứ tự vào công ty>
    :param db: session của SQLAlchemy
    :param department_id: id của phòng ban
    :param position_id: id của chức vụ
    :return: mã nhân viên và thứ tự vào công ty
    """

    # Lấy phòng ban và chức vụ từ database
    dept: Department = db.query(Department).filter(Department.id == department_id).first()
    pos: Position = db.query(Position).filter(Position.id == position_id).first()

    if not dept or not pos:
        raise ValueError("Phòng ban hoặc chức vụ không tồn tại")

    # Tìm thứ tự vào công ty (join order)
    max_order = db.query(Employee.join_order).filter(Employee.department_id == department_id).order_by(Employee.join_order.desc()).first()
    
    # Nếu không có nhân viên nào trong phòng ban, join order sẽ là 1
    next_order = (max_order[0] if max_order else 0) + 1

    # Định dạng join_order thành 4 chữ số (ví dụ: 0001, 0002,...)
    order_str = f"{next_order:04d}"

    # Tạo mã nhân viên theo cú pháp: <ma_phong><ma_chuc_vu><join_order_4chuso>
    employee_code = f"{dept.code}{pos.code}{order_str}"

    return employee_code, next_order
