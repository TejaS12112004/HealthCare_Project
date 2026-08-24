import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, User, ChevronRight } from 'lucide-react';
import { useDoctorAppointments } from './hooks/useDoctorAPI';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
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
    <div className="max-w-5xl mx-auto p-8">
      <Reveal delay={0.1}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl text-ink font-display mb-2">Schedule</h1>
            <p className="text-ink/60 font-body">View your appointments for any given date.</p>
          </div>
          <div className="w-full md:w-64">
            <Input 
              label="Select Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <Card noPadding>
          {isLoading ? (
            <div className="flex justify-center p-16"><Spinner size="lg" /></div>
          ) : appointments && appointments.length > 0 ? (
            <Reveal stagger={0.04} className="divide-y divide-ink/5">
              {appointments.map((apt: Appointment) => (
                <RevealItem key={apt.id}>
                  <Link 
                    to={`/doctor/appointments/${apt.id}`}
                    className={cn(
                      "flex items-center justify-between p-6 hover:bg-surface-hover transition-colors group",
                      apt.status === 'COMPLETED' && "opacity-70"
                    )}
                  >
                    <div className="flex items-center gap-6 flex-1">
                      <div className="flex flex-col text-ink w-24">
                        <span className="font-bold">{format(parseISO(apt.slotTime), 'h:mm a')}</span>
                        <span className="text-xs font-medium text-ink/50">30 min</span>
                      </div>
                      
                      <div className="h-12 w-12 rounded-xl bg-bg flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        <User className="h-6 w-6 text-ink/40 group-hover:text-accent" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-display font-medium text-lg text-ink">
                          {apt.patient 
                            ? (apt.patient as any).name || `${apt.patient.firstName} ${apt.patient.lastName}`
                            : (apt as any).patientName || 'Unknown Patient'}
                        </h3>
                          {apt.status === 'CANCELLED' && (
                            <Badge variant="CANCELLED">Cancelled</Badge>
                          )}
                        </div>
                        {apt.symptomForm?.symptoms && apt.status !== 'CANCELLED' && (
                          <p className="text-sm font-body text-ink/60 truncate max-w-md">
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
                        <ChevronRight className="h-5 w-5 text-ink/30 group-hover:text-accent transition-colors" />
                      </div>
                    )}
                  </Link>
                </RevealItem>
              ))}
            </Reveal>
          ) : (
            <EmptyState 
              icon={CalendarIcon} 
              title="No appointments found" 
              description={`No appointments found for ${format(parseISO(selectedDate), 'MMMM d, yyyy')}.`} 
            />
          )}
        </Card>
      </Reveal>
    </div>
  );
};

export default DoctorAppointments;
