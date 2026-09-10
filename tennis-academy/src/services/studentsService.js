/**
 * Students service — CRUD + enrollment + package enrichment.
 * Table: students
 * Columns: id, name, age, age_group, level, entity, status, parent_id,
 *          join_date, attendance, package_type, package_expiry, photo_url, aadhar_url,
 *          guardian_name, guardian_phone, guardian_email, guardian_relationship,
 *          alternate_phone, membership_type, remarks, created_at, updated_at
 */
import { BaseService } from './BaseService.js';
import { supabase, toCamelKeys, entityFilter } from '../utils/supabase.js';

class StudentsService extends BaseService {
  constructor() {
    super('students');
  }

  /**
   * List students with optional filters and pagination.
   * @param {Object} opts - { entity, status, batch, membership, query, page, pageSize }
   */
  async list({ entity, status, batch, membership, query, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (status) filters.status = status;
    if (batch) filters.batch = batch;
    if (membership) filters.membership_type = membership;
    return super.list({ entity, filters, page, pageSize, orderBy: 'name', ascending: true, query });
  }

  /**
   * Get student by ID with enrollments + packages.
   * @param {string} id
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('students')
      .select('*, enrollments(*), packages(*)')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[supabase] getById(students):', error.message);
    }

    return { data: toCamelKeys(data), error: null };
  }

  /**
   * Check for duplicate student by name + guardian phone.
   */
  async checkDuplicate(name, guardianPhone) {
    const { data, error } = await supabase
      .from('students')
      .select('id, name')
      .eq('name', name)
      .eq('guardian_phone', guardianPhone);

    return { data: toCamelKeys(data || []), error };
  }

  /**
   * Get advanced players for a specific entity.
   */
  async getAdvancedPlayers(entity) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('entity', entity || 'the-club')
      .eq('level', 'Advanced');

    return { data: toCamelKeys(data || []), error };
  }

  /**
   * List students with pagination and filtering (matches localDb.listStudents).
   */
  async paginatedList({ entity, query, status, page = 1, pageSize = 20 } = {}) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from('students')
      .select('*', { count: 'exact' });

    q = entityFilter(q, entity);

    if (status) q = q.eq('status', status);
    if (query) q = q.ilike('name', `%${query}%`);

    q = q.order('name', { ascending: true }).range(from, to);

    const { data, count, error } = await q;
    return {
      data: toCamelKeys(data || []),
      count: count || 0,
      error,
    };
  }

  /**
   * Upsert student (create or update).
   */
  async upsert(student) {
    return super.upsert(student);
  }

  /**
   * Delete student by ID.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const studentsService = new StudentsService();