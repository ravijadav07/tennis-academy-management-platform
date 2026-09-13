/**
 * Reconciliation service — Excel vs system reconciliation.
 * Table: reconciliation
 * Columns: id, entity, month, year, excel_amount, system_amount, difference,
 *          status, notes, created_at, updated_at
 */
import { BaseService } from './BaseService.js';

class ReconciliationService extends BaseService {
  constructor() {
    super('reconciliation');
  }

  /**
   * List reconciliation entries with optional filters.
   */
  async list({ entity, status, month, year, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (status) filters.status = status;
    if (month) filters.month = month;
    if (year) filters.year = year;
    return super.list({ entity, filters, page, pageSize, orderBy: 'created_at', ascending: false });
  }

  /**
   * Get reconciliation entry by month/year/entity.
   */
  async getByMonthYear(entity, month, year) {
    const res = await this.list({ entity, month, year, pageSize: 1 });
    return { data: res.data?.[0] || null, error: null };
  }

  /**
   * Upsert reconciliation entry.
   */
  async upsert(entry) {
    return super.upsert(entry);
  }

  /**
   * Delete reconciliation entry.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const reconciliationService = new ReconciliationService();