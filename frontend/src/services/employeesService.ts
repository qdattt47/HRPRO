import { apiFetch, buildApiUrl } from './api';
import type { Employee } from '../components/ui/EmployeePage';
import type { NewEmployeeData } from '../components/ui/AddEmployeeModal';
import type { EmployeeEditData } from '../components/ui/EditEmployeeModal';

const STORAGE_KEY = 'employeesData';
const API_PREFIX = '/api/v1/employees';

type BackendEmployee = {
  id: number;
  code: string;
  name: string;
  department_id: number;
  position_id: number;
  department_name?: string | null;
  position_name?: string | null;
  base_salary: number;
  status: 'active' | 'inactive';
  join_order: number;
  joined_at: string;
  photo_url?: string | null;
  account: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

type CreateEmployeeDto = {
  name: string;
  department_id: number;
  position_id: number;
  base_salary: number;
  status: 'active' | 'inactive';
  account: string;
  password: string;
  photo_url?: string | null;
};

type UpdateEmployeeDto = Partial<CreateEmployeeDto>;

const getLocal = (): Employee[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Employee[];
  } catch (error) {
    console.warn('Không đọc được employeesData:', error);
    return [];
  }
};

const saveLocal = (rows: Employee[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

const toViewModel = (employee: BackendEmployee): Employee => ({
  id: String(employee.id),
  code: employee.code,
  name: employee.name,
  dept: employee.department_name ?? '',
  departmentId: String(employee.department_id),
  position: employee.position_name ?? '',
  positionId: String(employee.position_id),
  baseSalary: Number(employee.base_salary),
  status: employee.status,
  visible: true,
  photo: employee.photo_url ?? undefined,
  joinOrder: employee.join_order,
  joinedAt: employee.joined_at,
  taiKhoan: employee.account,
  matKhau: employee.password_hash,
  account: employee.account,
  password: employee.password_hash,
  createdAt: employee.created_at,
  updatedAt: employee.updated_at,
});

const buildCreateDto = (payload: NewEmployeeData): CreateEmployeeDto | null => {
  const deptId = Number(payload.departmentId);
  const posId = Number(payload.positionId);
  if (Number.isNaN(deptId) || Number.isNaN(posId)) {
    return null;
  }
  return {
    name: payload.name,
    department_id: deptId,
    position_id: posId,
    base_salary: payload.baseSalary,
    status: payload.status,
    account: payload.taiKhoan,
    password: payload.matKhau,
    photo_url: payload.photo ?? undefined,
  };
};

const buildUpdateDto = (payload: EmployeeEditData): UpdateEmployeeDto => {
  const dto: UpdateEmployeeDto = {
    name: payload.name,
    base_salary: payload.baseSalary,
    status: payload.status,
    account: payload.taiKhoan,
    photo_url: payload.photo ?? undefined,
  };
  if (payload.departmentId) {
    const deptId = Number(payload.departmentId);
    if (!Number.isNaN(deptId)) dto.department_id = deptId;
  }
  if (payload.positionId) {
    const posId = Number(payload.positionId);
    if (!Number.isNaN(posId)) dto.position_id = posId;
  }
  if (payload.matKhau) dto.password = payload.matKhau;
  return dto;
};

const postJson = async <T>(path: string, body: unknown) =>
  apiFetch<T>(buildApiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const putJson = async <T>(path: string, body: unknown) =>
  apiFetch<T>(buildApiUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const employeesService = {
  getLocalSnapshot: getLocal,
  saveLocalSnapshot: saveLocal,
  async list(): Promise<Employee[]> {
    try {
      const remote = await apiFetch<BackendEmployee[]>(buildApiUrl(API_PREFIX));
      const mapped = remote.map(toViewModel);
      saveLocal(mapped);
      return mapped;
    } catch (error) {
      console.warn('Không tải được danh sách nhân viên từ backend, dùng dữ liệu offline.', error);
      return getLocal();
    }
  },
  async create(payload: NewEmployeeData): Promise<Employee | null> {
    const dto = buildCreateDto(payload);
    if (!dto) {
      console.warn('Thiếu thông tin phòng ban hoặc chức vụ nên không thể tạo nhân viên trên backend.');
      return null;
    }
    const created = await postJson<BackendEmployee>(API_PREFIX, dto);
    const viewModel = toViewModel(created);
    const local = getLocal();
    saveLocal([viewModel, ...local.filter((row) => row.id !== viewModel.id)]);
    return viewModel;
  },
  async update(employeeId: string, payload: EmployeeEditData): Promise<Employee | null> {
    const dto = buildUpdateDto(payload);
    try {
      const updated = await putJson<BackendEmployee>(`${API_PREFIX}/${employeeId}`, dto);
      const viewModel = toViewModel(updated);
      const local = getLocal().map((row) => (row.id === viewModel.id ? viewModel : row));
      saveLocal(local);
      return viewModel;
    } catch (error) {
      console.warn('Không cập nhật được nhân viên trên backend.', error);
      return null;
    }
  },
  async remove(employeeId: string): Promise<boolean> {
    try {
      await apiFetch(buildApiUrl(`${API_PREFIX}/${employeeId}`), { method: 'DELETE' });
      const local = getLocal().filter((row) => row.id !== employeeId);
      saveLocal(local);
      return true;
    } catch (error) {
      console.warn('Không xóa được nhân viên trên backend.', error);
      return false;
    }
  },
};
