import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, FileText, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDoctorAppointments } from './hooks/useDoctorAPI';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { cn } from '../../lib/utils';
import type { Appointment } from '../../types/appointment';

const UrgencyBadge: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  if (appointment.status === 'COMPLETED') {
    return <Badge variant="success">Completed</Badge>;
  }
  
  if (!appointment.preVisitSummary || appointment.preVisitSummary.llmStatus === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
        <Spinner size="sm" className="h-3 w-3" />
        Analysing…
      </span>
    );
  }

  if (appointment.preVisitSummary.llmStatus === 'FAILED') {
    return <Badge variant="danger">Error</Badge>;
  }

  const urgency = appointment.preVisitSummary.urgencyLevel;
  switch (urgency) {
    case 'HIGH':
      return <Badge variant="danger">High Urgency</Badge>;
    case 'MEDIUM':
      return <Badge variant="warning">Medium Urgency</Badge>;
    default:
      return <Badge variant="success">Low Urgency</Badge>;
  }
};

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Fetch today's appointments
  const { data: appointments, isLoading } = useDoctorAppointments(today);

  const pendingNotes = appointments?.filter(a => a.status === 'CONFIRMED') || [];
  const completedToday = appointments?.filter(a => a.status === 'COMPLETED') || [];
  const totalToday = appointments?.length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Dr. {user?.lastName}!</h1>
        <p className="text-slate-400">Here is your schedule and patient overview for today.</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Total Today</p>
            <p className="text-2xl font-bold text-white">{totalToday}</p>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <FileText className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Pending Notes</p>
            <p className="text-2xl font-bold text-white">{pendingNotes.length}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Completed</p>
            <p className="text-2xl font-bold text-white">{completedToday.length}</p>
          </div>
        </div>
      </div>

      {/* Today's Appointments List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Today's Appointments</h2>
          <span className="text-sm text-slate-400">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size="lg" /></div>
        ) : appointments && appointments.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {appointments.map((apt) => (
              <Link 
                key={apt.id} 
                to={`/doctor/appointments/${apt.id}`}
                className={cn(
                  "flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors group",
                  apt.status === 'COMPLETED' && "opacity-70"
                )}
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="flex flex-col text-slate-300 w-24">
                    <span className="font-semibold text-white">{format(parseISO(apt.slotTime), 'h:mm a')}</span>
                    <span className="text-xs text-slate-500">30 min</span>
                  </div>
                  
                  <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <User className="h-5 w-5 text-slate-400 group-hover:text-indigo-400" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-200">
                      {apt.patient.firstName} {apt.patient.lastName}
                    </h3>
                    {apt.symptomForm?.symptoms && (
                      <p className="text-sm text-slate-400 truncate max-w-md">
                        {apt.symptomForm.symptoms}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden md:block">
                    <UrgencyBadge appointment={apt} />
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="h-12 w-12 text-slate-700 mx-auto mb-4" />
            <p>You have no appointments scheduled for today.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;

// Add ChevronRight inline to avoid extra import if missing
function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
