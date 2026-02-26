import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { AnalyticsResponse } from '@/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsChartProps {
  data: AnalyticsResponse | null;
  loading?: boolean;
  error?: string | null;
}

export function AnalyticsChart({ data, loading, error }: AnalyticsChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Analytics</CardTitle>
          <CardDescription className="text-xs">7-day click history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            Loading analytics...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Analytics</CardTitle>
          <CardDescription className="text-xs">7-day click history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-10 text-sm text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Analytics</CardTitle>
          <CardDescription className="text-xs">7-day click history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
            <p>Select a URL to view analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform API response for Chart.js
  const chartData = {
    labels: data.clicks_by_day.map((d) => d.date),
    datasets: [
      {
        label: 'Clicks',
        data: data.clicks_by_day.map((d) => d.clicks),
        borderColor: 'hsl(var(--chart-1))',
        backgroundColor: 'hsl(var(--chart-1) / 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'hsl(var(--chart-1))',
        pointBorderColor: 'hsl(var(--background))',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(var(--card))',
        titleColor: 'hsl(var(--foreground))',
        bodyColor: 'hsl(var(--foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            return context[0].label;
          },
          label: (context: any) => {
            return `${context.parsed.y} click${context.parsed.y !== 1 ? 's' : ''}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'hsl(var(--border) / 0.3)',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(var(--border) / 0.3)',
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          precision: 0,
        },
      },
    },
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Analytics: {data.alias}</CardTitle>
        <CardDescription className="text-xs">7-day click history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
