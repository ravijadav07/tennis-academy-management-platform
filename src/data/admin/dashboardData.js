export const dashboardStats = {
  totalStudents: { value: 296, delta: 12, label: 'Total Students' },
  activeCoaches: { value: 10, delta: 0, label: 'Active Coaches' },
  monthlyRevenue: { value: '₹48,500', delta: 8, label: 'Monthly Revenue' },
  attendanceRate: { value: 87, delta: 2, label: 'Attendance Rate' },
  batchOccupancy: {
    overall: 74,
    totalSeats: 400,
    filledSeats: 296,
    delta: -3,
    byEntity: {
      'the-club': { rate: 72, seats: 220, filled: 158 },
      'tots-tennis': { rate: 77, seats: 180, filled: 138 },
    },
  },
  pendingLeads: { value: 47, delta: 12, label: 'Pending Leads' },
  renewalsDue: { value: 34, delta: 5, label: 'Renewals Due (30 days)' },
};

export const revenueTrend = [
  { label: 'Jul', value: 32000 },
  { label: 'Aug', value: 35000 },
  { label: 'Sep', value: 38000 },
  { label: 'Oct', value: 42500 },
  { label: 'Nov', value: 45000 },
  { label: 'Dec', value: 48000 },
  { label: 'Jan', value: 44000 },
  { label: 'Feb', value: 46000 },
  { label: 'Mar', value: 49000 },
  { label: 'Apr', value: 51000 },
  { label: 'May', value: 47500 },
  { label: 'Jun', value: 52000 },
  { label: 'Jul', value: 54000 },
  { label: 'Aug', value: 48500 },
];

export const attendanceTrend = [
  { label: 'Mon', value: 92 },
  { label: 'Tue', value: 88 },
  { label: 'Wed', value: 85 },
  { label: 'Thu', value: 90 },
  { label: 'Fri', value: 82 },
  { label: 'Sat', value: 78 },
  { label: 'Sun', value: 65 },
];

export const enrollmentByEntity = [
  { label: 'The Club', value: 158 },
  { label: "TOTS Tennis", value: 138 },
];

export const studentAgeGroups = [
  { label: 'U-10', value: 45 },
  { label: 'U-14', value: 98 },
  { label: 'U-16', value: 82 },
  { label: 'U-18', value: 51 },
  { label: 'Adult', value: 20 },
];