import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: 'PATIENT' } });

  const onSubmit = async (data: FormData) => {
    try {
      await apiClient.post(ENDPOINTS.AUTH.REGISTER, data);
      navigate('/login', { state: { registered: true } });
    } catch {
      setError('root', { message: 'Registration failed. Email may already be in use.' });
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 mb-4">
            <span className="text-2xl font-bold text-white">HC</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="mt-1 text-sm text-slate-400">Join the HealthCare platform</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" placeholder="John" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name" placeholder="Doe" error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />

          {/* Role toggle */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-300">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {(['PATIENT', 'DOCTOR'] as Role[]).map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={r} {...register('role')} className="accent-indigo-500" />
                  <span className="text-sm text-slate-300">{r === 'PATIENT' ? 'Patient' : 'Doctor'}</span>
                </label>
              ))}
            </div>
          </div>

          {errors.root && (
            <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
