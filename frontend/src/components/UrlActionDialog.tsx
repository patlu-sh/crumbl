// components/UrlActionDialog.tsx — Shared dialog for edit, delete, and archive URL actions
import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Archive, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { UrlItem } from '@/types/api';

export type UrlAction = 'edit' | 'delete' | 'archive';

interface UrlActionDialogProps {
  open: boolean;
  action: UrlAction | null;
  url: UrlItem | null;
  onConfirm: (action: UrlAction, alias: string, value?: string) => void;
  onClose: () => void;
}

const actionConfig = {
  edit: {
    icon: Pencil,
    title: 'Edit URL',
    description: 'Update the destination for this short link.',
    confirmLabel: 'Save Changes',
    confirmVariant: 'default' as const,
  },
  delete: {
    icon: Trash2,
    title: 'Delete URL',
    description: 'This will permanently delete the short link and all its click data. This action cannot be undone.',
    confirmLabel: 'Delete',
    confirmVariant: 'destructive' as const,
  },
  archive: {
    icon: Archive,
    title: (archived: boolean) => archived ? 'Unarchive URL' : 'Archive URL',
    description: (archived: boolean) => archived
      ? 'This will restore the short link to your active links.'
      : 'This will hide the link from your main list. You can restore it later.',
    confirmLabel: (archived: boolean) => archived ? 'Unarchive' : 'Archive',
    confirmVariant: 'outline' as const,
  },
};

export function UrlActionDialog({ open, action, url, onConfirm, onClose }: UrlActionDialogProps) {
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && action === 'edit' && url) {
      setEditValue(url.original_url);
      setTimeout(() => inputRef.current?.select(), 50);
    }
    if (!open) {
      setLoading(false);
      setEditValue('');
    }
  }, [open, action, url]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !action || !url) return null;

  const isArchiveAction = action === 'archive';
  const config = isArchiveAction ? null : actionConfig[action];
  const archiveConfig = isArchiveAction ? actionConfig.archive : null;

  const title = isArchiveAction
    ? archiveConfig!.title(url.archived)
    : config!.title as string;

  const description = isArchiveAction
    ? archiveConfig!.description(url.archived)
    : config!.description as string;

  const confirmLabel = isArchiveAction
    ? archiveConfig!.confirmLabel(url.archived)
    : config!.confirmLabel as string;

  const confirmVariant = isArchiveAction
    ? archiveConfig!.confirmVariant
    : config!.confirmVariant;

  const IconComponent = isArchiveAction
    ? Archive
    : actionConfig[action].icon;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(action, url.alias, action === 'edit' ? editValue : undefined);
    } finally {
      setLoading(false);
    }
  };

  const isEditInvalid = action === 'edit' && (!editValue.trim() || editValue === url.original_url);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center",
                action === 'delete' ? "bg-destructive/10" : "bg-muted"
              )}>
                <IconComponent className={cn(
                  "w-4 h-4",
                  action === 'delete' ? "text-destructive" : "text-muted-foreground"
                )} />
              </div>
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alias label */}
          <p className="text-xs text-muted-foreground mb-3 font-mono bg-muted/50 rounded-lg px-3 py-2 truncate">
            {url.alias}
          </p>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-5">{description}</p>

          {/* Edit input */}
          {action === 'edit' && (
            <div className="mb-5">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Destination URL
              </label>
              <Input
                ref={inputRef}
                type="url"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => e.key === 'Enter' && !isEditInvalid && handleConfirm()}
                className="h-9 text-sm"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="default" className="text-sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={confirmVariant}
              size="default"
              className="text-sm"
              onClick={handleConfirm}
              disabled={loading || isEditInvalid}
            >
              {loading ? 'Please wait...' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
