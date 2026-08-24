import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, FileText, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDoctorAppointments } from './hooks/useDoctorAPI';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Skeleton } from '../../components/ui/Skeleton';
import { Reveal, RevealItem } from '../../lib/motion/Reveal';
import { cn } from '../../lib/utils';
import type { Appointment } from '../../types/appointment';

const UrgencyBadge: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  if (appointment.status === 'COMPLETED') {
    return <Badge variant="success">Completed</Badge>;
  }
  
  if (!appointment.preVisitSummary || appointment.preVisitSummary.llmStatus === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-xs font-bold border border-accent/20">
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
      return <div className="animate-pulse-slow"><Badge variant="danger">High Urgency</Badge></div>;
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
    <div className="max-w-7xl mx-auto space-y-8 p-8">
      <Reveal>
        <header>
          <h1 className="text-3xl text-primary mb-2">Welcome back, Dr. {user?.lastName}!</h1>
          <p className="text-slate-500 font-medium">Here is your schedule and patient overview for today.</p>
        </header>
      </Reveal>

      {/* Quick Stats */}
      <Reveal delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-primary/5 rounded-2xl p-6 shadow-multi flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Today</p>
              <p className="text-3xl font-bold text-primary">{totalToday}</p>
            </div>
          </div>
          
          <div className="bg-surface border border-primary/5 rounded-2xl p-6 shadow-multi flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <FileText className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Notes</p>
              <p className="text-3xl font-bold text-primary">{pendingNotes.length}</p>
            </div>
          </div>

          <div className="bg-surface border border-primary/5 rounded-2xl p-6 shadow-multi flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</p>
              <p className="text-3xl font-bold text-primary">{completedToday.length}</p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Today's Appointments List */}
      <Reveal delay={0.2}>
        <div className="bg-surface border border-primary/5 rounded-2xl overflow-hidden shadow-multi">
          <div className="px-8 py-6 border-b border-primary/5 flex items-center justify-between bg-background/50">
            <h2 className="text-xl text-primary font-bold">Today's Appointments</h2>
            <span className="text-sm font-bold text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4 p-8">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : appointments && appointments.length > 0 ? (
            <Reveal stagger={0.04} className="divide-y divide-primary/5">
              {appointments.map((apt) => (
                <RevealItem key={apt.id}>
                  <Link 
                    to={`/doctor/appointments/${apt.id}`}
                    className={cn(
                      "flex items-center justify-between p-6 hover:bg-surface-hover hover:-translate-y-[2px] transition-all duration-200 group",
                      apt.status === 'COMPLETED' && "opacity-70"
                    )}
                  >
                    <div className="flex items-center gap-6 flex-1">
                      <div className="flex flex-col text-primary font-bold w-24">
                        <span className="font-bold text-primary">{format(parseISO(apt.slotTime), 'h:mm a')}</span>
                        <span className="text-xs font-medium text-slate-500">30 min</span>
                      </div>
                      
                      <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        <User className="h-6 w-6 text-slate-400 group-hover:text-accent" />
                      </div>

                      <div className="flex-1">
                        <div className="font-bold text-primary text-lg">
                        {apt.patient 
                          ? (apt.patient as any).name || `${apt.patient.firstName} ${apt.patient.lastName}`
                          : (apt as any).patientName || 'Unknown Patient'}
                      </div>
                        {apt.symptomForm?.symptoms && (
                          <p className="text-sm font-medium text-slate-500 truncate max-w-md">
                            {apt.symptomForm.symptoms}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden md:block">
                        <UrgencyBadge appointment={apt} />
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-accent transition-colors" />
                    </div>
                  </Link>
                </RevealItem>
              ))}
            </Reveal>
          ) : (
            <div className="p-16 text-center text-slate-500 font-medium">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p>You have no appointments scheduled for today.</p>
            </div>
          )}
        </div>
      </Reveal>
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
