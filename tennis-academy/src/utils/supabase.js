// Pure data transformer and entity filtering utilities for Google Sheets / runtime data store

// Stub fallback to prevent runtime crashes if legacy code references supabase
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({ single: async () => ({ data: null, error: null }), order: async () => ({ data: [], error: null }) }),
      order: () => ({ data: [], error: null }),
    }),
  }),
};

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
  if ((!result.capacity || result.capacity === 0) && (result.maxCapacity || result.max_capacity)) {
    result.capacity = Number(result.maxCapacity || result.max_capacity || 0);
  }
  if ((!result.maxCapacity || result.maxCapacity === 0) && (result.capacity || result.capacity === 0)) {
    result.maxCapacity = Number(result.capacity || 0);
  }
  if (!result.dayPattern && (result.daysOfWeek || result.days_of_week)) {
    result.dayPattern = result.daysOfWeek || result.days_of_week;
  }
  if (!result.daysOfWeek && (result.dayPattern || result.day_pattern)) {
    result.daysOfWeek = result.dayPattern || result.day_pattern;
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