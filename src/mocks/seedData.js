// ---------------------------------------------------------------------------
// seedData.js — mock dataset for the ATA prototype.
//
// Derived from the client's live workbook (August 2026). Student, coach, court
// and batch names are real so the demo is recognisable. Fees, phone numbers,
// attendance history and private-session logs are synthesised.
//
// The slot totals reconcile EXACTLY to the client's own Slot Analysis sheet:
//   130 slots · 88 booked · 42 open · 67.69% occupancy
// If a change to this file breaks that, the change is wrong.
// ---------------------------------------------------------------------------
import core from './seed.core.json';
import history from './seed.history.json';

export const SEED = { ...core, ...history };
export default SEED;
