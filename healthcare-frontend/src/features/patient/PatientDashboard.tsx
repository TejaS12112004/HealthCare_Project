import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { Calendar, Search, ChevronRight, User, Clock, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { usePatientAppointments } from './hooks/usePatientAPI';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { Reveal } from '../../lib/motion/Reveal';
import type { Appointment } from '../../types/appointment';

/* ── Count-up hook — animates once on first mount ── */
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) { setValue(target); return; }
    started.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, durationMs]);
  return value;
}

/* ── Greeting based on local hour ── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── Date label helper ── */
function dateLabel(iso: string) {
  const d = parseISO(iso);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
}

/* ── Hero appointment card ── */
const NextAppointmentHero: React.FC<{ appointment: Appointment }> = ({ appointment }) => (
  <Link to={`/patient/appointments/${appointment.id}`}>
    <div className="relative rounded-xl overflow-hidden border border-accent/20 bg-gradient-to-br from-accent/8 via-surface to-surface hover:border-accent/40 transition-all duration-200 hover:shadow-soft group cursor-pointer">
      {/* Top accent strip */}
      <div className="h-1 bg-gradient-to-r from-accent to-teal-400" />
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent/80 mb-1.5">Next Appointment</p>
            <h2 className="text-2xl font-display font-semibold text-ink">
              Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
            </h2>
            <p className="text-sm text-ink/60 mt-0.5 font-body">{appointment.doctor.specialisation}</p>
          </div>
          <Badge variant={appointment.status}>{appointment.status}</Badge>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-ink/70">
            <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-accent" />
            </div>
            <span>{dateLabel(appointment.slotTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-ink/70">
            <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-accent" />
            </div>
            <span>{format(parseISO(appointment.slotTime), 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-ink/70">
            <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <Stethoscope className="h-3.5 w-3.5 text-accent" />
            </div>
            <span>{appointment.doctor.specialisation}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-ink/5">
          <Button variant="primary" size="sm" className="flex-1 sm:flex-none">
            View Details
          </Button>
          <span className="text-xs text-ink/40 font-body ml-auto flex items-center gap-1 group-hover:text-accent transition-colors">
            See full record <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  </Link>
);

/* ── Stat card ── */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  to?: string;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, icon, to }) => {
  const count = useCountUp(value);
  const Inner = (
    <Card className="flex items-center gap-4 hover:border-accent/20 transition-colors h-full">
      <div className="h-11 w-11 rounded-xl bg-bg border border-ink/5 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-ink leading-none mb-0.5">{count}</p>
        <p className="text-xs font-body text-ink/50">{label}</p>
      </div>
    </Card>
  );
  if (to) return <Link to={to} className="block h-full">{Inner}</Link>;
  return Inner;
};

/* ── Quick action card ── */
interface QuickActionProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent?: boolean;
}
const QuickAction: React.FC<QuickActionProps> = ({ to, icon, title, subtitle, accent }) => (
  <Link to={to} className="block group">
    <Card className={`flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-soft transition-all duration-150 ${accent ? 'border-accent/20 hover:border-accent/40' : 'hover:border-accent/20'}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? 'bg-accent text-white' : 'bg-ink/5 text-ink/60 group-hover:bg-accent/10 group-hover:text-accent transition-colors'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display font-semibold text-ink truncate">{title}</p>
        <p className="text-xs font-body text-ink/50 truncate">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-ink/20 group-hover:text-accent transition-colors flex-shrink-0" />
    </Card>
  </Link>
);

/* ── Recent appointment row ── */
const RecentAppointmentRow: React.FC<{ appointment: Appointment }> = ({ appointment }) => (
  <Link to={`/patient/appointments/${appointment.id}`}>
    <div className="flex items-center gap-3 py-3 px-4 -mx-4 rounded-lg hover:bg-bg transition-colors group cursor-pointer border-b border-ink/5 last:border-0">
      <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
        <User className="h-3.5 w-3.5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate font-display">
          Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
        </p>
        <p className="text-xs text-ink/50 font-body truncate">
          {format(parseISO(appointment.slotTime), 'MMM d, yyyy')} · {appointment.doctor.specialisation}
        </p>
      </div>
      <Badge variant={appointment.status} className="ml-auto flex-shrink-0 text-[10px]">
        {appointment.status}
      </Badge>
    </div>
  </Link>
);

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: upcoming, isLoading: loadingUpcoming } = usePatientAppointments('CONFIRMED', 3);
  const { data: past, isLoading: loadingPast } = usePatientAppointments('COMPLETED', 5);

  const upcomingCount = upcoming?.length ?? 0;
  const pastCount = past?.length ?? 0;
  const nextAppt = upcoming?.[0];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* ── Greeting Header ── */}
      <Reveal>
        <header className="mb-8">
          <p className="text-sm font-medium text-ink/50 font-body mb-1">
            {greeting()},
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-ink leading-tight">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-ink/50 font-body text-sm mt-1.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>
      </Reveal>

      {/* ── Hero: Next Appointment + Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Next appointment hero */}
        <Reveal delay={0.1} className="lg:col-span-3">
          {loadingUpcoming ? (
            <Card className="flex items-center justify-center h-48">
              <Spinner size="lg" />
            </Card>
          ) : nextAppt ? (
            <NextAppointmentHero appointment={nextAppt} />
          ) : (
            <Card className="flex flex-col items-center justify-center py-10 text-center border-dashed">
              <EmptyState
                icon={Calendar}
                title="No upcoming appointments"
                description="Book a visit with one of our specialists."
                action={
                  <Link to="/patient/search">
                    <Button variant="primary" size="sm">Find a Doctor</Button>
                  </Link>
                }
              />
            </Card>
          )}
        </Reveal>

        {/* Stats + Quick Actions */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4">
            <Reveal delay={0.15}>
              <StatCard
                label="Upcoming"
                value={loadingUpcoming ? 0 : upcomingCount}
                icon={<Calendar className="h-5 w-5 text-accent" />}
                to="/patient/appointments"
              />
            </Reveal>
            <Reveal delay={0.2}>
              <StatCard
                label="Past Visits"
                value={loadingPast ? 0 : pastCount}
                icon={<Clock className="h-5 w-5 text-ink/40" />}
                to="/patient/appointments"
              />
            </Reveal>
          </div>

          {/* Quick actions */}
          <Reveal delay={0.25} className="flex flex-col gap-2.5 flex-1">
            <QuickAction
              to="/patient/search"
              icon={<Search className="h-4 w-4" />}
              title="Find a Doctor"
              subtitle="Browse specialists & availability"
              accent
            />
            <QuickAction
              to="/patient/appointments"
              icon={<Calendar className="h-4 w-4" />}
              title="My Appointments"
              subtitle="View upcoming & past visits"
            />
          </Reveal>
        </div>
      </div>

      {/* ── Recent Past Visits ── */}
      <Reveal delay={0.35}>
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-display font-semibold text-ink">Recent Past Visits</h2>
            <Link
              to="/patient/appointments"
              className="text-xs font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingPast ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : past?.length ? (
            <motion.div layout>
              {past.map((apt: Appointment) => (
                <RecentAppointmentRow key={apt.id} appointment={apt} />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No past visits yet"
              description="Your completed consultations will appear here."
            />
          )}
        </Card>
      </Reveal>
    </div>
  );
};

export default PatientDashboard;
