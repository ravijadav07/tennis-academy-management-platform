export const parentPayments = [
  { id: 'pp-1', date: '2026-08-01', amount: 4500, type: 'Monthly Fee', gateway: 'cc_avenue', status: 'paid', invoiceId: 'INV-2026-0842' },
  { id: 'pp-2', date: '2026-07-01', amount: 4500, type: 'Monthly Fee', gateway: 'cc_avenue', status: 'paid', invoiceId: 'INV-2026-0790' },
  { id: 'pp-3', date: '2026-06-01', amount: 4500, type: 'Monthly Fee', gateway: 'cc_avenue', status: 'paid', invoiceId: 'INV-2026-0730' },
  { id: 'pp-4', date: '2026-05-01', amount: 4500, type: 'Monthly Fee', gateway: 'cc_avenue', status: 'paid', invoiceId: 'INV-2026-0670' },
  { id: 'pp-5', date: '2026-04-01', amount: 4500, type: 'Monthly Fee', gateway: 'cc_avenue', status: 'paid', invoiceId: 'INV-2026-0610' },
];

export const paymentSummary = {
  totalPaid: 22500,
  nextDue: '2026-09-01',
  nextAmount: 4500,
  paymentMethod: 'CC Avenue',
};