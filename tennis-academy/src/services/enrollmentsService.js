/**
 * Enrollments service — CRUD + student-batch enrollment tracking.
 * Table: enrollments
 * Columns: id, student_id, batch_id, entity, status, start_date, end_date,
 *          created_at, updated_at
 */
import { BaseService } from './BaseService.js';
import { supabase, toCamelKeys } from '../utils/supabase.js';

class EnrollmentsService extends BaseService {
  constructor() {
    super('enrollments');
  }

  /**
   * List enrollments with optional filters.
   */
  async list({ entity, status, studentId, batchId, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (status) filters.status = status;
    if (studentId) filters.student_id = studentId;
    if (batchId) filters.batch_id = batchId;
    return super.list({ entity, filters, page, pageSize, orderBy: 'created_at', ascending: false });
  }

  /**
   * Get enrollments for a student.
   */
  async getByStudent(studentId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, batches(name, program, day_pattern, start_time, end_time)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    return { data: toCamelKeys(data || []), error };
  }

  /**
   * Get enrollments for a batch.
   */
  async getByBatch(batchId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, students(name, age, level, guardian_name, guardian_phone)')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    return { data: toCamelKeys(data || []), error };
  }

  /**
   * Upsert enrollment.
   */
  async upsert(enrollment) {
    return super.upsert(enrollment);
  }

  /**
   * Delete enrollment.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const enrollmentsService = new EnrollmentsService();