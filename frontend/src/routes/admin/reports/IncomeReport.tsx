
import BarChart from "@/components/charts/BarChart";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Table from "@/components/ui/Table";
import { formatCurrency } from "@/lib/money";
import { useMemo, useState } from "react";

type IncomeRow = {
  month: number;
  basicSalary: number;
  netSalary: number;
  difference: number;
};

const IncomeReport = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [employee, setEmployee] = useState<string | null>(null);

  const data = useMemo<IncomeRow[]>(() => {
    if (!employee) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const basicSalary = 5000000;
      const netSalary = basicSalary + Math.random() * 5000000;
      return {
        month: i + 1,
        basicSalary,
        netSalary,
        difference: netSalary - basicSalary,
      };
    });
  }, [employee]);

  const totalIncome = useMemo(() => {
    return data.reduce((acc, item) => acc + item.netSalary, 0);
  }, [data]);

  const previousYearIncome = 100000000; // Mock data
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
          value={employee || ""}
          onChange={(e) => setEmployee(e.target.value)}
          className="w-64"
        >
          <option value="" disabled>
            Chọn nhân viên
          </option>
          <option value="1">Nhân viên A</option>
          <option value="2">Nhân viên B</option>
        </Select>
        <Button>Duyệt</Button>
        <Button variant="outline">Xuất PDF</Button>
      </div>

      {employee && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Card>
              <h2 className="text-lg font-semibold mb-4">
                Lương thực nhận theo năm {year}
              </h2>
              <div className="h-80">
                <BarChart
                  data={data.map((d) => ({
                    name: `Tháng ${d.month}`,
                    value: d.netSalary,
                  }))}
                  xAxis="name"
                  yAxis="value"
                />
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold mb-4">Bảng thống kê</h2>
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
      )}
    </div>
  );
};

export default IncomeReport;
