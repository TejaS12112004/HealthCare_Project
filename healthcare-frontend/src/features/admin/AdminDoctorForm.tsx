import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
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
        <Input label="First Name *" {...register('firstName')} error={errors.firstName?.message} />
        <Input label="Last Name *" {...register('lastName')} error={errors.lastName?.message} />
        <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} disabled={!!initialData} />
        <Input label="Phone *" {...register('phone')} error={errors.phone?.message} />
        <Select
          label="Specialisation *"
          options={specialisations?.map((s: any) => ({ label: s.name, value: s.id })) || []}
          error={errors.specialisationId?.message}
          {...register('specialisationId')}
        />
        <Select
          label="Slot Duration (Minutes) *"
          options={[
            { label: '15 Minutes', value: '15' },
            { label: '20 Minutes', value: '20' },
            { label: '30 Minutes', value: '30' },
            { label: '45 Minutes', value: '45' },
            { label: '60 Minutes', value: '60' },
          ]}
          error={errors.slotDurationMinutes?.message}
          {...register('slotDurationMinutes')}
        />
      </div>

      <Textarea
        label="Bio"
        rows={3}
        error={errors.bio?.message}
        {...register('bio')}
      />

      <div className="space-y-3">
        <label className="text-sm font-bold text-ink">Working Hours</label>
        <div className="bg-bg p-4 rounded-xl border border-ink/5 space-y-3">
          {fields.map((field, index) => {
            const isActive = watch(`workingHours.${index}.isActive`);
            return (
              <div key={field.id} className="flex items-center gap-4">
                <div className="w-32 flex items-center gap-2">
                  <input type="checkbox" className="rounded border-ink/20 bg-surface text-accent focus:ring-accent" {...register(`workingHours.${index}.isActive`)} />
                  <span className={cn("text-sm font-medium", isActive ? "text-ink" : "text-ink/40")}>{DAYS[index]}</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <Input type="time" {...register(`workingHours.${index}.startTime`)} disabled={!isActive} className={cn(!isActive && "opacity-50")} />
                  <span className="text-ink/50 text-sm">to</span>
                  <Input type="time" {...register(`workingHours.${index}.endTime`)} disabled={!isActive} className={cn(!isActive && "opacity-50")} />
                </div>
              </div>
            );
          })}
          {errors.workingHours?.root && <p className="text-xs text-danger">{errors.workingHours.root.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-ink/5">
        <Button type="submit" isLoading={isSubmitting}>
          {initialData ? 'Update Doctor' : 'Add Doctor'}
        </Button>
      </div>
    </form>
  );
};
