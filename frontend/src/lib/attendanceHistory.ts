export type AttendanceEvent = {
  id: string;
  type: 'checkin' | 'checkout';
  timestamp: string;
  durationHours?: number;
};

const HISTORY_KEY = (employeeId: string) => `attendanceHistory:${employeeId}`;
export const HISTORY_LIMIT = 200;

export const SIMULATION_RATIO = 3600 / 5; // 5 giây = 1 giờ chấm công
const LUNCH_BREAK_HOURS = 1;

export const calculateSimulatedHours = (inTime: Date, outTime: Date) => {
  const diffMs = outTime.getTime() - inTime.getTime();
  if (diffMs <= 0) return 0;
  const minutes = diffMs / (1000 * 60);
  const hours = minutes / 60;
  const hasLunchBreak = inTime.getHours() < 12 && outTime.getHours() > 13;
  const realHours = hasLunchBreak ? hours - LUNCH_BREAK_HOURS : hours;
  const simulated = realHours * SIMULATION_RATIO;
  return Math.max(0, Number(simulated.toFixed(2)));
};

export const summarizeAttendanceRecords = (
  records: AttendanceEvent[],
  referenceDate: Date = new Date()
) => {
  if (!records.length) {
    return { history: [], monthlyHours: 0 };
  }
  const asc = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  let lastCheckIn: Date | null = null;
  const enriched: AttendanceEvent[] = asc.map((record) => {
    const eventTime = new Date(record.timestamp);
    if (record.type === 'checkin') {
      lastCheckIn = eventTime;
      return { ...record, durationHours: undefined };
    }
    if (lastCheckIn) {
      const durationHours = calculateSimulatedHours(lastCheckIn, eventTime);
      lastCheckIn = null;
      return { ...record, durationHours };
    }
    return { ...record, durationHours: record.durationHours };
  });

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const monthlyHours = enriched.reduce((total, record) => {
    if (record.type !== 'checkout' || typeof record.durationHours !== 'number') {
      return total;
    }
    const time = new Date(record.timestamp);
    if (time.getFullYear() === refYear && time.getMonth() === refMonth) {
      return total + record.durationHours;
    }
    return total;
  }, 0);

  return {
    history: enriched.reverse(),
    monthlyHours: Number(monthlyHours.toFixed(2)),
  };
};

export const calculateSalaryProjection = (monthlyHours: number, baseSalary: number) => {
  const hourlyRate = baseSalary / 160;
  const hasBaseSalary = monthlyHours >= 40;
  const overtimeHours = hasBaseSalary ? Math.max(0, monthlyHours - 40) : 0;
  const overtimePay = hasBaseSalary ? Number((overtimeHours * hourlyRate).toFixed(2)) : 0;
  const projectedSalary = hasBaseSalary ? baseSalary + overtimePay : 0;
  return {
    hasBaseSalary,
    overtimeHours: Number(overtimeHours.toFixed(2)),
    overtimePay,
    projectedSalary,
  };
};

export const loadLocalAttendanceHistory = (employeeId: string): AttendanceEvent[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(HISTORY_KEY(employeeId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AttendanceEvent[]) : [];
  } catch (error) {
    console.warn('Không đọc được attendanceHistory:', error);
    return [];
  }
};

export const appendLocalAttendanceRecord = (
  employeeId: string,
  record: AttendanceEvent
) => {
  if (typeof localStorage === 'undefined') return;
  const current = loadLocalAttendanceHistory(employeeId);
  current.push(record);
  if (current.length > HISTORY_LIMIT) {
    current.splice(0, current.length - HISTORY_LIMIT);
  }
  localStorage.setItem(HISTORY_KEY(employeeId), JSON.stringify(current));
};
