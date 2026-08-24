import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, FileText, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDoctorAppointments } from './hooks/useDoctorAPI';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Skeleton } from '../../components/ui/Skeleton';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Reveal, RevealItem } from '../../lib/motion/Reveal';
import { cn } from '../../lib/utils';
import type { Appointment } from '../../types/appointment';

const UrgencyBadge: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  if (appointment.status === 'COMPLETED') {
    return <Badge variant="COMPLETED">Completed</Badge>;
  }
  
  if (!appointment.preVisitSummary || appointment.preVisitSummary.llmStatus === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/20">
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
          <h1 className="text-3xl text-ink font-display mb-2">Welcome back, Dr. {user?.lastName}!</h1>
          <p className="text-ink/60 font-body">Here is your schedule and patient overview for today.</p>
        </header>
      </Reveal>

      {/* Quick Stats */}
      <Reveal delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-accent/10 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink/50 uppercase tracking-wider">Total Today</p>
              <p className="text-3xl font-bold text-ink">{totalToday}</p>
            </div>
          </Card>
          
          <Card className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-warning/10 flex items-center justify-center">
              <FileText className="h-7 w-7 text-warning" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink/50 uppercase tracking-wider">Pending Notes</p>
              <p className="text-3xl font-bold text-ink">{pendingNotes.length}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-success" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink/50 uppercase tracking-wider">Completed</p>
              <p className="text-3xl font-bold text-ink">{completedToday.length}</p>
            </div>
          </Card>
        </div>
      </Reveal>

      {/* Today's Appointments List */}
      <Reveal delay={0.2}>
        <Card noPadding>
          <div className="px-8 py-6 border-b border-ink/5 flex items-center justify-between bg-bg/50">
            <h2 className="text-xl text-ink font-display font-medium">Today's Appointments</h2>
            <span className="text-sm font-bold text-ink/50">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4 p-8">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : appointments && appointments.length > 0 ? (
            <Reveal stagger={0.04} className="divide-y divide-ink/5">
              {appointments.map((apt) => (
                <RevealItem key={apt.id}>
                  <Link 
                    to={`/doctor/appointments/${apt.id}`}
                    className={cn(
                      "flex items-center justify-between p-6 hover:bg-surface-hover hover:-translate-y-[1px] transition-all duration-200 group",
                      apt.status === 'COMPLETED' && "opacity-70"
                    )}
                  >
                    <div className="flex items-center gap-6 flex-1">
                      <div className="flex flex-col text-ink font-bold w-24">
                        <span className="font-bold">{format(parseISO(apt.slotTime), 'h:mm a')}</span>
                        <span className="text-xs font-medium text-ink/50">30 min</span>
                      </div>
                      
                      <div className="h-12 w-12 rounded-xl bg-bg flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        <User className="h-6 w-6 text-ink/40 group-hover:text-accent" />
                      </div>

                      <div className="flex-1">
                        <div className="font-display font-medium text-ink text-lg">
                        {apt.patient 
                          ? (apt.patient as any).name || `${apt.patient.firstName} ${apt.patient.lastName}`
                          : (apt as any).patientName || 'Unknown Patient'}
                      </div>
                        {apt.symptomForm?.symptoms && (
                          <p className="text-sm font-body text-ink/60 truncate max-w-md">
                            {apt.symptomForm.symptoms}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden md:block">
                        <UrgencyBadge appointment={apt} />
                      </div>
                      <ChevronRight className="h-5 w-5 text-ink/30 group-hover:text-accent transition-colors" />
                    </div>
                  </Link>
                </RevealItem>
              ))}
            </Reveal>
          ) : (
            <EmptyState 
              icon={Calendar} 
              title="No Appointments" 
              description="You have no appointments scheduled for today." 
            />
          )}
        </Card>
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
