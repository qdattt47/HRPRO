import type { Employee } from '../components/ui/EmployeePage';
import type { NewEmployeeData } from '../components/ui/AddEmployeeModal';
import type { EmployeeEditData } from '../components/ui/EditEmployeeModal';
import { supabase } from '@/lib/supabaseClient';
import { extractJoinOrderFromCode } from '../utils/employeeCode';

const STORAGE_KEY = 'employeesData';

type RelationRow = { id: string; name: string | null };

type SupabaseEmployeeRow = {
  id: string;
  employee_code: string;
  full_name: string;
  department_id: string;
  position_id: string;
  departments?: RelationRow | RelationRow[] | null;
  positions?: RelationRow | RelationRow[] | null;
  base_salary: number;
  status: 'active' | 'inactive';
  joined_at: string;
  photo_url?: string | null;
  account: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

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

const resolveRelation = (relation?: RelationRow | RelationRow[] | null) => {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
};

const toViewModel = (employee: SupabaseEmployeeRow): Employee => {
  const joinOrder = extractJoinOrderFromCode(employee.employee_code) ?? undefined;
  const department = resolveRelation(employee.departments);
  const position = resolveRelation(employee.positions);
  return {
    id: employee.id,
    code: employee.employee_code,
    name: employee.full_name,
    dept: department?.name ?? '',
    departmentId: employee.department_id,
    position: position?.name ?? '',
    positionId: employee.position_id,
    baseSalary: Number(employee.base_salary),
    status: employee.status,
    visible: true,
    photo: employee.photo_url ?? undefined,
    joinOrder,
    joinedAt: new Date(employee.joined_at).toISOString(),
    taiKhoan: employee.account,
    matKhau: employee.password_hash,
    account: employee.account,
    password: employee.password_hash,
    createdAt: employee.created_at,
    updatedAt: employee.updated_at,
  };
};

export const employeesService = {
  getLocalSnapshot: getLocal,
  saveLocalSnapshot: saveLocal,
  async list(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_code,
          full_name,
          department_id,
          position_id,
          base_salary,
          status,
          joined_at,
          account,
          password_hash,
          photo_url,
          created_at,
          updated_at,
          departments:department_id ( id, name ),
          positions:position_id ( id, name )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = (data ?? []).map((row: Record<string, unknown>) =>
        toViewModel(row as SupabaseEmployeeRow)
      );
      saveLocal(mapped);
      return mapped;
    } catch (error) {
      console.warn('Không tải được danh sách nhân viên từ backend, dùng dữ liệu offline.', error);
      return getLocal();
    }
  },
  async create(payload: NewEmployeeData): Promise<Employee | null> {
    if (!payload.departmentId || !payload.positionId) {
      console.warn('Thiếu phòng ban hoặc chức vụ khi tạo nhân viên.');
      return null;
    }
    const { data, error } = await supabase
      .from('employees')
      .insert({
        employee_code: payload.code,
        full_name: payload.name,
        department_id: payload.departmentId,
        position_id: payload.positionId,
        base_salary: payload.baseSalary,
        status: payload.status,
        joined_at: payload.joinedAt,
        account: payload.taiKhoan,
        password_hash: payload.matKhau,
        photo_url: payload.photo ?? null,
      })
      .select(`
        id,
        employee_code,
        full_name,
        department_id,
        position_id,
        base_salary,
        status,
        joined_at,
        account,
        password_hash,
        photo_url,
        created_at,
        updated_at,
        departments:department_id ( id, name ),
        positions:position_id ( id, name )
      `)
      .single();
    if (error || !data) {
      throw error ?? new Error('Không thể tạo nhân viên.');
    }
    const viewModel = toViewModel(data as SupabaseEmployeeRow);
    const local = getLocal();
    saveLocal([viewModel, ...local.filter((row) => row.id !== viewModel.id)]);
    return viewModel;
  },
  async update(employeeId: string, payload: EmployeeEditData): Promise<Employee | null> {
    const updatePayload: Record<string, unknown> = {
      full_name: payload.name,
      base_salary: payload.baseSalary,
      status: payload.status,
      account: payload.taiKhoan,
      joined_at: payload.joinedAt,
      photo_url: payload.photo ?? null,
    };
    if (payload.code) updatePayload.employee_code = payload.code;
    if (payload.departmentId) updatePayload.department_id = payload.departmentId;
    if (payload.positionId) updatePayload.position_id = payload.positionId;
    if (payload.matKhau) updatePayload.password_hash = payload.matKhau;
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updatePayload)
        .eq('id', employeeId)
        .select(`
          id,
          employee_code,
          full_name,
          department_id,
          position_id,
          base_salary,
          status,
          joined_at,
          account,
          password_hash,
          photo_url,
          created_at,
          updated_at,
          departments:department_id ( id, name ),
          positions:position_id ( id, name )
        `)
        .single();
      if (error || !data) {
        throw error ?? new Error('Không thể cập nhật nhân viên.');
      }
      const viewModel = toViewModel(data as SupabaseEmployeeRow);
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
      const { error } = await supabase.from('employees').delete().eq('id', employeeId);
      if (error) throw error;
      const local = getLocal().filter((row) => row.id !== employeeId);
      saveLocal(local);
      return true;
    } catch (error) {
      console.warn('Không xóa được nhân viên trên backend.', error);
      return false;
    }
  },
};
