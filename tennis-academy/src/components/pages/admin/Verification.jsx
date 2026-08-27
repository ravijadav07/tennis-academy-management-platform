import { useMemo, useState } from 'react';
import { useDb } from '../../../context/DbContext';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import StatusPill from '../../ui/StatusPill';
import Dropdown from '../../ui/Dropdown';
import StatCard from '../../ui/StatCard';
import { toast } from 'sonner';
import { CheckCircle, Undo2, Clock, MapPin, User, Search, Filter, Layers, CheckSquare, Calendar } from 'lucide-react';

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Verification() {
  const { db, tick } = useDb();
  const state = useMemo(() => db.readAll(), [db, tick]);

  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING' | 'COMPLETED' | 'ALL'
  const [selected, setSelected] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [coachFilter, setCoachFilter] = useState('');
  const [processingIds, setProcessingIds] = useState(new Set());

  const courts = state.courts || [];
  const coaches = state.coaches || [];
  const allSessions = state.privateSessions || [];

  // Compute stats across all private sessions
  const pendingCount = useMemo(() => allSessions.filter((s) => s.status === 'PENDING_VERIFICATION').length, [allSessions]);
  const verifiedCount = useMemo(() => allSessions.filter((s) => s.status === 'COMPLETED').length, [allSessions]);
  const totalCount = allSessions.length;

  // Filter sessions based on tab, date, coach, and search query
  const filteredSessions = useMemo(() => {
    return allSessions
      .filter((s) => {
        if (activeTab === 'PENDING') return s.status === 'PENDING_VERIFICATION';
        if (activeTab === 'COMPLETED') return s.status === 'COMPLETED';
        return true; // 'ALL'
      })
      .filter((s) => !dateFrom || s.date >= dateFrom)
      .filter((s) => !dateTo || s.date <= dateTo)
      .filter((s) => !coachFilter || s.coachId === coachFilter)
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const client = (s.clientName || s.studentName || '').toLowerCase();
        const coach = (coaches.find((c) => c.id === s.coachId)?.name || '').toLowerCase();
        return client.includes(q) || coach.includes(q);
      })
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime) || a.id.localeCompare(b.id));
  }, [allSessions, activeTab, dateFrom, dateTo, coachFilter, searchQuery, coaches]);

  // Stable grouping by coach: maintain consistent coach order from state.coaches
  const byCoach = useMemo(() => {
    const coachMap = new Map();

    // Initialize all coaches to keep stable ordering
    coaches.forEach((c) => {
      coachMap.set(c.id, {
        coachId: c.id,
        coachName: c.name,
        designation: c.designation || 'Tennis Coach',
        rate1on1: c.rate1on1PerHour || 0,
        sessions: [],
      });
    });

    // Populate sessions
    filteredSessions.forEach((s) => {
      if (!coachMap.has(s.coachId)) {
        coachMap.set(s.coachId, {
          coachId: s.coachId,
          coachName: 'Unknown Coach',
          designation: '',
          rate1on1: 0,
          sessions: [],
        });
      }
      coachMap.get(s.coachId).sessions.push(s);
    });

    // Return only coaches that have sessions in the filtered view
    return Array.from(coachMap.values())
      .filter((group) => group.sessions.length > 0)
      .map((group) => ({
        ...group,
        pendingCount: group.sessions.filter((s) => s.status === 'PENDING_VERIFICATION').length,
        completedCount: group.sessions.filter((s) => s.status === 'COMPLETED').length,
        count: group.sessions.length,
      }));
  }, [coaches, filteredSessions]);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const toggleAllInCoach = (sessions) => {
    const next = new Set(selected);
    const allSelected = sessions.every((s) => next.has(s.id));
    sessions.forEach((s) => (allSelected ? next.delete(s.id) : next.add(s.id)));
    setSelected(next);
  };

  const toggleSelectAll = () => {
    const next = new Set(selected);
    const allSelected = filteredSessions.length > 0 && filteredSessions.every((s) => next.has(s.id));
    if (allSelected) {
      filteredSessions.forEach((s) => next.delete(s.id));
    } else {
      filteredSessions.forEach((s) => next.add(s.id));
    }
    setSelected(next);
  };

  const handleVerifySingle = async (sessionId) => {
    setProcessingIds((prev) => new Set(prev).add(sessionId));
    try {
      await db.verifyPrivateSessions({ sessionIds: [sessionId], userId: 'user_admin' });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
      toast.success('Session verified');
    } catch (e) {
      toast.error(e.message || 'Verification failed');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const handleUnverifySingle = async (sessionId) => {
    setProcessingIds((prev) => new Set(prev).add(sessionId));
    try {
      if (db.unverifyPrivateSessions) {
        await db.unverifyPrivateSessions({ sessionIds: [sessionId] });
      }
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
      toast.success('Verification reverted to pending');
    } catch (e) {
      toast.error(e.message || 'Revert failed');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const handleVerifySelected = async () => {
    if (selected.size === 0) {
      toast.error('Select sessions to verify');
      return;
    }
    const sessionIds = [...selected];
    setProcessingIds(new Set(sessionIds));
    try {
      await db.verifyPrivateSessions({ sessionIds, userId: 'user_admin' });
      setSelected(new Set());
      toast.success(`Verified ${sessionIds.length} session${sessionIds.length > 1 ? 's' : ''}`);
    } catch (e) {
      toast.error(e.message || 'Verification failed');
    } finally {
      setProcessingIds(new Set());
    }
  };

  const handleUnverifySelected = async () => {
    if (selected.size === 0) {
      toast.error('Select sessions to unverify');
      return;
    }
    const sessionIds = [...selected];
    setProcessingIds(new Set(sessionIds));
    try {
      if (db.unverifyPrivateSessions) {
        await db.unverifyPrivateSessions({ sessionIds });
      }
      setSelected(new Set());
      toast.success(`Reverted ${sessionIds.length} session${sessionIds.length > 1 ? 's' : ''} to pending`);
    } catch (e) {
      toast.error(e.message || 'Revert failed');
    } finally {
      setProcessingIds(new Set());
    }
  };

  const handleVerifyCoachPending = async (sessions) => {
    const pendingCoachIds = sessions.filter((s) => s.status === 'PENDING_VERIFICATION').map((s) => s.id);
    if (pendingCoachIds.length === 0) return;
    setProcessingIds(new Set(pendingCoachIds));
    try {
      await db.verifyPrivateSessions({ sessionIds: pendingCoachIds, userId: 'user_admin' });
      setSelected((prev) => {
        const next = new Set(prev);
        pendingCoachIds.forEach((id) => next.delete(id));
        return next;
      });
      toast.success(`Verified ${pendingCoachIds.length} session${pendingCoachIds.length > 1 ? 's' : ''}`);
    } catch (e) {
      toast.error(e.message || 'Verification failed');
    } finally {
      setProcessingIds(new Set());
    }
  };

  const selectedPendingCount = useMemo(() => {
    return allSessions.filter((s) => selected.has(s.id) && s.status === 'PENDING_VERIFICATION').length;
  }, [allSessions, selected]);

  const selectedCompletedCount = useMemo(() => {
    return allSessions.filter((s) => selected.has(s.id) && s.status === 'COMPLETED').length;
  }, [allSessions, selected]);

  return (
    <div className="space-y-4">
      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={Layers}
          label="Total Private Sessions"
          value={totalCount}
        />
        <StatCard
          icon={Clock}
          label="Pending Verification"
          value={pendingCount}
          color="warn"
        />
        <StatCard
          icon={CheckCircle}
          label="Verified Sessions"
          value={verifiedCount}
          color="ok"
        />
      </div>

      {/* Tabs & Controls */}
      <Card className="p-3">
        <div className="flex flex-col gap-3">
          {/* Status Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-line">
            <div className="flex items-center gap-1.5 p-1 bg-canvas-soft rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('PENDING')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'PENDING'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Pending Verification ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('COMPLETED')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'COMPLETED'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Verified ({verifiedCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                All Sessions ({totalCount})
              </button>
            </div>

            {/* Batch Action Buttons */}
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <>
                  {selectedPendingCount > 0 && (
                    <Button size="sm" icon={CheckCircle} onClick={handleVerifySelected}>
                      Verify Selected ({selectedPendingCount})
                    </Button>
                  )}
                  {selectedCompletedCount > 0 && (
                    <Button size="sm" variant="secondary" icon={Undo2} onClick={handleUnverifySelected}>
                      Revert Selected ({selectedCompletedCount})
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2.5">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or coach..."
                  className="w-full pl-8 pr-3 h-[32px] rounded-lg border border-line bg-white text-xs outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                />
              </div>

              {/* Coach Dropdown */}
              <Dropdown
                className="w-44 flex-shrink-0"
                value={coachFilter}
                onChange={(v) => setCoachFilter(typeof v === 'object' ? v.value || v : v)}
                placeholder="All Coaches"
                options={coaches.map((c) => ({ value: c.id, label: c.name }))}
                getOptionLabel={(o) => (o && o.label) || ''}
                getOptionValue={(o) => (o && o.value) || ''}
              />

              {/* Date Filters */}
              <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-[32px] px-2 rounded-lg border border-line bg-white text-[11px] outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                  placeholder="From"
                />
                <span className="text-ink-faint">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-[32px] px-2 rounded-lg border border-line bg-white text-[11px] outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                  placeholder="To"
                />
                {(dateFrom || dateTo || coachFilter || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!h-[32px] !px-2 text-xs text-brand"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      setCoachFilter('');
                      setSearchQuery('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Select / Deselect All for Filtered List */}
            {filteredSessions.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-xs">
                {filteredSessions.every((s) => selected.has(s.id)) ? 'Deselect All Filtered' : 'Select All Filtered'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Session Groups by Coach */}
      {filteredSessions.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-sm font-medium text-ink">No private sessions found</p>
            <p className="text-xs text-ink-muted mt-1">
              {activeTab === 'PENDING'
                ? 'All private sessions are currently verified!'
                : 'Try adjusting your filters or date range.'}
            </p>
          </div>
        </Card>
      ) : (
        byCoach.map(({ coachId, coachName, designation, sessions, count, pendingCount: groupPending, completedCount: groupCompleted }) => {
          const allCoachSelected = sessions.every((s) => selected.has(s.id));
          return (
            <Card key={coachId} className="transition-all">
              {/* Coach Group Header */}
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-line flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-ink">{coachName}</h4>
                    {designation && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-canvas-soft text-ink-muted">
                        {designation}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {count} total session{count !== 1 ? 's' : ''}
                    {groupPending > 0 && <span className="text-warn font-semibold"> · {groupPending} pending</span>}
                    {groupCompleted > 0 && <span className="text-ok"> · {groupCompleted} verified</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {groupPending > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => handleVerifyCoachPending(sessions)}
                      className="!h-[28px] !text-[11px]"
                    >
                      Verify All ({groupPending})
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAllInCoach(sessions)}
                    className="!h-[28px] !text-[11px]"
                  >
                    {allCoachSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-1.5">
                {sessions.map((s) => {
                  const isPending = s.status === 'PENDING_VERIFICATION';
                  const isCompleted = s.status === 'COMPLETED';
                  const courtName = (courts.find((c) => c.id === s.courtId) || {}).name || '';
                  const isProcessing = processingIds.has(s.id);
                  const isChecked = selected.has(s.id);

                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors border ${
                        isChecked
                          ? 'bg-brand-50/40 border-brand/20'
                          : isCompleted
                          ? 'bg-canvas-soft/40 border-transparent hover:bg-canvas-soft/70'
                          : 'bg-canvas-soft border-transparent hover:bg-canvas-soft/80'
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(s.id)}
                        className="rounded text-brand focus:ring-brand cursor-pointer"
                      />

                      {/* Student Icon & Name */}
                      <div className="flex items-center gap-1.5 min-w-[140px] flex-1 truncate">
                        <User className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                        <span className="font-semibold text-ink truncate">
                          {s.clientName || s.studentName || 'Unnamed Student'}
                        </span>
                        {s.clientType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-canvas-soft text-ink-faint flex-shrink-0">
                            {s.clientType}
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1 text-ink-muted flex-shrink-0 w-24">
                        <Calendar className="w-3 h-3 text-ink-faint" />
                        <span>{s.date}</span>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 text-ink-muted flex-shrink-0 w-28">
                        <Clock className="w-3 h-3 text-ink-faint" />
                        <span>{s.startTime} - {s.endTime}</span>
                      </div>

                      {/* Court */}
                      {courtName && (
                        <div className="hidden sm:flex items-center gap-1 text-ink-faint flex-shrink-0 w-20 truncate">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{courtName}</span>
                        </div>
                      )}

                      {/* Status Pill */}
                      <div className="flex-shrink-0">
                        <StatusPill status={isCompleted ? 'verified' : 'pending_verification'} />
                      </div>

                      {/* Inline Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isPending ? (
                          <Button
                            size="sm"
                            icon={CheckCircle}
                            disabled={isProcessing}
                            onClick={() => handleVerifySingle(s.id)}
                            className="!h-[28px] !px-2.5 !text-[11px]"
                          >
                            Verify
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Undo2}
                            disabled={isProcessing}
                            onClick={() => handleUnverifySingle(s.id)}
                            className="!h-[28px] !px-2 !text-[11px] text-ink-muted hover:text-ink"
                            title="Revert verification to pending"
                          >
                            Revert
                          </Button>
                        )}
                      </div>
                    </div>
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