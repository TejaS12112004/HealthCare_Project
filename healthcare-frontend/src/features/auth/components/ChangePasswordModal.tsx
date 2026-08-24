import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useChangePassword } from '../hooks/useChangePassword';

const schema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [errorMsg, setErrorMsg] = useState('');
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  const { mutateAsync, isPending } = useChangePassword();

  const handleClose = () => {
    reset();
    setErrorMsg('');
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    setErrorMsg('');
    try {
      await mutateAsync({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      alert('Password changed successfully!');
      handleClose();
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to change password. Check your old password.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}
        
        <Input 
          type="password" 
          label="Old Password *" 
          {...register('oldPassword')} 
          error={errors.oldPassword?.message} 
        />
        
        <Input 
          type="password" 
          label="New Password *" 
          {...register('newPassword')} 
          error={errors.newPassword?.message} 
        />
        
        <Input 
          type="password" 
          label="Confirm New Password *" 
          {...register('confirmPassword')} 
          error={errors.confirmPassword?.message} 
        />
        
        <div className="flex justify-end gap-3 pt-4 border-t border-ink/5">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" isLoading={isPending}>Save Password</Button>
        </div>
      </form>
    </Modal>
  );
};
