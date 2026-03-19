import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { apiClient } from '../services/apiClient';
import type { TimetableEntry } from '../types/api';
import type { TimetableEntryFormData } from '../schemas/timetableSchemas';

interface CreateTimetablePayload extends TimetableEntryFormData {
  classId: number;
  sectionId: number;
  dayOfWeek: string;
  periodNumber: number;
}

export function useClassTimetable(classId: number, sectionId: number) {
  return useQuery({
    queryKey: queryKeys.timetable.class(classId, sectionId),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<TimetableEntry[]>('/timetable', {
        params: { classId, sectionId },
        signal,
      });
      return res.data;
    },
    enabled: classId > 0 && sectionId > 0,
  });
}

export function useTeacherTimetable(teacherId: number) {
  return useQuery({
    queryKey: queryKeys.timetable.teacher(teacherId),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<TimetableEntry[]>('/timetable', {
        params: { teacherId },
        signal,
      });
      return res.data;
    },
    enabled: teacherId > 0,
  });
}

export function useCreateTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTimetablePayload) => {
      const res = await apiClient.post<TimetableEntry>('/timetable', data);
      return res.data;
    },
    onSuccess: (entry) => {
      qc.invalidateQueries({
        queryKey: queryKeys.timetable.class(entry.classId, entry.sectionId),
      });
      if (entry.teacherId) {
        qc.invalidateQueries({ queryKey: queryKeys.timetable.teacher(entry.teacherId) });
      }
    },
  });
}

export function useUpdateTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateTimetablePayload> }) => {
      const res = await apiClient.put<TimetableEntry>(`/timetable/${id}`, data);
      return res.data;
    },
    onSuccess: (entry) => {
      qc.invalidateQueries({
        queryKey: queryKeys.timetable.class(entry.classId, entry.sectionId),
      });
      if (entry.teacherId) {
        qc.invalidateQueries({ queryKey: queryKeys.timetable.teacher(entry.teacherId) });
      }
    },
  });
}

export function useDeleteTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      classId,
      sectionId,
      teacherId,
    }: {
      id: number;
      classId: number;
      sectionId: number;
      teacherId?: number;
    }) => {
      await apiClient.delete(`/timetable/${id}`);
      return { classId, sectionId, teacherId };
    },
    onSuccess: ({ classId, sectionId, teacherId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.timetable.class(classId, sectionId) });
      if (teacherId) {
        qc.invalidateQueries({ queryKey: queryKeys.timetable.teacher(teacherId) });
      }
    },
  });
}
