import { Link, useLocation } from 'react-router-dom';
import { getNavForRole } from '../../config/nav';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

export default function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const nav = getNavForRole(user?.role);
  const items = nav.flatMap(s => s.items).slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-line md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14 px-1">
        {items.map(({ path, label, icon: Icon }) => {
          const active = pathname === path || pathname.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 rounded-xl transition-colors',
                active ? 'text-brand' : 'text-ink-muted'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate max-w-[56px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}