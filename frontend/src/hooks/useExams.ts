import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { fetchPaginated, apiClient } from '../services/apiClient';
import type { Exam, Mark, ExamStatistics, StudentExamResults, ExamResults } from '../types/api';
import type { ExamFormData, MarksEntryFormData } from '../schemas/examSchemas';

interface ExamListParams {
  classId?: number;
  examType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export function useExamList(params: ExamListParams = {}) {
  return useQuery({
    queryKey: queryKeys.exams.list(params as Record<string, unknown>),
    queryFn: ({ signal }) =>
      fetchPaginated<Exam>('/exams', params as Record<string, unknown>, signal),
    placeholderData: (prev) => prev,
  });
}

export function useExam(id: number) {
  return useQuery({
    queryKey: queryKeys.exams.detail(id),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<Exam>(`/exams/${id}`, { signal });
      return res.data;
    },
    enabled: id > 0,
  });
}

export function useExamMarks(examId: number) {
  return useQuery({
    queryKey: queryKeys.exams.marks(examId),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<Mark[]>(`/exams/${examId}/marks`, { signal });
      return res.data;
    },
    enabled: examId > 0,
  });
}

export function useStudentExamResults(studentId: number) {
  return useQuery({
    queryKey: queryKeys.exams.studentResults(studentId),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<StudentExamResults>(`/exams/student/${studentId}`, { signal });
      return res.data;
    },
    enabled: studentId > 0,
  });
}

export function useExamResults(examId: number) {
  return useQuery({
    queryKey: queryKeys.exams.results(examId),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ExamResults>(`/exams/${examId}/results`, { signal });
      return res.data;
    },
    enabled: examId > 0,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ExamFormData) => {
      const res = await apiClient.post<Exam>('/exams', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exams.lists() });
    },
  });
}

export function useSubmitMarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, data }: { examId: number; data: MarksEntryFormData[] }) => {
      const res = await apiClient.post<Mark[]>(`/exams/${examId}/marks`, data);
      return res.data;
    },
    onSuccess: (_, { examId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.exams.marks(examId) });
      qc.invalidateQueries({ queryKey: queryKeys.exams.results(examId) });
    },
  });
}
