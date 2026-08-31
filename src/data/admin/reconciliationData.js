export const reconciliationEntries = [
  { id: 'rec-1', studentName: 'Arjun Mehta', business_entity: 'the-club', excelAmount: 4500, systemAmount: 4500, difference: 0, gateway: 'cc_avenue', status: 'matched', date: '2026-08-01' },
  { id: 'rec-2', studentName: 'Kavya Reddy', business_entity: 'the-club', excelAmount: 12000, systemAmount: 12000, difference: 0, gateway: 'cc_avenue', status: 'matched', date: '2026-07-01' },
  { id: 'rec-3', studentName: 'Rohit Desai', business_entity: 'tots-tennis', excelAmount: 5000, systemAmount: 5000, difference: 0, gateway: 'stripe', status: 'matched', date: '2026-08-01' },
  { id: 'rec-4', studentName: 'Simran Kaur', business_entity: 'tots-tennis', excelAmount: 4000, systemAmount: 0, difference: 4000, gateway: 'stripe', status: 'mismatch', date: '2026-08-07', note: 'Payment not reflected in system' },
  { id: 'rec-5', studentName: 'Diya Agarwal', business_entity: 'tots-tennis', excelAmount: 3500, systemAmount: 3500, difference: 0, gateway: 'stripe', status: 'matched', date: '2026-08-06' },
  { id: 'rec-6', studentName: 'Pari Singh', business_entity: 'the-club', excelAmount: 3000, systemAmount: 3000, difference: 0, gateway: 'excel_reported', status: 'new', date: '2026-08-07', note: 'New entry from Excel upload' },
  { id: 'rec-7', studentName: 'Vihaan Joshi', business_entity: 'tots-tennis', excelAmount: 3500, systemAmount: 0, difference: 3500, gateway: 'stripe', status: 'mismatch', date: '2026-08-05', note: 'Pending in system' },
  { id: 'rec-8', studentName: 'Advait Iyer', business_entity: 'tots-tennis', excelAmount: 5000, systemAmount: 5000, difference: 0, gateway: 'stripe', status: 'matched', date: '2026-08-02' },
];

export const reconciliationStats = {
  totalEntries: 8,
  matched: 5,
  mismatched: 2,
  new: 1,
  totalDifference: 7500,
};