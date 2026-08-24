import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { AlertCircle, Calendar, CheckCircle2, ChevronRight, Clock, Info } from 'lucide-react';
import { useConfirmBooking, useDoctorSlots, useHoldSlot } from './hooks/usePatientAPI';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { cn } from '../../lib/utils';
import type { HoldResponse, Appointment, SlotResponse } from '../../types/appointment';

const symptomSchema = z.object({
  symptoms: z.string().min(5, 'Please describe your symptoms in detail'),
  durationDays: z.string().min(1, 'Required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
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
    defaultValues: { severity: 'LOW', durationDays: '1' },
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
        <h1 className="text-3xl font-bold text-white mb-6">Book Appointment</h1>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className={cn("flex items-center gap-2", step >= 1 ? "text-indigo-400" : "text-slate-500")}>
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", step >= 1 ? "bg-indigo-600 text-white" : "bg-slate-800")}>1</div>
            Select Slot
          </div>
          <ChevronRight className="h-4 w-4 text-slate-700" />
          <div className={cn("flex items-center gap-2", step >= 2 ? "text-indigo-400" : "text-slate-500")}>
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", step >= 2 ? "bg-indigo-600 text-white" : "bg-slate-800")}>2</div>
            Symptoms
          </div>
          <ChevronRight className="h-4 w-4 text-slate-700" />
          <div className={cn("flex items-center gap-2", step >= 3 ? "text-indigo-400" : "text-slate-500")}>
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center", step >= 3 ? "bg-indigo-600 text-white" : "bg-slate-800")}>3</div>
            Confirm
          </div>
        </div>
      </div>

      {expiredError && (
        <div className="mb-6 p-4 rounded-lg bg-red-900/50 border border-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-red-400">Hold Expired</h4>
            <p className="text-sm text-red-300">Your 10-minute hold on the slot expired. Please select a new slot.</p>
          </div>
        </div>
      )}

      {/* Step 1: Select Slot */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="mb-6 max-w-xs">
            <Input
              label="Select Date"
              type="date"
              min={format(new Date(), 'yyyy-MM-dd')}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <h3 className="text-lg font-semibold text-white mb-4">Available Slots</h3>
          {loadingSlots ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : slots?.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots.map((s: SlotResponse) => (
                <button
                  key={s.slotTime}
                  disabled={!s.isAvailable || isHolding}
                  onClick={() => handleHold(s.slotTime)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    s.isAvailable
                      ? "bg-slate-800 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-slate-700 hover:border-indigo-500 cursor-pointer"
                      : "bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50"
                  )}
                >
                  {format(parseISO(s.slotTime), 'h:mm a')}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-slate-950 rounded-lg">
              No slots available on this date.
            </div>
          )}
        </div>
      )}

      {/* Step 2: Symptoms */}
      {step === 2 && hold && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Patient Symptoms</h2>
            <form id="symptom-form" onSubmit={handleSubmit(onConfirm)} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">Symptoms *</label>
                <textarea
                  className={cn(
                    'rounded-lg border bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                    errors.symptoms ? 'border-red-500' : 'border-slate-700'
                  )}
                  rows={3}
                  placeholder="Describe how you are feeling..."
                  {...register('symptoms')}
                />
                {errors.symptoms && <p className="text-xs text-red-400">{errors.symptoms.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Duration (Days) *" type="number" error={errors.durationDays?.message} {...register('durationDays')} />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-300">Severity *</label>
                  <select
                    className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
                    {...register('severity')}
                  >
                    <option value="LOW">Low / Mild</option>
                    <option value="MEDIUM">Medium / Moderate</option>
                    <option value="HIGH">High / Severe</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-300">Additional Notes (Optional)</label>
                <textarea
                  className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  {...register('additionalNotes')}
                />
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Clock className="h-5 w-5" />
                <h3 className="font-semibold">Hold Expires In</h3>
              </div>
              <div className="text-3xl font-mono font-bold text-white tracking-wider">{timeLeft}</div>
              <p className="text-xs text-indigo-300/70 mt-2">Complete this form to confirm your slot.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4">Slot Details</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  {format(parseISO(hold.slotTime), 'MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  {format(parseISO(hold.slotTime), 'h:mm a')}
                </div>
              </div>
            </div>

            <Button type="submit" form="symptom-form" isLoading={isConfirming} className="w-full">
              Confirm Booking
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && appointment && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-lg mx-auto">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/50 mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-slate-400 mb-6">Your appointment with Dr. {appointment.doctor.lastName} is set for <strong>{format(parseISO(appointment.slotTime), 'MMM d, h:mm a')}</strong>.</p>
          
          <div className="bg-slate-950 rounded-lg p-4 mb-8 text-left flex items-start gap-3">
            <Info className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-300">AI Summary Preparation</p>
              <p className="text-xs text-slate-500 mt-1">An AI-generated pre-visit summary is currently being prepared for your doctor based on your symptoms. You will receive an email confirmation shortly.</p>
            </div>
          </div>

          <Link to="/patient/appointments">
            <Button className="w-full">View My Appointments</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
