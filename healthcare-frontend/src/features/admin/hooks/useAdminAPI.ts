import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import type { Doctor } from '../../../types/appointment';

// -----------------------------------------------------
// DOCTOR MANAGEMENT
// -----------------------------------------------------
export const useAdminDoctors = () => {
  return useQuery({
    queryKey: ['admin', 'doctors'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ content: Doctor[] }>(ENDPOINTS.DOCTORS.LIST);
      return data.content;
    },
  });
};

export const useAdminSpecialisations = () => {
  return useQuery({
    queryKey: ['admin', 'specialisations'],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/api/v1/admin/specialisations');
      return data;
    },
  });
};

export const useCreateDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/api/v1/admin/doctors', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] });
    },
  });
};

export const useUpdateDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & any) => {
      const { data } = await apiClient.put(`/api/v1/admin/doctors/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] });
    },
  });
};

export const useDeactivateDoctor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/admin/doctors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'doctors'] });
    },
  });
};

// -----------------------------------------------------
// LEAVE MANAGEMENT
// -----------------------------------------------------
export const useDoctorLeave = (doctorId: string, year: number, month: number) => {
  return useQuery({
    queryKey: ['admin', 'leave', doctorId, year, month],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>(`/api/v1/admin/doctors/${doctorId}/leave?year=${year}&month=${month}`);
      return data;
    },
    enabled: !!doctorId,
  });
};

export const useMarkLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ doctorId, date, reason }: { doctorId: string, date: string, reason: string }) => {
      const { data } = await apiClient.post(`/api/v1/admin/doctors/${doctorId}/leave`, { leaveDate: date, reason });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leave', variables.doctorId] });
    },
  });
};

export const useRemoveLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ doctorId, date }: { doctorId: string, date: string }) => {
      await apiClient.delete(`/api/v1/admin/doctors/${doctorId}/leave/${date}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'leave', variables.doctorId] });
    },
  });
};

// -----------------------------------------------------
// NOTIFICATION & LLM MONITORS
// -----------------------------------------------------
export const useEmailLogs = (status?: string) => {
  return useQuery({
    queryKey: ['admin', 'emails', status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      const { data } = await apiClient.get<any[]>(`/api/v1/admin/notifications?${params.toString()}`);
      return data;
    },
  });
};

export const useRetryAllEmails = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/api/v1/admin/notifications/retry');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'emails'] });
    },
  });
};

export const useFailedLLMSummaries = () => {
  return useQuery({
    queryKey: ['admin', 'llm-failed'],
    queryFn: async () => {
      const { data } = await apiClient.get<any[]>('/api/v1/admin/llm/failed');
      return data;
    },
  });
};

export const useRetryLLM = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type }: { id: string, type: 'pre-visit' | 'post-visit' }) => {
      await apiClient.post(`/api/v1/admin/llm/retry/${type}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'llm-failed'] });
    },
  });
};
