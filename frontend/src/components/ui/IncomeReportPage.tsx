import { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Select } from "./Select";

const BAO_CAO_INTERVAL_MS = 5 * 60 * 1000; // 5 phút thực tế = 1 tháng mô phỏng
const KIEM_TRA_INTERVAL_MS = 5 * 1000; // kiểm tra trạng thái mỗi 5 giây để không phải đợi đủ 5 phút từ lúc mở trang
const REPORT_KEY = (employeeId: string) => `incomeReports:${employeeId}`;
const REPORT_STATE_KEY = (employeeId: string) => `incomeReportState:${employeeId}`;
const WORKING_HOURS_KEY = (employeeId: string) => `workingHours:${employeeId}`;

type IncomeReportEntry = {
  id: string;
  year: number;
  month: number;
  baseSalary: number;
  netIncome: number;
  difference: number;
  recordedAt: string;
};

type EmployeeOption = {
  id: string;
  name: string;
  baseSalary: number;
};

// Đồng bộ dữ liệu nhân viên với EmployeePage.tsx
const loadEmployees = (): EmployeeOption[] => {
  const stored = localStorage.getItem("employeesData");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Array<{
        id: string;
        name: string;
        baseSalary?: number;
        [key: string]: unknown;
      }>;
      return parsed.map((emp) => ({
        id: emp.id,
        name: emp.name,
        baseSalary:
          typeof emp.baseSalary === "number"
            ? emp.baseSalary
            : Number(emp["salary"] as number | string) || 0,
      }));
    } catch (error) {
      console.warn("Không đọc được employeesData:", error);
    }
  }
  return [];
};

const formatCurrency = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const readWorkingHours = (employeeId: string) => {
  if (typeof localStorage === "undefined") return 0;
  const raw = localStorage.getItem(WORKING_HOURS_KEY(employeeId));
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as { hours?: number };
    return Number(parsed.hours) || 0;
  } catch (error) {
    console.warn("Không đọc được workingHours:", error);
    return 0;
  }
};

const resetWorkingHours = (employeeId: string) => {
  if (typeof localStorage === "undefined") return;
  const now = new Date();
  localStorage.setItem(
    WORKING_HOURS_KEY(employeeId),
    JSON.stringify({ year: now.getFullYear(), month: now.getMonth() + 1, hours: 0 })
  );
};

const loadIncomeReports = (employeeId: string): IncomeReportEntry[] => {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(REPORT_KEY(employeeId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IncomeReportEntry[]) : [];
  } catch (error) {
    console.warn("Không đọc được incomeReports:", error);
    return [];
  }
};

const saveIncomeReports = (employeeId: string, data: IncomeReportEntry[]) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(REPORT_KEY(employeeId), JSON.stringify(data));
};

const ensureReportState = (employeeId: string) => {
  if (typeof localStorage === "undefined") return null;
  const now = Date.now();
  const raw = localStorage.getItem(REPORT_STATE_KEY(employeeId));
  if (!raw) {
    const state = { startTime: now, lastSnapshotMonth: 0 };
    localStorage.setItem(REPORT_STATE_KEY(employeeId), JSON.stringify(state));
    return state;
  }
  try {
    return JSON.parse(raw) as { startTime: number; lastSnapshotMonth: number };
  } catch (error) {
    console.warn("Không đọc được incomeReportState:", error);
    const state = { startTime: now, lastSnapshotMonth: 0 };
    localStorage.setItem(REPORT_STATE_KEY(employeeId), JSON.stringify(state));
    return state;
  }
};

const saveReportState = (employeeId: string, state: { startTime: number; lastSnapshotMonth: number }) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(REPORT_STATE_KEY(employeeId), JSON.stringify(state));
};

const computeIncomeForHours = (hours: number, baseSalary: number) => {
  const hourlyRate = baseSalary / 160;
  const hasBase = hours >= 40;
  const overtimeHours = hasBase ? Math.max(0, hours - 40) : 0;
  const appliedBase = hasBase ? baseSalary : 0;
  const netIncome = hasBase ? baseSalary + overtimeHours * hourlyRate : 0;
  return { baseSalary: appliedBase, netIncome, difference: netIncome - appliedBase };
};

const simulateMonthlyReport = (employee: EmployeeOption | undefined) => {
  if (!employee || typeof localStorage === "undefined") return false;
  const state = ensureReportState(employee.id);
  if (!state) return false;
  const now = Date.now();
  const completedMonths = Math.floor((now - state.startTime) / BAO_CAO_INTERVAL_MS);
  if (completedMonths <= state.lastSnapshotMonth) return false;
  const reports = loadIncomeReports(employee.id);
  let created = false;
  while (state.lastSnapshotMonth < completedMonths) {
    const nextIndex = state.lastSnapshotMonth + 1;
    const year = 2025 + Math.floor((nextIndex - 1) / 12);
    const month = ((nextIndex - 1) % 12) + 1;
    const hours = readWorkingHours(employee.id);
    const { baseSalary, netIncome, difference } = computeIncomeForHours(hours, employee.baseSalary);
    const entry: IncomeReportEntry = {
      id: `${employee.id}-${year}-${month}-${Date.now()}`,
      year,
      month,
      baseSalary,
      netIncome,
      difference,
      recordedAt: new Date().toISOString(),
    };
    reports.push(entry);
    resetWorkingHours(employee.id);
    state.lastSnapshotMonth = nextIndex;
    created = true;
  }
  if (created) {
    saveIncomeReports(employee.id, reports);
    saveReportState(employee.id, state);
  }
  return created;
};

const Header = () => (
  <div className="flex items-center justify-between mb-6">
    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Báo cáo thu nhập năm</h1>
  </div>
);

// Định nghĩa kiểu cho props của FilterBar
type FilterBarProps = {
  year: string; setYear: (y: string) => void;
  employee: string; setEmployee: (e: string) => void;
  employeeList: EmployeeOption[];
};

const FilterBar = ({ year, setYear, employee, setEmployee, employeeList }: FilterBarProps) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    <div>
      <label className="block text-sm font-medium mb-1">Năm</label>
      <Select value={year} onChange={(e) => setYear(e.target.value)}>
        <option value="2025">Năm 2025</option>
        <option value="2024">Năm 2024</option>
      </Select>
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Nhân viên</label>
      <Select
        value={employee}
        onChange={(e) => setEmployee(e.target.value)}
        disabled={employeeList.length === 0}
      >
        {employeeList.length === 0 && <option value="">Chưa có dữ liệu nhân viên</option>}
        {employeeList.map((emp) => (
          <option key={emp.id} value={emp.id}>{emp.name}</option>
        ))}
      </Select>
    </div>
  </div>
);

const IncomeChart = ({ data }: { data: any[] }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4 text-gray-800">Lương thực nhận hàng tháng</h2>
    {data.length === 0 ? (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        Chưa có dữ liệu để hiển thị.
      </div>
    ) : (
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickFormatter={(tick) => `T${tick}`} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}tr`} />
            <Tooltip formatter={(value: number) => [formatCurrency(value), "Thực nhận"]} />
            <Bar dataKey="netIncome" name="Lương thực nhận" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const IncomeTable = ({ data }: { data: any[] }) => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden mt-6">
    {data.length === 0 ? (
      <div className="py-10 text-center text-sm text-slate-400">
        Chưa có dữ liệu bảng lương để hiển thị.
      </div>
    ) : (
      <table className="min-w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {["Tháng", "Lương cơ bản", "Lương thực nhận", "Chênh lệch"].map((head) => (
              <th key={head} className="px-4 py-3 text-sm text-black font-medium">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month} className="border-t border-gray-200 hover:bg-gray-50">
              <td className="px-4 py-3 text-black font-medium">Tháng {row.month}</td>
              <td className="px-4 py-3 text-black">{formatCurrency(row.baseSalary)}</td>
              <td className="px-4 py-3 text-black font-semibold">{formatCurrency(row.netIncome)}</td>
              <td className={`px-4 py-3 font-medium ${row.difference > 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(row.difference)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const SummaryCard = ({ summary, year }: { summary: any, year: string }) => (
  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
    <h3 className="font-semibold text-gray-600">Tổng thu nhập năm {year}</h3>
    <p className="text-3xl font-bold text-gray-900">{formatCurrency(summary.total ?? 0)}</p>
    <div className="flex items-center gap-2">
      <span className="px-2 py-1 text-sm font-bold bg-slate-100 text-slate-600 rounded-full">
        0%
      </span>
      <span className="text-sm text-gray-500">Chưa có dữ liệu so sánh</span>
    </div>
    <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
      Chưa có dữ liệu xu hướng
    </div>
  </div>
);

export default function IncomeReportPage() {
  const [employeeList, setEmployeeList] = useState<EmployeeOption[]>(loadEmployees);
  const [year, setYear] = useState("2025");
  const [employee, setEmployee] = useState(() => loadEmployees()[0]?.id ?? "");
  const [reportVersion, setReportVersion] = useState(0);

  useEffect(() => {
    setEmployeeList(loadEmployees());
  }, []);

  useEffect(() => {
    if (employeeList.length === 0) {
      setEmployee("");
      return;
    }
    if (!employee || !employeeList.find((emp) => emp.id === employee)) {
      setEmployee(employeeList[0].id);
    }
  }, [employeeList, employee]);

  useEffect(() => {
    if (!employee) return;
    // xử lý ngay khi vào để bắt kịp tháng mô phỏng còn thiếu
    const targetEmployee = employeeList.find((emp) => emp.id === employee);
    const created = simulateMonthlyReport(targetEmployee);
    if (created) {
      setReportVersion((prev) => prev + 1);
    }
    const interval = window.setInterval(() => {
      const employeeObj = employeeList.find((emp) => emp.id === employee);
      const added = simulateMonthlyReport(employeeObj);
      if (added) {
        setReportVersion((prev) => prev + 1);
      }
    }, KIEM_TRA_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [employee, employeeList]);

  const currentData = useMemo(() => {
    if (!employee) return { summary: { total: 0, change: 0, trend: [] }, details: [] };
    const reports = loadIncomeReports(employee).filter((entry) => String(entry.year) === year);
    const sorted = [...reports].sort((a, b) => a.month - b.month);
    const details = sorted.map((entry) => ({
      month: entry.month,
      baseSalary: entry.baseSalary,
      netIncome: entry.netIncome,
      difference: entry.difference,
    }));
    const total = details.reduce((sum, item) => sum + item.netIncome, 0);
    return { summary: { total, change: 0, trend: [] }, details };
  }, [year, employee, reportVersion]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Header />
        <FilterBar
          year={year}
          setYear={setYear}
          employee={employee}
          setEmployee={setEmployee}
          employeeList={employeeList}
        />

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <IncomeChart data={currentData.details} />
            <IncomeTable data={currentData.details} />
          </div>
          <div className="lg:col-span-1">
            <SummaryCard summary={currentData.summary} year={year} />
          </div>
        </main>

        <footer className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-500">
          Kết nối hệ thống thực tế để hiển thị dữ liệu báo cáo thu nhập.
        </footer>
      </div>
    </div>
  );
}
