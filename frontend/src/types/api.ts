// API response types matching backend contract

export interface ShortenRequest {
  url: string;
}

export interface ShortenResponse {
  alias: string;
  short_url: string;
}

export interface RateLimitError {
  error: string;
  retry_after_seconds: number;
}

export interface UrlItem {
  alias: string;
  original_url: string;
  total_clicks: number;
  archived: boolean;
}

export interface ClicksByDay {
  date: string; // YYYY-MM-DD
  clicks: number;
}

export interface AnalyticsResponse {
  alias: string;
  clicks_by_day: ClicksByDay[];
}

export interface ApiError {
  status: number;
  retryAfter?: number;
  message: string;
}
