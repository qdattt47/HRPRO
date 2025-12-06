import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import type { Employee } from "./EmployeePage";

type AttendanceHistoryRecord = {
  id: string;
  type: "checkin" | "checkout";
  timestamp: string;
  durationHours?: number;
};

const loadHistory = (employeeId: string): AttendanceHistoryRecord[] => {
  if (typeof window === "undefined") return [];
  const key = `attendanceHistory:${employeeId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as AttendanceHistoryRecord[];
    }
  } catch (error) {
    console.warn("Không đọc được attendanceHistory:", error);
  }
  return [];
};

const getMonthlyHours = (employeeId: string): number => {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(`workingHours:${employeeId}`);
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as { year: number; month: number; hours: number };
    const now = new Date();
    if (
      parsed &&
      parsed.year === now.getFullYear() &&
      parsed.month === now.getMonth() + 1 &&
      typeof parsed.hours === "number"
    ) {
      return Number(parsed.hours) || 0;
    }
  } catch (error) {
    console.warn("Không đọc được dữ liệu workingHours:", error);
  }
  return 0;
};

export function AttendanceHistoryModal({
  open,
  onClose,
  employee,
}: {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}) {
  const [records, setRecords] = useState<AttendanceHistoryRecord[]>([]);

  useEffect(() => {
    if (!open || !employee) return;
    const history = loadHistory(employee.id);
    setRecords(history);
  }, [open, employee]);

  const monthlyHours = useMemo(() => (employee ? getMonthlyHours(employee.id) : 0), [employee]);
  const currentMonthCount = useMemo(() => {
    if (!records.length) return 0;
    const now = new Date();
    return records.filter((record) => {
      const time = new Date(record.timestamp);
      return (
        time.getFullYear() === now.getFullYear() &&
        time.getMonth() === now.getMonth()
      );
    }).length;
  }, [records]);

  if (!employee) return null;

  const formatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

  const orderedRecords = [...records].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Lịch sử chấm công - ${employee.name}`}
      titleClassName="text-slate-900"
    >
      <div className="space-y-5">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tổng giờ tháng này
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{monthlyHours.toFixed(2)}h</p>
          <p className="text-sm text-slate-500">
            Số lần chấm công trong tháng: {currentMonthCount}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Lịch sử gần đây</p>
          {orderedRecords.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu chấm công.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {orderedRecords.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {record.type === "checkin" ? "Check-in" : "Check-out"}
                    </p>
                    <p className="text-xs text-slate-500">{formatter.format(new Date(record.timestamp))}</p>
                  </div>
                  {typeof record.durationHours === "number" && (
                    <span className="text-sm font-semibold text-emerald-600">
                      +{record.durationHours.toFixed(2)}h
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
