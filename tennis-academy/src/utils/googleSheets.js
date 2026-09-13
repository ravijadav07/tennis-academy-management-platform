/**
 * Google Sheets Database Client
 * Handles fetching, parsing, and caching table data from Google Sheets CSV endpoints.
 */

import { toCamelKeys } from './supabase.js';

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID;

export const SHEET_GIDS = {
  academies: import.meta.env.VITE_GOOGLE_SHEETS_GID_ACADEMIES,
  attendance: import.meta.env.VITE_GOOGLE_SHEETS_GID_ATTENDANCE,
  batches: import.meta.env.VITE_GOOGLE_SHEETS_GID_BATCHES,
  coach_leaves: import.meta.env.VITE_GOOGLE_SHEETS_GID_COACH_LEAVES,
  coaches: import.meta.env.VITE_GOOGLE_SHEETS_GID_COACHES,
  courts: import.meta.env.VITE_GOOGLE_SHEETS_GID_COURTS,
  enrollments: import.meta.env.VITE_GOOGLE_SHEETS_GID_ENROLLMENTS,
  one_on_one_sessions: import.meta.env.VITE_GOOGLE_SHEETS_GID_ONE_ON_ONE_SESSIONS,
  schedule: import.meta.env.VITE_GOOGLE_SHEETS_GID_ONE_ON_ONE_SESSIONS,
  packages: import.meta.env.VITE_GOOGLE_SHEETS_GID_PACKAGES,
  parents: import.meta.env.VITE_GOOGLE_SHEETS_GID_PARENTS,
  payments: import.meta.env.VITE_GOOGLE_SHEETS_GID_PAYMENTS,
  progress_reports: import.meta.env.VITE_GOOGLE_SHEETS_GID_PROGRESS_REPORTS,
  progress: import.meta.env.VITE_GOOGLE_SHEETS_GID_PROGRESS_REPORTS,
  reconciliation_audits: import.meta.env.VITE_GOOGLE_SHEETS_GID_RECONCILIATION_AUDITS,
  reconciliation: import.meta.env.VITE_GOOGLE_SHEETS_GID_RECONCILIATION_AUDITS,
  report_verifications: import.meta.env.VITE_GOOGLE_SHEETS_GID_REPORT_VERIFICATIONS,
  students: import.meta.env.VITE_GOOGLE_SHEETS_GID_STUDENTS,
  users: import.meta.env.VITE_GOOGLE_SHEETS_GID_USERS,
};

// In-memory store for active session table data
const tableMemoryCache = new Map();

/**
 * Robust CSV parser supporting quotes and escaped quotes
 */
export function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];
  const lines = [];
  let curLine = [];
  let curVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        curVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      curLine.push(curVal.trim());
      curVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      curLine.push(curVal.trim());
      lines.push(curLine);
      curLine = [];
      curVal = '';
    } else {
      curVal += char;
    }
  }
  if (curVal || curLine.length > 0) {
    curLine.push(curVal.trim());
    lines.push(curLine);
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).filter(r => r.some(cell => cell !== '')).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      let val = row[idx] !== undefined ? row[idx].replace(/^"|"$/g, '').trim() : '';
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val !== '' && !isNaN(val) && !isNaN(parseFloat(val))) val = Number(val);
      obj[h] = val;
    });
    return obj;
  });
}

/**
 * Fetch table data strictly from real CSV assets or Google Sheets endpoints
 */
export async function fetchTableData(tableName, options = {}) {
  const forceRefresh = typeof options === 'boolean' ? options : options?.forceRefresh || false;
  
  if (!forceRefresh && tableMemoryCache.has(tableName)) {
    return tableMemoryCache.get(tableName);
  }

  const gid = SHEET_GIDS[tableName];

  // 1. Try remote Google Sheets endpoint first
  if (gid !== undefined && gid !== '' && gid !== null) {
    const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}&_t=${Date.now()}`;
    try {
      const res = await fetch(exportUrl, { method: 'GET', redirect: 'manual' });
      if (res.ok && res.status === 200) {
        const text = await res.text();
        // Check if response is valid CSV and NOT Google Login HTML page
        if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html') && text.includes(',')) {
          const parsedRows = parseCSV(text);
          if (parsedRows && parsedRows.length > 0) {
            const camelData = toCamelKeys(parsedRows);
            tableMemoryCache.set(tableName, camelData);
            return camelData;
          }
        }
      } else if (res.type === 'opaqueredirect' || res.status === 0 || res.status === 302 || res.status === 401) {
        // Quietly fallback without throwing CORS errors in browser log
        // (Spreadsheet is private / restricted)
      }
    } catch (err) {
      // Quiet fallback to local CSV assets
    }
  }

  // 2. Fallback: Fetch local CSV asset from /data/{tableName}.csv
  try {
    const localCsvUrl = `${import.meta.env.BASE_URL || '/'}data/${tableName}.csv`;
    const res = await fetch(localCsvUrl, { method: 'GET' });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
        const parsedRows = parseCSV(text);
        if (parsedRows && parsedRows.length > 0) {
          const camelData = toCamelKeys(parsedRows);
          tableMemoryCache.set(tableName, camelData);
          return camelData;
        }
      }
    }
  } catch (err) {
    // Continue to memory cache fallback
  }

  // 3. Final fallback to memory cache if available
  if (tableMemoryCache.has(tableName)) {
    return tableMemoryCache.get(tableName);
  }

  return [];
}

/**
 * Save updated table rows to runtime memory cache
 */
export function saveTableData(tableName, rows) {
  tableMemoryCache.set(tableName, rows);
}
