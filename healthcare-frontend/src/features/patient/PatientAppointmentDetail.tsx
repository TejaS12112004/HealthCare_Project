import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Stethoscope, FileText, BrainCircuit, Activity } from 'lucide-react';
import { useAppointment } from './hooks/usePatientAPI';
import { ENDPOINTS } from '../../api/endpoints';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Reveal } from '../../lib/motion/Reveal';
import apiClient from '../../api/apiClient';

const PatientAppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: apt, isLoading } = useAppointment(id!);

  if (isLoading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  if (!apt) return <div className="p-8 text-center text-slate-500 font-medium">Appointment not found.</div>;

  const date = parseISO(apt.slotTime);
  const { symptomForm, postVisitSummary } = apt;

  const handleCalendarSync = async () => {
    try {
      // Fetch the auth URL from backend
      const res = await apiClient.get<{ url: string }>(ENDPOINTS.CALENDAR.AUTH_URL);
      window.location.href = res.data.url;
    } catch (err) {
      alert("Failed to initiate calendar sync.");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header Card */}
      <Reveal>
        <div className="bg-surface border border-primary/5 rounded-2xl p-8 shadow-multi">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl text-primary">Consultation with Dr. {apt.doctor.lastName}</h1>
                <Badge variant={apt.status}>{apt.status}</Badge>
              </div>
              <p className="text-slate-500 font-medium">{apt.doctor.specialisation}</p>
            </div>
            
            <Button variant="secondary" onClick={handleCalendarSync} className="flex-shrink-0">
              <CalendarIcon className="h-4 w-4" />
              Sync to Google Calendar
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-background rounded-2xl border border-primary/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date</p>
                <p className="text-sm font-bold text-primary">{format(date, 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Time</p>
                <p className="text-sm font-bold text-primary">{format(date, 'h:mm a')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</p>
                <p className="text-sm font-bold text-primary">{apt.doctor.firstName} {apt.doctor.lastName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
                <p className="text-sm font-bold text-primary capitalize">{apt.status.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Symptoms */}
        <Reveal delay={0.1} className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-primary/5 rounded-2xl p-8 shadow-multi">
            <h2 className="text-xl text-primary mb-6 flex items-center gap-2">
              <FileText className="h-6 w-6 text-slate-400" />
              Symptom Form
            </h2>
            
            {symptomForm ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Severity</p>
                  <Badge variant={
                    symptomForm.severity > 7 ? 'HIGH' : symptomForm.severity > 4 ? 'MEDIUM' : 'LOW'
                  }>
                    {symptomForm.severity}/10
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Duration</p>
                  <p className="text-sm font-medium text-primary">{symptomForm.durationDays} days</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Symptoms</p>
                  <p className="text-sm text-primary font-medium whitespace-pre-wrap bg-background p-4 rounded-xl border border-primary/5">{symptomForm.symptoms}</p>
                </div>
                {symptomForm.additionalNotes && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-sm text-slate-600 font-medium italic">{symptomForm.additionalNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 font-medium italic">No symptom form submitted.</p>
            )}
          </div>
        </Reveal>

        {/* Right Column: AI Post-Visit & Prescriptions */}
        <Reveal delay={0.2} className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-primary/5 rounded-2xl p-8 shadow-multi h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl text-primary flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-accent" />
                Post-Visit Summary
              </h2>
              {postVisitSummary?.llmStatus === 'COMPLETED' && (
                <Badge variant="success">AI Generated</Badge>
              )}
            </div>

            {!postVisitSummary || postVisitSummary.llmStatus === 'PENDING' ? (
              <div className="bg-background border border-primary/10 border-dashed rounded-2xl p-12 text-center">
                <Clock className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                <p className="text-primary font-bold text-lg mb-2">Awaiting Doctor's Notes</p>
                <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                  Your doctor has not submitted the final notes yet. Once submitted, our AI will generate a patient-friendly summary for you here.
                </p>
              </div>
            ) : postVisitSummary.llmStatus === 'FAILED' ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
                <p className="text-red-600 font-medium">Summary generation temporarily unavailable.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Doctor's Advice</h3>
                  <div className="bg-background p-6 rounded-2xl border border-primary/5">
                    <p className="whitespace-pre-wrap leading-relaxed text-primary font-medium">
                      {postVisitSummary.patientFriendlySummary}
                    </p>
                  </div>
                </div>

                {postVisitSummary.followUpAdvice && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Follow-up Plan</h3>
                    <div className="bg-accent/5 p-6 rounded-2xl border border-accent/20">
                      <p className="whitespace-pre-wrap leading-relaxed text-primary font-medium">
                        {postVisitSummary.followUpAdvice}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default PatientAppointmentDetail;
