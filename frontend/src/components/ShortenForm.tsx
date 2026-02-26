// components/ShortenForm.tsx — Shared URL shortening form component
import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { Link2 as LinkIcon, ArrowRight } from 'lucide-react';
import { api } from '@/api/client';
import { useCountdown } from '@/hooks/useCountdown';
import type { ApiError } from '@/types/api';

interface ShortenFormProps {
  onSuccess?: () => void;
  className?: string;
}

function validateUrl(raw: string): string | null {
  const trimmed = raw.trim();

  if (!trimmed) return 'Please enter a URL.';
  if (trimmed.length > 2048) return 'URL is too long (max 2048 characters).';

  // Must start with http:// or https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return 'URL must start with http:// or https://';
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return 'Invalid URL format. Please check and try again.';
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and loopback
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return 'Localhost URLs are not allowed.';
  }

  // Block private IP ranges
  const privateIp = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0)/;
  if (privateIp.test(hostname)) {
    return 'Private/internal IP addresses are not allowed.';
  }

  // Hostname must have at least one dot (e.g. example.com)
  if (!hostname.includes('.')) {
    return 'URL must contain a valid domain (e.g. https://example.com).';
  }

  // No empty path-only or bare protocol URLs
  if (hostname.length === 0) {
    return 'URL is missing a valid hostname.';
  }

  return null; // valid
}

export function ShortenForm({ onSuccess, className }: ShortenFormProps) {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  const remaining = useCountdown(retryAfterSeconds);
  const isDisabled = loading || (remaining !== null && remaining > 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationError = validateUrl(urlInput);
    if (validationError) {
      toast.error('Invalid URL', { description: validationError });
      return;
    }

    setLoading(true);
    try {
      const response = await api.shortenUrl(urlInput.trim());
      toast.success('URL shortened!', { description: response.short_url });
      setUrlInput('');
      onSuccess?.();
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 429 && apiError.retryAfter) {
        setRetryAfterSeconds(apiError.retryAfter);
        toast.error('Rate limit exceeded', {
          description: `Please wait ${apiError.retryAfter} seconds before trying again.`,
        });
      } else {
        toast.error('Failed to shorten URL', {
          description: apiError.message || 'An unexpected error occurred. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-card border border-border rounded-2xl px-3 sm:px-4 py-2 shadow-lg group focus-within:border-muted-foreground/50 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300 gap-2 sm:gap-0">
        <div className="flex items-center flex-1 min-w-0">
          <LinkIcon className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            type="url"
            placeholder="Paste your long URL here..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isDisabled}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm sm:text-base py-2 min-w-0"
          />
        </div>
        <button
          type="submit"
          disabled={isDisabled}
          className="flex items-center justify-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
        >
          {remaining !== null && remaining > 0
            ? `Wait ${remaining}s`
            : loading
            ? 'Shortening...'
            : 'Shorten'}
          {!(remaining !== null && remaining > 0) && !loading && (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
}
