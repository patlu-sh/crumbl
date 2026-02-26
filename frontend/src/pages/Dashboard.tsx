// pages/Dashboard.tsx — Dark-themed dashboard with stats, URL list, and analytics panel
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { RefreshCw, LayoutList, TrendingUp, Clock, Archive } from 'lucide-react';
import { api } from '@/api/client';
import type { UrlItem, AnalyticsResponse, ApiError } from '@/types/api';
import { Navbar } from '@/components/Navbar';
import { ShortenForm } from '@/components/ShortenForm';
import { DashboardUrlList } from '@/components/DashboardUrlList';
import { DashboardAnalytics } from '@/components/DashboardAnalytics';
import { StatsCards } from '@/components/StatsCards';
import { Loader } from '@/components/Loader';
import { UrlActionDialog } from '@/components/UrlActionDialog';
import type { UrlAction } from '@/components/UrlActionDialog';

export function Dashboard() {

  // URLs state
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [urlsLoading, setUrlsLoading] = useState(true);

  // Analytics state
  const [selectedAlias, setSelectedAlias] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Filter tab
  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'recent' | 'archived'>('all');

  // Action dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<UrlAction | null>(null);
  const [dialogUrl, setDialogUrl] = useState<UrlItem | null>(null);

  useEffect(() => {
    fetchUrls();
  }, []);

  useEffect(() => {
    if (selectedAlias) {
      fetchAnalytics(selectedAlias);
    } else {
      setAnalyticsData(null);
      setAnalyticsError(null);
    }
  }, [selectedAlias]);

  const fetchUrls = async () => {
    setUrlsLoading(true);
    try {
      const data = await api.getUrls();
      setUrls(data);
      // Auto-select first URL if none selected
      if (data.length > 0 && !selectedAlias) {
        setSelectedAlias(data[0].alias);
      }
    } catch (err) {
      const apiError = err as ApiError;
      toast.error(apiError.message || 'Failed to load URLs');
    } finally {
      setUrlsLoading(false);
    }
  };

  const fetchAnalytics = async (alias: string) => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await api.getAnalytics(alias);
      setAnalyticsData(data);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMsg = apiError.message || 'Failed to load analytics';
      setAnalyticsError(errorMsg);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleUrlShortened = () => {
    fetchUrls();
  };

  const handleSelectAlias = (alias: string) => {
    setSelectedAlias(alias);
  };

  const handleEdit = (alias: string, _currentUrl: string) => {
    const url = urls.find(u => u.alias === alias) ?? null;
    setDialogUrl(url);
    setDialogAction('edit');
    setDialogOpen(true);
  };

  const handleArchive = (alias: string, _archived: boolean) => {
    const url = urls.find(u => u.alias === alias) ?? null;
    setDialogUrl(url);
    setDialogAction('archive');
    setDialogOpen(true);
  };

  const handleDelete = (alias: string) => {
    const url = urls.find(u => u.alias === alias) ?? null;
    setDialogUrl(url);
    setDialogAction('delete');
    setDialogOpen(true);
  };

  const handleDialogConfirm = async (action: UrlAction, alias: string, value?: string) => {
    try {
      if (action === 'edit' && value) {
        await api.updateUrl(alias, value);
        toast.success('URL updated successfully');
      } else if (action === 'delete') {
        await api.deleteUrl(alias);
        toast.success('URL deleted successfully');
        if (selectedAlias === alias) setSelectedAlias(null);
      } else if (action === 'archive') {
        const url = urls.find(u => u.alias === alias);
        const archived = !url?.archived;
        await api.archiveUrl(alias, archived);
        toast.success(archived ? 'URL archived' : 'URL unarchived');
      }
      setDialogOpen(false);
      fetchUrls();
    } catch (err) {
      const apiError = err as ApiError;
      toast.error(apiError.message || 'Action failed');
      throw err; // re-throw so dialog resets loading state
    }
  };

  // Compute stats with useMemo
  const totalClicks = useMemo(() => urls.reduce((sum, u) => sum + u.total_clicks, 0), [urls]);
  const activeLinks = useMemo(() => urls.length, [urls]);

  // Filter URLs based on active tab with useMemo
  const filteredUrls = useMemo(() => {
    switch (activeTab) {
      case 'trending':
        return [...urls].sort((a, b) => b.total_clicks - a.total_clicks);
      case 'recent':
        return urls; // Already sorted by created_at DESC from backend
      case 'archived':
        return urls.filter(u => u.archived);
      case 'all':
      default:
        return urls;
    }
  }, [urls, activeTab]);

  const handleRefresh = () => {
    fetchUrls();
    if (selectedAlias) {
      fetchAnalytics(selectedAlias);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Dashboard</h2>
          <button
            onClick={handleRefresh}
            disabled={urlsLoading || analyticsLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {urlsLoading || analyticsLoading ? (
              <Loader />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <StatsCards totalClicks={totalClicks} activeLinks={activeLinks} loading={urlsLoading} />

            <ShortenForm onSuccess={handleUrlShortened} />

            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
              {(['all', 'trending', 'recent', 'archived'] as const).map((tab) => {
                const labels: Record<typeof tab, string> = {
                  all: 'All Links',
                  trending: 'Trending',
                  recent: 'Recent',
                  archived: 'Archived',
                };
                const icons: Record<typeof tab, React.ReactNode> = {
                  all: <LayoutList className="w-4 h-4" />,
                  trending: <TrendingUp className="w-4 h-4" />,
                  recent: <Clock className="w-4 h-4" />,
                  archived: <Archive className="w-4 h-4" />,
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {icons[tab]}
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            <DashboardUrlList
              urls={filteredUrls}
              selectedAlias={selectedAlias}
              onSelectAlias={handleSelectAlias}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onDelete={handleDelete}
              loading={urlsLoading}
              activeTab={activeTab}
            />
          </div>

          <div className="lg:sticky lg:top-4 lg:self-start">
            <DashboardAnalytics
              data={analyticsData}
              loading={analyticsLoading}
              error={analyticsError}
              selectedAlias={selectedAlias}
            />
          </div>
        </div>
      </div>
    </div>

      <UrlActionDialog
        open={dialogOpen}
        action={dialogAction}
        url={dialogUrl}
        onConfirm={handleDialogConfirm}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}
