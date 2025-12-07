
import BarChart from "@/components/charts/BarChart";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Table from "@/components/ui/Table";
import { formatCurrency } from "@/lib/money";
import { useEffect, useMemo, useState } from "react";
import { employeesService } from "@/services/employeesService";
import { payrollService, type MonthlyPayrollRow } from "@/services/payrollService";

type IncomeRow = {
  month: number;
  basicSalary: number;
  netSalary: number;
  difference: number;
};

const IncomeReport = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [employee, setEmployee] = useState<string>("");
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [payrollRows, setPayrollRows] = useState<MonthlyPayrollRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [previousYearIncome, setPreviousYearIncome] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await employeesService.list();
        if (!active) return;
        const mapped = list.map((emp) => ({ id: emp.id, name: emp.name }));
        setEmployees(mapped);
        if (!employee && mapped.length) {
          setEmployee(mapped[0].id);
        }
      } catch (error) {
        console.warn("Không tải được danh sách nhân viên cho báo cáo lương.", error);
      }
    })();
    return () => {
      active = false;
    };
  }, []); // load employees once

  useEffect(() => {
    if (!employee) {
      setPayrollRows([]);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const rows = await payrollService.fetchMonthlyPayrolls(employee, year);
        if (!active) return;
        setPayrollRows(rows);
      } catch (error) {
        console.warn("Không tải được dữ liệu bảng lương.", error);
        if (active) setPayrollRows([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [employee, year]);

  useEffect(() => {
    if (!employee) {
      setPreviousYearIncome(0);
      return;
    }
    let active = true;
    (async () => {
      try {
        const rows = await payrollService.fetchMonthlyPayrolls(employee, year - 1);
        if (!active) return;
        const total = rows.reduce((sum, row) => sum + row.total_pay, 0);
        setPreviousYearIncome(total);
      } catch (error) {
        console.warn("Không tải được dữ liệu năm trước.", error);
        if (active) setPreviousYearIncome(0);
      }
    })();
    return () => {
      active = false;
    };
  }, [employee, year]);

  const data = useMemo<IncomeRow[]>(() => {
    return payrollRows.map((row) => ({
      month: row.month,
      basicSalary: row.base_salary,
      netSalary: row.total_pay,
      difference: row.total_pay - row.base_salary,
    }));
  }, [payrollRows]);

  const totalIncome = useMemo(() => {
    return payrollRows.reduce((acc, item) => acc + item.total_pay, 0);
  }, [payrollRows]);

  const incomeChange = totalIncome - previousYearIncome;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          type="number"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          placeholder="Năm"
          className="w-32"
        />
        <Select
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
          className="w-64"
        >
          <option value="" disabled>
            {employees.length ? "Chọn nhân viên" : "Đang tải nhân viên..."}
          </option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </Select>
        <Button type="button">Duyệt</Button>
        <Button type="button" variant="outline">
          Xuất PDF
        </Button>
      </div>

      {employee ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Card>
              <h2 className="text-lg font-semibold mb-4">
                Lương thực nhận theo năm {year}
              </h2>
              <div className="h-80">
                {loading ? (
                  <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
                ) : data.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Chưa có dữ liệu bảng lương cho nhân viên này.
                  </p>
                ) : (
                  <BarChart
                    data={data.map((d) => ({
                      name: `Tháng ${d.month}`,
                      value: d.netSalary,
                    }))}
                    xAxis="name"
                    yAxis="value"
                  />
                )}
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold mb-4">Bảng thống kê</h2>
              {loading ? (
                <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
              ) : (
                <Table
                  columns={[
                    { header: "Tháng", accessor: "month" },
                    {
                      header: "Lương cơ bản",
                      accessor: "basicSalary",
                      render: (row: IncomeRow) => formatCurrency(row.basicSalary),
                    },
                    {
                      header: "Lương thực nhận",
                      accessor: "netSalary",
                      render: (row: IncomeRow) => formatCurrency(row.netSalary),
                    },
                    {
                      header: "Chênh lệch",
                      accessor: "difference",
                      render: (row: IncomeRow) =>
                        formatCurrency(row.netSalary - row.basicSalary),
                    },
                  ]}
                  data={data}
                />
              )}
            </Card>
          </div>
          <div className="col-span-1 space-y-4">
            <Card>
              <h2 className="text-lg font-semibold mb-4">
                Tổng thu nhập năm {year}
              </h2>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
                <p
                  className={
                    incomeChange >= 0 ? "text-green-500" : "text-red-500"
                  }
                >
                  {incomeChange >= 0 ? "▲" : "▼"} {formatCurrency(incomeChange)} so
                  với năm trước
                </p>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Chọn nhân viên để xem báo cáo lương.
        </p>
      )}
    </div>
  );
};

export default IncomeReport;
