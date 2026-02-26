// components/DashboardUrlList.tsx — URL list with sparkline visuals matching dashboard design
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/api/client';
import { Pencil, Archive, Trash2, BarChart2 } from 'lucide-react';
import { Loader } from '@/components/Loader';
import type { UrlItem } from '@/types/api';

interface DashboardUrlListProps {
  urls: UrlItem[];
  selectedAlias: string | null;
  onSelectAlias: (alias: string) => void;
  onEdit: (alias: string, currentUrl: string) => void;
  onArchive: (alias: string, archived: boolean) => void;
  onDelete: (alias: string) => void;
  loading?: boolean;
  activeTab?: 'all' | 'trending' | 'recent' | 'archived';
}

// Format relative time
function formatTimeAgo(index: number): string {
  if (index === 0) return 'Just now';
  if (index === 1) return '2 hours ago';
  if (index === 2) return 'Yesterday';
  return `${index + 1} days ago`;
}

export function DashboardUrlList({ urls, selectedAlias, onSelectAlias, onEdit, onArchive, onDelete, loading, activeTab = 'all' }: DashboardUrlListProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader />
          <span>Loading URLs...</span>
        </div>
      </div>
    );
  }

  if (urls.length === 0) {
    const emptyMessages: Record<string, { title: string; description: string }> = {
      all: {
        title: 'No URLs shortened yet.',
        description: 'Create your first short URL above!'
      },
      trending: {
        title: 'No URLs to show.',
        description: 'Shorten some URLs and get clicks to see trending links!'
      },
      recent: {
        title: 'No recent URLs.',
        description: 'Create your first short URL above!'
      },
      archived: {
        title: 'No archived URLs.',
        description: 'Archive URLs to keep your dashboard organized.'
      }
    };

    const message = emptyMessages[activeTab] || emptyMessages.all;

    return (
      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
          <p>{message.title}</p>
          <p className="text-xs mt-1">{message.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Table header — hidden on mobile, visible on md+ */}
      <div className="hidden md:grid grid-cols-[minmax(200px,1fr)_minmax(250px,1.5fr)_auto_auto] gap-4 px-5 py-3 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">Alias</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">Original URL</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">Actions</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">Clicks (24h)</span>
      </div>

      {/* Rows — card layout on mobile, grid row on md+ */}
      {urls.map((url, index) => (
        <div
          key={url.alias}
          className={cn(
            'transition-colors border-b border-border last:border-b-0',
            // md+ grid layout
            'md:grid md:grid-cols-[minmax(200px,1fr)_minmax(250px,1.5fr)_auto_auto] md:gap-4 md:items-center',
            // mobile stacked layout
            'flex flex-col gap-2 p-4 md:px-5 md:py-4',
            selectedAlias === url.alias
              ? 'bg-muted/60 border-l-2 border-l-primary'
              : 'hover:bg-muted/30',
            url.archived && 'opacity-50'
          )}
        >
          {/* Alias + time */}
          <div className="min-w-0">
            <a 
              href={`${API_BASE_URL}/${url.alias}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-foreground hover:text-primary hover:underline block truncate"
            >
              {API_BASE_URL}/{url.alias}
            </a>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {formatTimeAgo(index)}
              {url.archived && <span className="ml-2 text-xs">(Archived)</span>}
            </p>
          </div>

          {/* Original URL */}
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 md:hidden">Destination</p>
            <a
              href={url.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline truncate block"
            >
              {url.original_url}
            </a>
          </div>

          {/* Mobile: Actions row with click count */}
          <div className="flex items-center justify-between md:contents">
            {/* Actions */}
            <div className="flex items-center justify-start gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAlias(url.alias);
                }}
                className={cn(
                  "p-1.5 hover:bg-muted rounded transition-colors",
                  selectedAlias === url.alias ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                title="View analytics"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(url.alias, url.original_url);
                }}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                title="Edit URL"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(url.alias, !url.archived);
                }}
                className={cn(
                  "p-1.5 hover:bg-muted rounded transition-colors",
                  url.archived ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                title={url.archived ? "Unarchive" : "Archive"}
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(url.alias);
                }}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded transition-colors"
                title="Delete URL"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Click count */}
            <p className="text-sm font-semibold text-foreground min-w-[60px] flex-shrink-0 text-right md:text-left">
              {url.total_clicks.toLocaleString()} <span className="text-xs font-normal text-muted-foreground md:hidden">clicks</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
