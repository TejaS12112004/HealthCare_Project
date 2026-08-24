import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { AlertCircle, Calendar, CheckCircle2, ChevronRight, Clock, Info } from 'lucide-react';
import { useConfirmBooking, useDoctorSlots, useHoldSlot } from './hooks/usePatientAPI';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { cn } from '../../lib/utils';
import type { HoldResponse, Appointment, SlotResponse } from '../../types/appointment';

const symptomSchema = z.object({
  symptoms: z.string().min(5, 'Please describe your symptoms in detail'),
  durationDays: z.string().min(1, 'Required'),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
  additionalNotes: z.string().optional(),
});
type SymptomForm = z.infer<typeof symptomSchema>;

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

  // Hold Timer Logic
  useEffect(() => {
    if (step !== 2 || !hold) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(hold.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        clearInterval(interval);
        setExpiredError(true);
        setStep(1);
        setHold(null);
      } else {
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
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
    } catch (err) {
      console.error(err);
      alert('Failed to hold slot. It might have been taken.');
    }
  };

  const onConfirm = async (data: any) => {
    if (!hold) return;
    try {
      const payload = {
        holdId: hold.holdId,
        symptoms: data.symptoms,
        durationDays: Number(data.durationDays),
        severity: data.severity,
        additionalNotes: data.additionalNotes
      };
      const apt = await confirmBooking(payload);
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
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header & Steps */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-medium text-ink mb-6">Book Appointment</h1>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className={cn("flex items-center gap-2", step >= 1 ? "text-accent" : "text-ink/40")}>
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-white", step >= 1 ? "bg-accent" : "bg-ink/20")}>1</div>
            Select Slot
          </div>
          <ChevronRight className="h-4 w-4 text-ink/20" />
          <div className={cn("flex items-center gap-2", step >= 2 ? "text-accent" : "text-ink/40")}>
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-white", step >= 2 ? "bg-accent" : "bg-ink/20")}>2</div>
            Symptoms
          </div>
          <ChevronRight className="h-4 w-4 text-ink/20" />
          <div className={cn("flex items-center gap-2", step >= 3 ? "text-accent" : "text-ink/40")}>
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-white", step >= 3 ? "bg-accent" : "bg-ink/20")}>3</div>
            Confirm
          </div>
        </div>
      </div>

      {expiredError && (
        <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-danger mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-danger">Hold Expired</h4>
            <p className="text-sm text-danger/80 font-medium">Your 10-minute hold on the slot expired. Please select a new slot.</p>
          </div>
        </div>
      )}

      {/* Step 1: Select Slot */}
      {step === 1 && (
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

          <h3 className="text-lg font-display font-medium text-ink mb-4">Available Slots</h3>
          {loadingSlots ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : slots?.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots.map((s: SlotResponse) => (
                <motion.button
                  key={s.slotTime}
                  whileHover={s.isAvailable && !isHolding ? { scale: 1.05 } : {}}
                  whileTap={s.isAvailable && !isHolding ? { scale: 0.97 } : {}}
                  disabled={!s.isAvailable || isHolding}
                  onClick={() => handleHold(s.slotTime)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    s.isAvailable
                      ? "bg-bg text-ink border border-ink/10 hover:bg-accent hover:text-white hover:border-accent cursor-pointer"
                      : "bg-bg/50 text-ink/30 border border-ink/5 cursor-not-allowed"
                  )}
                >
                  {format(parseISO(s.slotTime), 'h:mm a')}
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-ink/50 bg-bg rounded-xl font-medium border border-ink/5">
              No slots available on this date.
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Symptoms */}
      {step === 2 && hold && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <h2 className="text-xl font-display font-medium text-ink mb-6">Patient Symptoms</h2>
              <form id="symptom-form" onSubmit={handleSubmit(onConfirm)} className="space-y-6">
                <div>
                  <Textarea
                    label="Symptoms *"
                    rows={3}
                    placeholder="Describe how you are feeling..."
                    error={errors.symptoms?.message}
                    {...register('symptoms')}
                  />
                </div>

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
                      { label: 'High / Severe', value: 'SEVERE' }
                    ]}
                    error={errors.severity?.message}
                    {...register('severity')}
                  />
                </div>

                <div>
                  <Textarea
                    label="Additional Notes (Optional)"
                    rows={2}
                    error={errors.additionalNotes?.message}
                    {...register('additionalNotes')}
                  />
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="!bg-accent/5 !border-accent/20">
              <div className="flex items-center gap-2 text-accent mb-2">
                <Clock className="h-5 w-5" />
                <h3 className="font-bold">Hold Expires In</h3>
              </div>
              <div className="text-3xl font-mono font-bold text-accent tracking-wider">{timeLeft}</div>
              <p className="text-xs text-accent/70 mt-2 font-medium">Complete this form to confirm your slot.</p>
            </Card>

            <Card>
              <h3 className="font-display font-medium text-ink mb-4">Slot Details</h3>
              <div className="space-y-3 text-sm text-ink/70 font-medium">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-accent" />
                  </div>
                  {format(parseISO(hold.slotTime), 'MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-accent" />
                  </div>
                  {format(parseISO(hold.slotTime), 'h:mm a')}
                </div>
              </div>
            </Card>

            <div className="w-full">
              <Button type="submit" form="symptom-form" isLoading={isConfirming} className="w-full">
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && appointment && (
        <Card className="text-center max-w-lg mx-auto py-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-6">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-display font-medium text-ink mb-2">Booking Confirmed!</h2>
          <p className="text-ink/60 font-body mb-8">Your appointment with Dr. {appointment.doctor.lastName} is set for <strong>{format(parseISO(appointment.slotTime), 'MMM d, h:mm a')}</strong>.</p>
          
          <div className="bg-bg rounded-xl border border-ink/5 p-5 mb-8 text-left flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Info className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">AI Summary Preparation</p>
              <p className="text-xs text-ink/60 font-medium mt-1 leading-relaxed">An AI-generated pre-visit summary is currently being prepared for your doctor based on your symptoms. You will receive an email confirmation shortly.</p>
            </div>
          </div>

          <Link to="/patient/appointments">
            <Button className="w-full">View My Appointments</Button>
          </Link>
        </Card>
      )}
    </div>
  );
};

export default BookAppointment;
