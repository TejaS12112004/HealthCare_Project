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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm transition-all hover:border-slate-700">
      <div className="flex justify-between items-start mb-4">
        <Badge variant={appointment.status}>{appointment.status}</Badge>
        <span className="text-xs text-slate-500">ID: {appointment.id.slice(0, 8)}</span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-slate-300">
          <Calendar className="h-4 w-4 text-indigo-400" />
          <span className="text-sm">{format(date, 'MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <Clock className="h-4 w-4 text-indigo-400" />
          <span className="text-sm">{format(date, 'h:mm a')}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <User className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-medium">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</span>
        </div>
        <div className="pl-7 text-xs text-slate-500">{appointment.doctor.specialisation}</div>
      </div>

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
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
