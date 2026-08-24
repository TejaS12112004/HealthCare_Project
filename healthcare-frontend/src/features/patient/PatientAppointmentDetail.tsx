import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Stethoscope, FileText, BrainCircuit, Activity } from 'lucide-react';
import { useAppointment } from './hooks/usePatientAPI';
import { ENDPOINTS } from '../../api/endpoints';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import apiClient from '../../api/apiClient';

const PatientAppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: apt, isLoading } = useAppointment(id!);

  if (isLoading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  if (!apt) return <div className="p-8 text-center text-slate-400">Appointment not found.</div>;

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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">Consultation with Dr. {apt.doctor.lastName}</h1>
              <Badge variant={apt.status}>{apt.status}</Badge>
            </div>
            <p className="text-slate-400">{apt.doctor.specialisation}</p>
          </div>
          
          <Button variant="secondary" onClick={handleCalendarSync} className="flex-shrink-0">
            <CalendarIcon className="h-4 w-4" />
            Sync to Google Calendar
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-900/30 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Date</p>
              <p className="text-sm font-medium text-slate-200">{format(date, 'MMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-900/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Time</p>
              <p className="text-sm font-medium text-slate-200">{format(date, 'h:mm a')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-900/30 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Doctor</p>
              <p className="text-sm font-medium text-slate-200">{apt.doctor.firstName} {apt.doctor.lastName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-900/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <p className="text-sm font-medium text-slate-200 capitalize">{apt.status.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Symptoms */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400" />
              Symptom Form
            </h2>
            
            {symptomForm ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Severity</p>
                  <Badge variant={
                    symptomForm.severity > 7 ? 'HIGH' : symptomForm.severity > 4 ? 'MEDIUM' : 'LOW'
                  }>
                    {symptomForm.severity}/10
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-sm text-slate-300">{symptomForm.durationDays} days</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Symptoms</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-950 p-3 rounded-lg border border-slate-800">{symptomForm.symptoms}</p>
                </div>
                {symptomForm.additionalNotes && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-slate-300 italic">{symptomForm.additionalNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No symptom form submitted.</p>
            )}
          </div>
        </div>

        {/* Right Column: AI Post-Visit & Prescriptions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-indigo-400" />
                Post-Visit Summary
              </h2>
              {postVisitSummary?.llmStatus === 'COMPLETED' && (
                <Badge variant="success">AI Generated</Badge>
              )}
            </div>

            {!postVisitSummary || postVisitSummary.llmStatus === 'PENDING' ? (
              <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl p-8 text-center">
                <Clock className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">Awaiting Doctor's Notes</p>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  Your doctor has not submitted the final notes yet. Once submitted, our AI will generate a patient-friendly summary for you here.
                </p>
              </div>
            ) : postVisitSummary.llmStatus === 'FAILED' ? (
              <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-6 text-center">
                <p className="text-red-400 text-sm">Summary generation temporarily unavailable.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">Doctor's Advice</h3>
                  <div className="prose prose-invert prose-sm max-w-none bg-slate-950 p-5 rounded-xl border border-slate-800">
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-300">
                      {postVisitSummary.patientFriendlySummary}
                    </p>
                  </div>
                </div>

                {postVisitSummary.followUpAdvice && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 mb-2 uppercase tracking-wider">Follow-up Plan</h3>
                    <div className="bg-indigo-950/30 p-5 rounded-xl border border-indigo-900/50">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-indigo-200">
                        {postVisitSummary.followUpAdvice}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientAppointmentDetail;
