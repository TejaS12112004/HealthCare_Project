import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, User, ChevronRight, X } from 'lucide-react';
import { useCancelAppointment, usePatientAppointments } from './hooks/usePatientAPI';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Reveal, RevealItem } from '../../lib/motion/Reveal';
import type { Appointment, AppointmentStatus } from '../../types/appointment';

const TABS = [
  { label: 'Upcoming', id: 'CONFIRMED' },
  { label: 'Past', id: 'COMPLETED' },
  { label: 'Cancelled', id: 'CANCELLED' },
];

/* ─── Mobile stacked card for each appointment ─────────────────────── */
const AppointmentMobileCard: React.FC<{
  appointment: Appointment;
  onCancel?: (id: string) => void;
}> = ({ appointment, onCancel }) => (
  <Card className="transition-all hover:-translate-y-0.5 hover:border-accent/20 hover:shadow-soft duration-150">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-accent" />
        </div>
        <div>
          <p className="text-sm font-display font-semibold text-ink leading-tight">
            Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
          </p>
          <p className="text-xs text-ink/50 font-body mt-0.5">{appointment.doctor.specialisation}</p>
        </div>
      </div>
      <Badge variant={appointment.status} className="text-[10px] flex-shrink-0">{appointment.status}</Badge>
    </div>

    <div className="flex flex-wrap gap-3 mt-3 mb-4">
      <div className="flex items-center gap-1.5 text-xs text-ink/60 font-medium">
        <Calendar className="h-3.5 w-3.5 text-accent/70" />
        {format(parseISO(appointment.slotTime), 'MMM d, yyyy')}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-ink/60 font-medium">
        <Clock className="h-3.5 w-3.5 text-accent/70" />
        {format(parseISO(appointment.slotTime), 'h:mm a')}
      </div>
    </div>

    <div className="flex items-center gap-2 pt-3 border-t border-ink/5">
      <Link to={`/patient/appointments/${appointment.id}`} className="flex-1">
        <Button variant="secondary" size="sm" className="w-full text-xs">
          <ChevronRight className="h-3.5 w-3.5 mr-1" />
          View Details
        </Button>
      </Link>
      {(appointment.status === 'CONFIRMED' || appointment.status === 'RESCHEDULED') && onCancel && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onCancel(appointment.id)}
          className="text-xs flex-shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  </Card>
);

const PatientAppointments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppointmentStatus>('CONFIRMED');
  const { data: appointments, isLoading } = usePatientAppointments(activeTab);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const { mutateAsync: cancelAppt, isPending: isCancelling } = useCancelAppointment();

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await cancelAppt(cancelId);
      setCancelId(null);
    } catch {
      alert('Failed to cancel appointment.');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <Reveal>
        <header className="mb-8">
          <h1 className="text-3xl font-display font-semibold text-ink mb-1">My Appointments</h1>
          <p className="text-ink/50 font-body text-sm">View and manage all your healthcare visits.</p>
        </header>
      </Reveal>

      {/* Tabs */}
      <Reveal delay={0.05}>
        <div className="mb-6">
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as AppointmentStatus)}
          />
        </div>
      </Reveal>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !appointments?.length ? (
        <Reveal delay={0.1}>
          <Card className="py-16">
            <EmptyState
              icon={Calendar}
              title="No appointments found"
              description={`You have no ${activeTab.toLowerCase()} appointments.${activeTab === 'CONFIRMED' ? ' Book a visit with a specialist to get started.' : ''}`}
              action={
                activeTab === 'CONFIRMED' ? (
                  <Link to="/patient/search">
                    <Button variant="primary" size="sm">Find a Doctor</Button>
                  </Link>
                ) : undefined
              }
            />
          </Card>
        </Reveal>
      ) : (
        <>
          {/* Desktop Table */}
          <Reveal delay={0.1} className="hidden md:block">
            <Card noPadding>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Doctor</TableHead>
                    <TableHead>Specialisation</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt: Appointment) => (
                    <TableRow key={apt.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                            <User className="h-3.5 w-3.5 text-accent" />
                          </div>
                          <span className="font-display font-semibold text-sm text-ink">
                            Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-ink/60 font-body">
                        {apt.doctor.specialisation}
                      </TableCell>
                      <TableCell className="text-sm text-ink font-medium">
                        {format(parseISO(apt.slotTime), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm text-ink font-medium">
                        {format(parseISO(apt.slotTime), 'h:mm a')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={apt.status} className="text-[10px]">{apt.status}</Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/patient/appointments/${apt.id}`}>
                            <Button variant="secondary" size="sm" className="text-xs">
                              Details
                            </Button>
                          </Link>
                          {(apt.status === 'CONFIRMED' || apt.status === 'RESCHEDULED') && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              onClick={() => setCancelId(apt.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Reveal>

          {/* Mobile Stacked Cards */}
          <div className="md:hidden">
            <Reveal stagger={0.04} className="space-y-3">
              {appointments.map((apt: Appointment) => (
                <RevealItem key={apt.id}>
                  <AppointmentMobileCard
                    appointment={apt}
                    onCancel={apt.status === 'CONFIRMED' ? setCancelId : undefined}
                  />
                </RevealItem>
              ))}
            </Reveal>
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={!!cancelId} onClose={() => setCancelId(null)} title="Cancel Appointment">
        <p className="text-ink/60 font-body mb-6 leading-relaxed">
          Are you sure you want to cancel this appointment? This action cannot be undone and your doctor will be notified.
        </p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="outline" onClick={() => setCancelId(null)}>
            Keep Appointment
          </Button>
          <Button
            variant="destructive"
            isLoading={isCancelling}
            onClick={handleCancel}
            className="sm:w-48"
          >
            Confirm Cancellation
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PatientAppointments;
