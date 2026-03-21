import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, APP_ENV } from '../config/env';
import { ApiError } from '../types/api';
import { clearSession, getToken } from './authService';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// Request interceptor: inject Bearer token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Dev-only logging — never log Authorization header value
  if (APP_ENV === 'development') {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response interceptor: normalize success — unwrap { success, data } envelope
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap backend envelope: { success: true, data: ..., message: ... }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = parseDates(response.data.data);
    } else {
      response.data = parseDates(response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const message = (data?.message as string) ?? error.message ?? 'Unknown error';
    const code = data?.code as string | undefined;

    if (status === 401) {
      clearSession();
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }

    throw new ApiError(status, message, code);
  }
);

// ISO date string pattern
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export function parseDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return (ISO_DATE_RE.test(obj) ? new Date(obj) : obj) as unknown as T;
  }
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => parseDates(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = parseDates(value);
    }
    return result as T;
  }
  return obj;
}

export async function fetchPaginated<T>(
  url: string,
  params?: Record<string, unknown>,
  signal?: AbortSignal
): Promise<import('../types/api').PaginatedResponse<T>> {
  // The interceptor unwraps { success, data } → data (the array)
  // but paginatedResponse puts pagination in meta, so we need the raw envelope
  const response = await axios.get<{
    success: boolean;
    data: T[];
    meta: { pagination: { total: number; page: number; totalPages: number; limit: number } };
  }>(url, {
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    params,
    signal,
    timeout: 30_000,
  });

  const { data, meta } = response.data;
  const pagination = meta?.pagination;
  return {
    items: parseDates(data) as T[],
    total: pagination?.total ?? 0,
    page: pagination?.page ?? 1,
    totalPages: pagination?.totalPages ?? 1,
    limit: pagination?.limit ?? 20,
  };
}

export default apiClient;
