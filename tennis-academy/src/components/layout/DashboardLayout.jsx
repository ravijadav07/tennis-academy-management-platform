import { Outlet, useLocation } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleMobile = useCallback(() => setMobileOpen(o => !o), []);
  const toggleCollapsed = useCallback(() => setCollapsed(c => !c), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />
      <div className="flex-1 flex flex-col min-w-0 w-0">
        <Header
          onMenuClick={toggleMobile}
        />
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-7 lg:px-8 py-5 sm:py-6 md:py-7 pb-8 sm:pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}