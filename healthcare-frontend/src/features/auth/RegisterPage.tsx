import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import { FloatingInput } from '../../components/ui/FloatingInput';
import { MorphingButton } from '../../components/ui/MorphingButton';
import { Reveal } from '../../lib/motion/Reveal';
import type { Role } from '../../types/auth';

const schema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PATIENT', 'DOCTOR'] as const),
});
type FormData = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    setError,
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: 'PATIENT' } });

  const roleValue = watch('role');

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      await apiClient.post(ENDPOINTS.AUTH.REGISTER, data);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { state: { registered: true } });
      }, 1000);
    } catch {
      setError('root', { message: 'Registration failed. Email may already be in use.' });
      setIsPending(false);
    }
  };

  const nextStep = async () => {
    const isStep1Valid = await trigger(['firstName', 'lastName', 'email']);
    if (isStep1Valid) setStep(2);
  };

  return (
    <div className="w-full">
      <Reveal delay={0.1}>
        <h1 className="text-3xl font-display font-bold text-primary mb-2">Create account</h1>
        <p className="text-slate-500 mb-8">Join the HealthCare platform</p>
      </Reveal>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-100 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-accent"
          initial={{ width: "50%" }}
          animate={{ width: step === 1 ? "50%" : "100%" }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <FloatingInput label="First name" error={errors.firstName?.message} {...register('firstName')} />
                <FloatingInput label="Last name" error={errors.lastName?.message} {...register('lastName')} />
              </div>
              <FloatingInput label="Email address" type="email" error={errors.email?.message} {...register('email')} />
              
              <div className="pt-4">
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full h-14 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <FloatingInput label="Password" type="password" error={errors.password?.message} {...register('password')} />

              <div className="flex flex-col gap-2 mt-4 mb-2">
                <label className="text-sm font-medium text-slate-500">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['PATIENT', 'DOCTOR'] as Role[]).map((r) => (
                    <label key={r} className={`flex items-center justify-center h-12 rounded-xl border cursor-pointer transition-all ${roleValue === r ? 'border-accent bg-accent/5 text-accent font-medium' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      <input type="radio" value={r} {...register('role')} className="hidden" />
                      {r === 'PATIENT' ? 'Patient' : 'Doctor'}
                    </label>
                  ))}
                </div>
              </div>

              {errors.root && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                  {errors.root.message}
                </p>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-14 px-6 text-slate-500 font-medium hover:text-slate-800 transition-colors"
                >
                  Back
                </button>
                <MorphingButton type="submit" isLoading={isPending && !isSuccess} isSuccess={isSuccess}>
                  Create account
                </MorphingButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <Reveal delay={0.5}>
        <p className="mt-8 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-accent transition-colors">
            Sign in
          </Link>
        </p>
      </Reveal>
    </div>
  );
};

export default RegisterPage;
