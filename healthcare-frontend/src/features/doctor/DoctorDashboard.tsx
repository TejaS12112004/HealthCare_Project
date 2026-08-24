import React from 'react';
import { format, parseISO, isAfter, isBefore, addMinutes } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, FileText, User, ChevronRight, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDoctorAppointments } from './hooks/useDoctorAPI';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Skeleton } from '../../components/ui/Skeleton';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Reveal } from '../../lib/motion/Reveal';
import { cn } from '../../lib/utils';
import type { Appointment } from '../../types/appointment';

/* ─── Reusable AI content treatment ─────────────────────────────────
   Use this component anywhere AI-generated content appears in the app.
   It provides a consistent visual distinction: accent left-border +
   soft accent-tinted background + "AI Generated" label.
──────────────────────────────────────────────────────────────────── */
export const AIContentCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  label?: string;
}> = ({ children, className, label = 'AI Generated' }) => (
  <div className={cn(
    'relative pl-4 rounded-r-xl rounded-l-none border border-l-0 bg-accent/5 border-accent/20',
    className
  )}>
    {/* Left accent bar */}
    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-accent to-teal-400 rounded-l-full" />
    {/* AI label */}
    <div className="flex items-center gap-1.5 pt-4 px-4 mb-3">
      <Sparkles className="h-3 w-3 text-accent" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-accent/80">{label}</span>
    </div>
    <div className="px-4 pb-4">
      {children}
    </div>
  </div>
);

/* ─── Urgency badge with HIGH pulse animation ────────────────────── */
export const UrgencyBadge: React.FC<{ appointment: Appointment; compact?: boolean }> = ({
  appointment,
  compact = false,
}) => {
  if (appointment.status === 'COMPLETED') {
    return <Badge variant="COMPLETED">Completed</Badge>;
  }
  if (appointment.status === 'CANCELLED') {
    return <Badge variant="CANCELLED">Cancelled</Badge>;
  }

  if (!appointment.preVisitSummary || appointment.preVisitSummary.llmStatus === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] font-bold border border-accent/20">
        <Spinner size="sm" className="h-3 w-3" />
        {!compact && 'Analysing…'}
      </span>
    );
  }

  if (appointment.preVisitSummary.llmStatus === 'FAILED') {
    return <Badge variant="danger">Error</Badge>;
  }

  const urgency = appointment.preVisitSummary.urgencyLevel;
  if (urgency === 'HIGH') {
    return (
      <span className="relative inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-danger/10 text-danger text-[11px] font-bold border border-danger/30">
        <span className="absolute inset-0 rounded-full border border-danger/40 animate-ping opacity-60" />
        <AlertCircle className="h-3 w-3 relative z-10" />
        <span className="relative z-10">High Urgency</span>
      </span>
    );
  }
  if (urgency === 'MEDIUM') return <Badge variant="warning">Medium Urgency</Badge>;
  return <Badge variant="success">Low Urgency</Badge>;
};

/* ─── Helpers ────────────────────────────────────────────────────── */
function getAppointmentState(apt: Appointment, now: Date): 'past' | 'current' | 'upcoming' {
  const slotStart = parseISO(apt.slotTime);
  const slotEnd = addMinutes(slotStart, apt.doctor?.slotDurationMinutes ?? 30);
  if (apt.status === 'COMPLETED' || isBefore(slotEnd, now)) return 'past';
  if (isBefore(slotStart, now) && isAfter(slotEnd, now)) return 'current';
  return 'upcoming';
}

function patientName(apt: Appointment) {
  return apt.patient
    ? `${apt.patient.firstName} ${apt.patient.lastName}`
    : (apt as any).patientName || 'Unknown Patient';
}

/* ─── Timeline row ───────────────────────────────────────────────── */
const TimelineRow: React.FC<{
  appointment: Appointment;
  state: 'past' | 'current' | 'upcoming';
  isLast: boolean;
}> = ({ appointment, state, isLast }) => {
  const isCurrent = state === 'current';
  const isPast = state === 'past';
  const time = format(parseISO(appointment.slotTime), 'h:mm a');

  return (
    <div className="flex gap-4">
      {/* Timeline track */}
      <div className="flex flex-col items-center flex-shrink-0 w-12">
        <div
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all z-10',
            isCurrent
              ? 'bg-accent text-white border-accent shadow-lg shadow-accent/30'
              : isPast
              ? 'bg-surface border-ink/10 text-ink/30'
              : 'bg-bg border-ink/15 text-ink/60'
          )}
        >
          <User className="h-4 w-4" />
        </div>
        {!isLast && (
          <div className={cn('flex-1 w-px mt-1', isPast ? 'bg-ink/10' : 'bg-ink/5')} style={{ minHeight: '2rem' }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <Link
          to={`/doctor/appointments/${appointment.id}`}
          className={cn(
            'block rounded-xl border transition-all duration-150 hover:-translate-y-0.5',
            isCurrent
              ? 'border-accent/30 bg-accent/5 shadow-sm hover:shadow-md hover:border-accent/50'
              : isPast
              ? 'border-ink/5 bg-surface opacity-65 hover:opacity-85 hover:border-ink/10'
              : 'border-ink/8 bg-surface hover:border-accent/25 hover:shadow-sm'
          )}
        >
          {isCurrent && (
            <div className="h-0.5 bg-gradient-to-r from-accent to-teal-400 rounded-t-xl" />
          )}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Time */}
              <div className={cn('flex-shrink-0 text-right w-16', isCurrent ? 'text-accent' : 'text-ink/60')}>
                <p className="text-sm font-bold font-display">{time}</p>
                <p className="text-[10px] font-medium text-ink/40">
                  {appointment.doctor?.slotDurationMinutes ?? 30}m
                </p>
              </div>

              {/* Divider */}
              <div className={cn('h-8 w-px flex-shrink-0', isCurrent ? 'bg-accent/30' : 'bg-ink/8')} />

              {/* Patient info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-display font-semibold text-ink truncate">
                    {patientName(appointment)}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-white flex-shrink-0">
                      Now
                    </span>
                  )}
                </div>
                {appointment.symptomForm?.symptoms && appointment.status !== 'CANCELLED' && (
                  <p className="text-xs text-ink/50 font-body truncate max-w-xs">
                    {appointment.symptomForm.symptoms}
                  </p>
                )}
              </div>
            </div>

            {/* Right: badge + chevron */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden sm:block">
                <UrgencyBadge appointment={appointment} />
              </div>
              <ChevronRight className={cn('h-4 w-4 transition-colors', isCurrent ? 'text-accent' : 'text-ink/25')} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

/* ─── Stat card ──────────────────────────────────────────────────── */
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass?: string;
}> = ({ label, value, icon, colorClass = 'bg-accent/10' }) => (
  <Card className="flex items-center gap-4">
    <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0', colorClass)}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-display font-bold text-ink">{value}</p>
    </div>
  </Card>
);

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();

  const { data: appointments, isLoading } = useDoctorAppointments(today);

  const pendingNotes = appointments?.filter(a => a.status === 'CONFIRMED') ?? [];
  const completedToday = appointments?.filter(a => a.status === 'COMPLETED') ?? [];
  const totalToday = appointments?.length ?? 0;

  // Sort appointments chronologically
  const sorted = [...(appointments ?? [])].sort(
    (a, b) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime()
  );

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
      {/* Header */}
      <Reveal>
        <header>
          <p className="text-xs font-medium text-ink/40 font-body mb-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
          <h1 className="text-3xl font-display font-semibold text-ink">
            Good morning, Dr. {user?.lastName}
          </h1>
          <p className="text-ink/50 font-body text-sm mt-1">Here's your schedule and patient overview for today.</p>
        </header>
      </Reveal>

      {/* Stats row */}
      <Reveal delay={0.08}>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Total Today"
            value={totalToday}
            icon={<Calendar className="h-6 w-6 text-accent" />}
            colorClass="bg-accent/10"
          />
          <StatCard
            label="Pending Notes"
            value={pendingNotes.length}
            icon={<FileText className="h-6 w-6 text-warning" />}
            colorClass="bg-warning/10"
          />
          <StatCard
            label="Completed"
            value={completedToday.length}
            icon={<CheckCircle className="h-6 w-6 text-success" />}
            colorClass="bg-success/10"
          />
        </div>
      </Reveal>

      {/* Today's timeline */}
      <Reveal delay={0.14}>
        <Card noPadding>
          <div className="px-6 py-4 border-b border-ink/5 flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-ink flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink/40" />
              Today's Schedule
            </h2>
            <Link
              to="/doctor/appointments"
              className="text-xs font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
            >
              Browse all dates <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : sorted.length > 0 ? (
              <div>
                {sorted.map((apt, i) => (
                  <TimelineRow
                    key={apt.id}
                    appointment={apt}
                    state={getAppointmentState(apt, now)}
                    isLast={i === sorted.length - 1}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No appointments today"
                description="Your schedule is clear for today. Enjoy the downtime."
              />
            )}
          </div>
        </Card>
      </Reveal>
    </div>
  );
};

export default DoctorDashboard;
