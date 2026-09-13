/**
 * Progress service — CRUD + student progress tracking.
 * Table: progress
 * Columns: id, student_id, entity, category, rating, note, date, created_at, updated_at
 */
import { BaseService } from './BaseService.js';

class ProgressService extends BaseService {
  constructor() {
    super('progress');
  }

  /**
   * List progress records with optional filters.
   */
  async list({ entity, studentId, category, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (studentId) filters.student_id = studentId;
    if (category) filters.category = category;
    return super.list({ entity, filters, page, pageSize, orderBy: 'date', ascending: false });
  }

  /**
   * Get progress for a specific student.
   */
  async getByStudent(studentId) {
    return this.list({ studentId, pageSize: 200 });
  }

  /**
   * Create a progress entry.
   */
  async create(progress) {
    return super.upsert(progress);
  }

  /**
   * Delete progress entry.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const progressService = new ProgressService();