import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BrainCircuit,
  Calendar,
  ChevronDown,
  Clock,
  Plus,
  Sparkles,
  Trash2,
  User,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDoctorAppointment, useSubmitNotes } from './hooks/useDoctorAPI';
import { Badge } from '../../components/ui/Badge';
import { AsyncButton } from '../../components/ui/AsyncButton';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../contexts/ToastContext';
import { Reveal } from '../../lib/motion/Reveal';
import { AIContentCard, UrgencyBadge } from './DoctorDashboard';

/* ─── Zod schema ─────────────────────────────────────────────────── */
const prescriptionSchema = z.object({
  medicationName: z.string().min(2, 'Required'),
  dosage: z.string().min(1, 'Required'),
  frequency: z.string().min(1, 'Required'),
  durationDays: z.string().min(1, 'Min 1 day'),
  instructions: z.string().optional(),
});

const notesSchema = z.object({
  clinicalNotes: z.string().min(10, 'Clinical notes are required (min 10 chars)'),
  prescriptions: z.array(prescriptionSchema),
});

type NotesForm = z.infer<typeof notesSchema>;

/* ─── Prescription row with slide-in/out ─────────────────────────── */
const PrescriptionRow: React.FC<{
  index: number;
  register: any;
  errors: any;
  onRemove: () => void;
}> = ({ index, register, errors, onRemove }) => (
  <motion.div
    key={index}
    layout
    initial={{ opacity: 0, height: 0, y: -12 }}
    animate={{ opacity: 1, height: 'auto', y: 0 }}
    exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
    transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
  >
    <div className="relative bg-bg rounded-xl border border-ink/8 p-5 mt-3">
      {/* Row number + remove */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent/70 flex items-center gap-1.5">
          <span className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-[10px]">
            {index + 1}
          </span>
          Medication
        </span>
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-ink/30 hover:text-danger hover:bg-danger/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      {/* 2-col grid on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            label="Medication Name *"
            error={errors.prescriptions?.[index]?.medicationName?.message}
            {...register(`prescriptions.${index}.medicationName` as const)}
          />
        </div>
        <div>
          <Input
            label="Dosage *"
            placeholder="e.g. 500mg"
            error={errors.prescriptions?.[index]?.dosage?.message}
            {...register(`prescriptions.${index}.dosage` as const)}
          />
        </div>
        <div>
          <Select
            label="Frequency *"
            options={[
              { label: 'Once Daily', value: 'ONCE_DAILY' },
              { label: 'Twice Daily', value: 'TWICE_DAILY' },
              { label: 'Thrice Daily', value: 'THRICE_DAILY' },
            ]}
            {...register(`prescriptions.${index}.frequency` as const)}
          />
        </div>
        <div>
          <Input
            type="number"
            label="Duration (Days) *"
            placeholder="e.g. 7"
            error={errors.prescriptions?.[index]?.durationDays?.message}
            {...register(`prescriptions.${index}.durationDays` as const)}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Instructions (Optional)"
            placeholder="e.g. Take after meals"
            {...register(`prescriptions.${index}.instructions` as const)}
          />
        </div>
      </div>
    </div>
  </motion.div>
);

/* ─── Main component ─────────────────────────────────────────────── */
const PostVisitNotes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showRawSymptoms, setShowRawSymptoms] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: apt, isLoading } = useDoctorAppointment(id!);
  const { mutateAsync: submitNotes, isPending: isSubmitting } = useSubmitNotes();
  const { toast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NotesForm>({
    resolver: zodResolver(notesSchema),
    defaultValues: { clinicalNotes: '', prescriptions: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'prescriptions' });

  const onSubmit = async (data: NotesForm) => {
    try {
      await submitNotes({
        id: id!,
        clinicalNotes: data.clinicalNotes,
        prescriptions: data.prescriptions.map(p => ({
          ...p,
          durationDays: Number(p.durationDays),
        })),
      });
      setSubmitSuccess(true);
      toast('Notes saved! Patient summary is generating.', 'success');
      setTimeout(() => navigate('/doctor/dashboard'), 1200);
    } catch {
      toast('Failed to save notes. Please try again.', 'error');
    }
  };

  if (isLoading) return <div className="flex justify-center p-16"><Spinner size="lg" /></div>;
  if (!apt) return (
    <div className="p-8 text-center">
      <AlertCircle className="h-10 w-10 text-ink/20 mx-auto mb-3" />
      <p className="text-ink/40 font-medium">Appointment not found.</p>
    </div>
  );

  const summary = apt.preVisitSummary;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 md:p-8">
      {/* ── Patient header card ── */}
      <Reveal>
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-bg border border-ink/5 flex items-center justify-center flex-shrink-0">
                <User className="h-7 w-7 text-ink/25" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-semibold text-ink">
                  {apt.patient.firstName} {apt.patient.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-ink/60 font-body">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(parseISO(apt.slotTime), 'MMMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {format(parseISO(apt.slotTime), 'h:mm a')}
                  </span>
                  <Badge variant={apt.status}>{apt.status}</Badge>
                </div>
              </div>
            </div>

            {/* Urgency indicator */}
            <div className="flex-shrink-0">
              <UrgencyBadge appointment={apt} />
            </div>
          </div>
        </Card>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left: AI Pre-Visit Summary ── */}
        <Reveal delay={0.08} className="lg:col-span-5 space-y-4">
          {/* AI Pre-Visit Summary */}
          {!summary || summary.llmStatus === 'PENDING' ? (
            <Card>
              <h2 className="text-base font-display font-semibold text-ink mb-5 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-accent" />
                AI Pre-Visit Summary
              </h2>
              <div className="space-y-3 animate-pulse mb-4">
                <div className="h-3 bg-bg rounded w-1/3" />
                <div className="h-16 bg-bg rounded" />
                <div className="h-3 bg-bg rounded w-1/2" />
                <div className="h-3 bg-bg rounded w-4/5" />
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-accent justify-center py-2">
                <Spinner size="sm" />
                Analyzing patient symptoms…
              </div>
            </Card>
          ) : summary.llmStatus === 'FAILED' ? (
            <Card>
              <h2 className="text-base font-display font-semibold text-ink mb-4 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-accent" />
                AI Pre-Visit Summary
              </h2>
              <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 text-sm text-danger font-medium">
                AI summary generation failed. Review raw symptoms below.
              </div>
            </Card>
          ) : (
            <Card>
              <h2 className="text-base font-display font-semibold text-ink mb-5 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-accent" />
                AI Pre-Visit Summary
              </h2>

              <AIContentCard>
                <div className="space-y-5">
                  {/* Urgency */}
                  <div>
                    <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-2">Urgency Level</p>
                    <UrgencyBadge appointment={apt} />
                  </div>

                  {/* Chief Complaint */}
                  <div>
                    <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-2">Chief Complaint</p>
                    <p className="text-sm text-ink font-medium leading-relaxed">{summary.chiefComplaint}</p>
                  </div>

                  {/* Suggested Questions */}
                  {summary.suggestedQuestions?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-ink/50 uppercase tracking-widest mb-2">
                        Suggested Questions
                      </p>
                      <ul className="space-y-2">
                        {summary.suggestedQuestions.map((q, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-ink">
                            <span className="h-4 w-4 rounded-full bg-accent/15 text-accent font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AIContentCard>
            </Card>
          )}

          {/* Raw Symptoms collapsible */}
          <Card className="!p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRawSymptoms(v => !v)}
              className="flex items-center justify-between w-full px-5 py-4 text-sm font-semibold text-ink/60 hover:text-ink hover:bg-bg/50 transition-colors"
            >
              <span>Raw Patient Input</span>
              <motion.div animate={{ rotate: showRawSymptoms ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </button>
            <AnimatePresence>
              {showRawSymptoms && apt.symptomForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-3 text-sm border-t border-ink/5 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-bg p-3 rounded-lg border border-ink/5">
                        <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-0.5">Severity</p>
                        <p className="font-semibold text-ink">{apt.symptomForm.severity}/10</p>
                      </div>
                      <div className="bg-bg p-3 rounded-lg border border-ink/5">
                        <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-0.5">Duration</p>
                        <p className="font-semibold text-ink">{apt.symptomForm.durationDays} days</p>
                      </div>
                    </div>
                    <div className="bg-bg p-3 rounded-lg border border-ink/5">
                      <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-1.5">Symptoms</p>
                      <p className="text-ink font-body text-xs leading-relaxed whitespace-pre-wrap">
                        {apt.symptomForm.symptoms}
                      </p>
                    </div>
                    {apt.symptomForm.additionalNotes && (
                      <div className="bg-bg p-3 rounded-lg border border-ink/5">
                        <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-1">Notes</p>
                        <p className="text-ink/70 font-body text-xs italic">{apt.symptomForm.additionalNotes}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </Reveal>

        {/* ── Right: Post-Visit Notes Form ── */}
        <Reveal delay={0.14} className="lg:col-span-7">
          {apt.status === 'COMPLETED' ? (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h2 className="text-base font-display font-semibold text-ink">Consultation Completed</h2>
                  <p className="text-xs text-ink/50 font-body">Notes have already been submitted.</p>
                </div>
              </div>
              <div className="bg-bg p-4 rounded-xl border border-ink/5 text-sm text-ink/70 font-body">
                Notes successfully documented. Patient-friendly summary has been generated and delivered.
              </div>
            </Card>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Clinical Notes card */}
              <Card>
                <h2 className="text-base font-display font-semibold text-ink mb-5">Post-Visit Clinical Notes</h2>
                <Textarea
                  label="Clinical Notes *"
                  rows={6}
                  placeholder="Document your clinical findings, diagnosis, and treatment plan…"
                  error={errors.clinicalNotes?.message}
                  {...register('clinicalNotes')}
                />
              </Card>

              {/* Prescriptions card */}
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-display font-semibold text-ink">Prescriptions</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      append({
                        medicationName: '',
                        dosage: '',
                        frequency: 'ONCE_DAILY',
                        durationDays: '7',
                        instructions: '',
                      })
                    }
                    className="text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Medication
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <p className="text-xs font-body text-ink/40 text-center py-8 border border-dashed border-ink/10 rounded-xl mt-3">
                    No prescriptions added. Click "Add Medication" to prescribe.
                  </p>
                ) : (
                  <AnimatePresence initial={false}>
                    {fields.map((field, index) => (
                      <PrescriptionRow
                        key={field.id}
                        index={index}
                        register={register}
                        errors={errors}
                        onRemove={() => remove(index)}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </Card>

              {/* Submit — AsyncButton morphs to circle spinner on submit */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-auto sm:min-w-[260px]">
                  <AsyncButton
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    isSuccess={submitSuccess}
                    disabled={isSubmitting || submitSuccess}
                  >
                    <Sparkles className="h-4 w-4" />
                    Submit Notes & Generate Summary
                  </AsyncButton>
                </div>
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </div>
  );
};

export default PostVisitNotes;
