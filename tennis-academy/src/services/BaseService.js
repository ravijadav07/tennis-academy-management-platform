import { fetchTableData, saveTableData } from '../utils/googleSheets.js';

export class BaseService {
  constructor(tableName) {
    this.table = tableName;
  }

  /**
   * Helper: filter data by entity, additional key-value filters, search query, sorting, and pagination
   */
  filterAndPaginate(allRows, { entity, filters = {}, page = 1, pageSize = 50, orderBy = 'createdAt', ascending = false, query = null } = {}) {
    let rows = Array.isArray(allRows) ? [...allRows] : [];

    // Filter by entity
    if (entity && entity !== 'all') {
      rows = rows.filter(r => r.entity === entity || r.businessEntity === entity || !r.entity);
    }

    // Filter by key-value pairs
    for (const [col, val] of Object.entries(filters)) {
      if (val !== undefined && val !== null && val !== '') {
        const camelCol = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        rows = rows.filter(r => {
          const itemVal = r[col] !== undefined ? r[col] : r[camelCol];
          if (itemVal === undefined || itemVal === null) return false;
          return String(itemVal).toLowerCase() === String(val).toLowerCase();
        });
      }
    }

    // Filter by search query on 'name' or 'fullName'
    if (query) {
      const q = String(query).toLowerCase();
      rows = rows.filter(r => {
        const name = (r.name || r.fullName || r.clientName || '').toLowerCase();
        return name.includes(q);
      });
    }

    // Sort
    if (orderBy) {
      const camelOrder = orderBy.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      rows.sort((a, b) => {
        let valA = a[orderBy] !== undefined ? a[orderBy] : a[camelOrder];
        let valB = b[orderBy] !== undefined ? b[orderBy] : b[camelOrder];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
      });
    }

    const totalCount = rows.length;

    // Paginate
    if (pageSize && pageSize > 0) {
      const from = (page - 1) * pageSize;
      rows = rows.slice(from, from + pageSize);
    }

    return { data: rows, count: totalCount };
  }

  /**
   * List rows with optional filters, pagination, sorting.
   */
  async list({ entity, filters = {}, page = 1, pageSize = 50, orderBy = 'created_at', ascending = false, query = null } = {}) {
    try {
      const allRows = await fetchTableData(this.table);
      const { data, count } = this.filterAndPaginate(allRows, { entity, filters, page, pageSize, orderBy, ascending, query });

      return {
        data,
        count,
        error: null,
      };
    } catch (err) {
      console.warn(`[BaseService] Google Sheets list error for ${this.table}:`, err);
      return { data: [], count: 0, error: err };
    }
  }

  /**
   * Get a single row by ID.
   */
  async getById(id) {
    try {
      const allRows = await fetchTableData(this.table);
      const found = allRows.find(r => String(r.id) === String(id));
      return {
        data: found || null,
        error: null,
      };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Insert or update a row (upsert).
   */
  async upsert(row) {
    try {
      const allRows = await fetchTableData(this.table);
      const rowId = row.id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const updatedRow = { ...row, id: rowId, updatedAt: new Date().toISOString() };

      const existingIndex = allRows.findIndex(r => String(r.id) === String(rowId));
      if (existingIndex >= 0) {
        allRows[existingIndex] = { ...allRows[existingIndex], ...updatedRow };
      } else {
        allRows.unshift(updatedRow);
      }

      saveTableData(this.table, allRows);

      return {
        data: updatedRow,
        error: null,
      };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Delete a row by ID.
   */
  async delete(id) {
    try {
      const allRows = await fetchTableData(this.table);
      const filtered = allRows.filter(r => String(r.id) !== String(id));
      saveTableData(this.table, filtered);
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  /**
   * Count rows with optional filters.
   */
  async count({ entity, filters = {} } = {}) {
    try {
      const allRows = await fetchTableData(this.table);
      const { count } = this.filterAndPaginate(allRows, { entity, filters, pageSize: 0 });
      return { count, error: null };
    } catch (err) {
      return { count: 0, error: err };
    }
  }

  /**
   * Get all rows matching filters (no pagination).
   */
  async getAll({ entity, filters = {}, orderBy = 'created_at', ascending = false } = {}) {
    try {
      const allRows = await fetchTableData(this.table);
      const { data } = this.filterAndPaginate(allRows, { entity, filters, pageSize: 0, orderBy, ascending });
      return {
        data,
        error: null,
      };
    } catch (err) {
      return { data: [], error: err };
    }
  }

  /**
   * Insert multiple rows at once.
   */
  async insertMany(rows) {
    try {
      const allRows = await fetchTableData(this.table);
      const newRows = rows.map((r, idx) => ({
        ...r,
        id: r.id || `id_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: r.createdAt || new Date().toISOString(),
      }));

      const combined = [...newRows, ...allRows];
      saveTableData(this.table, combined);

      return {
        data: newRows,
        error: null,
      };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Subscribe fallback
   */
  subscribe(callback) {
    return {
      unsubscribe: () => {},
    };
  }
}