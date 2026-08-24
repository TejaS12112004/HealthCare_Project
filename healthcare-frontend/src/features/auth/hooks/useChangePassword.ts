import { useMutation } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      await apiClient.post('/api/v1/auth/change-password', payload);
    },
  });
};
