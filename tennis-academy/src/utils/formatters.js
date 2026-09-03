export function formatCurrency(amount) {
  return `\u20B9 ${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Takes a 24h time string like "15:30" → "3:30 PM". Also handles "06:30" → "6:30 AM".
export function formatTime12h(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Takes a YYYY-MM-DD string → "27-08-26" (DD-MM-YY)
export function formatDateDDMMYY(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr.slice(0, 10);
  return `${parts[2]}-${parts[1]}-${parts[0].slice(2)}`;
}

export function formatDateTime(dateStr) {
  return `${formatDate(dateStr)}, ${formatTime(dateStr)}`;
}

export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

export function daysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function daysAgo(dateStr) {
  return -daysUntil(dateStr);
}

export function relativeTime(dateStr) {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days}d left`;
  return formatDate(dateStr);
}

export function getTodayPattern() {
  const day = new Date().getDay();
  if (day === 0) return 'SAT_SUN';
  if ([1, 3, 5].includes(day)) return 'MWF';
  if ([2, 4, 6].includes(day)) return 'TTS';
  return 'MWF';
}

export function getTodayPatternLabel() {
  const p = getTodayPattern();
  if (p === 'SAT_SUN') return 'Today (Sat & Sun)';
  return `Today (${p})`;
}

export function getBatchDisplayName(batch, courts = []) {
  if (!batch) return '';
  if (batch.name) return batch.name;

  const courtObj = (courts || []).find((c) => c.id === batch.courtId);
  const courtName = courtObj ? courtObj.name : (batch.courtId ? batch.courtId.replace('court_', 'Court ') : 'Court');

  const progMap = {
    ADV: 'Advance',
    INT: 'Intermediate',
    BEG: 'Beginner',
    ADULT: 'Adults',
    JDP: 'JDP',
    HPP: 'HPP',
    WEEKEND: 'Weekend',
    FITNESS: 'Fitness',
  };
  const progLabel = progMap[batch.program] || batch.program || '';
  const ballText = batch.ballLevel ? `${batch.ballLevel} Ball` : '';
  const timeText = batch.startTime && batch.endTime
    ? `${formatTime12h(batch.startTime)} to ${formatTime12h(batch.endTime)}`
    : batch.startTime ? formatTime12h(batch.startTime) : '';

  const mid = [progLabel, ballText].filter(Boolean).join(' ');
  return [courtName, mid, timeText].filter(Boolean).join(' - ');
}