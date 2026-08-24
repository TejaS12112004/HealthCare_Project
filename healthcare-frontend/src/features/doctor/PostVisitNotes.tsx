import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BrainCircuit, Calendar, ChevronDown, ChevronRight, Clock, Plus, Trash2, User } from 'lucide-react';
import { useDoctorAppointment, useSubmitNotes } from './hooks/useDoctorAPI';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../contexts/ToastContext';
import { Reveal } from '../../lib/motion/Reveal';

const prescriptionSchema = z.object({
  medicationName: z.string().min(2, "Required"),
  dosage: z.string().min(1, "Required"),
  frequency: z.string().min(1, "Required"),
  durationDays: z.string().min(1, "Min 1 day"),
  instructions: z.string().optional(),
});

const notesSchema = z.object({
  clinicalNotes: z.string().min(10, "Clinical notes are required (min 10 chars)"),
  prescriptions: z.array(prescriptionSchema),
});

type NotesForm = z.infer<typeof notesSchema>;

const PostVisitNotes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showRawSymptoms, setShowRawSymptoms] = useState(false);

  const { data: apt, isLoading } = useDoctorAppointment(id!);
  const { mutateAsync: submitNotes, isPending: isSubmitting } = useSubmitNotes();
  const { toast } = useToast();

  const { register, control, handleSubmit, formState: { errors } } = useForm<NotesForm>({
    resolver: zodResolver(notesSchema),
    defaultValues: {
      clinicalNotes: '',
      prescriptions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "prescriptions",
  });

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        prescriptions: data.prescriptions.map((p: any) => ({
          ...p,
          durationDays: Number(p.durationDays)
        }))
      };
      await submitNotes({ id: id!, ...payload });
      toast('Notes saved successfully! Patient summary is generating.', 'success');
      navigate('/doctor/dashboard');
    } catch (e) {
      toast('Failed to save notes.', 'error');
    }
  };

  if (isLoading) return <div className="flex justify-center p-16"><Spinner size="lg" /></div>;
  if (!apt) return <div className="p-8 text-center text-ink/40">Appointment not found.</div>;

  const summary = apt.preVisitSummary;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8">
      {/* Header */}
      <Reveal>
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-xl bg-bg flex items-center justify-center">
              <User className="h-8 w-8 text-ink/30" />
            </div>
            <div>
              <h1 className="text-3xl text-ink font-display font-medium">{apt.patient.firstName} {apt.patient.lastName}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-ink/60 font-body">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(parseISO(apt.slotTime), 'MMM d, yyyy')}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {format(parseISO(apt.slotTime), 'h:mm a')}</span>
                <Badge variant={apt.status}>{apt.status}</Badge>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: AI Pre-visit Summary */}
        <Reveal delay={0.1} className="lg:col-span-5 space-y-6">
          <Card>
            <h2 className="text-xl font-display font-medium text-ink mb-6 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-accent" />
              AI Pre-Visit Summary
            </h2>

            {!summary || summary.llmStatus === 'PENDING' ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-bg rounded w-1/4 mb-6"></div>
                <div className="h-24 bg-bg rounded mb-6"></div>
                <div className="h-4 bg-bg rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-bg rounded"></div>
                  <div className="h-3 bg-bg rounded w-5/6"></div>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-accent mt-8 justify-center">
                  <Spinner size="sm" /> Analyzing patient symptoms…
                </div>
              </div>
            ) : summary.llmStatus === 'FAILED' ? (
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-5 text-danger font-medium text-sm">
                AI summary generation failed. Please review the raw symptoms below.
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-2">Urgency Level</p>
                  {summary.urgencyLevel === 'HIGH' ? <Badge variant="danger">HIGH</Badge> : 
                   summary.urgencyLevel === 'MEDIUM' ? <Badge variant="warning">MEDIUM</Badge> : 
                   <Badge variant="success">LOW</Badge>}
                </div>
                
                <div>
                  <p className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-2">Chief Complaint</p>
                  <p className="text-ink font-medium text-sm">{summary.chiefComplaint}</p>
                </div>

                {summary.suggestedQuestions && summary.suggestedQuestions.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-ink/50 uppercase tracking-wider mb-2">Suggested Questions</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {summary.suggestedQuestions.map((q, i) => (
                         <li key={i} className="text-ink font-medium text-sm ml-4">{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Raw Symptoms */}
            <div className="mt-8 pt-6 border-t border-ink/5">
              <button 
                onClick={() => setShowRawSymptoms(!showRawSymptoms)}
                className="flex items-center justify-between w-full text-sm font-bold text-ink/50 hover:text-accent transition-colors"
              >
                Raw Patient Symptoms
                {showRawSymptoms ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {showRawSymptoms && apt.symptomForm && (
                <div className="mt-4 bg-bg p-4 rounded-lg border border-ink/5 text-sm space-y-3">
                  <div><strong className="text-ink/60 font-bold">Severity:</strong> <span className="text-ink font-medium">{apt.symptomForm.severity}/10</span></div>
                  <div><strong className="text-ink/60 font-bold">Duration:</strong> <span className="text-ink font-medium">{apt.symptomForm.durationDays} days</span></div>
                  <div><strong className="text-ink/60 font-bold">Symptoms:</strong> <p className="text-ink font-medium mt-1 whitespace-pre-wrap">{apt.symptomForm.symptoms}</p></div>
                  {apt.symptomForm.additionalNotes && (
                    <div><strong className="text-ink/60 font-bold">Notes:</strong> <p className="text-ink font-medium mt-1 italic">{apt.symptomForm.additionalNotes}</p></div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </Reveal>

        {/* Right Column: Post-Visit Notes Form */}
        <Reveal delay={0.2} className="lg:col-span-7">
          {apt.status === 'COMPLETED' ? (
            <Card>
              <h2 className="text-xl font-display font-medium text-ink mb-6">Consultation Completed</h2>
              <p className="text-ink/60 font-medium mb-6">Notes have already been submitted for this appointment.</p>
              <div className="bg-bg p-5 rounded-lg border border-ink/5 text-sm font-medium text-ink whitespace-pre-wrap">
                Notes have been successfully documented. Patient summary generated.
              </div>
            </Card>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <h2 className="text-xl font-display font-medium text-ink mb-6">Post-Visit Clinical Notes</h2>
                
                <div className="space-y-2">
                  <Textarea
                    label="Clinical Notes *"
                    rows={6}
                    error={errors.clinicalNotes?.message}
                    {...register("clinicalNotes")}
                  />
                </div>
              </Card>

              {/* Prescriptions Array */}
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-display font-medium text-ink">Prescriptions</h3>
                  <Button type="button" variant="secondary" size="sm" onClick={() => append({ medicationName: '', dosage: '', frequency: 'ONCE_DAILY', durationDays: '7', instructions: '' })}>
                    <Plus className="h-4 w-4 mr-1" /> Add Medication
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <p className="text-sm font-body text-ink/50 text-center py-6 border border-dashed border-ink/10 rounded-lg">No prescriptions added.</p>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {fields.map((field, index) => (
                        <motion.div
                          key={field.id}
                          initial={{ opacity: 0, y: -20, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, overflow: 'hidden' }}
                          transition={{ duration: 0.2 }}
                          className="relative bg-bg p-5 rounded-lg border border-ink/5 grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <IconButton type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="absolute top-2 right-2 text-ink/40 hover:text-danger z-10">
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                          
                          <div className="space-y-1">
                            <Input 
                              label="Medication *"
                              error={errors.prescriptions?.[index]?.medicationName?.message}
                              {...register(`prescriptions.${index}.medicationName` as const)} 
                            />
                          </div>

                          <div className="space-y-1">
                            <Input 
                              label="Dosage *"
                              error={errors.prescriptions?.[index]?.dosage?.message}
                              {...register(`prescriptions.${index}.dosage` as const)} 
                            />
                          </div>

                          <div className="space-y-1">
                            <Select 
                              label="Frequency *"
                              options={[
                                { label: 'Once Daily', value: 'ONCE_DAILY' },
                                { label: 'Twice Daily', value: 'TWICE_DAILY' },
                                { label: 'Thrice Daily', value: 'THRICE_DAILY' }
                              ]}
                              {...register(`prescriptions.${index}.frequency` as const)}
                            />
                          </div>

                          <div className="space-y-1">
                            <Input 
                              type="number"
                              label="Duration (Days) *"
                              error={errors.prescriptions?.[index]?.durationDays?.message}
                              {...register(`prescriptions.${index}.durationDays` as const)} 
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1">
                            <Input 
                              label="Instructions (Optional)"
                              error={errors.prescriptions?.[index]?.instructions?.message}
                              {...register(`prescriptions.${index}.instructions` as const)} 
                            />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </Card>

              <div className="flex justify-end pt-4">
                <div className="w-full sm:w-auto">
                  <Button type="submit" isLoading={isSubmitting} className="w-full">
                    Submit Notes & Generate Patient Summary
                  </Button>
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
