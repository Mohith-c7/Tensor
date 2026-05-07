import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';
import { apiClient } from '../services/apiClient';
import type { FeeStructure, FeePayment, StudentFeeStatus } from '../types/api';
import type { FeeStructureFormData, PaymentFormData } from '../schemas/feeSchemas';

export function useFeeStructures() {
  return useQuery({
    queryKey: queryKeys.fees.structures(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<FeeStructure[]>('/fees/structures', { signal });
      return res.data;
    },
  });
}

export function useCreateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: FeeStructureFormData) => {
      const res = await apiClient.post<FeeStructure>('/fees/structures', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.fees.structures() });
    },
  });
}

export function useStudentFeeStatus(studentId: number, year: string) {
  return useQuery({
    queryKey: queryKeys.fees.studentStatus(studentId, year),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<StudentFeeStatus>(`/fees/student/${studentId}`, {
        params: { year },
        signal,
      });
      return res.data;
    },
    enabled: studentId > 0 && !!year,
  });
}

export function usePendingFees() {
  return useQuery({
    queryKey: queryKeys.fees.pending(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<StudentFeeStatus[]>('/fees/pending', { signal });
      return res.data;
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const res = await apiClient.post<FeePayment>('/fees/payments', data);
      return res.data;
    },
    onSuccess: (payment) => {
      qc.invalidateQueries({ queryKey: queryKeys.fees.payments() });
      qc.invalidateQueries({
        queryKey: queryKeys.fees.studentStatus(payment.studentId, payment.academicYear),
      });
      qc.invalidateQueries({ queryKey: queryKeys.fees.pending() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.kpis() });
    },
  });
}

export function useClassFeesSummary(classId: number | null, academicYear: string) {
  return useQuery({
    queryKey: queryKeys.fees.classSummary(classId, academicYear),
    queryFn: async ({ signal }) => {
      if (!classId) return null;
      const res = await apiClient.get(`/fees/class/${classId}/summary`, {
        params: { year: academicYear },
        signal,
      });
      return res.data;
    },
    enabled: !!classId && !!academicYear,
  });
}
