/**
 * useSupabaseQuery — Generic hook for Supabase data fetching with loading/error states.
 * Replaces direct service calls in components.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useSupabaseQuery(
 *     () => coachesService.list({ entity: 'the-club' }),
 *     [entity]
 *   );
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function useSupabaseQuery(fetchFn, deps = [], opts = {}) {
  const { enabled = true, immediate = true } = opts;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const execute = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result.data);
    } catch (err) {
      console.error('[useSupabaseQuery] error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, deps);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return { data, loading, error, refetch };
}

/**
 * useSupabaseMutation — Generic hook for write operations.
 */
export function useSupabaseMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(async (fn) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fn();
      setData(result.data);
      return result;
    } catch (err) {
      console.error('[useSupabaseMutation] error:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, data, reset };
}

/**
 * useSupabaseSubscription — Fallback subscription hook.
 */
export function useSupabaseSubscription(table, callback) {
  useEffect(() => {
    // No-op for Google Sheets / runtime store
  }, [table, callback]);
}