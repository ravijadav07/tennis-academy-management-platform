import { useMemo, useState } from 'react';
import { useDb } from '../../../context/DbContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import StatusPill from '../../ui/StatusPill';
import Dropdown from '../../ui/Dropdown';
import { toast } from 'sonner';
import { CheckCircle, Clock, MapPin, User } from 'lucide-react';

function getToday() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

export default function Verification() {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);
  const [selected, setSelected] = useState(new Set());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(getToday());
  const [coachFilter, setCoachFilter] = useState('');

  const pending = (state.privateSessions || [])
    .filter((s) => s.status === 'PENDING_VERIFICATION')
    .filter((s) => !dateFrom || s.date >= dateFrom)
    .filter((s) => !dateTo || s.date <= dateTo)
    .filter((s) => !coachFilter || s.coachId === coachFilter)
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

  const byCoach = useMemo(() => {
    const map = {};
    pending.forEach((s) => {
      if (!map[s.coachId]) map[s.coachId] = [];
      map[s.coachId].push(s);
    });
    return Object.entries(map).map(([coachId, sessions]) => {
      const coach = state.coaches.find((c) => c.id === coachId);
      return { coachId, coachName: coach?.name || 'Unknown', sessions, count: sessions.length };
    });
  }, [pending, state.coaches]);

  const toggleAll = (sessions) => {
    const next = new Set(selected);
    const allSelected = sessions.every((s) => next.has(s.id));
    sessions.forEach((s) => allSelected ? next.delete(s.id) : next.add(s.id));
    setSelected(next);
  };

  const handleVerify = async () => {
    if (selected.size === 0) { toast.error('Select sessions to verify'); return; }
    try {
      await db.verifyPrivateSessions({ sessionIds: [...selected], verifiedBy: 'admin' });
      setSelected(new Set());
      toast.success(`Verified ${selected.size} sessions`);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      {/* Header + Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-ink">{pending.length} pending verification</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="h-[34px] px-2.5 rounded-lg border border-line bg-white text-[12px] outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand" placeholder="From" />
          <span className="text-ink-faint text-xs">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="h-[34px] px-2.5 rounded-lg border border-line bg-white text-[12px] outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand" placeholder="To" />
          <Dropdown
            className="w-44 flex-shrink-0"
            value={coachFilter}
            onChange={(v) => setCoachFilter(typeof v === 'object' ? (v.value || v) : v)}
            placeholder="All Coaches"
            options={state.coaches.map((c) => ({ value: c.id, label: c.name }))}
            getOptionLabel={(o) => (o && o.label) || ''}
            getOptionValue={(o) => (o && o.value) || ''}
          />
        </div>
        <Button size="sm" icon={CheckCircle} onClick={handleVerify} disabled={selected.size === 0}>
          Verify Selected ({selected.size})
        </Button>
      </div>

      {pending.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-ink-muted py-6">No sessions pending verification.</p>
        </Card>
      ) : (
        byCoach.map(({ coachId, coachName, sessions, count }) => {
          const courts = state.courts || [];
          return (
            <Card key={coachId}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-ink">{coachName}</h4>
                  <p className="text-[11px] text-ink-faint">{count} session{count !== 1 ? 's' : ''}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleAll(sessions)}>
                  {sessions.every((s) => selected.has(s.id)) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="space-y-1">
                {sessions.map((s) => {
                  const courtName = (courts.find((c) => c.id === s.courtId) || {}).name || '';
                  return (
                    <label key={s.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-canvas-soft text-xs cursor-pointer hover:bg-canvas-soft/50 transition-colors">
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => {
                        const next = new Set(selected);
                        if (selected.has(s.id)) {
                          next.delete(s.id);
                        } else {
                          next.add(s.id);
                        }
                        setSelected(next);
                      }} className="rounded" />
                      <User className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                      <span className="font-semibold text-ink flex-1 truncate">{s.clientName || s.studentName || 'Unnamed'}</span>
                      <span className="text-ink-muted flex-shrink-0">{s.date}</span>
                      <span className="text-ink-muted flex-shrink-0"><Clock className="w-3 h-3 inline mr-0.5" />{s.startTime} - {s.endTime}</span>
                      {courtName && <span className="text-ink-faint flex-shrink-0"><MapPin className="w-3 h-3 inline mr-0.5" />{courtName}</span>}
                      <StatusPill status="pending" />
                    </label>
                  );
                })}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}