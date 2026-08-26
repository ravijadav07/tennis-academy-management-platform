export const reportTypes = [
  { id: 'rpt-1', name: 'Student Attendance Report', category: 'student', description: 'Monthly attendance by student', lastGenerated: '2026-08-01', status: 'ready' },
  { id: 'rpt-2', name: 'Monthly Revenue Report', category: 'revenue', description: 'Revenue summary with group/1-on-1 split', lastGenerated: '2026-08-01', status: 'ready' },
  { id: 'rpt-3', name: 'Occupancy / Slot Analysis', category: 'occupancy', description: 'Batch occupancy rates by time slot', lastGenerated: '2026-08-01', status: 'ready' },
  { id: 'rpt-4', name: 'Coach Payroll Report', category: 'revenue', description: 'Monthly coach payroll with revenue share', lastGenerated: '2026-08-01', status: 'draft' },
  { id: 'rpt-5', name: 'Renewal Status Report', category: 'renewal', description: 'Upcoming and overdue renewals', lastGenerated: '2026-08-05', status: 'ready' },
  { id: 'rpt-6', name: 'Revenue Reconciliation Report', category: 'reconciliation', description: 'Excel vs System reconciliation summary', lastGenerated: '2026-08-07', status: 'ready' },
  { id: 'rpt-7', name: 'Invoice Archive', category: 'revenue', description: 'Generated invoices with revenue split', lastGenerated: '2026-08-01', status: 'ready' },
];

export const occupancyData = [
  { slot: 'Mon 4-5 PM', batch: 'Advanced Tournament', capacity: 20, enrolled: 18, occupancy: 90, business_entity: 'the-club', status: 'full' },
  { slot: 'Mon 5-6 PM', batch: 'Advanced Tournament', capacity: 20, enrolled: 18, occupancy: 90, business_entity: 'the-club', status: 'full' },
  { slot: 'Tue 4-5 PM', batch: 'Intermediate Group', capacity: 24, enrolled: 22, occupancy: 92, business_entity: 'the-club', status: 'full' },
  { slot: 'Wed 4-5 PM', batch: 'Beginner Batch A', capacity: 16, enrolled: 15, occupancy: 94, business_entity: 'tots-tennis', status: 'full' },
  { slot: 'Thu 4-5 PM', batch: 'Beginner Batch B', capacity: 16, enrolled: 14, occupancy: 88, business_entity: 'tots-tennis', status: 'good' },
  { slot: 'Sat 8-10 AM', batch: 'Intermediate Group', capacity: 24, enrolled: 22, occupancy: 92, business_entity: 'the-club', status: 'full' },
  { slot: 'Sat 4-6 PM', batch: 'Advanced Tournament (TT)', capacity: 16, enrolled: 15, occupancy: 94, business_entity: 'tots-tennis', status: 'full' },
  { slot: 'Mon 3-4 PM', batch: 'Beginner Batch C', capacity: 16, enrolled: 13, occupancy: 81, business_entity: 'the-club', status: 'good' },
];

export const sampleInvoices = [
  {
    id: 'INV-2026-0842', studentName: 'Arjun Mehta', business_entity: 'the-club', period: 'August 2026',
    groupClasses: { sessions: 12, rate: 500, total: 6000 },
    oneOnOne: { sessions: 4, rate: 1200, total: 4800 },
    totalRevenue: 10800,
    split: { academy: 7560, coach: 3240 },
    status: 'draft', generated: '2026-08-01',
  },
  {
    id: 'INV-2026-0845', studentName: 'Rohit Desai', business_entity: 'tots-tennis', period: 'August 2026',
    groupClasses: { sessions: 12, rate: 500, total: 6000 },
    oneOnOne: { sessions: 2, rate: 1200, total: 2400 },
    totalRevenue: 8400,
    split: { academy: 5880, coach: 2520 },
    status: 'sent', generated: '2026-08-01',
  },
];