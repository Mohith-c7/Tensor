import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { apiClient } from '../services/apiClient';
import type { AttendanceRecord, MarkAttendanceRequest } from '../types/api';

export function useClassAttendance(classId: number, sectionId: number, date: string, periodNumber?: number) {
  return useQuery({
    queryKey: queryKeys.attendance.class(classId, sectionId, date, periodNumber),
    queryFn: async ({ signal }) => {
      const params: any = { classId, sectionId, date };
      if (periodNumber) params.periodNumber = periodNumber;
      const res = await apiClient.get<AttendanceRecord[]>('/attendance/class', {
        params,
        signal,
      });
      return res.data;
    },
    enabled: classId > 0 && sectionId > 0 && !!date,
  });
}

export function useStudentAttendanceStats(studentId: number, startDate: string, endDate: string, threshold?: number) {
  return useQuery({
    queryKey: queryKeys.attendance.studentStats(studentId, startDate, endDate, threshold),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<AttendanceStats>(`/attendance/stats/${studentId}`, {
        params: { startDate, endDate, threshold },
        signal,
      });
      return res.data;
    },
    enabled: studentId > 0 && !!startDate && !!endDate,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MarkAttendanceRequest) => {
      const res = await apiClient.post<AttendanceRecord[]>('/attendance', payload);
      return res.data;
    },
    onMutate: async () => {
      // Snapshot for rollback
      const snapshot = qc.getQueriesData({ queryKey: queryKeys.attendance.all });
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      // Rollback optimistic update
      if (context?.snapshot) {
        for (const [key, data] of context.snapshot) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
  });
}
