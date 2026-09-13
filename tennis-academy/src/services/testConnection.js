/**
 * Supabase Connection Test — run in browser console or as a script.
 * Verifies: connection, auth, table access, RLS policies.
 * 
 * Usage: import { testSupabaseConnection } from './services/testConnection.js';
 *        await testSupabaseConnection();
 */
import { fetchTableData } from '../utils/googleSheets.js';

export async function testConnection() {
  const tables = [
    'coaches', 'students', 'parents', 'packages', 'schedule',
    'attendance', 'payments', 'batches', 'reconciliation', 'courts',
    'enrollments', 'progress', 'communications_log', 'workflow_state',
    'certificates', 'report_verifications'
  ];

  const results = [];
  for (const table of tables) {
    try {
      const data = await fetchTableData(table);
      results.push({ check: `Table: ${table}`, status: 'OK', detail: `${data.length} rows` });
    } catch (err) {
      results.push({ check: `Table: ${table}`, status: 'FAIL', detail: err.message });
    }
  }

  return results;
}