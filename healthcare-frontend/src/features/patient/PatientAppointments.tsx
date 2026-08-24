import { useState } from 'react';
import { useCancelAppointment, usePatientAppointments } from './hooks/usePatientAPI';
import { AppointmentCard } from './components/AppointmentCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import type { Appointment } from '../../types/appointment';
import { cn } from '../../lib/utils';
import type { AppointmentStatus } from '../../types/appointment';

const TABS: { label: string; status: AppointmentStatus }[] = [
  { label: 'Upcoming', status: 'CONFIRMED' },
  { label: 'Past', status: 'COMPLETED' },
  { label: 'Cancelled', status: 'CANCELLED' },
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
        <h1 className="text-3xl font-bold text-white mb-2">My Appointments</h1>
        <p className="text-slate-400">View and manage all your healthcare visits.</p>
      </header>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-800 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            onClick={() => setActiveTab(tab.status)}
            className={cn(
              "px-5 py-3 text-sm font-medium transition-colors border-b-2",
              activeTab === tab.status
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center p-12"><Spinner size="lg" /></div>
      ) : appointments?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((apt: Appointment) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              onCancel={apt.status === 'CONFIRMED' ? setCancelId : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400">No {activeTab.toLowerCase()} appointments found.</p>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal isOpen={!!cancelId} onClose={() => setCancelId(null)} title="Cancel Appointment">
        <p className="text-slate-300 mb-6">
          Are you sure you want to cancel this appointment? This action cannot be undone and your doctor will be notified.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setCancelId(null)}>Keep Appointment</Button>
          <Button variant="danger" isLoading={isCancelling} onClick={handleCancel}>Confirm Cancellation</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PatientAppointments;
