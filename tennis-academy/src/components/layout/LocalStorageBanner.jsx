import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LocalStorageBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('ata.banner.dismissed') === '1');
  if (!user || (user.role !== 'admin' && user.role !== 'ops_head') || dismissed) return null;

  return (
    <div className="fixed bottom-14 right-0 z-[45] pointer-events-auto" style={{ paddingRight: 'calc(env(safe-area-inset-right, 0px) + 14px)' }}>
      <div className="flex items-start gap-3 px-3 py-2 bg-warn-bg border border-warn/20 rounded-lg shadow-soft text-[11px] text-warn max-w-sm">
        <div>
          <p className="font-semibold mb-1">Local-first phase — two known limitations:</p>
          <p className="mb-0.5">1. Attendance data is stored in this browser. Simultaneous attendance marking from multiple devices is not supported and may result in conflicting data. Multi-device concurrency requires the backend phase.</p>
          <p>2. Automatic unattended email dispatch is not available. Reports must be manually verified and sent through the Send Now action.</p>
        </div>
        <button onClick={() => { setDismissed(true); localStorage.setItem('ata.banner.dismissed', '1'); }}
          className="p-0.5 rounded hover:bg-warn/10 flex-shrink-0"><X className="w-3 h-3" /></button>
      </div>
    </div>
  );
}