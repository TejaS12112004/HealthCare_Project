import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAdminDoctors, useDoctorLeave, useMarkLeave, useRemoveLeave } from './hooks/useAdminAPI';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Leave Management</h1>
        <p className="text-slate-400 text-sm">Manage doctor absences and automatically notify affected patients.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="w-full md:w-72">
            <label className="block text-xs font-medium text-slate-400 mb-2">Select Doctor</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <select 
                className="w-full pl-10 pr-3 py-2 rounded-md border border-slate-700 bg-slate-950 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none h-[42px]"
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
            <button onClick={handlePrevMonth} className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 text-slate-300">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-bold text-white w-40 text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button onClick={handleNextMonth} className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 text-slate-300">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {selectedDoctorId ? (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 relative">
            {isLoadingLeaves && (
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <Spinner />
              </div>
            )}
            
            <div className="grid grid-cols-7 border-b border-slate-800 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 bg-slate-900">
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
                      "border-b border-r border-slate-800/50 p-2 relative transition-colors",
                      !isCurrentMonth ? "bg-slate-950 opacity-20 cursor-default" : "bg-slate-950 hover:bg-slate-800/30 cursor-pointer",
                      i % 7 === 6 && "border-r-0",
                      isLeave && "bg-red-500/10 hover:bg-red-500/20"
                    )}
                  >
                    <span className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm",
                      isToday ? "bg-indigo-600 text-white font-bold" : (isCurrentMonth ? "text-slate-300" : "text-slate-600"),
                      isLeave && !isToday && "text-red-400 font-semibold"
                    )}>
                      {format(day, 'd')}
                    </span>
                    
                    {isLeave && (
                      <div className="absolute bottom-2 left-2 right-2 rounded bg-red-500/20 px-1 py-0.5 text-[10px] font-medium text-red-400 text-center truncate">
                        On Leave
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-slate-700 rounded-xl">
            <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Select a doctor to manage their leave schedule.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isMarkLeaveModalOpen} onClose={() => setIsMarkLeaveModalOpen(false)} title="Mark Leave Day">
        <form onSubmit={handleMarkLeave} className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-4">
              Mark <strong className="text-white">{selectedDate && format(selectedDate, 'MMM d, yyyy')}</strong> as a leave day.
              This will automatically cancel any existing appointments on this day and notify the patients via email.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Reason (Optional)</label>
            <Input value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="e.g. Sick Leave, Vacation" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsMarkLeaveModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger" isLoading={isMarking}>Confirm & Mark Leave</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!affectedAppointmentsModal} onClose={() => setAffectedAppointmentsModal(null)} title="Leave Marked Successfully">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Leave has been scheduled. The following <strong className="text-white">{affectedAppointmentsModal?.length}</strong> appointments have been cancelled, and cancellation emails have been queued.
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2 text-sm">
            {affectedAppointmentsModal?.map((apt: any) => (
              <div key={apt.id} className="flex justify-between items-center py-1">
                <span className="text-white">{apt.patientName}</span>
                <span className="text-slate-400">{apt.slotTime && format(parseISO(apt.slotTime), 'h:mm a')}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setAffectedAppointmentsModal(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminLeave;
