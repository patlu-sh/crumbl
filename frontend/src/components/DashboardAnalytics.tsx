// components/DashboardAnalytics.tsx — Right-side analytics panel matching dashboard design
import { useEffect, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Link2 } from 'lucide-react';
import { API_BASE_URL } from '@/api/client';
import { Loader } from '@/components/Loader';
import type { AnalyticsResponse } from '@/types/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface DashboardAnalyticsProps {
  data: AnalyticsResponse | null;
  loading?: boolean;
  error?: string | null;
  selectedAlias?: string | null;
}

export function DashboardAnalytics({ data, loading, error, selectedAlias }: DashboardAnalyticsProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Compute total clicks over 7 days with useMemo (must be before conditional returns)
  const totalClicks7d = useMemo(() => 
    data ? data.clicks_by_day.reduce((sum, d) => sum + d.clicks, 0) : 0,
    [data]
  );

  // Calculate percentage change (compare avg daily clicks: last 3 days vs first 3 days)
  const percentageChange = useMemo(() => {
    if (!data || data.clicks_by_day.length < 7) return null;
    
    // Average daily clicks for first 3 days
    const firstThreeDays = data.clicks_by_day.slice(0, 3);
    const avgFirst = firstThreeDays.reduce((sum, d) => sum + d.clicks, 0) / 3;
    
    // Average daily clicks for last 3 days
    const lastThreeDays = data.clicks_by_day.slice(4, 7);
    const avgLast = lastThreeDays.reduce((sum, d) => sum + d.clicks, 0) / 3;
    
    if (avgFirst === 0) return avgLast > 0 ? 100 : 0;
    
    return Math.round(((avgLast - avgFirst) / avgFirst) * 100);
  }, [data]);

  // Day labels (Mon, Tue, etc.) with useMemo (must be before conditional returns)
  const dayLabels = useMemo(() => 
    data ? data.clicks_by_day.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }) : [],
    [data]
  );

  const chartData = useMemo(() => ({
    labels: dayLabels,
    datasets: [
      {
        data: data ? data.clicks_by_day.map((d) => d.clicks) : [],
        borderColor: 'hsl(0 0% 95%)',
        backgroundColor: 'hsla(0, 0%, 95%, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  }), [data, dayLabels]);

  // Empty state
  if (!selectedAlias && !loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="flex flex-col items-center justify-center text-sm text-muted-foreground h-[400px]">
          <p className="text-base">Select a link to view analytics</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader />
            <span>Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="flex items-center justify-center text-sm text-destructive h-[400px]">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'hsl(0 0% 15%)',
        titleColor: 'hsl(0 0% 95%)',
        bodyColor: 'hsl(0 0% 95%)',
        padding: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.parsed.y} clicks`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'hsl(0 0% 55%)', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        display: false,
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{API_BASE_URL}/{data.alias}</p>
              <p className="text-xs text-muted-foreground">
                Created {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-1">Last 7 Days</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {totalClicks7d.toLocaleString()}
            </span>
            {percentageChange !== null && percentageChange !== 0 && (
              <span className={`text-sm font-medium flex items-center gap-0.5 ${
                percentageChange > 0 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {percentageChange > 0 ? '▲' : '▼'} {Math.abs(percentageChange)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="h-[160px] sm:h-[180px]">
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}
