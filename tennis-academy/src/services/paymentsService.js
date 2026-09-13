/**
 * Payments service — CRUD + payment tracking.
 * Table: payments
 * Columns: id, student_id, entity, amount, date, gateway, type, status,
 *          invoice_id, created_at, updated_at
 */
import { BaseService } from './BaseService.js';

class PaymentsService extends BaseService {
  constructor() {
    super('payments');
  }

  /**
   * List payments with optional filters.
   */
  async list({ entity, status, studentId, type, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (status) filters.status = status;
    if (studentId) filters.student_id = studentId;
    if (type) filters.type = type;
    return super.list({ entity, filters, page, pageSize, orderBy: 'date', ascending: false });
  }

  /**
   * Get payments for a specific student.
   */
  async getByStudent(studentId) {
    return this.list({ studentId, pageSize: 200 });
  }

  /**
   * Record a new payment.
   */
  async recordPayment({ studentId, entity, amount, date, gateway, type, status, invoiceId }) {
    const payment = {
      studentId,
      student_id: studentId,
      entity,
      amount,
      date,
      gateway,
      type,
      status,
      invoiceId,
      invoice_id: invoiceId,
    };
    return this.upsert(payment);
  }

  /**
   * Upsert payment.
   */
  async upsert(payment) {
    return super.upsert(payment);
  }

  /**
   * Delete payment.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const paymentsService = new PaymentsService();