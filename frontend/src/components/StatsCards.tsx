// components/StatsCards.tsx — Total clicks and active links stat cards
import { Loader } from '@/components/Loader';

interface StatsCardsProps {
  totalClicks: number;
  activeLinks: number;
  loading?: boolean;
}

export function StatsCards({ totalClicks, activeLinks, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
          <p className="text-sm text-muted-foreground mb-1">Total Clicks</p>
          <div className="flex items-center h-10">
            <Loader />
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
          <p className="text-sm text-muted-foreground mb-1">Active Links</p>
          <div className="flex items-center h-10">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
        <p className="text-sm text-muted-foreground mb-1">Total Clicks</p>
        <p className="text-2xl sm:text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
          {totalClicks.toLocaleString()}
        </p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
        <p className="text-sm text-muted-foreground mb-1">Active Links</p>
        <p className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
          {activeLinks}
        </p>
      </div>
    </div>
  );
}
