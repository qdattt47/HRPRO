import { apiFetch, buildApiUrl } from './api';
import type { DepartmentStatus } from './types';

const STORAGE_KEY = 'departmentsData';
const API_PREFIX = '/api/v1/departments';

type BackendDepartment = {
  id: number;
  code: string;
  name: string;
  founded_year?: number | null;
  status: DepartmentStatus;
};

export type DepartmentPayload = {
  maPhong: string;
  tenPhong: string;
  namThanhLap: number;
  trangThai: DepartmentStatus;
};

export type DepartmentViewModel = DepartmentPayload & {
  id: string;
  visible: boolean;
  truongPhong?: string;
};

const toViewModel = (dept: BackendDepartment): DepartmentViewModel => ({
  id: String(dept.id),
  maPhong: dept.code,
  tenPhong: dept.name,
  namThanhLap: dept.founded_year ?? new Date().getFullYear(),
  trangThai: dept.status,
  visible: true,
});

const toBackendPayload = (payload: Partial<DepartmentPayload>) => {
  const body: Record<string, unknown> = {};
  if (payload.maPhong !== undefined) body.code = payload.maPhong;
  if (payload.tenPhong !== undefined) body.name = payload.tenPhong;
  if (payload.namThanhLap !== undefined) body.founded_year = payload.namThanhLap;
  if (payload.trangThai !== undefined) body.status = payload.trangThai;
  return body;
};

const getLocalDepartments = (): DepartmentViewModel[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DepartmentViewModel[];
  } catch (error) {
    console.warn('Không thể đọc dữ liệu departmentsData:', error);
    return [];
  }
};

const saveLocalDepartments = (rows: DepartmentViewModel[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

const ensureSeedData = (seed: DepartmentViewModel[] = []) => {
  const existing = getLocalDepartments();
  if (existing.length) return existing;
  saveLocalDepartments(seed);
  return seed;
};

const mergeVisibility = (
  remoteRows: DepartmentViewModel[],
  cachedRows: DepartmentViewModel[]
) => {
  const visibilityMap = cachedRows.reduce<Record<string, boolean>>((acc, row) => {
    acc[row.id] = row.visible;
    acc[row.maPhong] = row.visible;
    return acc;
  }, {});

  return remoteRows.map((row) => ({
    ...row,
    visible: visibilityMap[row.id] ?? visibilityMap[row.maPhong] ?? true,
  }));
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

export const departmentsService = {
  loadLocal(seed?: DepartmentViewModel[]) {
    return ensureSeedData(seed);
  },
  saveLocal: saveLocalDepartments,
  createLocalRecord(payload: DepartmentPayload, idGenerator: () => string): DepartmentViewModel {
    return {
      id: idGenerator(),
      maPhong: payload.maPhong,
      tenPhong: payload.tenPhong,
      namThanhLap: payload.namThanhLap,
      trangThai: payload.trangThai,
      visible: true,
    };
  },
  async list(seed?: DepartmentViewModel[]): Promise<DepartmentViewModel[]> {
    const cached = ensureSeedData(seed);
    try {
      const remote = await apiFetch<BackendDepartment[]>(buildApiUrl(API_PREFIX));
      const mapped = mergeVisibility(remote.map(toViewModel), cached);
      saveLocalDepartments(mapped);
      return mapped;
    } catch (error) {
      console.warn('Không thể tải danh sách phòng ban từ backend, sử dụng cache local.', error);
      return cached;
    }
  },
  async create(payload: DepartmentPayload): Promise<DepartmentViewModel> {
    const response = await postJson<BackendDepartment>(API_PREFIX, toBackendPayload(payload));
    return toViewModel(response);
  },
  async update(
    departmentId: string,
    payload: Partial<DepartmentPayload>
  ): Promise<DepartmentViewModel> {
    const response = await putJson<BackendDepartment>(
      `${API_PREFIX}/${departmentId}`,
      toBackendPayload(payload)
    );
    return toViewModel(response);
  },
  async remove(departmentId: string): Promise<void> {
    await apiFetch(buildApiUrl(`${API_PREFIX}/${departmentId}`), {
      method: 'DELETE',
    });
  },
};
