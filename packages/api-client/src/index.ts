export type QueryParams = Record<string, string | number | boolean | undefined>;

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

export interface FetchOptions extends RequestInit {
  params?: QueryParams;
}

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null;
  onTokenRefresh?: () => Promise<string | null>; // Callback para refrescar token
}

export class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private getAccessToken?: () => string | null;
  private onTokenRefresh?: () => Promise<string | null>;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.getAccessToken = options.getAccessToken;
    this.onTokenRefresh = options.onTokenRefresh;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getCurrentAccessToken(): string | null {
    return this.accessToken ?? this.getAccessToken?.() ?? null;
  }

  private buildUrl(endpoint: string, params?: QueryParams): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    let token = this.getCurrentAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // ✅ Si el token expiró (401), intentar refrescar automáticamente
    if (response.status === 401 && this.onTokenRefresh && endpoint !== '/api/auth/refresh') {
      try {
        token = await this.refreshToken();

        if (token) {
          // Reintentar la petición con el nuevo token
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          response = await fetch(url, {
            ...fetchOptions,
            headers,
          });
        }
      } catch (error) {
        console.error('Error al refrescar token:', error);
        // Si falla el refresh, dejar pasar el 401
      }
    }

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiError(response.status, response.statusText, errorData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Refrescar el access token usando refresh token de cookie
   * Implementa mutex pattern para evitar múltiples refreshes simultáneos
   */
  private async refreshToken(): Promise<string | null> {
    // Si ya está refrescando, esperar a que termine
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      if (!this.onTokenRefresh) {
        return null;
      }

      const newToken = await this.onTokenRefresh();

      if (newToken) {
        this.setAccessToken(newToken);
      }

      return newToken;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      return null;
    }
  }

  get<T>(endpoint: string, params?: QueryParams): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'DELETE' });
  }
}
