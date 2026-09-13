/**
 * Students service — CRUD + enrollment + package enrichment.
 * Table: students
 * Uses Google Sheets database storage (via BaseService / fetchTableData).
 */
import { BaseService } from './BaseService.js';
import { fetchTableData } from '../utils/googleSheets.js';

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
    try {
      const res = await super.getById(id);
      if (res.data) {
        const [enrollments, packages] = await Promise.all([
          fetchTableData('enrollments'),
          fetchTableData('packages')
        ]);
        const sId = String(id).trim();
        const studentEnrollments = enrollments.filter(e => String(e.studentId || e.student_id || '').trim() === sId);
        const studentPackages = packages.filter(p => String(p.studentId || p.student_id || '').trim() === sId);
        return { data: { ...res.data, enrollments: studentEnrollments, packages: studentPackages }, error: null };
      }
      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  /**
   * Check for duplicate student by name + guardian phone.
   */
  async checkDuplicate(name, guardianPhone) {
    try {
      const all = await fetchTableData('students');
      const qName = String(name || '').trim().toLowerCase();
      const qPhone = String(guardianPhone || '').trim();
      const found = all.filter(s => {
        const sName = String(s.name || s.fullName || s.full_name || '').trim().toLowerCase();
        const sPhone = String(s.guardianPhone || s.guardian_phone || s.phone || '').trim();
        return sName === qName && sPhone === qPhone;
      });
      return { data: found, error: null };
    } catch (e) {
      return { data: [], error: e };
    }
  }

  /**
   * Get advanced players for a specific entity.
   */
  async getAdvancedPlayers(entity) {
    try {
      const all = await fetchTableData('students');
      const filtered = all.filter(s => {
        const matchEntity = !entity || entity === 'all' || s.entity === entity;
        return matchEntity && String(s.level || s.skillLevel || '').toLowerCase() === 'advanced';
      });
      return { data: filtered, error: null };
    } catch (e) {
      return { data: [], error: e };
    }
  }

  /**
   * List students with pagination and filtering.
   */
  async paginatedList({ entity, query, status, page = 1, pageSize = 20 } = {}) {
    const filters = {};
    if (status) filters.status = status;
    return super.list({ entity, filters, page, pageSize, orderBy: 'name', ascending: true, query });
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