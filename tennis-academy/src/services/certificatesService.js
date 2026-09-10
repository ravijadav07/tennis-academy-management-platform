/**
 * Certificates service — CRUD + certificate generation tracking.
 * Table: certificates
 * Columns: id, student_id, entity, course, issued_date, file_url,
 *          created_at, updated_at
 */
import { BaseService } from './BaseService.js';
import { supabase, toCamelKeys } from '../utils/supabase.js';

class CertificatesService extends BaseService {
  constructor() {
    super('certificates');
  }

  /**
   * List certificates with optional filters.
   */
  async list({ entity, studentId, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (studentId) filters.student_id = studentId;
    return super.list({ entity, filters, page, pageSize, orderBy: 'issued_date', ascending: false });
  }

  /**
   * Get certificates for a student.
   */
  async getByStudent(studentId) {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', studentId)
      .order('issued_date', { ascending: false });

    return { data: toCamelKeys(data || []), error };
  }

  /**
   * Create certificate.
   */
  async create(cert) {
    return super.upsert(cert);
  }

  /**
   * Delete certificate.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const certificatesService = new CertificatesService();