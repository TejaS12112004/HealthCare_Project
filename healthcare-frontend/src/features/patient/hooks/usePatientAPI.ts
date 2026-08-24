import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import type { Appointment, Doctor, HoldResponse, SlotResponse } from '../../../types/appointment';

// Fetch patient appointments
export const usePatientAppointments = (status: string, size?: number) => {
  return useQuery({
    queryKey: ['appointments', 'patient', status, size],
    queryFn: async () => {
      const params = new URLSearchParams({ status });
      if (size) params.append('size', size.toString());
      const { data } = await apiClient.get<{ content: Appointment[] }>(`${ENDPOINTS.APPOINTMENTS.MY}?${params.toString()}`);
      return data.content; // assuming Spring Data Pageable response
    },
  });
};

// Fetch single appointment
export const useAppointment = (id: string) => {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const { data } = await apiClient.get<Appointment>(ENDPOINTS.APPOINTMENTS.BY_ID(id));
      return data;
    },
    enabled: !!id,
  });
};

// Search doctors
export const useSearchDoctors = (specialisation?: string, date?: string) => {
  return useQuery({
    queryKey: ['doctors', specialisation, date],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (specialisation) params.append('specialisation', specialisation);
      if (date) params.append('date', date);
      const { data } = await apiClient.get<{ content: Doctor[] }>(`${ENDPOINTS.DOCTORS.LIST}?${params.toString()}`);
      return data.content;
    },
  });
};

// Get doctor slots
export const useDoctorSlots = (doctorId: string, date: string) => {
  return useQuery({
    queryKey: ['slots', doctorId, date],
    queryFn: async () => {
      const { data } = await apiClient.get<SlotResponse[]>(`${ENDPOINTS.DOCTORS.SLOTS(doctorId)}?date=${date}`);
      return data;
    },
    enabled: !!doctorId && !!date,
  });
};

// Cancel appointment
export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(ENDPOINTS.APPOINTMENTS.CANCEL(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

// Hold slot
export const useHoldSlot = () => {
  return useMutation({
    mutationFn: async (data: { doctorId: string; slotTime: string }) => {
      const res = await apiClient.post<HoldResponse>(ENDPOINTS.APPOINTMENTS.HOLD, data);
      return res.data;
    },
  });
};

// Confirm booking
export const useConfirmBooking = () => {
  return useMutation({
    mutationFn: async (data: { holdId: string; symptoms: string; durationDays: number; severity: string; additionalNotes?: string }) => {
      const { holdId, ...payload } = data;
      const res = await apiClient.post<Appointment>(ENDPOINTS.APPOINTMENTS.CONFIRM(holdId), payload);
      return res.data;
    },
  });
};
