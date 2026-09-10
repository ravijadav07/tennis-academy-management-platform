/**
 * Batches service — CRUD + roster, day pattern, court, coach assignments.
 * Table: batches
 * Columns: id, name, entity, level, schedule, capacity, enrolled, status,
 *          age_group, location, program, day_pattern, court_id, ball_level,
 *          primary_coach_id, support_coach_id, start_time, end_time,
 *          is_semi_batch, semi_batch_group, court_change_at, court_change_to,
 *          created_at, updated_at
 */
import { BaseService } from './BaseService.js';
import { supabase, toCamelKeys, entityFilter } from '../utils/supabase.js';

class BatchesService extends BaseService {
  constructor() {
    super('batches');
  }

  /**
   * List batches with optional filters.
   * @param {Object} opts - { entity, status, dayPattern, page, pageSize }
   */
  async list({ entity, status, dayPattern, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (status) filters.status = status;
    if (dayPattern) filters.day_pattern = dayPattern;
    return super.list({ entity, filters, page, pageSize, orderBy: 'name', ascending: true });
  }

  /**
   * Get batch by ID with enrollments + students + packages.
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('batches')
      .select('*, enrollments(*, students(*, packages(*)))')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[supabase] getById(batches):', error.message);
    }

    return { data: toCamelKeys(data), error: null };
  }

  /**
   * List batches by day pattern (MWF / TTS).
   * Matches localDb.listBatches({ dayPattern }).
   */
  async listByDayPattern(dayPattern) {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('day_pattern', dayPattern)
      .order('start_time', { ascending: true });

    return { data: toCamelKeys(data || []), error };
  }

  /**
   * Get all active batches for an entity (used in schedule views).
   */
  async getActiveBatches(entity) {
    return this.list({ entity, status: 'active', pageSize: 200 });
  }

  /**
   * Upsert batch (create or update).
   */
  async upsert(batch) {
    return super.upsert(batch);
  }

  /**
   * Delete/archive batch by ID.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const batchesService = new BatchesService();