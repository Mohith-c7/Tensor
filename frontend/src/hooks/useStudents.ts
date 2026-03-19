import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { fetchPaginated, apiClient } from '../services/apiClient';
import type { Student, CreateStudentRequest, StudentListParams } from '../types/api';

export function useStudentList(params: StudentListParams = {}) {
  return useQuery({
    queryKey: queryKeys.students.list(params as Record<string, unknown>),
    queryFn: ({ signal }) =>
      fetchPaginated<Student>('/students', params as Record<string, unknown>, signal),
    placeholderData: (prev) => prev,
  });
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: queryKeys.students.detail(id),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<Student>(`/students/${id}`, { signal });
      return res.data;
    },
    enabled: id > 0,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateStudentRequest) => {
      const res = await apiClient.post<Student>('/students', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateStudentRequest> }) => {
      const res = await apiClient.put<Student>(`/students/${id}`, data);
      return res.data;
    },
    onSuccess: (student) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.students.detail(student.id) });
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/students/${id}`);
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.lists() });
      qc.removeQueries({ queryKey: queryKeys.students.detail(id) });
    },
  });
}
