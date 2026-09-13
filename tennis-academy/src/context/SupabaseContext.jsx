/**
 * SupabaseContext — Provider that wraps Supabase client + all service instances.
 * Replaces the mock DbContext with live Supabase queries.
 *
 * Usage:
 *   <SupabaseProvider>
 *     <App />
 *   </SupabaseProvider>
 *
 *   const { supabase, services, entity, setEntity, user, loading } = useSupabase();
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabase.js';
import {
  coachesService,
  studentsService,
  batchesService,
  scheduleService,
  attendanceService,
  packagesService,
  parentsService,
  paymentsService,
  reconciliationService,
  courtsService,
  enrollmentsService,
  progressService,
  communicationsService,
  workflowService,
  certificatesService,
  dashboardService,
  usersService,
} from '../services/index.js';

const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  const [entity, setEntity] = useState('all');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize: set loading false
  useEffect(() => {
    setLoading(false);
  }, []);

  // ── Auth methods ──────────────────────────────────────────────────────────

  const signIn = useCallback(async ({ email }) => {
    const sessionUser = { email, role: 'admin' };
    setUser(sessionUser);
    return { user: sessionUser };
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
  }, []);

  // ── Service references ────────────────────────────────────────────────────

  const services = useMemo(() => ({
    coaches: coachesService,
    students: studentsService,
    batches: batchesService,
    schedule: scheduleService,
    attendance: attendanceService,
    packages: packagesService,
    parents: parentsService,
    payments: paymentsService,
    reconciliation: reconciliationService,
    courts: courtsService,
    enrollments: enrollmentsService,
    progress: progressService,
    communications: communicationsService,
    workflow: workflowService,
    certificates: certificatesService,
    dashboard: dashboardService,
    users: usersService,
  }), []);

  // ── Convenience methods ───────────────────────────────────────────────────

  /**
   * Generic fetch with entity filtering.
   * Wraps any service.list() call with the current entity.
   */
  const fetchWithEntity = useCallback(async (serviceFn, opts = {}) => {
    return serviceFn({ ...opts, entity: entity === 'all' ? undefined : entity });
  }, [entity]);

  const value = useMemo(() => ({
    supabase,
    services,
    entity,
    setEntity,
    user,
    loading,
    error,
    signIn,
    signOut,
    fetchWithEntity,
  }), [supabase, services, entity, setEntity, user, loading, error, signIn, signOut, fetchWithEntity]);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

/**
 * Hook to access Supabase context.
 * @returns {{ supabase, services, entity, setEntity, user, loading, error, signIn, signOut, fetchWithEntity }}
 */
export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error('useSupabase must be used within a <SupabaseProvider>');
  }
  return ctx;
}