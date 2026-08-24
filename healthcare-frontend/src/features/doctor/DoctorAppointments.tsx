import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, User, ChevronRight } from 'lucide-react';
import { useDoctorAppointments } from './hooks/useDoctorAPI';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tabs } from '../../components/ui/Tabs';
import { Reveal, RevealItem } from '../../lib/motion/Reveal';
import { UrgencyBadge } from './DoctorDashboard';
import { cn } from '../../lib/utils';
import type { Appointment, AppointmentStatus } from '../../types/appointment';

const STATUS_TABS = [
  { label: 'Upcoming', id: 'CONFIRMED' },
  { label: 'Completed', id: 'COMPLETED' },
  { label: 'Cancelled', id: 'CANCELLED' },
];

function patientName(apt: Appointment) {
  return apt.patient
    ? `${apt.patient.firstName} ${apt.patient.lastName}`
    : (apt as any).patientName || 'Unknown Patient';
}

const AppointmentRow: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  const isCancelled = appointment.status === 'CANCELLED';
  const slotDate = parseISO(appointment.slotTime);

  return (
    <Link
      to={`/doctor/appointments/${appointment.id}`}
      className={cn(
        'flex items-center gap-4 px-6 py-4 hover:bg-bg transition-all group border-b border-ink/5 last:border-0',
        isCancelled && 'opacity-60'
      )}
    >
      {/* Avatar */}
      <div className="h-10 w-10 rounded-full bg-bg border border-ink/5 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/10 group-hover:border-accent/20 transition-colors">
        <User className="h-4 w-4 text-ink/30 group-hover:text-accent transition-colors" />
      </div>

      {/* Patient info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-display font-semibold text-ink truncate">
            {patientName(appointment)}
          </span>
          {isCancelled && <Badge variant="CANCELLED" className="text-[10px]">Cancelled</Badge>}
        </div>
        {appointment.symptomForm?.symptoms && !isCancelled && (
          <p className="text-xs text-ink/50 font-body truncate max-w-sm">
            {appointment.symptomForm.symptoms}
          </p>
        )}
      </div>

      {/* Date/time */}
      <div className="hidden sm:flex flex-col items-end flex-shrink-0 mr-4">
        <span className="text-xs font-semibold text-ink">{format(slotDate, 'MMM d, yyyy')}</span>
        <span className="text-xs text-ink/50 font-body">{format(slotDate, 'h:mm a')}</span>
      </div>

      {/* Urgency badge */}
      {!isCancelled && (
        <div className="hidden md:block flex-shrink-0">
          <UrgencyBadge appointment={appointment} />
        </div>
      )}

      <ChevronRight className="h-4 w-4 text-ink/25 group-hover:text-accent transition-colors flex-shrink-0" />
    </Link>
  );
};

const DoctorAppointments: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeStatus, setActiveStatus] = useState<AppointmentStatus>('CONFIRMED');
  const { data: appointments, isLoading } = useDoctorAppointments(selectedDate || undefined, activeStatus);

  const filtered = appointments ?? [];
  const displayDate = selectedDate
    ? format(parseISO(selectedDate), 'MMMM d, yyyy')
    : 'all dates';

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      {/* Header */}
      <Reveal>
        <header className="mb-8">
          <h1 className="text-3xl font-display font-semibold text-ink mb-1">Appointments</h1>
          <p className="text-ink/50 font-body text-sm">View your appointment schedule by date and status.</p>
        </header>
      </Reveal>

      {/* Filters row */}
      <Reveal delay={0.05}>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-6">
          {/* Status tabs */}
          <div className="flex-1">
            <Tabs
              tabs={STATUS_TABS}
              activeTab={activeStatus}
              onChange={(id) => setActiveStatus(id as AppointmentStatus)}
              layoutId="doctor-appt-tabs"
            />
          </div>

          {/* Date filter */}
          <div className="w-full sm:w-52 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="text-xs text-ink/40 hover:text-danger transition-colors font-medium px-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Results */}
      <Reveal delay={0.1}>
        <Card noPadding>
          {/* Card header */}
          <div className="px-6 py-3.5 border-b border-ink/5 flex items-center justify-between bg-bg/40">
            <p className="text-xs font-bold text-ink/50 uppercase tracking-wider">
              {filtered.length} appointment{filtered.length !== 1 ? 's' : ''} · {displayDate}
            </p>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="divide-y divide-ink/5">
              {filtered.map((apt: Appointment) => (
                <RevealItem key={apt.id}>
                  <AppointmentRow appointment={apt} />
                </RevealItem>
              ))}
            </div>
          ) : (
            <div className="py-16">
              <EmptyState
                icon={CalendarIcon}
                title="No appointments found"
                description={`No ${activeStatus.toLowerCase()} appointments${selectedDate ? ` on ${format(parseISO(selectedDate), 'MMMM d, yyyy')}` : ''}.`}
              />
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
};

export default DoctorAppointments;
