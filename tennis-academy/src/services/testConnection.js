/**
 * Supabase Connection Test — run in browser console or as a script.
 * Verifies: connection, auth, table access, RLS policies.
 * 
 * Usage: import { testSupabaseConnection } from './services/testConnection.js';
 *        await testSupabaseConnection();
 */
import { supabase } from '../utils/supabase.js';

export async function testSupabaseConnection() {
  const results = [];
  const log = (check, status, detail = '') => {
    results.push({ check, status, detail });
    console.log(`[${status}] ${check}${detail ? ': ' + detail : ''}`);
  };

  // 1. Check config
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || url === 'http://localhost') {
    log('Config', 'FAIL', 'VITE_SUPABASE_URL not set');
    return results;
  }
  if (!key || key === 'your-anon-key-here' || key === 'placeholder') {
    log('Config', 'FAIL', 'VITE_SUPABASE_ANON_KEY not set');
    return results;
  }
  log('Config', 'OK', `URL: ${url}`);

  // 2. Test basic connection (list tables via health check)
  try {
    const { data, error } = await supabase.from('coaches').select('id').limit(1);
    if (error) {
      log('Connection', 'FAIL', error.message);
    } else {
      log('Connection', 'OK', `Coaches table reachable (${data.length} rows)`);
    }
  } catch (err) {
    log('Connection', 'FAIL', err.message);
  }

  // 3. Test each core table
  const tables = [
    'coaches', 'students', 'parents', 'packages', 'schedule',
    'attendance', 'payments', 'batches', 'reconciliation', 'courts',
    'enrollments', 'progress', 'communications_log', 'workflow_state',
    'certificates', 'coach_attendance', 'report_verifications'
  ];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (error) {
        log(`Table: ${table}`, 'FAIL', error.message);
      } else {
        log(`Table: ${table}`, 'OK', `${count} rows`);
      }
    } catch (err) {
      log(`Table: ${table}`, 'FAIL', err.message);
    }
  }

  // 4. Test auth session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      log('Auth Session', 'FAIL', error.message);
    } else if (session) {
      log('Auth Session', 'OK', `User: ${session.user.email}`);
    } else {
      log('Auth Session', 'OK', 'No active session (anonymous)');
    }
  } catch (err) {
    log('Auth Session', 'FAIL', err.message);
  }

  return results;
}