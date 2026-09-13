/**
 * Coaches service — CRUD + payroll, hours, duty type queries.
 * Table: coaches
 * Columns: id, name, phone, email, specialization, entity, status, join_date,
 *          hours_logged, hourly_rate, designation, duty_type, base_salary,
 *          rate_1on1_per_hour, rate_overtime_per_hour, paid_holidays_per_month,
 *          batches (text[]), students (int), created_at, updated_at
 */
import { BaseService } from './BaseService.js';

class CoachesService extends BaseService {
  constructor() {
    super('coaches');
  }

  /**
   * List coaches with optional entity filter.
   * @param {Object} opts - { entity, status, page, pageSize, query }
   */
  async list({ entity, status, page = 1, pageSize = 50, query = null } = {}) {
    const filters = {};
    if (status) filters.status = status;
    return super.list({ entity, filters, page, pageSize, orderBy: 'name', ascending: true, query });
  }

  /**
   * Get coach by ID with all fields.
   */
  async getById(id) {
    return super.getById(id);
  }

  /**
   * Upsert coach (create or update).
   */
  async upsert(coach) {
    return super.upsert(coach);
  }

  /**
   * Delete coach by ID.
   */
  async delete(id) {
    return super.delete(id);
  }

  /**
   * Get coaches by entity.
   * @param {string} entity - 'the-club' or 'tots-tennis'
   */
  async getByEntity(entity) {
    return this.list({ entity, pageSize: 200 });
  }

  /**
   * Get active coaches count.
   */
  async activeCount(entity) {
    return super.count({ entity, filters: { status: 'active' } });
  }

  /**
   * Update coach hours logged.
   */
  async updateHoursLogged(id, hours) {
    const res = await this.getById(id);
    if (res.data) {
      const updated = { ...res.data, hoursLogged: hours, hours_logged: hours };
      await this.upsert(updated);
      return { data: updated, error: null };
    }
    return { data: null, error: new Error('Coach not found') };
  }
}

export const coachesService = new CoachesService();