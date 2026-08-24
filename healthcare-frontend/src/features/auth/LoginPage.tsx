import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FloatingInput } from '../../components/ui/FloatingInput';
import { MorphingButton } from '../../components/ui/MorphingButton';
import { Reveal } from '../../lib/motion/Reveal';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      await login(data.email, data.password);
      setIsSuccess(true);
      // Wait for the button morph animation to complete before redirect happens (simulated here)
    } catch {
      setError('root', { message: 'Invalid email or password' });
      setIsPending(false);
    }
  };

  return (
    <div className="w-full">
      <Reveal delay={0.1}>
        <h1 className="text-3xl font-display font-bold text-primary mb-2">Welcome back</h1>
        <p className="text-slate-500 mb-8">Sign in to your healthcare account</p>
      </Reveal>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Reveal delay={0.2}>
          <FloatingInput
            label="Email address"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
        </Reveal>
        <Reveal delay={0.3}>
          <FloatingInput
            label="Password"
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
        </Reveal>

        {errors.root && (
          <Reveal delay={0.1}>
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
              {errors.root.message}
            </p>
          </Reveal>
        )}

        <Reveal delay={0.4}>
          <div className="mt-6">
            <MorphingButton type="submit" isLoading={isPending && !isSuccess} isSuccess={isSuccess}>
              Sign in
            </MorphingButton>
          </div>
        </Reveal>
      </form>

      <Reveal delay={0.5}>
        <p className="mt-8 text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-accent transition-colors">
            Create account
          </Link>
        </p>
      </Reveal>
    </div>
  );
};

export default LoginPage;
