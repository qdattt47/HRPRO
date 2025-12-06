import type { Employee } from "./EmployeePage";
import { Modal } from "./Modal";

type EmployeeDetailModalProps = {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
};

export function EmployeeDetailModal({
  open,
  onClose,
  employee,
}: EmployeeDetailModalProps) {
  if (!employee) return null;

  const formatMoney = (value: number) =>
    Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  const formatDate = (value?: string) => {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? "—"
      : new Intl.DateTimeFormat("vi-VN").format(parsed);
  };

  const initials = employee.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Modal open={open} onClose={onClose} title="Thông tin nhân viên">
      <div className="space-y-5 text-sm text-gray-700">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gradient-to-r from-blue-50 to-white p-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-inner flex items-center justify-center text-lg font-semibold text-blue-600">
            {employee.photo ? (
              <img
                src={employee.photo}
                alt={employee.name}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-500">
              Nhân viên
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {employee.name}
            </p>
            <p className="text-sm text-gray-500">{employee.position}</p>
          </div>
          <span
            className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
              employee.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {employee.status === "active" ? "Hoạt động" : "Ngưng"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Mã nhân viên</span>
            <span className="font-medium text-gray-900">{employee.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Phòng ban</span>
            <span className="font-medium text-gray-900">{employee.dept}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Chức vụ</span>
            <span className="font-medium text-gray-900">
              {employee.position}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Lương cơ bản</span>
            <span className="font-semibold text-gray-900">
              {formatMoney(employee.baseSalary)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ngày vào công ty</span>
            <span className="font-medium text-gray-900">{formatDate(employee.joinedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tài khoản</span>
            <span className="font-medium text-gray-900">
              {employee.taiKhoan || "Chưa thiết lập"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Mật khẩu</span>
            <span className="font-medium text-gray-900">
              {employee.matKhau || "Chưa thiết lập"}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
