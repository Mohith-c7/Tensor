import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

interface Class {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
}

/**
 * Hook to fetch all classes
 */
export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Class[] }>('/classes');
      return response.data.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - classes don't change often
  });
}

/**
 * Hook to fetch sections for a specific class
 */
export function useSections(classId: number | null) {
  return useQuery({
    queryKey: ['sections', classId],
    queryFn: async () => {
      if (!classId) return [];
      const response = await apiClient.get<{ data: Section[] }>(`/classes/${classId}/sections`);
      return response.data.data || [];
    },
    enabled: !!classId,
    staleTime: 10 * 60 * 1000,
  });
}
