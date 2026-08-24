import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAdminDoctors,
  useDoctorLeave,
  useMarkLeave,
  useRemoveLeave,
} from './hooks/useAdminAPI';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Reveal } from '../../lib/motion/Reveal';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '../../lib/utils';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AdminLeave: React.FC = () => {
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [removeDate, setRemoveDate] = useState<string | null>(null);
  const [affectedModal, setAffectedModal] = useState<any[] | null>(null);

  const { data: doctors } = useAdminDoctors();
  const activeDoctors = doctors?.filter(d => d.isActive) ?? [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: leaves, isLoading: loadingLeaves } = useDoctorLeave(selectedDoctorId, year, month);
  const { mutateAsync: markLeave, isPending: isMarking } = useMarkLeave();
  const { mutateAsync: removeLeave, isPending: isRemoving } = useRemoveLeave();
  const { toast } = useToast();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
  });

  const handleDateClick = (day: Date) => {
    if (!selectedDoctorId) return;
    const dateStr = format(day, 'yyyy-MM-dd');
    const isLeave = leaves?.some((l: any) => l.leaveDate === dateStr);
    if (isLeave) {
      setRemoveDate(dateStr);
      setIsRemoveModalOpen(true);
    } else {
      setSelectedDate(day);
      setLeaveReason('');
      setIsMarkModalOpen(true);
    }
  };

  const handleMarkLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedDate) return;
    try {
      const res = await markLeave({
        doctorId: selectedDoctorId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        reason: leaveReason,
      });
      setIsMarkModalOpen(false);
      if (res.affectedAppointments?.length > 0) {
        setAffectedModal(res.affectedAppointments);
      } else {
        toast('Leave marked. No appointments were affected.', 'success');
      }
    } catch {
      toast('Failed to mark leave. A leave may already exist for this date.', 'error');
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeDate || !selectedDoctorId) return;
    try {
      await removeLeave({ doctorId: selectedDoctorId, date: removeDate });
      toast(`Leave on ${removeDate} has been removed.`, 'success');
      setIsRemoveModalOpen(false);
      setRemoveDate(null);
    } catch {
      toast('Failed to remove leave.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6 md:p-8">
      {/* Header */}
      <Reveal>
        <div>
          <h1 className="text-3xl font-display font-semibold text-ink mb-1">Leave Management</h1>
          <p className="text-ink/50 font-body text-sm">Manage doctor absences — affected patients are automatically notified.</p>
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <Card>
          {/* Controls row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            {/* Doctor selector */}
            <div className="w-full md:w-72">
              <label className="block text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-2">Select Doctor</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30 pointer-events-none" />
                <select
                  className="w-full pl-9 pr-4 h-10 rounded-lg border border-ink/10 bg-bg text-sm font-medium text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent appearance-none transition-colors"
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">— Choose a doctor —</option>
                  {activeDoctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.firstName} {doc.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Month navigator */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="h-9 w-9 rounded-lg border border-ink/8 bg-surface hover:bg-bg flex items-center justify-center text-ink/60 hover:text-ink transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-base font-display font-semibold text-ink w-36 text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="h-9 w-9 rounded-lg border border-ink/8 bg-surface hover:bg-bg flex items-center justify-center text-ink/60 hover:text-ink transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Calendar */}
          {selectedDoctorId ? (
            <div className="border border-ink/8 rounded-2xl overflow-hidden relative">
              {/* Loading overlay */}
              <AnimatePresence>
                {loadingLeaves && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-surface/70 backdrop-blur-sm z-20 flex items-center justify-center"
                  >
                    <Spinner size="lg" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-ink/8 bg-bg">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-ink/40 uppercase tracking-widest py-3">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 auto-rows-[88px] bg-surface">
                {days.map((day, i) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const inMonth = isSameMonth(day, monthStart);
                  const isLeave = leaves?.some((l: any) => l.leaveDate === dateStr);
                  const isToday = isSameDay(day, new Date());
                  const isLastCol = i % 7 === 6;

                  return (
                    <motion.div
                      key={dateStr}
                      onClick={() => inMonth && handleDateClick(day)}
                      /* Background color tween: surface → danger/15 (leave) or accent/5 (hover) */
                      animate={{
                        backgroundColor: !inMonth
                          ? 'rgba(var(--color-bg-rgb, 248 248 247), 1)'
                          : isLeave
                          ? 'rgba(239 68 68 / 0.12)'
                          : 'rgba(var(--color-surface-rgb, 255 255 255), 1)',
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      whileHover={inMonth ? { backgroundColor: isLeave ? 'rgba(239 68 68 / 0.20)' : 'rgba(var(--color-accent-rgb, 14 165 233)/0.06)' } : {}}
                      className={cn(
                        'border-b border-r border-ink/5 p-2 flex flex-col relative select-none',
                        isLastCol && 'border-r-0',
                        inMonth && !isLeave ? 'cursor-pointer' : isLeave ? 'cursor-pointer' : 'cursor-default opacity-35'
                      )}
                    >
                      {/* Day number */}
                      <span
                        className={cn(
                          'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors',
                          isToday
                            ? 'bg-accent text-white font-bold shadow-sm shadow-accent/30'
                            : isLeave
                            ? 'text-danger font-bold'
                            : inMonth
                            ? 'text-ink/80'
                            : 'text-ink/25'
                        )}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Leave chip */}
                      <AnimatePresence>
                        {isLeave && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.2 }}
                            className="mt-auto mb-1 mx-0.5 rounded-md bg-danger/15 border border-danger/25 px-1.5 py-0.5 text-[10px] font-bold text-danger text-center"
                          >
                            Leave
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-ink/10 rounded-2xl bg-bg/50 text-center gap-3">
              <Calendar className="h-10 w-10 text-ink/15" />
              <p className="text-sm font-medium text-ink/40">Select a doctor to manage their leave schedule.</p>
            </div>
          )}
        </Card>
      </Reveal>

      {/* ── Mark Leave Modal ── */}
      <Modal isOpen={isMarkModalOpen} onClose={() => setIsMarkModalOpen(false)} title="Mark Leave Day">
        <form onSubmit={handleMarkLeave} className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/8 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink/70 font-body leading-relaxed">
              Marking <strong className="text-ink">{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</strong> as leave will automatically cancel all existing appointments on this date. Patients will be notified by email.
            </p>
          </div>
          <Input
            label="Reason (Optional)"
            value={leaveReason}
            onChange={e => setLeaveReason(e.target.value)}
            placeholder="e.g. Sick leave, Conference, Vacation"
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2 border-t border-ink/5">
            <Button type="button" variant="outline" onClick={() => setIsMarkModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" isLoading={isMarking}>
              Confirm & Mark Leave
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Remove Leave Confirmation Modal ── */}
      <Modal isOpen={isRemoveModalOpen} onClose={() => { setIsRemoveModalOpen(false); setRemoveDate(null); }} title="Remove Leave Day">
        <p className="text-ink/60 font-body mb-6 leading-relaxed">
          Remove leave on <strong className="text-ink">{removeDate}</strong>? This will restore the day to the doctor's schedule.
        </p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="outline" onClick={() => { setIsRemoveModalOpen(false); setRemoveDate(null); }}>Cancel</Button>
          <Button variant="primary" isLoading={isRemoving} onClick={handleConfirmRemove}>
            Remove Leave
          </Button>
        </div>
      </Modal>

      {/* ── Affected Appointments Result Modal ── */}
      <Modal
        isOpen={!!affectedModal}
        onClose={() => setAffectedModal(null)}
        title="Leave Marked — Patients Notified"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-success/8 border border-success/20">
            <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink/70 font-body leading-relaxed">
              Leave has been scheduled.{' '}
              <strong className="text-ink">{affectedModal?.length} appointment{affectedModal?.length !== 1 ? 's' : ''}</strong>{' '}
              were cancelled and patients will receive cancellation emails.
            </p>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2">
            {affectedModal?.map((apt: any) => (
              <div
                key={apt.id}
                className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-bg border border-ink/5"
              >
                <span className="text-sm font-display font-semibold text-ink">{apt.patientName}</span>
                <span className="text-xs text-ink/50 font-body">
                  {apt.slotTime && format(parseISO(apt.slotTime), 'h:mm a')}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-ink/5">
            <Button onClick={() => setAffectedModal(null)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminLeave;
