export const coachSchedule = [
  { id: 'cs-1', type: 'group', batch: 'Advanced Tournament', day: 'Mon', time: '4:00 PM - 6:00 PM', students: 18, location: 'Court 1', status: 'confirmed', session_period: 'full_day' },
  { id: 'cs-2', type: 'one_on_one', student: 'Arjun Mehta', day: 'Mon', time: '6:30 PM - 7:30 PM', status: 'confirmed_yes', confirmation: 'confirmed_yes', session_period: 'half_day' },
  { id: 'cs-3', type: 'group', batch: 'Advanced Tournament', day: 'Wed', time: '4:00 PM - 6:00 PM', students: 18, location: 'Court 1', status: 'confirmed', session_period: 'full_day' },
  { id: 'cs-4', type: 'one_on_one', student: 'Rohit Desai', day: 'Wed', time: '6:30 PM - 7:30 PM', status: 'declined_no', confirmation: 'declined_no', session_period: 'half_day' },
  { id: 'cs-5', type: 'group', batch: 'Advanced Tournament', day: 'Fri', time: '4:00 PM - 6:00 PM', students: 18, location: 'Court 1', status: 'confirmed', session_period: 'full_day' },
  { id: 'cs-6', type: 'one_on_one', student: 'Ishaan Gupta', day: 'Fri', time: '6:30 PM - 7:30 PM', status: 'confirmed_yes', confirmation: 'confirmed_yes', session_period: 'half_day' },
  { id: 'cs-7', type: 'one_on_one', student: 'Zara Khan', day: 'Thu', time: '6:30 PM - 7:30 PM', status: 'sent_no_reply', confirmation: 'sent_no_reply', session_period: 'half_day' },
];

export const coachStudents = [
  { id: 'stu-1', name: 'Arjun Mehta', age: 15, ageGroup: 'U-16', level: 'advanced', attendance: 92, packageExpiry: '2026-09-15', daysRemaining: 39 },
  { id: 'stu-3', name: 'Rohit Desai', age: 17, ageGroup: 'U-18', level: 'advanced', attendance: 95, packageExpiry: '2026-08-20', daysRemaining: 13 },
  { id: 'stu-8', name: 'Ishaan Gupta', age: 16, ageGroup: 'U-16', level: 'advanced', attendance: 80, packageExpiry: '2026-08-30', daysRemaining: 23 },
  { id: 'stu-12', name: 'Advait Iyer', age: 18, ageGroup: 'U-18', level: 'advanced', attendance: 91, packageExpiry: '2026-08-18', daysRemaining: 11 },
  { id: 'stu-15', name: 'Zara Khan', age: 16, ageGroup: 'U-16', level: 'advanced', attendance: 94, packageExpiry: '2026-09-01', daysRemaining: 25 },
];

export const coachStats = {
  totalStudents: 45,
  avgAttendance: 89,
  sessionsThisMonth: 42,
  oneOnOneSessions: 12,
  totalHours: 96,
  rating: 4.8,
  // Club coach: session-based payroll
  monthlySalary: 45000,
  halfDaySessions: 18,
  fullDaySessions: 24,
  payrollMethod: 'Salary (Club)',
};