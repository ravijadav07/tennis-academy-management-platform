/**
 * Parents service — CRUD + child relationships.
 * Table: parents
 * Columns: id, name, phone, email, entity, children (uuid[]), payment_status,
 *          renewal_status, account_status, comm_history (jsonb[]),
 *          created_at, updated_at
 */
import { BaseService } from './BaseService.js';
import { supabase, toCamelKeys } from '../utils/supabase.js';

class ParentsService extends BaseService {
  constructor() {
    super('parents');
  }

  /**
   * List parents with optional filters.
   */
  async list({ entity, status, page = 1, pageSize = 50, query } = {}) {
    const filters = {};
    if (status) filters.account_status = status;
    return super.list({ entity, filters, page, pageSize, orderBy: 'name', ascending: true, query });
  }

  /**
   * Get parent by phone (for parent login).
   */
  async getByPhone(phone) {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('phone', phone)
      .single();

    return { data: toCamelKeys(data), error };
  }

  /**
   * Get parent with children info.
   */
  async getByIdWithChildren(id) {
    const { data, error } = await supabase
      .from('parents')
      .select('*, students!students_parent_id_fkey(*)')
      .eq('id', id)
      .single();

    return { data: toCamelKeys(data), error };
  }

  /**
   * Get child names for a parent.
   */
  async getChildNames(parentId) {
    const { data, error } = await supabase
      .from('students')
      .select('id, name')
      .eq('parent_id', parentId);

    return { data: toCamelKeys(data || []), error };
  }

  /**
   * Upsert parent.
   */
  async upsert(parent) {
    return super.upsert(parent);
  }

  /**
   * Delete parent.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const parentsService = new ParentsService();