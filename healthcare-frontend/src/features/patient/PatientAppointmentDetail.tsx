import React from 'react';
import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  FileText,
  BrainCircuit,
  Pill,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { useAppointment } from './hooks/usePatientAPI';
import { ENDPOINTS } from '../../api/endpoints';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Reveal } from '../../lib/motion/Reveal';
import apiClient from '../../api/apiClient';
import type { Prescription } from '../../types/appointment';

/* ─── Frequency label ──────────────────────────────────────────────── */
function freqLabel(f: Prescription['frequency']) {
  if (f === 'ONCE_DAILY') return 'Once daily';
  if (f === 'TWICE_DAILY') return 'Twice daily';
  return 'Three times daily';
}

/* ─── Prescription card (patient-legible, not data-dense) ─────────── */
const PrescriptionCard: React.FC<{ rx: Prescription }> = ({ rx }) => (
  <div className="flex gap-4 py-4 border-b border-ink/5 last:border-0">
    <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Pill className="h-4.5 w-4.5 text-accent" style={{ height: '1.125rem', width: '1.125rem' }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-sm font-display font-semibold text-ink truncate">{rx.medicationName}</h4>
        <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full flex-shrink-0">
          {rx.dosage}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60 font-body">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" /> {freqLabel(rx.frequency)} · {rx.durationDays} days
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="h-3 w-3" />
          {format(parseISO(rx.startDate), 'MMM d')} → {format(parseISO(rx.endDate), 'MMM d, yyyy')}
        </span>
      </div>
      {rx.instructions && (
        <p className="mt-2 text-xs text-ink/70 font-body leading-relaxed italic bg-bg rounded-lg px-3 py-2 border border-ink/5">
          {rx.instructions}
        </p>
      )}
    </div>
  </div>
);

/* ─── Meta row ─────────────────────────────────────────────────────── */
const MetaItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-semibold text-ink">{value}</p>
    </div>
  </div>
);

const PatientAppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: apt, isLoading } = useAppointment(id!);

  if (isLoading) return <div className="flex justify-center p-16"><Spinner size="lg" /></div>;
  if (!apt) return (
    <div className="p-8 text-center text-ink/50 font-medium">
      <AlertCircle className="h-10 w-10 mx-auto mb-3 text-ink/20" />
      Appointment not found.
    </div>
  );

  const date = parseISO(apt.slotTime);
  const { symptomForm, postVisitSummary } = apt;
  const prescriptions: Prescription[] = (apt as any).prescriptions ?? [];

  const handleCalendarSync = async () => {
    try {
      const res = await apiClient.get<{ url: string }>(ENDPOINTS.CALENDAR.AUTH_URL);
      window.location.href = res.data.url;
    } catch {
      alert('Failed to initiate calendar sync.');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* ── Header card ── */}
      <Reveal>
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl text-ink font-display font-semibold">
                  Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                </h1>
                <Badge variant={apt.status}>{apt.status}</Badge>
              </div>
              <p className="text-sm text-ink/60 font-body">{apt.doctor.specialisation}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleCalendarSync} className="flex-shrink-0">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Add to Calendar
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-bg rounded-xl border border-ink/5">
            <MetaItem
              icon={<CalendarIcon className="h-4 w-4 text-accent" />}
              label="Date"
              value={format(date, 'MMM d, yyyy')}
            />
            <MetaItem
              icon={<Clock className="h-4 w-4 text-accent" />}
              label="Time"
              value={format(date, 'h:mm a')}
            />
            <MetaItem
              icon={<Stethoscope className="h-4 w-4 text-accent" />}
              label="Specialisation"
              value={apt.doctor.specialisation}
            />
            <MetaItem
              icon={<CheckCircle className="h-4 w-4 text-accent" />}
              label="Status"
              value={apt.status.charAt(0) + apt.status.slice(1).toLowerCase()}
            />
          </div>
        </Card>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Symptoms ── */}
        <Reveal delay={0.1} className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-base font-display font-semibold text-ink mb-5 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-ink/40" style={{ height: '1.125rem', width: '1.125rem' }} />
              Your Symptom Form
            </h2>
            {symptomForm ? (
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-2">Severity</p>
                  <Badge variant={symptomForm.severity > 7 ? 'danger' : symptomForm.severity > 4 ? 'warning' : 'success'}>
                    {symptomForm.severity}/10
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-2">Duration</p>
                  <p className="text-sm font-medium text-ink">{symptomForm.durationDays} days</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-2">Symptoms</p>
                  <p className="text-sm text-ink font-body leading-relaxed bg-bg p-3.5 rounded-lg border border-ink/5 whitespace-pre-wrap">
                    {symptomForm.symptoms}
                  </p>
                </div>
                {symptomForm.additionalNotes && (
                  <div>
                    <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-2">Additional Notes</p>
                    <p className="text-sm text-ink/60 font-body italic">{symptomForm.additionalNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink/40 font-body italic">No symptom form submitted.</p>
            )}
          </Card>
        </Reveal>

        {/* ── Right: Post-visit summary + prescriptions ── */}
        <Reveal delay={0.2} className="lg:col-span-2 space-y-6">
          {/* AI Post-Visit Summary */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-display font-semibold text-ink flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-accent" />
                Post-Visit Summary
              </h2>
              {postVisitSummary?.llmStatus === 'COMPLETED' && (
                <Badge variant="success">AI Generated</Badge>
              )}
            </div>

            {!postVisitSummary || postVisitSummary.llmStatus === 'PENDING' ? (
              <div className="bg-bg border border-dashed border-ink/10 rounded-xl p-10 text-center">
                <RefreshCw className="h-9 w-9 text-ink/20 mx-auto mb-3 animate-spin [animation-duration:3s]" />
                <p className="text-sm font-display font-medium text-ink mb-1.5">Awaiting Doctor's Notes</p>
                <p className="text-xs text-ink/50 font-body max-w-xs mx-auto leading-relaxed">
                  Once your doctor submits notes, our AI will create a clear, patient-friendly summary.
                </p>
              </div>
            ) : postVisitSummary.llmStatus === 'FAILED' ? (
              <div className="bg-danger/5 border border-danger/20 rounded-xl p-6 text-center">
                <AlertCircle className="h-7 w-7 text-danger mx-auto mb-2" />
                <p className="text-sm font-medium text-danger">Summary generation temporarily unavailable.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-3">Doctor's Advice</p>
                  <div className="bg-bg p-5 rounded-xl border border-ink/5">
                    <p className="text-sm text-ink font-body leading-relaxed whitespace-pre-wrap">
                      {postVisitSummary.patientFriendlySummary}
                    </p>
                  </div>
                </div>
                {postVisitSummary.followUpAdvice && (
                  <div>
                    <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-3">Follow-up Plan</p>
                    <div className="bg-accent/5 p-5 rounded-xl border border-accent/15">
                      <p className="text-sm text-ink font-body leading-relaxed whitespace-pre-wrap">
                        {postVisitSummary.followUpAdvice}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Prescriptions — clean card list */}
          {prescriptions.length > 0 && (
            <Card>
              <h2 className="text-base font-display font-semibold text-ink mb-2 flex items-center gap-2">
                <Pill className="h-4 w-4 text-accent" />
                Prescriptions
              </h2>
              <p className="text-xs text-ink/50 font-body mb-4">
                {prescriptions.length} medication{prescriptions.length !== 1 ? 's' : ''} prescribed
              </p>
              <div>
                {prescriptions.map((rx) => (
                  <PrescriptionCard key={rx.id} rx={rx} />
                ))}
              </div>
            </Card>
          )}
        </Reveal>
      </div>
    </div>
  );
};

export default PatientAppointmentDetail;
