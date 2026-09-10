/**
 * Attendance service — student + coach attendance tracking.
 * Table: attendance
 * Columns: id, student_id, batch_id, entity, date, status, session_period,
 *          check_in, check_out, marked_by, created_at, updated_at
 * Table: coach_attendance
 * Columns: id, coach_id, entity, date, status, session_period, check_in,
 *          check_out, approval_status, created_at, updated_at
 */
import { BaseService } from './BaseService.js';
import { supabase, toCamelKeys, entityFilter } from '../utils/supabase.js';

class AttendanceService extends BaseService {
  constructor() {
    super('attendance');
  }

  /**
   * List attendance records with filters.
   * @param {Object} opts - { entity, batchId, studentId, date, status, sessionPeriod, page, pageSize }
   */
  async list({ entity, batchId, studentId, date, status, sessionPeriod, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (batchId) filters.batch_id = batchId;
    if (studentId) filters.student_id = studentId;
    if (date) filters.date = date;
    if (status) filters.status = status;
    if (sessionPeriod) filters.session_period = sessionPeriod;
    return super.list({ entity, filters, page, pageSize, orderBy: 'date', ascending: false });
  }

  /**
   * Mark student attendance (calls RPC or direct insert).
   */
  async markAttendance({ studentId, batchId, date, status, sessionPeriod, markedBy = 'coach' }) {
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        student_id: studentId,
        batch_id: batchId,
        date,
        status,
        session_period: sessionPeriod,
        marked_by: markedBy,
      }, { onConflict: 'student_id,batch_id,date' })
      .select()
      .single();

    return { data: toCamelKeys(data), error };
  }

  /**
   * Get attendance for a specific batch + date.
   */
  async getByBatchAndDate(batchId, date) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, students(name)')
      .eq('batch_id', batchId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    return { data: toCamelKeys(data || []), error };
  }

  /**
   * Get monthly attendance for a student.
   */
  async getMonthlyAttendance(studentId, month, year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .gte('date', startDate)
      .lte('date', endDate);

    const records = data || [];
    const total = records.length;
    const attended = records.filter(r => r.status === 'present' || r.status === 'late').length;

    return {
      data: toCamelKeys(records),
      stats: { total, attended, percentage: total > 0 ? Math.round((attended / total) * 100) : 0 },
      error,
    };
  }

  /**
   * Coach attendance: list records.
   */
  async listCoachAttendance({ entity, coachId, date, status, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (coachId) filters.coach_id = coachId;
    if (date) filters.date = date;
    if (status) filters.status = status;
    return super.list({ entity, filters, page, pageSize, orderBy: 'date', ascending: false });
  }

  /**
   * Coach attendance: check-in.
   */
  async coachCheckIn({ coachId, date, sessionPeriod, time }) {
    const { data, error } = await supabase
      .from('coach_attendance')
      .upsert({
        coach_id: coachId,
        date,
        status: 'checked_in',
        session_period: sessionPeriod,
        check_in: time,
        approval_status: 'pending',
      }, { onConflict: 'coach_id,date,session_period' })
      .select()
      .single();

    return { data: toCamelKeys(data), error };
  }

  /**
   * Coach attendance: check-out.
   */
  async coachCheckOut({ coachId, date, time }) {
    const { data, error } = await supabase
      .from('coach_attendance')
      .update({ check_out: time, status: 'checked_out' })
      .eq('coach_id', coachId)
      .eq('date', date)
      .select()
      .single();

    return { data: toCamelKeys(data), error };
  }

  /**
   * Delete attendance record.
   */
  async delete(id) {
    return super.delete(id);
  }

  /**
   * Get session remark.
   */
  async getSessionRemark({ batchId, date }) {
    try {
      const { data, error } = await supabase
        .from('session_remarks')
        .select('*')
        .eq('batch_id', batchId)
        .eq('date', date)
        .maybeSingle();
      return { data: data ? toCamelKeys(data) : null, error };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  /**
   * Save session remark.
   */
  async saveSessionRemark({ batchId, date, remark }) {
    try {
      const { data, error } = await supabase
        .from('session_remarks')
        .upsert({ batch_id: batchId, date, remark }, { onConflict: 'batch_id,date' })
        .select()
        .single();
      return { data: data ? toCamelKeys(data) : null, error };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  /**
   * Create correction request.
   */
  async createCorrectionRequest({ attendanceId, studentId, batchId, date, oldStatus, newStatus, reason, requestedBy }) {
    try {
      const { data, error } = await supabase
        .from('attendance_corrections')
        .insert({
          attendance_id: attendanceId,
          student_id: studentId,
          batch_id: batchId,
          date,
          old_status: oldStatus,
          new_status: newStatus,
          reason,
          requested_by: requestedBy,
          status: 'pending',
        })
        .select()
        .single();
      return { data: data ? toCamelKeys(data) : null, error };
    } catch (e) {
      return { data: null, error: e };
    }
  }
}

export const attendanceService = new AttendanceService();