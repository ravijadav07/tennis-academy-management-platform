/**
 * Courts service — CRUD for tennis courts.
 * Table: courts
 * Columns: id, name, entity, status, created_at, updated_at
 */
import { BaseService } from './BaseService.js';
import { supabase, toCamelKeys } from '../utils/supabase.js';

class CourtsService extends BaseService {
  constructor() {
    super('courts');
  }

  /**
   * List courts with optional entity filter.
   */
  async list({ entity, status, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (status) filters.status = status;
    return super.list({ entity, filters, page, pageSize, orderBy: 'name', ascending: true });
  }

  /**
   * Get all courts (no pagination).
   */
  async getAllCourts() {
    return super.getAll({ orderBy: 'name', ascending: true });
  }

  /**
   * Upsert court.
   */
  async upsert(court) {
    return super.upsert(court);
  }

  /**
   * Delete court.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const courtsService = new CourtsService();