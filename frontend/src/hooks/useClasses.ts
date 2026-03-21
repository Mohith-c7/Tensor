import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

interface ClassOption {
  id: number;
  name: string;
}

interface SectionOption {
  id: number;
  name: string;
}

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ClassOption[]>('/classes', { signal });
      return res.data as ClassOption[];
    },
    staleTime: 10 * 60 * 1000, // classes rarely change
  });
}

export function useSections(classId: number) {
  return useQuery({
    queryKey: ['classes', classId, 'sections'],
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<SectionOption[]>(`/classes/${classId}/sections`, { signal });
      return res.data as SectionOption[];
    },
    enabled: classId > 0,
    staleTime: 10 * 60 * 1000,
  });
}
