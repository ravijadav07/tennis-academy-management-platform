export const parents = [
  { id: 'par-1', name: 'Rajesh Mehta', phone: '9810012345', email: 'rajesh.m@email.com', children: ['stu-1'], paymentStatus: 'paid', renewalStatus: 'active', business_entity: 'the-club', commHistory: 5, accountStatus: 'active' },
  { id: 'par-2', name: 'Sunita Reddy', phone: '9810012346', email: 'sunita.r@email.com', children: ['stu-2'], paymentStatus: 'paid', renewalStatus: 'active', business_entity: 'the-club', commHistory: 3, accountStatus: 'active' },
  { id: 'par-3', name: 'Manoj Desai', phone: '9810012347', email: 'manoj.d@email.com', children: ['stu-3'], paymentStatus: 'paid', renewalStatus: 'upcoming', business_entity: 'tots-tennis', commHistory: 8, accountStatus: 'active' },
  { id: 'par-4', name: 'Harpreet Kaur', phone: '9810012348', email: 'harpreet.k@email.com', children: ['stu-4'], paymentStatus: 'overdue', renewalStatus: 'overdue', business_entity: 'tots-tennis', commHistory: 4, accountStatus: 'active' },
  { id: 'par-5', name: 'Vikas Sharma', phone: '9810012349', email: 'vikas.s@email.com', children: ['stu-5'], paymentStatus: 'paid', renewalStatus: 'active', business_entity: 'the-club', commHistory: 2, accountStatus: 'active' },
  { id: 'par-6', name: 'Nisha Patel', phone: '9810012350', email: 'nisha.p@email.com', children: ['stu-6'], paymentStatus: 'paid', renewalStatus: 'active', business_entity: 'the-club', commHistory: 6, accountStatus: 'active' },
  { id: 'par-7', name: 'Ramesh Joshi', phone: '9810012351', email: 'ramesh.j@email.com', children: ['stu-7'], paymentStatus: 'pending', renewalStatus: 'upcoming', business_entity: 'tots-tennis', commHistory: 3, accountStatus: 'active' },
  { id: 'par-8', name: 'Pooja Gupta', phone: '9810012352', email: 'pooja.g@email.com', children: ['stu-8'], paymentStatus: 'paid', renewalStatus: 'active', business_entity: 'the-club', commHistory: 7, accountStatus: 'active' },
  { id: 'par-9', name: 'Sandeep Agarwal', phone: '9810012353', email: 'sandeep.a@email.com', children: ['stu-9'], paymentStatus: 'overdue', renewalStatus: 'overdue', business_entity: 'tots-tennis', commHistory: 2, accountStatus: 'active' },
  { id: 'par-10', name: 'Kavita Nair', phone: '9810012354', email: 'kavita.n@email.com', children: ['stu-10'], paymentStatus: 'paid', renewalStatus: 'active', business_entity: 'the-club', commHistory: 4, accountStatus: 'active' },
  { id: 'par-11', name: 'Deepak Choudhary', phone: '9810012355', email: 'deepak.c@email.com', children: ['stu-11'], paymentStatus: 'paid', renewalStatus: 'active', business_entity: 'the-club', commHistory: 1, accountStatus: 'active' },
  { id: 'par-12', name: 'Anita Iyer', phone: '9810012356', email: 'anita.i@email.com', children: ['stu-12'], paymentStatus: 'paid', renewalStatus: 'upcoming', business_entity: 'tots-tennis', commHistory: 5, accountStatus: 'active' },
  { id: 'par-13', name: 'Gurpreet Singh', phone: '9810012357', email: 'gurpreet.s@email.com', children: ['stu-13'], paymentStatus: 'overdue', renewalStatus: 'overdue', business_entity: 'the-club', commHistory: 3, accountStatus: 'active' },
  { id: 'par-14', name: 'Neelam Malhotra', phone: '9810012358', email: 'neelam.m@email.com', children: ['stu-14'], paymentStatus: 'paid', renewalStatus: 'active', business_entity: 'tots-tennis', commHistory: 4, accountStatus: 'active' },
  { id: 'par-15', name: 'Salman Khan', phone: '9810012359', email: 'salman.k@email.com', children: ['stu-15'], paymentStatus: 'paid', renewalStatus: 'active', business_entity: 'the-club', commHistory: 6, accountStatus: 'active' },
];

export const getChildNames = (parentId) => {
  const parent = parents.find(p => p.id === parentId);
  return parent ? parent.children : [];
};