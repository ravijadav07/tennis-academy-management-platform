export const attendanceRecords = [
  { id: 'att-1', studentId: 'stu-1', studentName: 'Arjun Mehta', batch: 'Advanced Tournament', date: '2026-08-07', status: 'present', checkIn: '3:55 PM', checkOut: '6:05 PM', session_period: 'full_day', marked_by: 'coach' },
  { id: 'att-2', studentId: 'stu-2', studentName: 'Kavya Reddy', batch: 'Intermediate Group', date: '2026-08-06', status: 'present', checkIn: '3:58 PM', checkOut: '6:02 PM', session_period: 'full_day', marked_by: 'coach' },
  { id: 'att-3', studentId: 'stu-3', studentName: 'Rohit Desai', batch: 'Advanced Tournament', date: '2026-08-07', status: 'absent', checkIn: null, checkOut: null, session_period: 'full_day', marked_by: 'coach' },
  { id: 'att-4', studentId: 'stu-4', studentName: 'Simran Kaur', batch: 'Intermediate Group', date: '2026-08-06', status: 'late', checkIn: '4:25 PM', checkOut: '6:00 PM', session_period: 'full_day', marked_by: 'coach' },
  { id: 'att-5', studentId: 'stu-5', studentName: 'Aarav Sharma', batch: 'Beginner Batch A', date: '2026-08-07', status: 'present', checkIn: '3:50 PM', checkOut: '5:02 PM', session_period: 'half_day', marked_by: 'coach' },
  { id: 'att-6', studentId: 'stu-6', studentName: 'Ananya Patel', batch: 'Intermediate Group', date: '2026-08-06', status: 'present', checkIn: '3:55 PM', checkOut: '6:00 PM', session_period: 'full_day', marked_by: 'coach' },
  { id: 'att-7', studentId: 'stu-7', studentName: 'Vihaan Joshi', batch: 'Beginner Batch B', date: '2026-08-05', status: 'absent', checkIn: null, checkOut: null, session_period: 'half_day', marked_by: 'coach' },
  { id: 'att-8', studentId: 'stu-8', studentName: 'Ishaan Gupta', batch: 'Advanced Tournament', date: '2026-08-07', status: 'present', checkIn: '3:52 PM', checkOut: '6:00 PM', session_period: 'full_day', marked_by: 'coach' },
  { id: 'att-9', studentId: 'stu-9', studentName: 'Diya Agarwal', batch: 'Beginner Batch A', date: '2026-08-07', status: 'present', checkIn: '3:57 PM', checkOut: '5:00 PM', session_period: 'half_day', marked_by: 'coach' },
  { id: 'att-10', studentId: 'stu-10', studentName: 'Reyansh Nair', batch: 'Intermediate Group', date: '2026-08-06', status: 'present', checkIn: '4:00 PM', checkOut: '6:03 PM', session_period: 'full_day', marked_by: 'coach' },
  { id: 'att-11', studentId: 'stu-11', studentName: 'Myra Choudhary', batch: 'Beginner Batch B', date: '2026-08-05', status: 'late', checkIn: '4:15 PM', checkOut: '5:00 PM', session_period: 'half_day', marked_by: 'coach' },
  { id: 'att-12', studentId: 'stu-12', studentName: 'Advait Iyer', batch: 'Advanced Tournament', date: '2026-08-07', status: 'present', checkIn: '3:54 PM', checkOut: '6:05 PM', session_period: 'full_day', marked_by: 'coach' },
  { id: 'att-13', studentId: 'stu-13', studentName: 'Pari Singh', batch: 'Beginner Batch A', date: '2026-08-05', status: 'absent', checkIn: null, checkOut: null, session_period: 'half_day', marked_by: 'coach' },
  { id: 'att-14', studentId: 'stu-14', studentName: 'Kabir Malhotra', batch: 'Intermediate Group', date: '2026-08-06', status: 'present', checkIn: '3:59 PM', checkOut: '6:00 PM', session_period: 'full_day', marked_by: 'coach' },
  { id: 'att-15', studentId: 'stu-15', studentName: 'Zara Khan', batch: 'Advanced Tournament', date: '2026-08-07', status: 'present', checkIn: '3:53 PM', checkOut: '6:04 PM', session_period: 'full_day', marked_by: 'coach' },
];

export const coachAttendance = [
  { id: 'coach-att-1', coachId: 'coach-1', coachName: 'Vikram Singh', date: '2026-08-07', status: 'present', sessions: 3, session_period: 'full_day', approval_status: 'approved' },
  { id: 'coach-att-2', coachId: 'coach-2', coachName: 'Sania Mirza', date: '2026-08-06', status: 'present', sessions: 2, session_period: 'full_day', approval_status: 'approved' },
  { id: 'coach-att-3', coachId: 'coach-3', coachName: 'Rajesh Kumar', date: '2026-08-07', status: 'present', sessions: 2, session_period: 'half_day', approval_status: 'pending' },
];

export const dailyConfirmationStats = {
  total: 24,
  confirmed: 18,
  pending: 6,
};

export const classesExpiringStats = {
  batchesCount: 4,
  daysThreshold: 10,
};