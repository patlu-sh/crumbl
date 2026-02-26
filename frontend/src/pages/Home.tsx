// pages/Home.tsx — Dark landing page with centered branding and URL shortening
import { useNavigate } from 'react-router-dom';
import { Clock, BarChart3, Cookie } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ShortenForm } from '@/components/ShortenForm';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="flex items-center gap-2 text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight mb-3 text-foreground">
          <Cookie className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 flex-shrink-0" strokeWidth={1.5} />
          crumbl
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-12 text-center">
          URLs that crumble into tiny pieces
        </p>

        <ShortenForm 
          onSuccess={() => navigate('/dashboard')}
          className="w-full max-w-2xl mb-8"
        />

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors"
          >
            <Clock className="w-4 h-4" />
            Recent Links
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </div>
      </main>
    </div>
  );
}
