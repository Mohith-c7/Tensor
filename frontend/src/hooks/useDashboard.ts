import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { apiClient } from '../services/apiClient';

interface DashboardKPIs {
  totalStudents: number;
  totalTeachers: number;
  attendanceRateToday: number;
  pendingFeesCount: number;
  upcomingExamsCount: number;
  classesAssigned?: number;
  attendanceMarkedToday?: boolean;
  recentMarksEntries?: number;
}

interface AttendanceTrendPoint {
  date: string;
  percentage: number;
}

interface FeeCollectionPoint {
  month: string;
  amount: number;
}

interface AuditEvent {
  id: number;
  action: string;
  entity: string;
  entityId: number;
  performedBy: string;
  createdAt: Date;
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<DashboardKPIs>('/dashboard/kpis', { signal });
      return res.data;
    },
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
  });
}

export function useAttendanceTrend() {
  return useQuery({
    queryKey: queryKeys.dashboard.attendanceTrend(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<AttendanceTrendPoint[]>('/dashboard/attendance-trend', {
        signal,
      });
      return res.data;
    },
  });
}

export function useFeeCollection() {
  return useQuery({
    queryKey: queryKeys.dashboard.feeCollection(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<FeeCollectionPoint[]>('/dashboard/fee-collection', {
        signal,
      });
      return res.data;
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivity(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<AuditEvent[]>('/dashboard/recent-activity', {
        params: { limit: 10 },
        signal,
      });
      return res.data;
    },
  });
}
