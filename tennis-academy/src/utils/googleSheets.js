/**
 * Google Sheets Database Client
 * Handles fetching, parsing, and caching table data from Google Sheets CSV endpoints.
 */

import { toCamelKeys } from './supabase.js';

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID || '1OTn3vT8qIeZFHzMZWAJHE_9ouqLGMiIF_zVEZQHq6DA';

export const SHEET_GIDS = {
  academies: import.meta.env.VITE_GOOGLE_SHEETS_GID_ACADEMIES || '0',
  attendance: import.meta.env.VITE_GOOGLE_SHEETS_GID_ATTENDANCE || '772014212',
  batches: import.meta.env.VITE_GOOGLE_SHEETS_GID_BATCHES || '139096806',
  coach_leaves: import.meta.env.VITE_GOOGLE_SHEETS_GID_COACH_LEAVES || '1465573576',
  coaches: import.meta.env.VITE_GOOGLE_SHEETS_GID_COACHES || '731582326',
  courts: import.meta.env.VITE_GOOGLE_SHEETS_GID_COURTS || '55890290',
  enrollments: import.meta.env.VITE_GOOGLE_SHEETS_GID_ENROLLMENTS || '605693083',
  one_on_one_sessions: import.meta.env.VITE_GOOGLE_SHEETS_GID_ONE_ON_ONE_SESSIONS || '721558255',
  schedule: import.meta.env.VITE_GOOGLE_SHEETS_GID_ONE_ON_ONE_SESSIONS || '721558255',
  packages: import.meta.env.VITE_GOOGLE_SHEETS_GID_PACKAGES || '1260552768',
  parents: import.meta.env.VITE_GOOGLE_SHEETS_GID_PARENTS || '1278619599',
  payments: import.meta.env.VITE_GOOGLE_SHEETS_GID_PAYMENTS || '800907974',
  progress_reports: import.meta.env.VITE_GOOGLE_SHEETS_GID_PROGRESS_REPORTS || '1652974773',
  progress: import.meta.env.VITE_GOOGLE_SHEETS_GID_PROGRESS_REPORTS || '1652974773',
  reconciliation_audits: import.meta.env.VITE_GOOGLE_SHEETS_GID_RECONCILIATION_AUDITS || '1376492719',
  reconciliation: import.meta.env.VITE_GOOGLE_SHEETS_GID_RECONCILIATION_AUDITS || '1376492719',
  report_verifications: import.meta.env.VITE_GOOGLE_SHEETS_GID_REPORT_VERIFICATIONS || '1052898027',
  students: import.meta.env.VITE_GOOGLE_SHEETS_GID_STUDENTS || '74175770',
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
export async function fetchTableData(tableName) {
  if (tableMemoryCache.has(tableName)) {
    return tableMemoryCache.get(tableName);
  }

  // Check localStorage first for persisted modifications
  const localStored = localStorage.getItem(`gs_db_${tableName}`);
  if (localStored) {
    try {
      const parsed = JSON.parse(localStored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        tableMemoryCache.set(tableName, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn(`[GoogleSheets] Local storage parse error for ${tableName}:`, e);
    }
  }

  // Fetch local CSV asset from /data/{tableName}.csv
  try {
    const localCsvUrl = `${import.meta.env.BASE_URL || '/'}data/${tableName}.csv`;
    const res = await fetch(localCsvUrl, { method: 'GET' });
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes('<!DOCTYPE html>')) {
        const parsedRows = parseCSV(text);
        if (parsedRows && parsedRows.length > 0) {
          const camelData = toCamelKeys(parsedRows);
          tableMemoryCache.set(tableName, camelData);
          localStorage.setItem(`gs_db_${tableName}`, JSON.stringify(camelData));
          return camelData;
        }
      }
    }
  } catch (err) {
    // Continue to Google Sheets remote endpoint
  }

  const gid = SHEET_GIDS[tableName];
  if (gid !== undefined) {
    const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
    try {
      const res = await fetch(exportUrl, { method: 'GET', mode: 'cors' });
      if (res.ok) {
        const text = await res.text();
        if (text && !text.includes('<!DOCTYPE html>')) {
          const parsedRows = parseCSV(text);
          if (parsedRows && parsedRows.length > 0) {
            const camelData = toCamelKeys(parsedRows);
            tableMemoryCache.set(tableName, camelData);
            localStorage.setItem(`gs_db_${tableName}`, JSON.stringify(camelData));
            return camelData;
          }
        }
      }
    } catch (err) {
      console.warn(`[GoogleSheets] Could not fetch ${tableName} from Google Sheets:`, err);
    }
  }

  return [];
}

/**
 * Save updated table rows to local memory & localStorage
 */
export function saveTableData(tableName, rows) {
  tableMemoryCache.set(tableName, rows);
  try {
    localStorage.setItem(`gs_db_${tableName}`, JSON.stringify(rows));
  } catch (e) {
    console.error(`[GoogleSheets] Error saving ${tableName} to localStorage:`, e);
  }
}
