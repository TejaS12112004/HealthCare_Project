export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'RESCHEDULED';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SymptomForm {
  id: string;
  symptoms: string;
  durationDays: number;
  severity: number;
  additionalNotes?: string;
  submittedAt: string;
}

export interface PreVisitSummary {
  id: string;
  urgencyLevel: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
  llmStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface PostVisitSummary {
  id: string;
  patientFriendlySummary: string;
  followUpAdvice: string;
  llmStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface Appointment {
  id: string;
  doctor: Doctor;
  patient: PatientSummary;
  slotTime: string;
  status: AppointmentStatus;
  cancelledReason?: string;
  symptomForm?: SymptomForm;
  preVisitSummary?: PreVisitSummary;
  postVisitSummary?: PostVisitSummary;
  googleCalendarEventIdPatient?: string;
  googleCalendarEventIdDoctor?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialisation: string;
  specialisationId: string;
  bio?: string;
  slotDurationMinutes: number;
  consultationFee?: number;
  isActive: boolean;
  availableSlots?: string[];
  nextAvailableDate?: string;
  workingHours?: any[];
}

export interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SlotResponse {
  slotTime: string;
  isAvailable: boolean;
}

export interface HoldResponse {
  holdId: string;
  slotTime: string;
  expiresAt: string;
}

export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: 'ONCE_DAILY' | 'TWICE_DAILY' | 'THRICE_DAILY';
  durationDays: number;
  startDate: string;
  endDate: string;
  instructions?: string;
  reminderTimesLocal: string[];
}
