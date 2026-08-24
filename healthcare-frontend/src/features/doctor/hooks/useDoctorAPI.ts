import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import type { Appointment } from '../../../types/appointment';

export const useDoctorAppointments = (date?: string, status?: string) => {
  return useQuery({
    queryKey: ['appointments', 'doctor', date, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (status) params.append('status', status);
      
      const { data } = await apiClient.get<{ content: Appointment[] }>(`${ENDPOINTS.APPOINTMENTS.DOCTOR}?${params.toString()}`);
      return data.content;
    },
  });
};

export const useDoctorAppointment = (id: string) => {
  return useQuery({
    queryKey: ['appointment', 'doctor', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Appointment>(ENDPOINTS.APPOINTMENTS.BY_ID(id));
      return data;
    },
    enabled: !!id,
  });
};

interface PrescriptionPayload {
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

interface SubmitNotesPayload {
  id: string;
  clinicalNotes: string;
  prescriptions: PrescriptionPayload[];
}

export const useSubmitNotes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: SubmitNotesPayload) => {
      const { data } = await apiClient.post<Appointment>(ENDPOINTS.APPOINTMENTS.NOTES(id), payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointment', 'doctor', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'doctor'] });
    },
  });
};
