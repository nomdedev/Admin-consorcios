import { ApiClient } from '@vecinosimple/api-client';
import { useAuthStore } from '@/features/auth/store/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export { ApiError } from '@vecinosimple/api-client';

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  // Callback para refrescar token automáticamente cuando expire
  onTokenRefresh: async () => {
    try {
      const success = await useAuthStore.getState().refreshSession();
      if (success) {
        return useAuthStore.getState().accessToken;
      }
      return null;
    } catch (error) {
      console.error('Error en onTokenRefresh:', error);
      return null;
    }
  },
});

export default apiClient;
