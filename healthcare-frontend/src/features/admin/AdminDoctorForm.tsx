import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAdminSpecialisations } from './hooks/useAdminAPI';
import { cn } from '../../lib/utils';

const workingHourSchema = z.object({
  isActive: z.boolean(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

const doctorSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "10-digit Indian mobile number required"),
  specialisationId: z.string().min(1, "Required"),
  bio: z.string().max(2000).optional(),
  slotDurationMinutes: z.string().min(1, "Required"),
  workingHours: z.array(workingHourSchema).refine(val => val.some(d => d.isActive), "At least one working day is required")
});

export type DoctorFormData = z.infer<typeof doctorSchema>;

interface AdminDoctorFormProps {
  initialData?: any; // If editing
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_WORKING_HOURS = DAYS.map((_, i) => ({
  isActive: i > 0 && i < 6, // Mon-Fri active by default
  dayOfWeek: i,
  startTime: '09:00',
  endTime: '17:00'
}));

export const AdminDoctorForm: React.FC<AdminDoctorFormProps> = ({ initialData, onSubmit, isSubmitting }) => {
  const { data: specialisations } = useAdminSpecialisations();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: initialData ? {
      ...initialData,
      workingHours: DAYS.map((_, i) => {
        const existing = initialData.workingHours?.find((wh: any) => wh.dayOfWeek === i);
        return existing ? { isActive: true, ...existing } : { isActive: false, dayOfWeek: i, startTime: '09:00', endTime: '17:00' };
      })
    } : {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialisationId: '',
      bio: '',
      slotDurationMinutes: 30,
      workingHours: DEFAULT_WORKING_HOURS
    }
  });

  const { fields } = useFieldArray({
    control,
    name: 'workingHours'
  });

  const handleFormSubmit = async (data: any) => {
    // Transform data for backend
    const payload = {
      ...data,
      slotDurationMinutes: Number(data.slotDurationMinutes),
      workingHours: data.workingHours
        .filter((wh: any) => wh.isActive)
        .map((wh: any) => ({
          dayOfWeek: wh.dayOfWeek,
          startTime: wh.startTime,
          endTime: wh.endTime
        }))
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-400">First Name *</label>
          <Input {...register('firstName')} error={errors.firstName?.message} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Last Name *</label>
          <Input {...register('lastName')} error={errors.lastName?.message} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Email *</label>
          <Input type="email" {...register('email')} error={errors.email?.message} disabled={!!initialData} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Phone *</label>
          <Input {...register('phone')} error={errors.phone?.message} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Specialisation *</label>
          <select 
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-[38px]"
            {...register('specialisationId')}
          >
            <option value="">Select Specialisation</option>
            {specialisations?.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.specialisationId && <p className="mt-1 text-xs text-red-400">{errors.specialisationId.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Slot Duration (Minutes) *</label>
          <select 
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-[38px]"
            {...register('slotDurationMinutes')}
          >
            <option value="15">15 Minutes</option>
            <option value="20">20 Minutes</option>
            <option value="30">30 Minutes</option>
            <option value="45">45 Minutes</option>
            <option value="60">60 Minutes</option>
          </select>
          {errors.slotDurationMinutes && <p className="mt-1 text-xs text-red-400">{errors.slotDurationMinutes.message}</p>}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-400">Bio</label>
        <textarea 
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
          {...register('bio')}
        />
        {errors.bio && <p className="mt-1 text-xs text-red-400">{errors.bio.message}</p>}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-bold text-white">Working Hours</label>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          {fields.map((field, index) => {
            const isActive = watch(`workingHours.${index}.isActive`);
            return (
              <div key={field.id} className="flex items-center gap-4">
                <div className="w-32 flex items-center gap-2">
                  <input type="checkbox" className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-600" {...register(`workingHours.${index}.isActive`)} />
                  <span className={cn("text-sm", isActive ? "text-slate-200" : "text-slate-500")}>{DAYS[index]}</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <Input type="time" {...register(`workingHours.${index}.startTime`)} disabled={!isActive} className={cn(!isActive && "opacity-50")} />
                  <span className="text-slate-500 text-sm">to</span>
                  <Input type="time" {...register(`workingHours.${index}.endTime`)} disabled={!isActive} className={cn(!isActive && "opacity-50")} />
                </div>
              </div>
            );
          })}
          {errors.workingHours?.root && <p className="text-xs text-red-400">{errors.workingHours.root.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <Button type="submit" isLoading={isSubmitting}>
          {initialData ? 'Update Doctor' : 'Add Doctor'}
        </Button>
      </div>
    </form>
  );
};
