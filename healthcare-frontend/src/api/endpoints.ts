// All backend API endpoint constants
const BASE = '/api/v1';

export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${BASE}/auth/login`,
    REGISTER: `${BASE}/auth/register`,
    REFRESH: `${BASE}/auth/refresh`,
    LOGOUT: `${BASE}/auth/logout`,
  },

  // Doctors (public)
  DOCTORS: {
    LIST: `${BASE}/doctors`,
    SLOTS: (doctorId: string) => `${BASE}/doctors/${doctorId}/slots`,
  },

  // Appointments
  APPOINTMENTS: {
    HOLD: `${BASE}/appointments/hold`,
    CONFIRM: (holdId: string) => `${BASE}/appointments/${holdId}/confirm`,
    CANCEL: (id: string) => `${BASE}/appointments/${id}/cancel`,
    RESCHEDULE: (id: string) => `${BASE}/appointments/${id}/reschedule`,
    MY: `${BASE}/appointments/my`,
    DOCTOR: `${BASE}/appointments/doctor`,
    BY_ID: (id: string) => `${BASE}/appointments/${id}`,
    NOTES: (id: string) => `${BASE}/appointments/${id}/notes`,
  },

  // Prescriptions
  PRESCRIPTIONS: {
    MY: `${BASE}/prescriptions/my`,
    REMINDERS: (prescriptionId: string) => `${BASE}/prescriptions/${prescriptionId}/reminders`,
  },

  // Calendar
  CALENDAR: {
    AUTH_URL: `${BASE}/calendar/auth-url`,
    CALLBACK: `${BASE}/calendar/callback`,
  },

  // Admin – doctors
  ADMIN: {
    DOCTORS: `${BASE}/admin/doctors`,
    DOCTOR_BY_ID: (id: string) => `${BASE}/admin/doctors/${id}`,
    DOCTOR_LEAVE: (id: string) => `${BASE}/admin/doctors/${id}/leave`,
    DOCTOR_LEAVE_DATE: (id: string, date: string) => `${BASE}/admin/doctors/${id}/leave/${date}`,
    SPECIALISATIONS: `${BASE}/admin/specialisations`,
  },
};
