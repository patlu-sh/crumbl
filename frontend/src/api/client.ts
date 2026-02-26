import type { 
  ShortenRequest, 
  ShortenResponse, 
  UrlItem, 
  AnalyticsResponse,
  RateLimitError,
  ApiError
} from '@/types/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // Handle rate limiting
  if (res.status === 429) {
    const data: RateLimitError = await res.json();
    const error: ApiError = {
      status: 429,
      retryAfter: data.retry_after_seconds,
      message: 'Rate limit exceeded',
    };
    throw error;
  }

  // Handle other errors
  if (!res.ok) {
    const error: ApiError = {
      status: res.status,
      message: `HTTP ${res.status}: ${res.statusText}`,
    };
    throw error;
  }

  return res.json();
}

export const api = {
  async shortenUrl(url: string): Promise<ShortenResponse> {
    const body: ShortenRequest = { url };
    return apiCall<ShortenResponse>('/api/shorten', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getUrls(): Promise<UrlItem[]> {
    return apiCall<UrlItem[]>('/api/urls');
  },

  async getAnalytics(alias: string): Promise<AnalyticsResponse> {
    return apiCall<AnalyticsResponse>(`/api/analytics/${alias}`);
  },

  async updateUrl(alias: string, newUrl: string): Promise<UrlItem> {
    return apiCall<UrlItem>(`/api/urls/${alias}`, {
      method: 'PATCH',
      body: JSON.stringify({ original_url: newUrl }),
    });
  },

  async archiveUrl(alias: string, archived: boolean): Promise<UrlItem> {
    return apiCall<UrlItem>(`/api/urls/${alias}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    });
  },

  async deleteUrl(alias: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/urls/${alias}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status === 429) {
      const data: RateLimitError = await res.json();
      throw { status: 429, retryAfter: data.retry_after_seconds, message: 'Rate limit exceeded' } as ApiError;
    }
    if (!res.ok) {
      throw { status: res.status, message: `HTTP ${res.status}: ${res.statusText}` } as ApiError;
    }
  },
};
