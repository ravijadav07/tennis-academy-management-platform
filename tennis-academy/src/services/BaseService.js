/**
 * Base service class for Supabase table operations.
 * Provides CRUD, pagination, filtering, and entity-scoped queries.
 *
 * Usage:
 *   const svc = new BaseService('coaches');
 *   await svc.list({ entity: 'the-club', page: 1, pageSize: 20 });
 *   await svc.getById('uuid');
 *   await svc.upsert({ name: 'Coach A', entity: 'the-club' });
 *   await svc.delete('uuid');
 */
import { supabase, toCamelKeys, toSnakeKeys, entityFilter, handleSupabaseError } from '../utils/supabase.js';

export class BaseService {
  constructor(tableName) {
    this.table = tableName;
  }

  /**
   * List rows with optional filters, pagination, sorting.
   * @param {Object} opts
   * @param {string} [opts.entity] - Filter by entity (the-club, tots-tennis, all)
   * @param {Object} [opts.filters] - Additional eq/gt/lt filters: { status: 'active', ... }
   * @param {number} [opts.page=1] - Page number (1-based)
   * @param {number} [opts.pageSize=50] - Rows per page
   * @param {string} [opts.orderBy='created_at'] - Column to sort by
   * @param {boolean} [opts.ascending=false] - Sort direction
   * @param {string} [opts.query] - Full-text search on 'name' column
   * @returns {Promise<{ data: Array, count: number, error: Error|null }>}
   */
  async list({ entity, filters = {}, page = 1, pageSize = 50, orderBy = 'created_at', ascending = false, query = null } = {}) {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let q = supabase
        .from(this.table)
        .select('*', { count: 'exact' });

      // Entity filter
      q = entityFilter(q, entity);

      // Additional filters
      for (const [col, val] of Object.entries(filters)) {
        if (val !== undefined && val !== null && val !== '') {
          q = q.eq(col, val);
        }
      }

      // Text search on name column
      if (query) {
        q = q.ilike('name', `%${query}%`);
      }

      // Sorting
      q = q.order(orderBy, { ascending });

      // Pagination
      q = q.range(from, to);

      const { data, count, error } = await q;
      if (error) handleSupabaseError(error, `list(${this.table})`);

      return {
        data: data ? toCamelKeys(data) : null,
        count: count || 0,
        error: error || null,
      };
    } catch (err) {
      handleSupabaseError(err, `list(${this.table}) network error`);
      return { data: null, count: 0, error: err };
    }
  }

  /**
   * Get a single row by ID.
   * @param {string} id - Row UUID or text ID
   * @returns {Promise<{ data: Object|null, error: Error|null }>}
   */
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error, `getById(${this.table}, ${id})`);
      }

      return {
        data: data ? toCamelKeys(data) : null,
        error: error || null,
      };
    } catch (err) {
      handleSupabaseError(err, `getById(${this.table}, ${id}) network error`);
      return { data: null, error: err };
    }
  }

  /**
   * Insert or update a row (upsert).
   * @param {Object} row - Data to upsert (camelCase keys will be converted)
   * @returns {Promise<{ data: Object|null, error: Error|null }>}
   */
  async upsert(row) {
    try {
      const snakeRow = toSnakeKeys(row);
      const { data, error } = await supabase
        .from(this.table)
        .upsert(snakeRow, { onConflict: 'id' })
        .select()
        .single();

      if (error) handleSupabaseError(error, `upsert(${this.table})`);

      return {
        data: data ? toCamelKeys(data) : null,
        error: error || null,
      };
    } catch (err) {
      handleSupabaseError(err, `upsert(${this.table}) network error`);
      return { data: null, error: err };
    }
  }

  /**
   * Delete a row by ID.
   * @param {string} id
   * @returns {Promise<{ error: Error|null }>}
   */
  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) handleSupabaseError(error, `delete(${this.table}, ${id})`);

      return { error: error || null };
    } catch (err) {
      handleSupabaseError(err, `delete(${this.table}, ${id}) network error`);
      return { error: err };
    }
  }

  /**
   * Count rows with optional filters.
   * @param {Object} opts
   * @param {string} [opts.entity]
   * @param {Object} [opts.filters]
   * @returns {Promise<{ count: number, error: Error|null }>}
   */
  async count({ entity, filters = {} } = {}) {
    try {
      let q = supabase
        .from(this.table)
        .select('*', { count: 'exact', head: true });

      q = entityFilter(q, entity);

      for (const [col, val] of Object.entries(filters)) {
        if (val !== undefined && val !== null && val !== '') {
          q = q.eq(col, val);
        }
      }

      const { count, error } = await q;
      if (error) handleSupabaseError(error, `count(${this.table})`);

      return { count: count || 0, error: error || null };
    } catch (err) {
      handleSupabaseError(err, `count(${this.table}) network error`);
      return { count: 0, error: err };
    }
  }

  /**
   * Get all rows matching filters (no pagination).
   * @param {Object} opts
   * @param {string} [opts.entity]
   * @param {Object} [opts.filters]
   * @param {string} [opts.orderBy]
   * @param {boolean} [opts.ascending]
   * @returns {Promise<{ data: Array, error: Error|null }>}
   */
  async getAll({ entity, filters = {}, orderBy = 'created_at', ascending = false } = {}) {
    try {
      let q = supabase
        .from(this.table)
        .select('*');

      q = entityFilter(q, entity);

      for (const [col, val] of Object.entries(filters)) {
        if (val !== undefined && val !== null && val !== '') {
          q = q.eq(col, val);
        }
      }

      q = q.order(orderBy, { ascending });

      const { data, error } = await q;
      if (error) handleSupabaseError(error, `getAll(${this.table})`);

      return {
        data: data ? toCamelKeys(data) : null,
        error: error || null,
      };
    } catch (err) {
      handleSupabaseError(err, `getAll(${this.table}) network error`);
      return { data: null, error: err };
    }
  }

  /**
   * Insert multiple rows at once.
   * @param {Array} rows
   * @returns {Promise<{ data: Array|null, error: Error|null }>}
   */
  async insertMany(rows) {
    try {
      const snakeRows = rows.map(toSnakeKeys);
      const { data, error } = await supabase
        .from(this.table)
        .insert(snakeRows)
        .select();

      if (error) handleSupabaseError(error, `insertMany(${this.table})`);

      return {
        data: data ? toCamelKeys(data) : null,
        error: error || null,
      };
    } catch (err) {
      handleSupabaseError(err, `insertMany(${this.table}) network error`);
      return { data: null, error: err };
    }
  }

  /**
   * Subscribe to real-time changes on this table.
   * @param {Function} callback - Called with { eventType, new, old }
   * @returns {Object} Subscription object (call .unsubscribe() to stop)
   */
  subscribe(callback) {
    return supabase
      .channel(`public:${this.table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: this.table }, (payload) => {
        callback({
          eventType: payload.eventType,
          new: toCamelKeys(payload.new),
          old: toCamelKeys(payload.old),
        });
      })
      .subscribe();
  }
}