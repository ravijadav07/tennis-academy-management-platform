/**
 * Schedule service — CRUD + session management.
 * Table: schedule
 * Columns: id, batch_id, entity, date, day, time, students, location, status,
 *          session_period, confirmation, marked_by, student_name, created_at, updated_at
 */
import { BaseService } from './BaseService.js';
import { fetchTableData } from '../utils/googleSheets.js';

class ScheduleService extends BaseService {
  constructor() {
    super('schedule');
  }

  /**
   * List schedule items with optional filters.
   * @param {Object} opts - { entity, batchId, date, status, page, pageSize }
   */
  async list({ entity, batchId, date, status, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (batchId) filters.batch_id = batchId;
    if (date) filters.date = date;
    if (status) filters.status = status;
    return super.list({ entity, filters, page, pageSize, orderBy: 'date', ascending: true });
  }

  /**
   * Get schedule for a specific date range.
   */
  async getByDateRange(entity, startDate, endDate) {
    const all = await fetchTableData('schedule');
    let filtered = all.filter(r => r.date >= startDate && r.date <= endDate);
    if (entity && entity !== 'all') {
      filtered = filtered.filter(r => r.entity === entity);
    }
    return { data: filtered, error: null };
  }

  /**
   * Get today's schedule for an entity.
   */
  async getTodaySchedule(entity) {
    const today = new Date().toISOString().split('T')[0];
    return this.list({ entity, date: today });
  }

  /**
   * Get schedule items by batch.
   */
  async getByBatch(batchId) {
    return this.list({ batchId, pageSize: 500 });
  }

  /**
   * Upsert schedule item.
   */
  async upsert(item) {
    return super.upsert(item);
  }

  /**
   * Delete schedule item.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const scheduleService = new ScheduleService();