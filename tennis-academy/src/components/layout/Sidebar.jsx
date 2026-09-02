import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, PanelLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNavForRole, resolveChildRoute } from '../../config/nav';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

function getActivePath(pathname, nav) {
  // Child/detail route check first — always wins
  const child = resolveChildRoute(pathname);
  if (child) return child.parent;

  // Longest-prefix match from nav items
  let best = null;
  for (const section of nav) {
    for (const item of section.items) {
      if (pathname === item.path || pathname.startsWith(item.path + '/')) {
        if (!best || item.path.length > best.length) best = item.path;
      }
    }
  }
  return best;
}

function isItemActive(activePath, itemPath) {
  return activePath === itemPath;
}

function NavItem({ path, label, icon: Icon, active, collapsed, onClick }) {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={cn(
        'flex items-center gap-[11px] h-10 rounded-[10px] text-[13px] font-medium transition-colors duration-150',
        collapsed ? 'px-0 justify-center w-10' : 'px-3',
        active
          ? 'bg-brand-50 text-brand-600 shadow-[inset_2px_0_0_var(--color-brand)]'
          : 'text-ink-muted hover:bg-[#F7F7FB] hover:text-ink'
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = getNavForRole(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = user?.role === 'ops_head' ? 'Operations' : user?.role === 'admin' ? 'Admin' : user?.role === 'coach' ? 'Coach' : user?.role === 'parent' ? 'Parent' : '';

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onMobileClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen, onMobileClose]);

  const activePath = getActivePath(pathname, nav);

  const sidebarContent = (isMobile) => (
    <aside className={cn(
      'flex-shrink-0 h-full bg-white border-r border-line flex flex-col transition-all duration-200',
      !isMobile && (collapsed ? 'w-16' : 'w-[240px]'),
      isMobile && 'w-[280px]'
    )}>
      {isMobile && (
        <div className="flex items-center justify-between px-4 h-16 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-brand-50 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-600 text-[11px] font-bold tracking-tight">AJ</span>
            </div>
            <span className="text-[14px] font-semibold text-ink tracking-[-0.01em]">Tennis Academy</span>
          </div>
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg hover:bg-canvas-soft text-ink-muted transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      {!isMobile && (
        <div className={cn(
          'flex items-center border-b border-line h-16 flex-shrink-0',
          collapsed ? 'px-0 justify-center' : 'px-4 gap-2.5'
        )}>
          <div className="w-[30px] h-[30px] rounded-[9px] bg-brand-50 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-600 text-[11px] font-bold tracking-tight">AJ</span>
          </div>
          {!collapsed && (
            <span className="text-[14px] font-semibold text-ink tracking-[-0.01em]">Tennis Academy</span>
          )}
        </div>
      )}

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2">
        {nav.map((section) => (
          <div key={section.section} className="mb-1">
            {(!isMobile || !collapsed) && !(isMobile && collapsed) && !collapsed && (
              <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#9AA0B2] px-3 mt-5 mb-[7px]">
                {section.section}
              </p>
            )}
            <div className="px-3 space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.path}
                  {...item}
                  active={isItemActive(activePath, item.path)}
                  collapsed={false}
                  onClick={isMobile ? onMobileClose : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 border-t border-line px-2.5 py-2.5">
        {/* User Profile */}
        <div className={cn(
          'flex items-center gap-2.5 px-2 py-2 mb-1.5 rounded-[10px]',
          collapsed ? 'justify-center' : ''
        )}>
          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-600 text-[11px] font-bold">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-ink-faint truncate leading-tight">{roleLabel}</p>
            </div>
          )}
        </div>

        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              'flex items-center gap-[11px] rounded-[9px] text-[13px] font-medium text-ink-muted hover:bg-[#F7F7FB] hover:text-ink transition-colors duration-150 w-full mb-1',
              collapsed ? 'h-10 justify-center' : 'h-[38px] px-3'
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft className={cn('w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200', collapsed && 'rotate-180')} />
            {!collapsed && 'Collapse'}
          </button>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-[11px] rounded-[9px] text-[13px] font-medium text-ink-muted hover:bg-[#F7F7FB] hover:text-err transition-colors duration-150 w-full',
            (!isMobile && collapsed) ? 'h-10 justify-center' : 'h-[38px] px-3'
          )}
          title={(!isMobile && collapsed) ? 'Logout' : undefined}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!(isMobile ? false : collapsed) && 'Logout'}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block">
        {sidebarContent(false)}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[200] md:hidden">
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
            />
            <motion.div
              className="absolute left-0 top-0 h-full z-[201]"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {sidebarContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}