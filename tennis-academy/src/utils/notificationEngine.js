// src/utils/notificationEngine.js
// Local-first notification utilities — prepares mailto: URLs.
// No backend send — opens browser compose window.
// Honest limitation: cannot guarantee unattended background send.
import { formatTime12h } from './formatters';

// WF-1: Absence notification — prepare mailto for absent student
export function prepareAbsenceEmail({ studentName, guardianEmail, batchName, batchDate, startTime, endTime }) {
  const subj = `Attendance Notification — ${studentName}`;
  const body = [
    `Dear Parent/Guardian,`,
    ``,
    `This is to inform you that ${studentName} was marked absent for their scheduled tennis session.`,
    ``,
    `Batch: ${batchName}`,
    `Date: ${batchDate}`,
    `Time: ${formatTime12h(startTime)} – ${formatTime12h(endTime)}`,
    ``,
    `Regards,`,
    `Tennis Academy Management`
  ].join('\n');
  return `mailto:${guardianEmail}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
}

// WF-1: Check if notification window is open (batch start + 15 min)
export function getNotificationWindow(batchStartTime) {
  if (!batchStartTime) return { open: false, minutesRemaining: -1 };
  const now = new Date();
  const [h, m] = batchStartTime.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return { open: false, minutesRemaining: -1 };
  const start = new Date(now);
  start.setHours(h, m, 0, 0);
  const windowOpen = new Date(start.getTime() + 15 * 60 * 1000); // +15 min
  const diff = windowOpen.getTime() - now.getTime();
  const minutesRemaining = Math.ceil(diff / 60000);
  return { open: diff <= 0, minutesRemaining: Math.max(0, minutesRemaining) };
}

// WF-2: Payment reminder — prepare mailto for pending payment
export function preparePaymentReminder({ studentName, guardianEmail, program, pendingAmount, hasPaymentUrl, paymentUrl }) {
  const subj = `Payment Reminder — ${studentName}`;
  const lines = [
    `Dear Parent/Guardian,`,
    ``,
    `This is a reminder that a payment is currently pending for ${studentName}.`,
    ``,
    `Enrollment: ${program || 'Enrollment'}`,
    `Pending Amount: Rs. ${(pendingAmount || 0).toLocaleString('en-IN')}`,
  ];
  if (hasPaymentUrl && paymentUrl) {
    lines.push(``, `Please use the payment link below to complete the payment:`, ``, paymentUrl);
  } else {
    lines.push(``, `Payment link is not yet configured. Please contact the academy for payment details.`);
  }
  lines.push(``, `Regards,`, `Tennis Academy Management`);
  return `mailto:${guardianEmail}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

// WF-3: Slot Analysis email — prepare mailto with report summary
export function prepareSlotReportEmail({ recipients, subject, body }) {
  const mail = (recipients || []).join(',');
  return `mailto:${mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}