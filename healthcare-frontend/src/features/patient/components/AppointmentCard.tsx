import { format } from 'date-fns';
import { Calendar, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Appointment } from '../../../types/appointment';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface Props {
  appointment: Appointment;
  onCancel?: (id: string) => void;
}

export const AppointmentCard: React.FC<Props> = ({ appointment, onCancel }) => {
  const isCancellable = appointment.status === 'CONFIRMED' || appointment.status === 'RESCHEDULED';
  const date = new Date(appointment.slotTime);

  return (
    <div className="bg-surface border border-primary/5 rounded-2xl p-6 shadow-multi transition-all hover:border-accent/30 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <Badge variant={appointment.status}>{appointment.status}</Badge>
        <span className="text-xs text-slate-400 font-medium">ID: {appointment.id.slice(0, 8)}</span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-primary">
          <Calendar className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">{format(date, 'MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-3 text-primary">
          <Clock className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">{format(date, 'h:mm a')}</span>
        </div>
        <div className="flex items-center gap-3 text-primary">
          <User className="h-4 w-4 text-accent" />
          <span className="text-sm font-bold">
            Dr. {appointment.doctor 
              ? (appointment.doctor.firstName ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}` : (appointment.doctor as any).name)
              : (appointment as any).doctorName || 'Doctor'}
          </span>
        </div>
        {(appointment.doctor?.specialisation || (appointment as any).specialisation) && (
          <div className="pl-7 text-xs text-slate-500 font-medium">
            {appointment.doctor?.specialisation || (appointment as any).specialisation}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-primary/5">
        <Link to={`/patient/appointments/${appointment.id}`} className="flex-1">
          <Button variant="secondary" className="w-full">View Details</Button>
        </Link>
        {isCancellable && onCancel && (
          <Button variant="danger" onClick={() => onCancel(appointment.id)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
