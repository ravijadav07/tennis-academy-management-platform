export const renewals = [
  { id: 'ren-1', studentId: 'stu-1', studentName: 'Arjun Mehta', parentName: 'Rajesh Mehta', business_entity: 'the-club', plan: 'Monthly', amount: 4500, expiry: '2026-09-15', daysRemaining: 39, paymentStatus: 'paid', lastReminder: '2026-08-01', nextReminder: '2026-09-09', status: 'active' },
  { id: 'ren-2', studentId: 'stu-2', studentName: 'Kavya Reddy', parentName: 'Sunita Reddy', business_entity: 'the-club', plan: 'Quarterly', amount: 12000, expiry: '2026-10-01', daysRemaining: 55, paymentStatus: 'paid', lastReminder: null, nextReminder: '2026-09-25', status: 'active' },
  { id: 'ren-3', studentId: 'stu-3', studentName: 'Rohit Desai', parentName: 'Manoj Desai', business_entity: 'tots-tennis', plan: 'Monthly', amount: 5000, expiry: '2026-08-20', daysRemaining: 13, paymentStatus: 'pending', lastReminder: '2026-08-01', nextReminder: '2026-08-14', status: 'upcoming' },
  { id: 'ren-4', studentId: 'stu-4', studentName: 'Simran Kaur', parentName: 'Harpreet Kaur', business_entity: 'tots-tennis', plan: '4-Week', amount: 4000, expiry: '2026-08-12', daysRemaining: 5, paymentStatus: 'overdue', lastReminder: '2026-08-06', nextReminder: '2026-08-07', status: 'overdue' },
  { id: 'ren-5', studentId: 'stu-5', studentName: 'Aarav Sharma', parentName: 'Vikas Sharma', business_entity: 'the-club', plan: 'Monthly', amount: 3500, expiry: '2026-09-01', daysRemaining: 25, paymentStatus: 'paid', lastReminder: null, nextReminder: '2026-08-26', status: 'active' },
  { id: 'ren-6', studentId: 'stu-7', studentName: 'Vihaan Joshi', parentName: 'Ramesh Joshi', business_entity: 'tots-tennis', plan: 'Monthly', amount: 3500, expiry: '2026-08-25', daysRemaining: 18, paymentStatus: 'pending', lastReminder: '2026-08-05', nextReminder: '2026-08-19', status: 'upcoming' },
  { id: 'ren-7', studentId: 'stu-9', studentName: 'Diya Agarwal', parentName: 'Sandeep Agarwal', business_entity: 'tots-tennis', plan: '4-Week', amount: 3500, expiry: '2026-08-10', daysRemaining: 3, paymentStatus: 'overdue', lastReminder: '2026-08-04', nextReminder: '2026-08-07', status: 'overdue' },
  { id: 'ren-8', studentId: 'stu-13', studentName: 'Pari Singh', parentName: 'Gurpreet Singh', business_entity: 'the-club', plan: '4-Week', amount: 3000, expiry: '2026-08-07', daysRemaining: 0, paymentStatus: 'overdue', lastReminder: '2026-08-01', nextReminder: '2026-08-07', status: 'expired' },
  { id: 'ren-9', studentId: 'stu-12', studentName: 'Advait Iyer', parentName: 'Anita Iyer', business_entity: 'tots-tennis', plan: 'Monthly', amount: 5000, expiry: '2026-08-18', daysRemaining: 11, paymentStatus: 'pending', lastReminder: '2026-07-30', nextReminder: '2026-08-12', status: 'upcoming' },
  { id: 'ren-10', studentId: 'stu-15', studentName: 'Zara Khan', parentName: 'Salman Khan', business_entity: 'the-club', plan: 'Monthly', amount: 5000, expiry: '2026-09-01', daysRemaining: 25, paymentStatus: 'paid', lastReminder: null, nextReminder: '2026-08-26', status: 'active' },
];

export const renewalStats = {
  upcoming7Days: 12,
  overdue: 8,
  activeCampaigns: 12,
  pausedCampaigns: 3,
};

export const reminderDrips = [
  { renewalId: 'ren-4', studentName: 'Simran Kaur', expiry: '2026-08-12', touchpoints: [
    { day: -6, date: '2026-08-06', channel: 'SMS', status: 'sent' },
    { day: 7, date: '2026-08-19', channel: 'Email', status: 'pending' },
    { day: 14, date: '2026-08-26', channel: 'Email', status: 'queued' },
    { day: 21, date: '2026-09-02', channel: 'SMS', status: 'queued' },
    { day: 28, date: '2026-09-09', channel: 'Email', status: 'queued' },
  ], autoStop: false },
  { renewalId: 'ren-7', studentName: 'Diya Agarwal', expiry: '2026-08-10', touchpoints: [
    { day: -6, date: '2026-08-04', channel: 'SMS', status: 'sent' },
    { day: 7, date: '2026-08-17', channel: 'Email', status: 'pending' },
    { day: 14, date: '2026-08-24', channel: 'Email', status: 'queued' },
    { day: 21, date: '2026-08-31', channel: 'SMS', status: 'queued' },
    { day: 28, date: '2026-09-07', channel: 'Email', status: 'queued' },
  ], autoStop: false },
  { renewalId: 'ren-3', studentName: 'Rohit Desai', expiry: '2026-08-20', touchpoints: [
    { day: -6, date: '2026-08-01', channel: 'SMS', status: 'sent' },
    { day: 0, date: '2026-08-20', channel: 'Email', status: 'pending' },
  ], autoStop: false, note: 'Parent indicated payment on Aug 20' },
];