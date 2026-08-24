import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAdminDoctors, useDoctorLeave, useMarkLeave, useRemoveLeave } from './hooks/useAdminAPI';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Reveal } from '../../lib/motion/Reveal';
import { cn } from '../../lib/utils';

export const AdminLeave: React.FC = () => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [isMarkLeaveModalOpen, setIsMarkLeaveModalOpen] = useState(false);
  const [affectedAppointmentsModal, setAffectedAppointmentsModal] = useState<any[] | null>(null);

  const { data: doctors } = useAdminDoctors();
  const activeDoctors = doctors?.filter(d => d.isActive) || [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  const { data: leaves, isLoading: isLoadingLeaves } = useDoctorLeave(selectedDoctorId, year, month);
  const { mutateAsync: markLeave, isPending: isMarking } = useMarkLeave();
  const { mutateAsync: removeLeave } = useRemoveLeave();

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDateClick = async (date: Date) => {
    if (!selectedDoctorId) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingLeave = leaves?.find((l: any) => l.leaveDate === dateStr);

    if (existingLeave) {
      if (confirm(`Remove leave on ${dateStr}?`)) {
        try {
          await removeLeave({ doctorId: selectedDoctorId, date: dateStr });
        } catch (e) {
          alert('Failed to remove leave');
        }
      }
    } else {
      setSelectedDate(date);
      setLeaveReason('');
      setIsMarkLeaveModalOpen(true);
    }
  };

  const handleMarkLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedDate) return;
    
    try {
      const res = await markLeave({ doctorId: selectedDoctorId, date: format(selectedDate, 'yyyy-MM-dd'), reason: leaveReason });
      setIsMarkLeaveModalOpen(false);
      
      if (res.affectedAppointments && res.affectedAppointments.length > 0) {
        setAffectedAppointmentsModal(res.affectedAppointments);
      }
    } catch (e) {
      alert('Failed to mark leave. A leave might already exist for this date.');
    }
  };

  // Calendar Grid generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-8">
      <Reveal>
        <div>
          <h1 className="text-3xl text-ink font-display mb-2">Leave Management</h1>
          <p className="text-ink/60 font-body">Manage doctor absences and automatically notify affected patients.</p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="w-full md:w-80">
              <label className="block text-xs font-bold text-ink/50 uppercase tracking-wider mb-2">Select Doctor</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink/40" />
                <select 
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-ink/10 bg-bg text-sm font-medium text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent appearance-none transition-colors"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">-- Choose a doctor --</option>
                  {activeDoctors.map(doc => (
                    <option key={doc.id} value={doc.id}>Dr. {doc.firstName} {doc.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={handlePrevMonth} className="p-2 bg-bg border border-ink/5 rounded-xl hover:bg-ink/5 text-ink transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl text-ink font-bold w-40 text-center font-display">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button onClick={handleNextMonth} className="p-2 bg-bg border border-ink/5 rounded-xl hover:bg-ink/5 text-ink transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {selectedDoctorId ? (
            <div className="border border-ink/10 rounded-2xl overflow-hidden bg-bg relative shadow-sm">
              {isLoadingLeaves && (
                <div className="absolute inset-0 bg-bg/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Spinner />
                </div>
              )}
              
              <div className="grid grid-cols-7 border-b border-ink/10 text-center text-xs font-bold text-ink/50 uppercase tracking-wider py-4 bg-surface">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 auto-rows-[100px]">
                {days.map((day, i) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isLeave = leaves?.some((l: any) => l.leaveDate === dateStr);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={dateStr}
                      onClick={() => isCurrentMonth && handleDateClick(day)}
                      className={cn(
                        "border-b border-r border-ink/5 p-2 relative transition-all duration-200",
                        !isCurrentMonth ? "bg-bg opacity-40 cursor-default" : "bg-surface hover:bg-accent/5 cursor-pointer",
                        i % 7 === 6 && "border-r-0",
                        isLeave && "bg-danger/10 hover:bg-danger/20"
                      )}
                    >
                      <span className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                        isToday ? "bg-accent text-white font-bold shadow-md shadow-accent/20" : (isCurrentMonth ? "text-ink" : "text-ink/40"),
                        isLeave && !isToday && "text-danger font-bold"
                      )}>
                        {format(day, 'd')}
                      </span>
                      
                      {isLeave && (
                        <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-danger/10 border border-danger/20 px-1 py-1 text-[10px] font-bold text-danger text-center truncate shadow-sm">
                          On Leave
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-ink/10 rounded-2xl bg-bg/50">
              <Calendar className="h-12 w-12 text-ink/20 mx-auto mb-4" />
              <p className="text-ink/50 font-medium">Select a doctor to manage their leave schedule.</p>
            </div>
          )}
        </Card>
      </Reveal>

      <Modal isOpen={isMarkLeaveModalOpen} onClose={() => setIsMarkLeaveModalOpen(false)} title="Mark Leave Day">
        <form onSubmit={handleMarkLeave} className="space-y-6">
          <div>
            <p className="text-ink/60 font-medium leading-relaxed">
              Mark <strong className="text-ink font-bold">{selectedDate && format(selectedDate, 'MMM d, yyyy')}</strong> as a leave day.
              This will automatically cancel any existing appointments on this day and notify the patients via email.
            </p>
          </div>
          <div>
            <Input label="Reason (Optional)" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="e.g. Sick Leave, Vacation" />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-ink/5">
            <Button type="button" variant="secondary" onClick={() => setIsMarkLeaveModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" isLoading={isMarking}>Confirm & Mark Leave</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!affectedAppointmentsModal} onClose={() => setAffectedAppointmentsModal(null)} title="Leave Marked Successfully">
        <div className="space-y-6">
          <p className="text-ink/60 font-medium leading-relaxed">
            Leave has been scheduled. The following <strong className="text-ink font-bold">{affectedAppointmentsModal?.length}</strong> appointments have been cancelled, and cancellation emails have been queued.
          </p>
          <div className="bg-bg border border-ink/5 rounded-xl p-4 max-h-60 overflow-y-auto space-y-2">
            {affectedAppointmentsModal?.map((apt: any) => (
              <div key={apt.id} className="flex justify-between items-center py-2 border-b border-ink/5 last:border-0">
                <span className="text-ink font-bold">{apt.patientName}</span>
                <span className="text-ink/50 font-medium">{apt.slotTime && format(parseISO(apt.slotTime), 'h:mm a')}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setAffectedAppointmentsModal(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminLeave;
