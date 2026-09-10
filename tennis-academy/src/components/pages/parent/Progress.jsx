import { useState, useEffect } from 'react';
import { Award, Mail, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { studentsService, communicationsService, progressService, coachesService } from '../../../services';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Skeleton from '../../ui/Skeleton';
import { formatDate } from '../../../utils/formatters';
import { cn } from '../../../utils/cn';

const commTypeLabel = {
  welcome: 'thank_you_admission',
  reminder: 'reminder',
  confirmation: 'confirmation',
  progress_report: 'progress_report',
  certificate: 'certificate',
  invoice: 'invoice',
};

export default function Progress() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState(null);
  const [commLog, setCommLog] = useState([]);
  const [progressEntries, setProgressEntries] = useState([]);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data: students } = await studentsService.getAll();
        if (cancelled) return;

        const student = (students || []).find(s => s.guardianName === user?.name || s.name === user?.name) || (students && students[0]);
        if (!student) {
          setLoading(false);
          return;
        }

        const sid = student.id;

        const [{ data: commData }, { data: progData }, { data: coachData }] = await Promise.all([
          communicationsService.getAll({ filters: { studentId: sid } }),
          progressService.getAll({ filters: { studentId: sid } }),
          coachesService.getAll(),
        ]);

        if (cancelled) return;

        const assignedCoach = (coachData || []).find(c => c.id === student.coachId) || coachData?.[0];

        if (assignedCoach) {
          setCoach({
            name: assignedCoach.fullName || assignedCoach.name || 'Santosh',
            specialization: assignedCoach.designation || 'Senior Tennis Coach',
            since: '',
            initials: (assignedCoach.fullName || assignedCoach.name || 'Santosh').split(' ').map(n => n[0]).join(''),
          });
        }

        setCommLog((commData || []).map(c => ({
          id: c.id,
          type: commTypeLabel[c.type] || c.type,
          sent: c.status === 'sent' || c.status === 'delivered',
          date: c.date,
          scheduled: c.date,
          file: c.fileLink || null,
          status: c.status || 'sent',
        })));

        if (progData && progData.length > 0) {
          setProgressEntries(progData.map(p => ({
            id: p.id,
            category: p.category || 'forehand',
            rating: p.rating || 4,
            note: p.note || p.remarks || '',
            date: p.date || p.reportDate,
          })));
          setAchievements(progData.filter(p => (p.rating || 4) >= 4).map(p => ({
            id: p.id,
            category: p.category || 'forehand',
            rating: p.rating || 4,
            date: p.date || p.reportDate,
          })));
        }

        setLoading(false);
      } catch (err) {
        console.error('[Progress] Load error:', err);
        toast.error('Failed to load progress data');
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.name]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton.SkeletonCard />
        <Skeleton.SkeletonCard />
        <Skeleton.SkeletonCard />
        <Skeleton.SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {coach && (
        <Card>
          <h3 className="text-sm font-semibold text-ink mb-2.5">Assigned Coach</h3>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
              <span className="text-brand text-sm font-bold">{coach.initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{coach.name}</p>
              <p className="text-xs text-ink-muted">{coach.specialization || 'Coach'}</p>
              {coach.since && <p className="text-xs text-ink-faint mt-0.5">Since {formatDate(coach.since)}</p>}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-warn" />
          Recent Achievements
        </h3>
        <div className="space-y-3">
          {achievements.length > 0 ? achievements.map(a => (
            <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-brand-50">
              <Star className="w-4 h-4 text-warn fill-warn shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink capitalize">{a.category.replace(/_/g, ' ')}</p>
                <p className="text-xs text-ink-muted">{formatDate(a.date)}</p>
              </div>
              <span className="ml-auto text-xs font-semibold text-warn">{a.rating}/5</span>
            </div>
          )) : (
            <p className="text-sm text-ink-muted text-center py-4">No achievements yet</p>
          )}
        </div>
      </Card>

      <Card padding={false}>
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-ink">Progress History</h3>
        </div>
        <div className="divide-y divide-line">
          {progressEntries.length > 0 ? progressEntries.map(p => (
            <div key={p.id} className="px-5 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-ink capitalize">{p.category.replace(/_/g, ' ')}</span>
                <span className="text-xs text-ink-muted">{formatDate(p.date)}</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn('w-3.5 h-3.5', i < p.rating ? 'text-warn fill-warn' : 'text-ink-faint')}
                  />
                ))}
              </div>
              {p.note && <p className="text-xs text-ink-muted">{p.note}</p>}
            </div>
          )) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-ink-muted">No progress entries yet</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
          <Mail className="w-5 h-5 text-brand" />
          Communications
        </h3>
        <div className="relative">
          {commLog.length > 0 && (
            <div className="absolute left-[7px] top-0 bottom-0 w-px bg-line" />
          )}
          <div className="space-y-4">
            {commLog.map((log) => (
              <div key={log.id} className="flex items-start gap-4 relative">
                <div className={cn(
                  'w-[15px] h-[15px] rounded-full border-2 shrink-0 mt-0.5 z-10 bg-white',
                  log.sent ? 'border-ok' : 'border-warn'
                )}>
                  {log.sent
                    ? <CheckCircle className="w-[11px] h-[11px] text-ok -mt-px -ml-px" />
                    : <AlertTriangle className="w-[11px] h-[11px] text-warn -mt-px -ml-px" />
                  }
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink capitalize">
                      {String(log.type).replace(/_/g, ' ')}
                    </p>
                    <StatusPill status={log.sent ? 'sent' : 'pending'} />
                  </div>
                  <p className="text-xs text-ink-muted">
                    {log.sent ? `Sent on ${log.date ? formatDate(log.date) : '--'}` : 'Pending'}
                  </p>
                  {log.file && <p className="text-xs text-brand mt-0.5">{log.file}</p>}
                </div>
              </div>
            ))}
            {commLog.length === 0 && (
              <p className="text-sm text-ink-muted text-center py-4">No communications yet</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}