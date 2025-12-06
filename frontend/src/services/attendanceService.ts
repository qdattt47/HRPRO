import { apiFetch, buildApiUrl } from './api';
import type {
  AttendanceType,
  EnrollFacePayload,
  EnrollFaceResponse,
  FaceCheckPayload,
  FaceCheckResponse,
  FaceEmbeddingRow,
} from './types';

const LOCAL_EMBEDDINGS_KEY = 'faceEmbeddings';

const getLocalEmbeddings = (): FaceEmbeddingRow[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_EMBEDDINGS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FaceEmbeddingRow[];
  } catch (error) {
    console.warn('Không đọc được dữ liệu faceEmbeddings:', error);
    return [];
  }
};

const saveLocalEmbeddings = (rows: FaceEmbeddingRow[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_EMBEDDINGS_KEY, JSON.stringify(rows));
};

const euclideanDistance = (a: number[], b: number[]) => {
  if (!a.length || !b.length || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

const storeLocalEmbedding = (payload: EnrollFacePayload): FaceEmbeddingRow => {
  const rows = getLocalEmbeddings().filter((row) => row.employeeId !== payload.employeeId);
  const record: FaceEmbeddingRow = {
    employeeId: payload.employeeId,
    embedding: payload.embedding,
    createdAt: new Date().toISOString(),
  };
  rows.push(record);
  saveLocalEmbeddings(rows);
  return record;
};

const fallbackEnroll = (payload: EnrollFacePayload): EnrollFaceResponse => {
  const { createdAt } = storeLocalEmbedding(payload);
  return {
    employeeId: payload.employeeId,
    createdAt,
    source: 'local',
  };
};

const fallbackCheck = ({
  embedding,
  type,
  threshold = 0.5,
}: FaceCheckPayload): FaceCheckResponse => {
  const rows = getLocalEmbeddings();
  if (!rows.length) {
    throw new Error('Chưa có dữ liệu khuôn mặt nào trong hệ thống.');
  }

  let match: FaceEmbeddingRow | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  rows.forEach((row) => {
    const distance = euclideanDistance(row.embedding, embedding);
    if (distance < bestDistance) {
      bestDistance = distance;
      match = row;
    }
  });

  if (!match || bestDistance > threshold) {
    throw new Error('Không nhận diện được khuôn mặt trong cơ sở dữ liệu.');
  }
  const confirmedMatch = match as FaceEmbeddingRow;

  return {
    employeeId: confirmedMatch.employeeId,
    type,
    timestamp: new Date().toISOString(),
    distance: bestDistance,
    threshold,
    source: 'local',
  };
};

const postJson = async <T>(path: string, body: unknown) =>
  apiFetch<T>(buildApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

const getJson = async <T>(path: string) => apiFetch<T>(buildApiUrl(path));

export const attendanceService = {
  list: async () => [],
  enrollFace: async (payload: EnrollFacePayload) => {
    try {
      const response = await postJson<EnrollFaceResponse>('/api/enroll-face', payload);
      storeLocalEmbedding(payload);
      return { ...response, source: 'remote' as const };
    } catch (error) {
      console.warn('Gọi API enroll-face thất bại, dùng local storage.', error);
      return fallbackEnroll(payload);
    }
  },
  checkInWithFace: async (payload: FaceCheckPayload) => {
    try {
      const response = await postJson<FaceCheckResponse>('/api/checkin', payload);
      return { ...response, source: 'remote' as const };
    } catch (error) {
      console.warn('Gọi API checkin thất bại, dùng local storage.', error);
      return fallbackCheck(payload);
    }
  },
  hasFaceEnrollment: async (employeeId: string) => {
    try {
      const response = await getJson<{ registered: boolean }>(
        `/api/employees/${employeeId}/face`
      );
      if (response?.registered) return true;
    } catch (error) {
      console.warn('Không kiểm tra được trạng thái khuôn mặt từ backend.', error);
    }
    return getLocalEmbeddings().some((row) => row.employeeId === employeeId);
  },
  saveLocalEmbedding: storeLocalEmbedding,
  clearLocalEmbedding: (employeeId: string) => {
    const next = getLocalEmbeddings().filter((row) => row.employeeId !== employeeId);
    saveLocalEmbeddings(next);
  },
  getLocalEmbeddings,
  computeDistance: euclideanDistance,
  buildAttendanceRecord: (
    employeeId: string,
    type: AttendanceType,
    timestamp: string,
    distance: number,
    threshold: number
  ): FaceCheckResponse => ({
    employeeId,
    type,
    timestamp,
    distance,
    threshold,
    source: 'local',
  }),
};
