import { useState } from 'react';
import { useSchedule } from '../../../hooks/useSchedule';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Button from '../../ui/Button';
import { Clock, User, Plus, Calendar } from 'lucide-react';
import CapacityIndicator from '../../ui/CapacityIndicator';
import { formatTime12h, getTodayPattern, getBatchDisplayName } from '../../../utils/formatters';

const PATTERNS = ['MWF', 'TTS', 'SAT_SUN'];

export default function AdminSchedule() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const todayPattern = getTodayPattern();
  const [pattern, setPattern] = useState(tabFromUrl && PATTERNS.includes(tabFromUrl) ? tabFromUrl : todayPattern);
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
      <div className="flex flex-wrap gap-2 items-center">
        {PATTERNS.map((p) => {
          const isToday = p === todayPattern;
          return (
            <button
              key={p}
              onClick={() => setPattern(p)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                p === pattern
                  ? 'bg-brand-50 text-brand-600 border border-brand/20 shadow-sm'
                  : 'text-ink-muted hover:bg-canvas-soft border border-transparent'
              }`}
            >
              <span>{p === 'SAT_SUN' ? 'Sat & Sun' : p}</span>
              {isToday && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-brand text-white rounded-full uppercase tracking-wider">
                  Today
                </span>
              )}
            </button>
          );
        })}
        <span className="sm:ml-auto text-xs text-ink-muted self-center">
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
                    className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg bg-[#F5F3FF] border border-brand/10 text-xs">
                    <span className="font-semibold text-brand-600 min-w-[70px]">Private Coaching</span>
                    <span className="text-ink-muted"><Clock className="w-3 h-3 inline mr-1" />{formatTime12h(b.startTime)} - {formatTime12h(b.endTime)}</span>
                    <span className="text-ink-muted"><User className="w-3 h-3 inline mr-1" />{b.clientName}</span>
                    <span className="text-ink-muted">Coach: {b.coachName}</span>
                    <StatusPill status="confirmed" />
                  </div>
                );
              }
              return (
                <div key={b.id} onClick={() => goToBatch(b.id)}
                  className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 py-2 rounded-lg bg-canvas-soft hover:bg-canvas-soft/70 cursor-pointer transition-colors text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink">{b.name || getBatchDisplayName(b, [court])}</span>
                    <span className="text-ink-muted"><Clock className="w-3 h-3 inline mr-1" />{formatTime12h(b.startTime)} - {formatTime12h(b.endTime)}</span>
                    {b.isSemiBatch && <StatusPill status="semi-batch" />}
                    {b.blockedCount > 0 && <span className="text-[10px] text-err font-medium">{b.blockedCount} unpaid</span>}
                    {b.supportCoachId && <span className="text-[10px] text-ink-faint">+support</span>}
                  </div>
                  <CapacityIndicator filled={b.filled} total={b.capacity} />
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}