import type { Params } from 'react-router-dom';

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: ('admin' | 'teacher')[];
}

export interface RouteHandle {
  breadcrumb: (params: Params) => string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortingState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
}

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
