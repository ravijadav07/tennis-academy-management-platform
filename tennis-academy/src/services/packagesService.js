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
    return this.list({ studentId, pageSize: 200 });
  }

  /**
   * Get active package for a student.
   */
  async getActivePackage(studentId) {
    const res = await this.list({ studentId, status: 'active', pageSize: 1 });
    return { data: res.data?.[0] || null, error: null };
  }

  /**
   * Record a payment against a package.
   */
  async recordPayment({ packageId, amount, paymentMode, transactionRef, paymentDate }) {
    const pkgRes = await this.getById(packageId);
    if (pkgRes.data) {
      const updated = {
        ...pkgRes.data,
        amountReceived: amount,
        paymentMode,
        transactionRef,
        paymentDate,
      };
      await this.upsert(updated);
      return { data: updated, error: null };
    }
    return { data: null, error: new Error('Package not found') };
  }

  /**
   * Update session consumption.
   */
  async updateSessionsConsumed(packageId, sessionsConsumed) {
    const pkgRes = await this.getById(packageId);
    if (pkgRes.data) {
      const updated = { ...pkgRes.data, sessionsConsumed };
      await this.upsert(updated);
      return { data: updated, error: null };
    }
    return { data: null, error: new Error('Package not found') };
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