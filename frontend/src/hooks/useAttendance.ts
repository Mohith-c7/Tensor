import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { apiClient } from '../services/apiClient';
import type { AttendanceRecord, MarkAttendanceRequest } from '../types/api';

export function useClassAttendance(classId: number, sectionId: number, date: string) {
  return useQuery({
    queryKey: queryKeys.attendance.class(classId, sectionId, date),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<AttendanceRecord[]>('/attendance/class', {
        params: { classId, sectionId, date },
        signal,
      });
      return res.data;
    },
    enabled: classId > 0 && sectionId > 0 && !!date,
  });
}

export function useStudentAttendance(studentId: number, start: string, end: string) {
  return useQuery({
    queryKey: queryKeys.attendance.student(studentId, start, end),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<AttendanceRecord[]>(`/attendance/student/${studentId}`, {
        params: { start, end },
        signal,
      });
      return res.data;
    },
    enabled: studentId > 0 && !!start && !!end,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MarkAttendanceRequest) => {
      const res = await apiClient.post<AttendanceRecord[]>('/attendance', payload);
      return res.data;
    },
    onMutate: async (payload) => {
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
