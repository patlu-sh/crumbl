// components/Navbar.tsx — Shared pill-style navigation bar
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';

  return (
    <nav className="flex justify-center pt-6 pb-2">
      <div className="flex items-center bg-card border border-border rounded-full px-1 py-1">
        <button
          onClick={() => navigate('/')}
          className={cn(
            'px-5 py-2 rounded-full text-sm transition-colors cursor-pointer',
            isHome
              ? 'bg-foreground text-background font-medium'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Home
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className={cn(
            'px-5 py-2 rounded-full text-sm transition-colors cursor-pointer',
            isDashboard
              ? 'bg-foreground text-background font-medium'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Dashboard
        </button>
      </div>
    </nav>
  );
}
