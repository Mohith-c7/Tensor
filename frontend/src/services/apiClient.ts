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

// Response interceptor: normalize success
apiClient.interceptors.response.use(
  (response) => {
    response.data = parseDates(response.data);
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
  const response = await apiClient.get<{
    data: T[];
    pagination: { total: number; page: number; totalPages: number; limit: number };
  }>(url, { params, signal });

  const { data, pagination } = response.data;
  return {
    items: data,
    total: pagination.total,
    page: pagination.page,
    totalPages: pagination.totalPages,
    limit: pagination.limit,
  };
}

export default apiClient;
