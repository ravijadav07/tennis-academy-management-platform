/**
 * Parents service — CRUD + child relationships.
 * Table: parents
 * Columns: id, name, phone, email, entity, children (uuid[]), payment_status,
 *          renewal_status, account_status, comm_history (jsonb[]),
 *          created_at, updated_at
 */
import { BaseService } from './BaseService.js';
import { fetchTableData } from '../utils/googleSheets.js';

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
    const res = await this.list({ pageSize: 500 });
    const found = (res.data || []).find(p => (p.phone || '').replace(/\D/g, '') === (phone || '').replace(/\D/g, ''));
    return { data: found || null, error: null };
  }

  /**
   * Get parent with children info.
   */
  async getByIdWithChildren(id) {
    const parentRes = await this.getById(id);
    if (!parentRes.data) return { data: null, error: null };
    const allStudents = await fetchTableData('students');
    const children = allStudents.filter(s => String(s.parentId || s.parent_id) === String(id));
    return { data: { ...parentRes.data, students: children }, error: null };
  }

  /**
   * Get child names for a parent.
   */
  async getChildNames(parentId) {
    const allStudents = await fetchTableData('students');
    const children = allStudents.filter(s => String(s.parentId || s.parent_id) === String(parentId));
    return { data: children, error: null };
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