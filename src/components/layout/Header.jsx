import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { getNavForRole, titleForPath, subtitleForPath } from '../../config/nav';
import { useAuth } from '../../context/AuthContext';
import GlobalSearch from './GlobalSearch';

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const nav = getNavForRole(user?.role);
  const title = titleForPath(pathname, nav);
  const subtitle = subtitleForPath(pathname, nav);

  const roleLabel = user?.role === 'ops_head' ? 'Operations' : user?.role === 'admin' ? 'Admin' : user?.role === 'coach' ? 'Coach' : user?.role === 'parent' ? 'Parent' : '';
  const canSearch = user?.role === 'admin' || user?.role === 'ops_head';

  return (
    <header className="sticky top-0 z-30 flex-shrink-0 bg-white/96 backdrop-blur-md border-b border-line">
      <div className="flex items-center justify-between h-[52px] md:h-[68px] px-5 md:px-6">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            className="md:hidden p-2 -ml-1 rounded-lg hover:bg-canvas-soft text-ink-muted transition-colors flex-shrink-0"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <h1 className="text-[17px] md:text-xl font-semibold text-ink leading-tight tracking-[-0.025em] truncate">
              {title}
            </h1>
            <p className="text-[11px] md:text-xs text-ink-faint mt-0.5 truncate hidden sm:block">
              {subtitle || `Tennis Academy Management${roleLabel ? ' \u2022 ' + roleLabel : ''}`}
            </p>
          </div>
        </div>
        {canSearch && <GlobalSearch />}
      </div>
    </header>
  );
}