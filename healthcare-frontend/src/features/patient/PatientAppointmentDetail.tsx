import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Stethoscope, FileText, BrainCircuit, Activity } from 'lucide-react';
import { useAppointment } from './hooks/usePatientAPI';
import { ENDPOINTS } from '../../api/endpoints';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Reveal } from '../../lib/motion/Reveal';
import apiClient from '../../api/apiClient';

const PatientAppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: apt, isLoading } = useAppointment(id!);

  if (isLoading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  if (!apt) return <div className="p-8 text-center text-ink/50 font-medium">Appointment not found.</div>;

  const date = parseISO(apt.slotTime);
  const { symptomForm, postVisitSummary } = apt;

  const handleCalendarSync = async () => {
    try {
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
        <Card>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl text-ink font-display font-medium">Consultation with Dr. {apt.doctor.lastName}</h1>
                <Badge variant={apt.status}>{apt.status}</Badge>
              </div>
              <p className="text-ink/60 font-body">{apt.doctor.specialisation}</p>
            </div>
            
            <Button variant="secondary" onClick={handleCalendarSync} className="flex-shrink-0">
              <CalendarIcon className="h-4 w-4" />
              Sync to Google Calendar
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-bg rounded-xl border border-ink/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink/50 uppercase tracking-wider">Date</p>
                <p className="text-sm font-bold text-ink">{format(date, 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink/50 uppercase tracking-wider">Time</p>
                <p className="text-sm font-bold text-ink">{format(date, 'h:mm a')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink/50 uppercase tracking-wider">Doctor</p>
                <p className="text-sm font-bold text-ink">{apt.doctor.firstName} {apt.doctor.lastName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink/50 uppercase tracking-wider">Status</p>
                <p className="text-sm font-bold text-ink capitalize">{apt.status.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Symptoms */}
        <Reveal delay={0.1} className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-xl text-ink font-display font-medium mb-6 flex items-center gap-2">
              <FileText className="h-6 w-6 text-ink/40" />
              Symptom Form
            </h2>
            
            {symptomForm ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-2">Severity</p>
                  <Badge variant={
                    symptomForm.severity > 7 ? 'danger' : symptomForm.severity > 4 ? 'warning' : 'success'
                  }>
                    {symptomForm.severity}/10
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-2">Duration</p>
                  <p className="text-sm font-medium text-ink">{symptomForm.durationDays} days</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-2">Symptoms</p>
                  <p className="text-sm text-ink font-medium whitespace-pre-wrap bg-bg p-4 rounded-lg border border-ink/5">{symptomForm.symptoms}</p>
                </div>
                {symptomForm.additionalNotes && (
                  <div>
                    <p className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-sm text-ink/60 font-medium italic">{symptomForm.additionalNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink/50 font-body italic">No symptom form submitted.</p>
            )}
          </Card>
        </Reveal>

        {/* Right Column: AI Post-Visit & Prescriptions */}
        <Reveal delay={0.2} className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl text-ink font-display font-medium flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-accent" />
                Post-Visit Summary
              </h2>
              {postVisitSummary?.llmStatus === 'COMPLETED' && (
                <Badge variant="success">AI Generated</Badge>
              )}
            </div>

            {!postVisitSummary || postVisitSummary.llmStatus === 'PENDING' ? (
              <div className="bg-bg border border-ink/10 border-dashed rounded-xl p-12 text-center">
                <Clock className="h-10 w-10 text-ink/40 mx-auto mb-4" />
                <p className="text-ink font-display font-medium text-lg mb-2">Awaiting Doctor's Notes</p>
                <p className="text-sm text-ink/50 font-body max-w-md mx-auto">
                  Your doctor has not submitted the final notes yet. Once submitted, our AI will generate a patient-friendly summary for you here.
                </p>
              </div>
            ) : postVisitSummary.llmStatus === 'FAILED' ? (
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-8 text-center">
                <p className="text-danger font-medium">Summary generation temporarily unavailable.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-3">Doctor's Advice</h3>
                  <div className="bg-bg p-6 rounded-xl border border-ink/5">
                    <p className="whitespace-pre-wrap leading-relaxed text-ink font-medium">
                      {postVisitSummary.patientFriendlySummary}
                    </p>
                  </div>
                </div>

                {postVisitSummary.followUpAdvice && (
                  <div>
                    <h3 className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-3">Follow-up Plan</h3>
                    <div className="bg-accent/5 p-6 rounded-xl border border-accent/20">
                      <p className="whitespace-pre-wrap leading-relaxed text-ink font-medium">
                        {postVisitSummary.followUpAdvice}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Reveal>
      </div>
    </div>
  );
};

export default PatientAppointmentDetail;
