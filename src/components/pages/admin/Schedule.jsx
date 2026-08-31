import { useState } from 'react';
import { useSchedule } from '../../../hooks/useSchedule';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Button from '../../ui/Button';
import { Clock, User, Plus } from 'lucide-react';

const PATTERNS = ['MWF', 'TTS', 'WEEKEND'];

export default function AdminSchedule() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [pattern, setPattern] = useState(tabFromUrl && PATTERNS.includes(tabFromUrl) ? tabFromUrl : 'MWF');
  const { byCourt, total, privateCount } = useSchedule(pattern);
  const navigate = useNavigate();

  const goToBatch = (batchId) => {
    navigate('/admin/batches/' + batchId, { state: { from: '/admin/schedule?tab=' + pattern } });
  };

  const addBatchAtCell = (courtId) => {
    navigate('/admin/batches/new', { state: { from: '/admin/schedule?tab=' + pattern, prefill: { courtId: courtId || '', dayPattern: pattern } } });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        {PATTERNS.map((p) => (
          <button key={p} onClick={() => setPattern(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${p === pattern ? 'bg-brand-50 text-brand-600' : 'text-ink-muted hover:bg-canvas-soft'}`}
          >{p === 'WEEKEND' ? 'Sat-Sun' : p}</button>
        ))}
        <span className="ml-auto text-xs text-ink-muted self-center">
          {total} batches{privateCount > 0 ? ` · ${privateCount} private` : ''}
        </span>
        <Button size="sm" icon={Plus} onClick={() => addBatchAtCell('')}>Add Batch</Button>
      </div>

      {byCourt.map(({ court, batches }) => (
        <Card key={court?.id || 'unknown'}>
          <h3 className="text-sm font-semibold text-ink mb-3">{court?.name || 'Unknown Court'}</h3>
          <div className="space-y-2">
            {batches.map((b) => {
              if (b._type === 'private') {
                return (
                  <div key={b.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#F5F3FF] border border-brand/10 text-xs">
                    <span className="font-semibold text-brand-600 min-w-[80px]">Private</span>
                    <span className="text-ink-muted"><Clock className="w-3 h-3 inline mr-1" />{b.startTime} - {b.endTime}</span>
                    <span className="text-ink-muted"><User className="w-3 h-3 inline mr-1" />{b.clientName}</span>
                    <span className="text-ink-muted">Coach: {b.coachName}</span>
                    <StatusPill status="confirmed" />
                  </div>
                );
              }
              return (
                <div key={b.id} onClick={() => goToBatch(b.id)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-canvas-soft hover:bg-canvas-soft/70 cursor-pointer transition-colors text-xs">
                  <span className="font-semibold text-ink min-w-[80px]">{b.program}</span>
                  <span className="text-ink-muted"><Clock className="w-3 h-3 inline mr-1" />{b.startTime} - {b.endTime}</span>
                  <span className="text-ink-muted">{b.filled}/{b.capacity}</span>
                  <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${b.capacity > 0 ? Math.round((b.filled / b.capacity) * 100) : 0}%` }} />
                  </div>
                  {b.isSemiBatch && <StatusPill status="semi-batch" />}
                  {b.blockedCount > 0 && <span className="text-[10px] text-err font-medium">{b.blockedCount} unpaid</span>}
                  {b.supportCoachId && <span className="text-[10px] text-ink-faint">+support</span>}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}