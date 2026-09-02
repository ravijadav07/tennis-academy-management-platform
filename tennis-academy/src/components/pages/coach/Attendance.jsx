import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, HelpCircle, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../utils/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/formatters';
import AdaptiveTable from '../../data/AdaptiveTable';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Button from '../../ui/Button';
import Skeleton from '../../ui/Skeleton';

const statusCycle = { present: 'absent', absent: 'late', late: 'present' };

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState(null);
  const [batchName, setBatchName] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const coachName = user?.name;
      if (!coachName) { setLoading(false); return; }

      const { data: coachRows } = await supabase
        .from('coaches')
        .select('id')
        .eq('name', coachName)
        .limit(1);

      if (!coachRows || coachRows.length === 0) { setLoading(false); return; }
      const cId = coachRows[0].id;
      setCoachId(cId);

      const { data: batchRows } = await supabase
        .from('batches')
        .select('name')
        .eq('coach_id', cId)
        .eq('status', 'active')
        .limit(1);

      if (batchRows && batchRows.length > 0) {
        setBatchName(batchRows[0].name);
      }

      const { data: studentRows } = await supabase
        .from('students')
        .select('id, name, batch_id')
        .eq('coach_id', cId)
        .eq('status', 'active');

      const studentList = studentRows || [];
      if (studentList.length === 0) { setRecords([]); setLoading(false); return; }

      const studentIds = studentList.map(s => s.id);

      const { data: attRows } = await supabase
        .from('attendance')
        .select('id, date, status, check_in, student_id, batch_id')
        .in('student_id', studentIds)
        .eq('date', today);

      const attMap = {};
      (attRows || []).forEach(a => {
        attMap[a.student_id] = a;
      });

      const merged = studentList.map(s => {
        const att = attMap[s.id];
        if (att) {
          return {
            id: att.id,
            studentId: att.student_id,
            studentName: s.name,
            date: att.date,
            status: att.status,
            checkIn: att.check_in?.substring(0, 5) || null,
            batch_id: att.batch_id || s.batch_id,
          };
        }
        return {
          id: null,
          studentId: s.id,
          studentName: s.name,
          date: today,
          status: null,
          checkIn: null,
          batch_id: s.batch_id,
        };
      });

      setRecords(merged);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const todayRecords = records;
  const unmarked = todayRecords.filter((r) => r.status === null).length;
  const present = todayRecords.filter((r) => r.status === 'present').length;
  const absent = todayRecords.filter((r) => r.status === 'absent').length;
  const marked = present + absent + todayRecords.filter((r) => r.status === 'late').length;
  const total = todayRecords.length;

  const handleToggle = async (studentId, currentStatus, batchId, existingId) => {
    const newStatus = statusCycle[currentStatus] || 'present';

    setRecords((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;
        return { ...r, status: newStatus };
      })
    );

    const { error } = await supabase
      .from('attendance')
      .upsert({
        id: existingId || undefined,
        student_id: studentId,
        batch_id: batchId,
        coach_id: coachId,
        date: today,
        status: newStatus,
      }, { onConflict: 'student_id,batch_id,date' });

    if (error) {
      toast.error('Failed to update attendance');
      setRecords((prev) =>
        prev.map((r) => {
          if (r.studentId !== studentId) return r;
          return { ...r, status: currentStatus || null };
        })
      );
    } else {
      toast.success(`Marked as ${newStatus}`);
    }
  };

  const handleMarkAllPresent = async () => {
    const unmarkedRecords = records.filter(r => r.status === null || r.status === 'absent');
    if (unmarkedRecords.length === 0) {
      toast.info('All students are already marked');
      return;
    }

    setRecords((prev) =>
      prev.map((r) => {
        if (r.status === null || r.status === 'absent') {
          return { ...r, status: 'present' };
        }
        return r;
      })
    );

    for (const record of unmarkedRecords) {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          id: record.id || undefined,
          student_id: record.studentId,
          batch_id: record.batch_id,
          coach_id: coachId,
          date: today,
          status: 'present',
        }, { onConflict: 'student_id,batch_id,date' });
      if (error) {
        console.error('Failed to mark present:', error);
        toast.error(`Failed to mark ${record.studentName || 'student'} as present`);
        setRecords((prev) =>
          prev.map((r) => (r.studentId === record.studentId ? { ...r, status: record.status } : r))
        );
        return;
      }
    }

    toast.success(`Marked ${unmarkedRecords.length} students as present`);
  };

  const columns = [
    {
      accessorKey: 'studentName',
      header: 'Student',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-brand text-xs font-semibold">
            {getValue().charAt(0)}
          </div>
          <span className="text-sm font-medium text-ink">{getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const record = row.original;
        const status = record.status || 'unmarked';
        return (
          <span onClick={() => handleToggle(record.studentId, record.status, record.batch_id, record.id)} className="cursor-pointer">
            <StatusPill status={status} />
          </span>
        );
      },
    },
    {
      accessorKey: 'checkIn',
      header: 'Check-in',
      cell: ({ getValue }) => (
        <span className="text-sm text-ink-muted font-mono">{getValue() || '--'}</span>
      ),
    },
  ];

  const renderCard = (record) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand text-xs font-semibold shrink-0">
          {record.studentName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink truncate">{record.studentName}</p>
          <p className="text-xs text-ink-muted">{record.checkIn || 'No check-in'}</p>
        </div>
      </div>
      <span onClick={() => handleToggle(record.studentId, record.status, record.batch_id, record.id)} className="cursor-pointer">
        <StatusPill status={record.status || 'unmarked'} />
      </span>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton.SkeletonCard />
        <Skeleton.SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">Today's Attendance</h3>
            <p className="text-sm text-ink-muted">
              {formatDate(today)}{batchName ? ` \u2022 ${batchName}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-ok" />
              <span className="text-sm font-medium text-ink">{present} Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-err" />
              <span className="text-sm font-medium text-ink">{absent} Absent</span>
            </div>
            {unmarked > 0 && (
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-off" />
                <span className="text-sm font-medium text-ink">{unmarked} Unmarked</span>
              </div>
            )}
            <span className="text-xs text-ink-muted bg-canvas-soft px-2 py-1 rounded-full">
              {marked}/{total} marked
            </span>
          </div>
        </div>

        {unmarked > 0 && (
          <div className="mb-3">
            <Button size="sm" icon={UserCheck} onClick={handleMarkAllPresent}>
              Mark All Present
            </Button>
          </div>
        )}

        <AdaptiveTable
          data={todayRecords}
          columns={columns}
          renderCard={renderCard}
          searchPlaceholder="Search attendance..."
          emptyMessage="No students found in your batch"
        />
      </Card>
    </div>
  );
}