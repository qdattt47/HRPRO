import { apiFetch, buildApiUrl } from './api';

const STORAGE_KEY = 'positionsData';
const API_PREFIX = '/api/v1/positions';

type BackendPosition = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
};

export type PositionViewModel = {
  id: string;
  maChucVu: string;
  tenChucVu: string;
  moTa?: string;
  visible: boolean;
};

const getLocal = (): PositionViewModel[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PositionViewModel[];
  } catch (error) {
    console.warn('Không đọc được positionsData:', error);
    return [];
  }
};

const saveLocal = (rows: PositionViewModel[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

const ensureSeed = (seed: PositionViewModel[] = []) => {
  const existing = getLocal();
  if (existing.length) return existing;
  saveLocal(seed);
  return seed;
};

const toViewModel = (pos: BackendPosition): PositionViewModel => ({
  id: String(pos.id),
  maChucVu: pos.code,
  tenChucVu: pos.name,
  moTa: pos.description ?? '',
  visible: true,
});

const mergeVisibility = (
  remote: PositionViewModel[],
  cached: PositionViewModel[]
) => {
  const visibilityById = cached.reduce<Record<string, boolean>>((acc, row) => {
    acc[row.id] = row.visible;
    acc[row.maChucVu] = row.visible;
    return acc;
  }, {});
  return remote.map((row) => ({
    ...row,
    visible: visibilityById[row.id] ?? visibilityById[row.maChucVu] ?? true,
  }));
};

export const positionsService = {
  loadLocal(seed?: PositionViewModel[]) {
    return ensureSeed(seed);
  },
  saveLocal,
  async list(seed?: PositionViewModel[]): Promise<PositionViewModel[]> {
    const cached = ensureSeed(seed);
    try {
      const remote = await apiFetch<BackendPosition[]>(buildApiUrl(API_PREFIX));
      const mapped = mergeVisibility(remote.map(toViewModel), cached);
      saveLocal(mapped);
      return mapped;
    } catch (error) {
      console.warn('Không thể tải danh sách chức vụ từ backend, dùng dữ liệu cache.', error);
      return cached;
    }
  },
};
