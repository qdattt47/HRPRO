import { useMemo, useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "./Button";
import { PositionTable } from "./PositionTable";
import { AddPositionModal, type NewPositionData } from "./AddPositionModal";
import { EditPositionModal, type PositionEditData } from "./EditPositionModal";
import { Input } from "./Input";
import type { Employee } from "./EmployeePage";
import { EmployeesListModal } from "./EmployeesListModal";
import { generatePositionShortCode } from "../../utils/employeeCode";

export type Position = {
  id: string;
  maChucVu: string;
  tenChucVu: string;
  moTa?: string;
  capDo?: "ADMIN" | "MANAGER" | "STAFF" | "INTERN" | string;
  quyenHan?: string[];
  trangThai: "active" | "inactive";
  visible: boolean;
  soNhanSu?: number;
};

type Toast = {
  id: string;
  message: string;
};

export default function PositionPage() {
  const seed: Position[] = [
    {
      id: "1",
      maChucVu: "G",
      tenChucVu: "Giám đốc điều hành",
      moTa: "Quản lý toàn bộ hoạt động công ty",
      capDo: "ADMIN",
      quyenHan: ["Toàn quyền hệ thống", "Duyệt ngân sách"],
      trangThai: "active",
      visible: true,
    },
    {
      id: "2",
      maChucVu: "T",
      tenChucVu: "Trưởng phòng",
      moTa: "Quản lý nhân sự và KPI phòng ban",
      capDo: "MANAGER",
      quyenHan: ["Quản lý nhân viên", "Duyệt công", "Xem báo cáo"],
      trangThai: "active",
      visible: true,
    },
    {
      id: "3",
      maChucVu: "N",
      tenChucVu: "Chuyên viên nhân sự",
      moTa: "Quản lý hồ sơ và tuyển dụng",
      capDo: "STAFF",
      quyenHan: ["Thêm nhân viên", "Cập nhật hồ sơ"],
      trangThai: "active",
      visible: true,
    },
  ];

  const [data, setData] = useState<Position[]>(() => {
    const stored = localStorage.getItem("positionsData");
    if (stored) {
      try {
        return JSON.parse(stored) as Position[];
      } catch (error) {
        console.warn("Không đọc được positionsData:", error);
      }
    }
    localStorage.setItem("positionsData", JSON.stringify(seed));
    return seed;
  });
  const [q, setQ] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [page, setPage] = useState(1);
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({});
  const [positionEmployees, setPositionEmployees] = useState<Employee[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const PAGE_SIZE = 4;

  const filtered = useMemo(() => {
    const result = data.filter((d) => {
      if (q && !(d.tenChucVu.toLowerCase().includes(q.toLowerCase()) || d.maChucVu.toLowerCase().includes(q.toLowerCase())))
        return false;
      return true;
    });
    const maxPage = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
    if (page > maxPage) {
      setPage(maxPage);
    }
    return result;
  }, [data, q]);

  useEffect(() => {
    const syncEmployeeCounts = () => {
      try {
        const raw = localStorage.getItem("employeesData");
        if (!raw) {
          setEmployeeCounts({});
          return;
        }
        const employees = JSON.parse(raw) as Employee[];
        const counts = employees.reduce<Record<string, number>>((acc, emp) => {
          acc[emp.position] = (acc[emp.position] || 0) + 1;
          return acc;
        }, {});
        setEmployeeCounts(counts);
      } catch (error) {
        console.warn("Không đọc được employeesData:", error);
        setEmployeeCounts({});
      }
    };

    syncEmployeeCounts();
    window.addEventListener("storage", syncEmployeeCounts);
    window.addEventListener("focus", syncEmployeeCounts);
    return () => {
      window.removeEventListener("storage", syncEmployeeCounts);
      window.removeEventListener("focus", syncEmployeeCounts);
    };
  }, []);

  const generatePosCode = (name: string) => {
    return generatePositionShortCode(name) || "X";
  };

  const addPosition = (pos: NewPositionData) => {
    const finalCode = pos.maChucVu || generatePosCode(pos.tenChucVu);
    const newPosition: Position = {
      ...pos,
      id: uuidv4(),
      maChucVu: finalCode,
      visible: true
    };
    setData((s) => {
      const next = [newPosition, ...s];
      localStorage.setItem("positionsData", JSON.stringify(next));
      return next;
    });
    showToast("Đã thêm chức vụ");
    setOpenAdd(false);
  };

  const updatePosition = (updatedData: PositionEditData) => {
    if (!editingPosition) return;

    setData(s => {
      const next = s.map(pos => pos.id === editingPosition.id ? { ...pos, ...updatedData } : pos);
      localStorage.setItem("positionsData", JSON.stringify(next));
      return next;
    });
    showToast("Đã cập nhật chức vụ");
    setEditingPosition(null);
  };

  const deletePosition = (id: string) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xoá chức vụ này?");
    if (confirmed) {
      setData((s) => {
        const next = s.filter((pos) => pos.id !== id);
        localStorage.setItem("positionsData", JSON.stringify(next));
        return next;
      });
      showToast("Đã xóa chức vụ");
    }
  };

  const showToast = (message: string) => {
    const toastId = uuidv4();
    setToasts((prevToasts) => [...prevToasts, { id: toastId, message }]);
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
    }, 3000);
  };

  const toggleVisibility = (id: string) => {
    setData((s) => {
      const next = s.map((pos) =>
        pos.id === id ? { ...pos, visible: !pos.visible } : pos
      );
      localStorage.setItem("positionsData", JSON.stringify(next));
      return next;
    });
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
  };

  const handleViewEmployees = (position: Position) => {
    setSelectedPosition(position);
    try {
      const raw = localStorage.getItem("employeesData");
      if (!raw) {
        setPositionEmployees([]);
      } else {
        const employees = JSON.parse(raw) as Employee[];
        const filteredEmployees = employees.filter(
          (emp) => emp.position === position.tenChucVu
        );
        setPositionEmployees(filteredEmployees);
      }
    } catch (error) {
      console.warn("Không đọc được employeesData:", error);
      setPositionEmployees([]);
    }
    setEmployeeModalOpen(true);
  };

  const closeEmployeeModal = () => {
    setEmployeeModalOpen(false);
    setPositionEmployees([]);
    setSelectedPosition(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Chức vụ</h1>
          <Button onClick={() => setOpenAdd(true)}>+ Thêm chức vụ</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
                <Input placeholder="Tìm theo tên, mã chức vụ..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
        </div>

        <PositionTable
          data={filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((position) => ({
            ...position,
            soNhanSu: employeeCounts[position.tenChucVu] || 0,
          }))}
          totalCount={filtered.length}
          page={page}
          pageSize={PAGE_SIZE}
          pageCount={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
          onPageChange={setPage}
          onDelete={deletePosition}
          onToggleVisibility={toggleVisibility}
          onEdit={handleEdit}
          onViewEmployees={handleViewEmployees}
        />

        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {toasts.map((toast) => (<div key={toast.id} className="bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-out">{toast.message}</div>))}
        </div>

        <EmployeesListModal
          open={employeeModalOpen}
          onClose={closeEmployeeModal}
          title={
            selectedPosition
              ? `Nhân sự - ${selectedPosition.tenChucVu}`
              : "Nhân sự theo chức vụ"
          }
          employees={positionEmployees}
          description={
            positionEmployees.length
              ? `Có ${positionEmployees.length} nhân viên giữ chức vụ ${selectedPosition?.tenChucVu ?? ""}.`
              : undefined
          }
          emptyDescription="Chưa có nhân viên nào giữ chức vụ này."
        />

        <AddPositionModal open={openAdd} onClose={() => setOpenAdd(false)} onSave={addPosition} />

        <EditPositionModal open={!!editingPosition} onClose={() => setEditingPosition(null)} position={editingPosition} onSave={updatePosition} />

      </div>
    </div>
  );
}
