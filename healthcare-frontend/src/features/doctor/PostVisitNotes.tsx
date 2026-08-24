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
import { AsyncButton } from '../../components/ui/AsyncButton';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../contexts/ToastContext';
import { cn } from '../../lib/utils';

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
  if (!apt) return <div className="p-8 text-center text-slate-400">Appointment not found.</div>;

  const summary = apt.preVisitSummary;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center">
            <User className="h-7 w-7 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{apt.patient.firstName} {apt.patient.lastName}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(parseISO(apt.slotTime), 'MMM d, yyyy')}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {format(parseISO(apt.slotTime), 'h:mm a')}</span>
              <Badge variant={apt.status}>{apt.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: AI Pre-visit Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-indigo-400" />
              AI Pre-Visit Summary
            </h2>

            {!summary || summary.llmStatus === 'PENDING' ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-1/4 mb-6"></div>
                <div className="h-24 bg-slate-800 rounded mb-6"></div>
                <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-800 rounded"></div>
                  <div className="h-3 bg-slate-800 rounded w-5/6"></div>
                </div>
                <div className="flex items-center gap-3 text-sm text-indigo-400 mt-8 justify-center">
                  <Spinner size="sm" /> Analyzing patient symptoms…
                </div>
              </div>
            ) : summary.llmStatus === 'FAILED' ? (
              <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-5 text-red-400 text-sm">
                AI summary generation failed. Please review the raw symptoms below.
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Urgency Level</p>
                  {summary.urgencyLevel === 'HIGH' ? <Badge variant="danger">HIGH</Badge> : 
                   summary.urgencyLevel === 'MEDIUM' ? <Badge variant="warning">MEDIUM</Badge> : 
                   <Badge variant="success">LOW</Badge>}
                </div>
                
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Chief Complaint</p>
                  <p className="text-slate-300 text-sm">{summary.chiefComplaint}</p>
                </div>

                {summary.suggestedQuestions && summary.suggestedQuestions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Suggested Questions</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {summary.suggestedQuestions.map((q, i) => (
                        <li key={i} className="text-slate-300 text-sm">{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Raw Symptoms */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <button 
                onClick={() => setShowRawSymptoms(!showRawSymptoms)}
                className="flex items-center justify-between w-full text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Raw Patient Symptoms
                {showRawSymptoms ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {showRawSymptoms && apt.symptomForm && (
                <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm space-y-3">
                  <div><strong className="text-slate-400 font-medium">Severity:</strong> <span className="text-slate-300">{apt.symptomForm.severity}/10</span></div>
                  <div><strong className="text-slate-400 font-medium">Duration:</strong> <span className="text-slate-300">{apt.symptomForm.durationDays} days</span></div>
                  <div><strong className="text-slate-400 font-medium">Symptoms:</strong> <p className="text-slate-300 mt-1 whitespace-pre-wrap">{apt.symptomForm.symptoms}</p></div>
                  {apt.symptomForm.additionalNotes && (
                    <div><strong className="text-slate-400 font-medium">Notes:</strong> <p className="text-slate-300 mt-1 italic">{apt.symptomForm.additionalNotes}</p></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Post-Visit Notes Form */}
        <div className="lg:col-span-7">
          {apt.status === 'COMPLETED' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Consultation Completed</h2>
              <p className="text-slate-400 mb-6">Notes have already been submitted for this appointment.</p>
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap">
                Notes have been successfully documented. Patient summary generated.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Post-Visit Clinical Notes</h2>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Clinical Notes *</label>
                  <textarea
                    rows={6}
                    className={cn(
                      "w-full rounded-lg border bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                      errors.clinicalNotes ? "border-red-500" : "border-slate-800"
                    )}
                    placeholder="Enter examination findings, diagnosis, and plan..."
                    {...register("clinicalNotes")}
                  />
                  {errors.clinicalNotes && <p className="text-xs text-red-400">{errors.clinicalNotes.message}</p>}
                </div>
              </div>

              {/* Prescriptions Array */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Prescriptions</h3>
                  <Button type="button" variant="secondary" size="sm" onClick={() => append({ medicationName: '', dosage: '', frequency: 'ONCE_DAILY', durationDays: '7', instructions: '' })}>
                    <Plus className="h-4 w-4 mr-1" /> Add Medication
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6 border border-dashed border-slate-800 rounded-xl">No prescriptions added.</p>
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
                          className="relative bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <button type="button" onClick={() => remove(index)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">Medication *</label>
                            <input 
                              className="w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                              {...register(`prescriptions.${index}.medicationName` as const)} 
                            />
                            {errors.prescriptions?.[index]?.medicationName && <p className="text-xs text-red-400">Required</p>}
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">Dosage *</label>
                            <input 
                              placeholder="e.g. 500mg"
                              className="w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                              {...register(`prescriptions.${index}.dosage` as const)} 
                            />
                            {errors.prescriptions?.[index]?.dosage && <p className="text-xs text-red-400">Required</p>}
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">Frequency *</label>
                            <select 
                              className="w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 h-[38px]" 
                              {...register(`prescriptions.${index}.frequency` as const)}
                            >
                              <option value="ONCE_DAILY">Once Daily</option>
                              <option value="TWICE_DAILY">Twice Daily</option>
                              <option value="THRICE_DAILY">Thrice Daily</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-400">Duration (Days) *</label>
                            <input 
                              type="number"
                              className="w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                              {...register(`prescriptions.${index}.durationDays` as const)} 
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1">
                            <label className="text-xs font-medium text-slate-400">Instructions (Optional)</label>
                            <input 
                              placeholder="e.g. Take after meals"
                              className="w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                              {...register(`prescriptions.${index}.instructions` as const)} 
                            />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <div className="w-full sm:w-auto">
                  <AsyncButton type="submit" isLoading={isSubmitting} className="w-full">
                    Submit Notes & Generate Patient Summary
                  </AsyncButton>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostVisitNotes;
