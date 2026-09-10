import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.warn(
    '[supabase] Missing or placeholder VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY — Supabase queries will fail gracefully'
  );
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
  }
);

// ── Helper: convert snake_case to camelCase ─────────────────────────────────
export function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// ── Helper: convert camelCase to snake_case ─────────────────────────────────
export function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

// ── Helper: transform an object's keys from snake_case to camelCase ─────────
export function toCamelKeys(obj) {
  if (Array.isArray(obj)) return obj.map(toCamelKeys);
  if (obj === null || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCase(key)] = value;
  }
  if (!result.name && (result.fullName || result.full_name || result.studentName || result.clientName)) {
    result.name = result.fullName || result.full_name || result.studentName || result.clientName;
  }
  return result;
}

// ── Helper: transform an object's keys from camelCase to snake_case ─────────
export function toSnakeKeys(obj) {
  if (Array.isArray(obj)) return obj.map(toSnakeKeys);
  if (obj === null || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCase(key)] = value;
  }
  return result;
}

// ── Helper: entity filtering ────────────────────────────────────────────────
// DB uses 'entity' column; frontend uses 'business_entity'
export function entityFilter(query, entity) {
  if (!entity || entity === 'all') return query;
  return query.eq('entity', entity);
}

// ── Helper: generic error handler ───────────────────────────────────────────
export function handleSupabaseError(error, context = '') {
  if (error) {
    console.warn(`[supabase]${context ? ' ' + context : ''}:`, error.message || error);
  }
}