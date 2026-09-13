/**
 * Communications service — CRUD + communication log.
 * Table: communications_log
 * Columns: id, entity, type, student_id, parent_id, message, status,
 *          date, created_at, updated_at
 */
import { BaseService } from './BaseService.js';

class CommunicationsService extends BaseService {
  constructor() {
    super('communications_log');
  }

  /**
   * List communications with optional filters.
   */
  async list({ entity, type, studentId, parentId, status, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (type) filters.type = type;
    if (studentId) filters.student_id = studentId;
    if (parentId) filters.parent_id = parentId;
    if (status) filters.status = status;
    return super.list({ entity, filters, page, pageSize, orderBy: 'date', ascending: false });
  }

  /**
   * Log a communication entry.
   */
  async log(entry) {
    return super.upsert(entry);
  }

  /**
   * Get communications for a parent.
   */
  async getByParent(parentId) {
    return this.list({ parentId, pageSize: 200 });
  }

  /**
   * Delete communication entry.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const communicationsService = new CommunicationsService();