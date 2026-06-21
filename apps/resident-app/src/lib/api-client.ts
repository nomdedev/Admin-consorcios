import { ApiClient } from '@vecinosimple/api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  // ❌ NO usar getAccessToken desde localStorage
  // El access token se setea desde AuthContext
});

export { ApiError } from '@vecinosimple/api-client';
