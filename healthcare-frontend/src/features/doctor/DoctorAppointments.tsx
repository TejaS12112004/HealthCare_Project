import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, User, ChevronRight } from 'lucide-react';
import { useDoctorAppointments } from './hooks/useDoctorAPI';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { cn } from '../../lib/utils';
import type { Appointment } from '../../types/appointment';

const UrgencyBadge: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  if (appointment.status === 'COMPLETED') {
    return <Badge variant="success">Completed</Badge>;
  }
  if (!appointment.preVisitSummary || appointment.preVisitSummary.llmStatus === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
        <Spinner size="sm" className="h-3 w-3" />
        Analysing…
      </span>
    );
  }
  if (appointment.preVisitSummary.llmStatus === 'FAILED') {
    return <Badge variant="danger">Error</Badge>;
  }
  switch (appointment.preVisitSummary.urgencyLevel) {
    case 'HIGH': return <Badge variant="danger">High Urgency</Badge>;
    case 'MEDIUM': return <Badge variant="warning">Medium Urgency</Badge>;
    default: return <Badge variant="success">Low Urgency</Badge>;
  }
};

const DoctorAppointments: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const { data: appointments, isLoading } = useDoctorAppointments(selectedDate);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Schedule</h1>
          <p className="text-slate-400">View your appointments for any given date.</p>
        </div>
        <div className="w-full md:w-64">
          <Input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-16"><Spinner size="lg" /></div>
        ) : appointments && appointments.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {appointments.map((apt: Appointment) => (
              <Link 
                key={apt.id} 
                to={`/doctor/appointments/${apt.id}`}
                className={cn(
                  "flex items-center justify-between p-6 hover:bg-slate-800/50 transition-colors group",
                  apt.status === 'COMPLETED' && "opacity-70"
                )}
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="flex flex-col text-slate-300 w-24">
                    <span className="font-semibold text-white">{format(parseISO(apt.slotTime), 'h:mm a')}</span>
                    <span className="text-xs text-slate-500">30 min</span>
                  </div>
                  
                  <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <User className="h-5 w-5 text-slate-400 group-hover:text-indigo-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-200">
                        {apt.patient.firstName} {apt.patient.lastName}
                      </h3>
                      {apt.status === 'CANCELLED' && (
                        <Badge variant="danger">Cancelled</Badge>
                      )}
                    </div>
                    {apt.symptomForm?.symptoms && apt.status !== 'CANCELLED' && (
                      <p className="text-sm text-slate-400 truncate max-w-md">
                        {apt.symptomForm.symptoms}
                      </p>
                    )}
                  </div>
                </div>

                {apt.status !== 'CANCELLED' && (
                  <div className="flex items-center gap-6">
                    <div className="hidden md:block">
                      <UrgencyBadge appointment={apt} />
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center text-slate-400">
            <CalendarIcon className="h-12 w-12 text-slate-700 mx-auto mb-4" />
            <p>No appointments found for {format(parseISO(selectedDate), 'MMMM d, yyyy')}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
