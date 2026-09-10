/**
 * Service layer index — import all services from here.
 * Usage: import { coachesService, studentsService, ... } from '../services/index.js';
 */
export { coachesService } from './coachesService.js';
export { studentsService } from './studentsService.js';
export { batchesService } from './batchesService.js';
export { scheduleService } from './scheduleService.js';
export { attendanceService } from './attendanceService.js';
export { packagesService } from './packagesService.js';
export { parentsService } from './parentsService.js';
export { paymentsService } from './paymentsService.js';
export { reconciliationService } from './reconciliationService.js';
export { courtsService } from './courtsService.js';
export { enrollmentsService } from './enrollmentsService.js';
export { progressService } from './progressService.js';
export { communicationsService } from './communicationsService.js';
export { workflowService } from './workflowService.js';
export { certificatesService } from './certificatesService.js';

/**
 * Dashboard service — aggregate stats for the admin dashboard.
 */
import { supabase, toCamelKeys, entityFilter } from '../utils/supabase.js';

export const dashboardService = {
  /**
   * Get dashboard stats for an entity.
   * @param {string} entity - 'the-club', 'tots-tennis', or 'all'
   */
  async getStats(entity) {
    const [studentsRes, coachesRes, batchesRes, paymentsRes, attendanceRes] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).then(r => r.count || 0),
      supabase.from('coaches').select('*', { count: 'exact', head: true }).eq('status', 'active').then(r => r.count || 0),
      supabase.from('batches').select('*', { count: 'exact', head: true }).eq('status', 'active').then(r => r.count || 0),
      supabase.from('payments').select('amount').then(r => {
        const rows = r.data || [];
        return rows.reduce((sum, p) => sum + (p.amount || 0), 0);
      }),
      supabase.from('attendance').select('status').then(r => {
        const rows = r.data || [];
        const total = rows.length;
        const attended = rows.filter(a => a.status === 'present' || a.status === 'late').length;
        return total > 0 ? Math.round((attended / total) * 100) : 0;
      }),
    ]);

    return {
      totalStudents: studentsRes,
      activeCoaches: coachesRes,
      activeBatches: batchesRes,
      monthlyRevenue: paymentsRes,
      attendanceRate: attendanceRes,
    };
  },

  /**
   * Get revenue trend data.
   */
  async getRevenueTrend(entity) {
    const { data, error } = await supabase
      .from('payments')
      .select('date, amount')
      .order('date', { ascending: true });

    if (error) return { data: [], error };

    // Group by month
    const byMonth = {};
    (data || []).forEach(p => {
      const month = p.date?.substring(0, 7); // YYYY-MM
      if (month) byMonth[month] = (byMonth[month] || 0) + p.amount;
    });

    const trend = Object.entries(byMonth).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    return { data: trend, error: null };
  },
};