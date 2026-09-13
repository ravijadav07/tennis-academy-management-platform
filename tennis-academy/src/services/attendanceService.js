/**
 * Attendance service — student + coach attendance tracking.
 * Uses Google Sheets database storage (via fetchTableData and saveTableData).
 */
import { BaseService } from './BaseService.js';
import { fetchTableData, saveTableData } from '../utils/googleSheets.js';

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
   * Mark student attendance (Google Sheets data store).
   */
  async markAttendance({ studentId, batchId, date, status, sessionPeriod, markedBy = 'coach' }) {
    try {
      const allRows = await fetchTableData('attendance');
      const sId = String(studentId).trim();
      const bId = String(batchId).trim();
      const existingIdx = allRows.findIndex(
        (r) => String(r.studentId || r.student_id || '').trim() === sId &&
               String(r.batchId || r.batch_id || '').trim() === bId &&
               r.date === date
      );

      const record = {
        id: existingIdx >= 0 ? allRows[existingIdx].id : `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        studentId: sId,
        batchId: bId,
        date,
        status: String(status).toUpperCase(),
        sessionPeriod: sessionPeriod || 'full_day',
        markedBy,
        createdAt: existingIdx >= 0 ? (allRows[existingIdx].createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        allRows[existingIdx] = { ...allRows[existingIdx], ...record };
      } else {
        allRows.unshift(record);
      }

      saveTableData('attendance', allRows);
      return { data: record, error: null };
    } catch (err) {
      console.warn('[AttendanceService] Google Sheets attendance save issue:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get attendance for a specific batch + date.
   */
  async getByBatchAndDate(batchId, date) {
    try {
      const allRows = await fetchTableData('attendance');
      const filtered = allRows.filter(
        (r) => String(r.batchId || r.batch_id || '').trim() === String(batchId).trim() && r.date === date
      );
      return { data: filtered, error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  }

  /**
   * Get monthly attendance for a student.
   */
  async getMonthlyAttendance(studentId, month, year) {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      const allRows = await fetchTableData('attendance');
      const records = allRows.filter(
        (r) => String(r.studentId || r.student_id || '').trim() === String(studentId).trim() &&
               r.date >= startDate && r.date <= endDate
      );
      const total = records.length;
      const attended = records.filter(
        (r) => String(r.status).toLowerCase() === 'present' || String(r.status).toLowerCase() === 'late'
      ).length;

      return {
        data: records,
        stats: { total, attended, percentage: total > 0 ? Math.round((attended / total) * 100) : 0 },
        error: null,
      };
    } catch (err) {
      return { data: [], stats: { total: 0, attended: 0, percentage: 0 }, error: err };
    }
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
    try {
      const allRows = await fetchTableData('coach_attendance');
      const cId = String(coachId).trim();
      const existingIdx = allRows.findIndex(
        (r) => String(r.coachId || r.coach_id || '').trim() === cId && r.date === date && r.sessionPeriod === sessionPeriod
      );
      const record = {
        id: existingIdx >= 0 ? allRows[existingIdx].id : `catt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        coachId: cId,
        date,
        status: 'checked_in',
        sessionPeriod: sessionPeriod || 'full_day',
        checkIn: time || new Date().toTimeString().slice(0, 5),
        approvalStatus: 'pending',
        updatedAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        allRows[existingIdx] = { ...allRows[existingIdx], ...record };
      } else {
        allRows.unshift(record);
      }
      saveTableData('coach_attendance', allRows);
      return { data: record, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Coach attendance: check-out.
   */
  async coachCheckOut({ coachId, date, time }) {
    try {
      const allRows = await fetchTableData('coach_attendance');
      const cId = String(coachId).trim();
      const existingIdx = allRows.findIndex(
        (r) => String(r.coachId || r.coach_id || '').trim() === cId && r.date === date
      );
      if (existingIdx >= 0) {
        allRows[existingIdx] = {
          ...allRows[existingIdx],
          checkOut: time || new Date().toTimeString().slice(0, 5),
          status: 'checked_out',
          updatedAt: new Date().toISOString(),
        };
        saveTableData('coach_attendance', allRows);
        return { data: allRows[existingIdx], error: null };
      }
      return { data: null, error: new Error('Coach attendance record not found') };
    } catch (err) {
      return { data: null, error: err };
    }
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
      const allRows = await fetchTableData('session_remarks');
      const found = allRows.find(
        (r) => String(r.batchId || r.batch_id || '').trim() === String(batchId).trim() && r.date === date
      );
      return { data: found || null, error: null };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  /**
   * Save session remark.
   */
  async saveSessionRemark({ batchId, date, remark }) {
    try {
      const allRows = await fetchTableData('session_remarks');
      const bId = String(batchId).trim();
      const existingIdx = allRows.findIndex(
        (r) => String(r.batchId || r.batch_id || '').trim() === bId && r.date === date
      );
      const record = {
        id: existingIdx >= 0 ? allRows[existingIdx].id : `sr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        batchId: bId,
        date,
        remark,
        updatedAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        allRows[existingIdx] = { ...allRows[existingIdx], ...record };
      } else {
        allRows.unshift(record);
      }
      saveTableData('session_remarks', allRows);
      return { data: record, error: null };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  /**
   * Create correction request.
   */
  async createCorrectionRequest({ attendanceId, studentId, batchId, date, oldStatus, newStatus, reason, requestedBy }) {
    try {
      const allRows = await fetchTableData('attendance_corrections');
      const record = {
        id: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        attendanceId,
        studentId,
        batchId,
        date,
        oldStatus,
        newStatus,
        reason,
        requestedBy,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      allRows.unshift(record);
      saveTableData('attendance_corrections', allRows);
      return { data: record, error: null };
    } catch (e) {
      return { data: null, error: e };
    }
  }
}

export const attendanceService = new AttendanceService();