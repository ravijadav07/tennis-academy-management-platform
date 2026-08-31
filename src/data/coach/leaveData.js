export const leaveRequests = [
  { id: 'leave-1', type: 'casual', startDate: '2026-08-15', endDate: '2026-08-15', reason: 'Personal work', status: 'approved', appliedDate: '2026-08-01' },
  { id: 'leave-2', type: 'sick', startDate: '2026-08-20', endDate: '2026-08-22', reason: 'Medical appointment', status: 'pending', appliedDate: '2026-08-06' },
  { id: 'leave-3', type: 'casual', startDate: '2026-07-10', endDate: '2026-07-10', reason: 'Family function', status: 'approved', appliedDate: '2026-07-01' },
  { id: 'leave-4', type: 'sick', startDate: '2026-06-05', endDate: '2026-06-06', reason: 'Fever', status: 'approved', appliedDate: '2026-06-04' },
];

export const leaveStats = {
  totalLeaves: 24,
  used: 8,
  remaining: 16,
  pending: 1,
};