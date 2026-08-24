import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useCancelAppointment, usePatientAppointments } from './hooks/usePatientAPI';
import { AppointmentCard } from './components/AppointmentCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Reveal, RevealItem } from '../../lib/motion/Reveal';
import type { Appointment } from '../../types/appointment';
import type { AppointmentStatus } from '../../types/appointment';

const TABS = [
  { label: 'Upcoming', id: 'CONFIRMED' },
  { label: 'Past', id: 'COMPLETED' },
  { label: 'Cancelled', id: 'CANCELLED' },
];

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
    } catch (err) {
      alert('Failed to cancel appointment.');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <Reveal>
          <h1 className="text-3xl text-ink font-display mb-2">My Appointments</h1>
          <p className="text-ink/60 font-body">View and manage all your healthcare visits.</p>
        </Reveal>
      </header>

      {/* Tabs */}
      <Reveal delay={0.1}>
        <div className="mb-6 w-full max-w-sm">
          <Tabs 
            tabs={TABS} 
            activeTab={activeTab} 
            onChange={(id) => setActiveTab(id as AppointmentStatus)} 
          />
        </div>
      </Reveal>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : appointments?.length ? (
        <Reveal stagger={0.04} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((apt: Appointment) => (
            <RevealItem key={apt.id}>
              <AppointmentCard
                appointment={apt}
                onCancel={apt.status === 'CONFIRMED' ? setCancelId : undefined}
              />
            </RevealItem>
          ))}
        </Reveal>
      ) : (
        <Reveal delay={0.2}>
          <Card className="py-16">
            <EmptyState 
              icon={Calendar} 
              title="No appointments found" 
              description={`No ${activeTab.toLowerCase()} appointments found.`} 
            />
          </Card>
        </Reveal>
      )}

      {/* Cancel Modal */}
      <Modal isOpen={!!cancelId} onClose={() => setCancelId(null)} title="Cancel Appointment">
        <p className="text-ink/60 mb-6 font-medium">
          Are you sure you want to cancel this appointment? This action cannot be undone and your doctor will be notified.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setCancelId(null)}>Keep Appointment</Button>
          <div className="w-48">
            <Button variant="destructive" isLoading={isCancelling} onClick={handleCancel} className="w-full">Confirm Cancellation</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PatientAppointments;
