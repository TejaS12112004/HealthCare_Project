import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { AlertCircle, Calendar, CheckCircle2, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirmBooking, useDoctorSlots, useHoldSlot } from './hooks/usePatientAPI';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { cn } from '../../lib/utils';
import type { HoldResponse, Appointment, SlotResponse } from '../../types/appointment';

const symptomSchema = z.object({
  symptoms: z.string().min(5, 'Please describe your symptoms in detail'),
  durationDays: z.string().min(1, 'Required'),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
  additionalNotes: z.string().optional(),
});
type SymptomForm = z.infer<typeof symptomSchema>;

/* ─── Slim top stepper ──────────────────────────────────────────────── */
const STEPS = ['Select Slot', 'Symptoms', 'Confirmed'] as const;

const Stepper: React.FC<{ current: number }> = ({ current }) => (
  <div className="flex items-center gap-1 mb-8">
    {STEPS.map((label, i) => {
      const idx = i + 1;
      const done = current > idx;
      const active = current === idx;
      return (
        <React.Fragment key={label}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200',
                done ? 'bg-success text-white' : active ? 'bg-accent text-white' : 'bg-ink/10 text-ink/40'
              )}
            >
              {done ? '✓' : idx}
            </div>
            <span
              className={cn(
                'text-xs font-medium transition-colors hidden sm:inline',
                active ? 'text-ink font-semibold' : done ? 'text-success' : 'text-ink/40'
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('flex-1 h-px mx-2 transition-colors', current > idx ? 'bg-success/50' : 'bg-ink/10')} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ─── Slot pill button ──────────────────────────────────────────────── */
const SlotPill: React.FC<{
  slot: SlotResponse;
  isHolding: boolean;
  onClick: () => void;
}> = ({ slot, isHolding, onClick }) => {
  const available = slot.isAvailable && !isHolding;
  return (
    <motion.button
      type="button"
      disabled={!available}
      onClick={onClick}
      whileHover={available ? { scale: 1.04 } : {}}
      whileTap={available ? { scale: 0.96 } : {}}
      className={cn(
        'relative px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-accent',
        slot.isAvailable
          ? 'bg-surface text-ink border-ink/15 hover:border-accent hover:bg-accent/5 hover:text-accent cursor-pointer'
          : 'bg-bg/50 text-ink/25 border-ink/5 cursor-not-allowed'
      )}
    >
      {format(parseISO(slot.slotTime), 'h:mm a')}
    </motion.button>
  );
};

const BookAppointment: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [hold, setHold] = useState<HoldResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [expiredError, setExpiredError] = useState(false);

  const { data: slots, isLoading: loadingSlots } = useDoctorSlots(doctorId!, date);
  const { mutateAsync: holdSlot, isPending: isHolding } = useHoldSlot();
  const { mutateAsync: confirmBooking, isPending: isConfirming } = useConfirmBooking();

  const { register, handleSubmit, formState: { errors } } = useForm<SymptomForm>({
    resolver: zodResolver(symptomSchema),
    defaultValues: { severity: 'MILD', durationDays: '1' },
  });

  /* Hold countdown */
  useEffect(() => {
    if (step !== 2 || !hold) return;
    const interval = setInterval(() => {
      const diff = new Date(hold.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        setExpiredError(true);
        setStep(1);
        setHold(null);
      } else {
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1000);
        setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [step, hold]);

  const handleHold = async (slotTime: string) => {
    try {
      setExpiredError(false);
      const res = await holdSlot({ doctorId: doctorId!, slotTime });
      setHold(res);
      setStep(2);
    } catch {
      alert('Failed to hold slot. It may have just been taken.');
    }
  };

  const onConfirm = async (data: SymptomForm) => {
    if (!hold) return;
    try {
      const apt = await confirmBooking({
        holdId: hold.holdId,
        symptoms: data.symptoms,
        durationDays: Number(data.durationDays),
        severity: data.severity,
        additionalNotes: data.additionalNotes,
      });
      setAppointment(apt);
      setStep(3);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setExpiredError(true);
        setStep(1);
        setHold(null);
      } else {
        alert('Failed to confirm booking.');
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-semibold text-ink mb-6">Book Appointment</h1>
        <Stepper current={step} />
      </div>

      {/* Expired error banner */}
      {expiredError && (
        <div className="mb-6 p-4 rounded-xl bg-danger/8 border border-danger/20 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-danger">Hold Expired</p>
            <p className="text-xs text-danger/80 mt-0.5 font-body">Your 10-minute hold expired. Please select a new slot.</p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── Step 1: Select Slot ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <div className="mb-6 max-w-xs">
                <Input
                  label="Select Date"
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <h3 className="text-sm font-display font-semibold text-ink mb-4">Available Time Slots</h3>

              {loadingSlots ? (
                <div className="flex justify-center py-10"><Spinner size="lg" /></div>
              ) : slots?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {slots.map((s: SlotResponse) => (
                    <SlotPill
                      key={s.slotTime}
                      slot={s}
                      isHolding={isHolding}
                      onClick={() => handleHold(s.slotTime)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No slots available"
                  description="No time slots are published for this date. Try selecting a different date."
                />
              )}
            </Card>
          </motion.div>
        )}

        {/* ── Step 2: Symptoms ── */}
        {step === 2 && hold && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Symptom form */}
            <div className="md:col-span-2">
              <Card>
                <h2 className="text-lg font-display font-semibold text-ink mb-6">Describe Your Symptoms</h2>
                <form id="symptom-form" onSubmit={handleSubmit(onConfirm)} className="space-y-5">
                  <Textarea
                    label="Symptoms *"
                    rows={3}
                    placeholder="Describe how you are feeling…"
                    error={errors.symptoms?.message}
                    {...register('symptoms')}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Duration (Days) *"
                      type="number"
                      error={errors.durationDays?.message}
                      {...register('durationDays')}
                    />
                    <Select
                      label="Severity *"
                      options={[
                        { label: 'Low / Mild', value: 'MILD' },
                        { label: 'Medium / Moderate', value: 'MODERATE' },
                        { label: 'High / Severe', value: 'SEVERE' },
                      ]}
                      error={errors.severity?.message}
                      {...register('severity')}
                    />
                  </div>
                  <Textarea
                    label="Additional Notes (Optional)"
                    rows={2}
                    {...register('additionalNotes')}
                  />
                </form>
              </Card>
            </div>

            {/* Sidebar: hold timer + slot summary */}
            <div className="space-y-4">
              {/* Countdown */}
              <Card className="bg-accent/5 border-accent/20">
                <div className="flex items-center gap-2 text-accent mb-1.5">
                  <Clock className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">Hold Expires In</p>
                </div>
                <p className="text-4xl font-mono font-bold text-accent tracking-widest">{timeLeft}</p>
                <p className="text-[11px] text-accent/70 mt-2 font-body">
                  Complete this form to secure your slot.
                </p>
              </Card>

              {/* Slot details */}
              <Card>
                <h3 className="text-sm font-display font-semibold text-ink mb-4">Your Selected Slot</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-ink/70 font-medium">
                    <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-accent" />
                    </div>
                    {format(parseISO(hold.slotTime), 'MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-ink/70 font-medium">
                    <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-3.5 w-3.5 text-accent" />
                    </div>
                    {format(parseISO(hold.slotTime), 'h:mm a')}
                  </div>
                </div>
              </Card>

              <Button
                type="submit"
                form="symptom-form"
                variant="primary"
                isLoading={isConfirming}
                className="w-full"
              >
                Confirm Booking
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Confirmed ── */}
        {step === 3 && appointment && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="text-center max-w-lg mx-auto py-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 border border-success/20 mb-6">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-display font-semibold text-ink mb-2">Booking Confirmed!</h2>
              <p className="text-ink/60 font-body mb-8 leading-relaxed">
                Your appointment with{' '}
                <span className="font-semibold text-ink">Dr. {appointment.doctor.lastName}</span> is set for{' '}
                <span className="font-semibold text-ink">
                  {format(parseISO(appointment.slotTime), 'MMM d, h:mm a')}
                </span>.
              </p>

              <div className="bg-bg rounded-xl border border-ink/5 p-5 mb-8 text-left flex items-start gap-4">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Info className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">AI Summary Preparation</p>
                  <p className="text-xs text-ink/60 font-body mt-1 leading-relaxed">
                    An AI-generated pre-visit summary is being prepared for your doctor based on your symptoms. You'll receive an email confirmation shortly.
                  </p>
                </div>
              </div>

              <Link to="/patient/appointments">
                <Button variant="primary" className="w-full">
                  View My Appointments
                </Button>
              </Link>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookAppointment;
