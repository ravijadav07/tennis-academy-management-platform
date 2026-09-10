/**
 * Packages service — CRUD + status, sessions, expiry.
 * Table: packages
 * Columns: id, student_id, entity, plan, amount, status, start_date, expiry_date,
 *          program, amount_received, balance_amount, payment_url, payment_mode,
 *          payment_date, transaction_ref, next_payment_due, base_amount, tax_amount,
 *          gst_rate, tax_inclusive, package_duration, discount, discount_reason,
 *          sessions_used, sessions_purchased, makeup_credit, extension_days, valid_to,
 *          sessions_consumed, remaining_balance, total_sessions, overdue_days,
 *          created_at, updated_at
 */
import { BaseService } from './BaseService.js';
import { supabase, toCamelKeys } from '../utils/supabase.js';

class PackagesService extends BaseService {
  constructor() {
    super('packages');
  }

  /**
   * List packages with optional filters.
   */
  async list({ entity, status, studentId, program, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (status) filters.status = status;
    if (studentId) filters.student_id = studentId;
    if (program) filters.program = program;
    return super.list({ entity, filters, page, pageSize, orderBy: 'created_at', ascending: false });
  }

  /**
   * Get packages for a specific student.
   */
  async getByStudent(studentId) {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    return { data: toCamelKeys(data || []), error };
  }

  /**
   * Get active package for a student.
   */
  async getActivePackage(studentId) {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return { data: toCamelKeys(data), error };
  }

  /**
   * Record a payment against a package.
   */
  async recordPayment({ packageId, amount, paymentMode, transactionRef, paymentDate }) {
    const { data, error } = await supabase
      .from('packages')
      .update({
        amount_received: amount,
        payment_mode: paymentMode,
        transaction_ref: transactionRef,
        payment_date: paymentDate,
      })
      .eq('id', packageId)
      .select()
      .single();

    return { data: toCamelKeys(data), error };
  }

  /**
   * Update session consumption.
   */
  async updateSessionsConsumed(packageId, sessionsConsumed) {
    const { data, error } = await supabase
      .from('packages')
      .update({ sessions_consumed: sessionsConsumed })
      .eq('id', packageId)
      .select()
      .single();

    return { data: toCamelKeys(data), error };
  }

  /**
   * Upsert package.
   */
  async upsert(pkg) {
    return super.upsert(pkg);
  }

  /**
   * Delete package.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const packagesService = new PackagesService();