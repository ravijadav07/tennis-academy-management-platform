/**
 * idGenerator.js
 * Centralized, collision-free, incremental ID creation logic for all entities.
 * Ensures IDs are pre-created before sending payloads to webhooks and Google Sheets integrations.
 */

/**
 * Extracts numeric suffix from an ID string matching a given prefix.
 * e.g., 'st_105' -> 105, 'pkg_003' -> 3, 'parent-12' -> 12
 */
function extractNumber(idStr, prefix) {
  if (!idStr || typeof idStr !== 'string') return 0;
  // Match prefix followed by separator (_ or -) and numbers
  const regex = new RegExp(`^${prefix}[_-]?(\\d+)`, 'i');
  const match = idStr.match(regex);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  // Try matching any trailing numbers in string if prefix match didn't find numeric suffix
  const numMatch = idStr.match(/(\d+)$/);
  if (numMatch && numMatch[1]) {
    return parseInt(numMatch[1], 10);
  }
  return 0;
}

/**
 * Generates an incremental ID given a prefix and a list of existing items or ID strings.
 * 
 * @param {string} prefix - Entity prefix ('st', 'parent', 'pkg', 'en', 'pay', 'b', 'coach', 'court', 'lea')
 * @param {Array<Object|string>} existingItems - Array of existing entity objects or ID strings
 * @param {Object} options - Formatting options
 * @param {string} [options.idField='id'] - Field name in object holding the ID
 * @param {number} [options.padZeroes=0] - Number of leading zero padding digits (e.g., 3 for 'pkg_001')
 * @param {string} [options.separator='_'] - Separator character between prefix and number
 * @param {number} [options.startFrom=101] - Starting integer if no existing items match
 * @returns {string} Incremental ID string (e.g. 'st_101', 'pkg_001', 'parent-101')
 */
export function generateIncrementalId(prefix, existingItems = [], options = {}) {
  const {
    idField = 'id',
    padZeroes = 0,
    separator = prefix === 'parent' ? '-' : '_',
    startFrom = prefix === 'pkg' || prefix === 'en' ? 1 : 101,
  } = options;

  let maxNum = startFrom - 1;

  if (Array.isArray(existingItems)) {
    for (const item of existingItems) {
      const idVal = typeof item === 'string' ? item : item?.[idField];
      const num = extractNumber(idVal, prefix);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  const numStr = padZeroes > 0 ? String(nextNum).padStart(padZeroes, '0') : String(nextNum);
  return `${prefix}${separator}${numStr}`;
}

/**
 * Pre-generate full suite of IDs for a new student onboarding flow.
 */
export function generateStudentOnboardingIds(existingData = {}) {
  const {
    students = [],
    parents = [],
    packages = [],
    enrollments = [],
    payments = []
  } = existingData;

  const studentId = generateIncrementalId('st', students, { startFrom: 101 });
  const parentId = generateIncrementalId('parent', parents, { startFrom: 101, separator: '-' });
  const packageId = generateIncrementalId('pkg', packages, { padZeroes: 3, startFrom: 1 });
  const enrollmentId = generateIncrementalId('en', enrollments, { padZeroes: 3, startFrom: 1 });
  const paymentId = generateIncrementalId('pay', payments, { startFrom: 101, separator: '_' });
  const academyId = import.meta.env.VITE_ACADEMY_ID;

  return {
    studentId,
    parentId,
    packageId,
    enrollmentId,
    paymentId,
    academyId
  };
}

export default {
  generateIncrementalId,
  generateStudentOnboardingIds,
};
