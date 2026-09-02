import React, { useState, useEffect } from 'react';
import { useStudents } from '../../../hooks/useStudents';
import { useDebounce } from '../../../hooks/useDebounce';
import { useDb } from '../../../context/DbContext';
import Card from '../../ui/Card';
import StatusPill from '../../ui/StatusPill';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import EligibilityStatusPill from '../../ui/EligibilityStatusPill';
import Dropdown from '../../ui/Dropdown';
import { toast } from 'sonner';
import { Search, Plus, Pencil, Archive, UserPlus, FileText, RefreshCw, Mail } from 'lucide-react';
import { GST_RATE } from '../../../utils/settings';
import { preparePaymentReminder } from '../../../utils/notificationEngine';
import { formatDateDDMMYY, formatTime12h } from '../../../utils/formatters';

const fieldBase = 'w-full h-[38px] px-3 rounded-lg border border-line bg-white text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all';
const labelCls = 'block text-[10px] font-semibold text-ink-muted uppercase tracking-[0.04em] mb-1';

// --- Configurable settings (expose to admin UI in a later phase) ---
const GUARDIAN_RELATIONSHIPS = ['Father', 'Mother', 'Guardian', 'Other'];
const DURATION_OPTIONS = [
  { value: '15d', label: '15 Days', months: 0.5 }, { value: '1mo', label: '1 Month', months: 1 },
  { value: '1.5mo', label: '1.5 Months', months: 1.5 }, { value: '2mo', label: '2 Months', months: 2 },
  { value: '2.5mo', label: '2.5 Months', months: 2.5 }, { value: '3mo', label: '3 Months', months: 3 },
  { value: '3.5mo', label: '3.5 Months', months: 3.5 }, { value: 'custom', label: 'Custom (days)', months: null },
  { value: 'per-session', label: 'Per Session', months: null },
];
const PAYMENT_STATUSES = ['PAID', 'PENDING', 'PARTIAL', 'COMPLIMENTARY'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Payment Link'];
const ENROLLMENT_TYPES = ['Group', 'Private', 'HPP', 'Add-on', 'Customised'];
// ---

const CATEGORY_OPTIONS = [
  { value: 'ADV', label: 'Advance' },
  { value: 'INT', label: 'Intermediate' },
  { value: 'BEG', label: 'Beginner' },
  { value: 'JDP', label: 'JDP (Junior Development Program)' },
  { value: 'HPP', label: 'HPP (High Performance Program)' },
  { value: 'ADULT', label: 'Adults' },
  { value: 'WEEKEND', label: 'Weekend Coaching' },
  { value: 'FITNESS', label: 'Fitness' },
];

function computeEndDate(joiningDate, durationMonths) {
  if (!joiningDate || !durationMonths) return '';
  const d = new Date(joiningDate + 'T00:00:00+05:30');
  const wholeMonths = Math.floor(durationMonths);
  const hasHalf = durationMonths - wholeMonths >= 0.45;
  d.setMonth(d.getMonth() + wholeMonths);
  if (hasHalf) d.setDate(d.getDate() + 15);
  return d.toISOString().split('T')[0];
}

function calcFee(amount, taxInclusive, discountType, discountVal, gstRate) {
  const rawAmount = parseFloat(amount) || 0;
  const rate = parseFloat(gstRate) || GST_RATE;
  let baseAmount = rawAmount;
  let discount = 0;
  if (discountType === '%' && discountVal) discount = Math.round(baseAmount * (parseFloat(discountVal) / 100));
  else if (discountType === 'flat' && discountVal) discount = parseFloat(discountVal) || 0;
  const afterDiscount = Math.max(0, baseAmount - discount);
  if (taxInclusive) { const taxAmount = Math.round(afterDiscount - afterDiscount / (1 + rate)); return { baseAmount: afterDiscount - taxAmount, discount, taxAmount, finalAmount: afterDiscount }; }
  const taxAmount = Math.round(afterDiscount * rate);
  return { baseAmount: afterDiscount, discount, taxAmount, finalAmount: afterDiscount + taxAmount };
}

function newEnrollmentBlock() {
  return { program: '', enrollmentType: 'Group', ballColor: '', batchId: '', joiningDate: new Date().toISOString().split('T')[0],
    packageDuration: '', endDate: '', amount: '', taxInclusive: false,
    discountType: '', discountVal: '', discountReason: '',
    paymentStatus: 'PAID', paymentMode: '', amountReceived: '',
    paymentDate: new Date().toISOString().split('T')[0], transactionRef: '',
    nextPaymentDue: '', balanceAmount: 0, customLineItems: [] };
}

function renderEnrollmentBlock(blk, setBlk, removable, onRemove, batchOptions = []) {
  const BALL_COLORS = ['Yellow', 'Green', 'Orange', 'Red'];
  const CATEGORIES_WITH_BALL = new Set(['ADV', 'INT', 'BEG', 'WEEKEND', 'JDP', 'HPP']);
  
  function filterBatches(prog, ball) {
    if (!prog) return [];
    // For JDP and HPP, students are placed in Advance, Intermediate, or Green Ball batches (Capacity follows student)
    if (prog === 'JDP' || prog === 'HPP') {
      if (!ball) {
        return batchOptions.filter((b) => ['ADV', 'INT', 'GREEN'].includes(b.program) || b.name?.includes('Advance') || b.name?.includes('Intermediate'));
      }
      return batchOptions.filter((b) => 
        (['ADV', 'INT', 'GREEN'].includes(b.program) || b.name?.includes('Advance') || b.name?.includes('Intermediate')) &&
        (!b.ballLevel || b.ballLevel.toLowerCase() === ball.toLowerCase() || (b.name && b.name.toLowerCase().includes(ball.toLowerCase())))
      );
    }

    if (prog === 'BEG') {
      if (!ball) return batchOptions.filter((b) => (b.name && b.name.toLowerCase().includes('beginner')) || ['GREEN', 'ORANGE', 'RED'].includes(b.program));
      return batchOptions.filter((b) => 
        ((b.name && b.name.toLowerCase().includes('beginner')) || ['GREEN', 'ORANGE', 'RED'].includes(b.program)) &&
        (!b.ballLevel || b.ballLevel.toLowerCase() === ball.toLowerCase() || (b.name && b.name.toLowerCase().includes(ball.toLowerCase())))
      );
    }

    if (CATEGORIES_WITH_BALL.has(prog)) {
      if (!ball) return batchOptions.filter((b) => b.program === prog || (b.name && b.name.toLowerCase().includes(prog.toLowerCase())));
      return batchOptions.filter((b) => 
        (b.program === prog || (b.name && b.name.toLowerCase().includes(prog.toLowerCase()))) && 
        ((b.ballLevel || '').toLowerCase() === ball.toLowerCase() || (b.name && b.name.toLowerCase().includes(ball.toLowerCase())))
      );
    }

    if (['ADULT', 'WEEKEND', 'FITNESS'].includes(prog)) {
      return batchOptions.filter((b) => b.program === prog || (b.name && b.name.toLowerCase().includes(prog.toLowerCase())));
    }

    return batchOptions;
  }

  const batches = filterBatches(blk.program, blk.ballColor);
  const isCustomised = blk.enrollmentType === 'Customised';
  const isAddOn = blk.enrollmentType === 'Add-on';
  const isPrivate = blk.enrollmentType === 'Private' || blk.program === 'PRIVATE';
  const fee = calcFee(blk.amount, blk.taxInclusive, blk.discountType, blk.discountVal, GST_RATE);

  return React.createElement('div', { className: 'rounded-xl border border-line bg-canvas-soft/40 p-3' },
    removable ? React.createElement('div', { className: 'flex justify-end mb-2' },
      React.createElement(Button, { size: 'sm', variant: 'ghost', icon: X, onClick: onRemove, className: '!text-err' }, 'Remove')) : null,
    // Enrollment Type selector
    React.createElement('div', { className: 'grid grid-cols-2 gap-3 mb-2' },
      React.createElement('div', { className: 'space-y-1' },
        React.createElement('label', { className: labelCls }, 'Enrollment Type'),
        React.createElement(Dropdown, { value: blk.enrollmentType || 'Group', onChange: (v) => { const t = typeof v === 'object' ? (v?.value || 'Group') : (v || 'Group'); setBlk({ ...blk, enrollmentType: t, program: t === 'Customised' ? '' : blk.program, customLineItems: t === 'Customised' ? (blk.customLineItems || []) : [] }); }, placeholder: 'Select type...', options: ENROLLMENT_TYPES.map((t) => ({ value: t, label: t })), getOptionLabel: (o) => o?.label || '', getOptionValue: (o) => o?.value || '' })),
      isAddOn ? React.createElement('div', { className: 'space-y-1' },
        React.createElement('label', { className: labelCls }, 'Category'),
        React.createElement(Dropdown, { value: blk.program, onChange: (v) => { const p = typeof v === 'object' ? (v?.value || '') : (v || ''); setBlk({ ...blk, program: p }); }, placeholder: 'Select category...', options: CATEGORY_OPTIONS, getOptionLabel: (o) => o?.label || '', getOptionValue: (o) => o?.value || '' })) : null),
    // Customised line items
    isCustomised ? React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'border-t border-line pt-2 mt-2' },
        React.createElement('p', { className: 'text-[10px] font-semibold text-ink-muted uppercase mb-2' }, 'Custom Line Items'),
        (blk.customLineItems || []).map((li, i) => React.createElement('div', { key: i, className: 'flex items-center gap-2 mb-2' },
          React.createElement('div', { className: 'flex-1 grid grid-cols-2 gap-2' },
            React.createElement('div', { className: 'space-y-1' },
              React.createElement('label', { className: labelCls }, 'Category *'),
              React.createElement(Dropdown, { value: li.category || '', onChange: (v) => { const c = typeof v === 'object' ? (v?.value || '') : (v || ''); const items = [...(blk.customLineItems || [])]; items[i] = { ...items[i], category: c }; setBlk({ ...blk, customLineItems: items }); }, placeholder: 'Category *', options: CATEGORY_OPTIONS, getOptionLabel: (o) => o?.label || '', getOptionValue: (o) => o?.value || '' })),
            React.createElement('div', { className: 'space-y-1' },
              React.createElement('label', { className: labelCls }, 'Rate (Rs.)'),
              React.createElement('input', { type: 'number', value: li.rate || '', onChange: (e) => { const items = [...(blk.customLineItems || [])]; items[i] = { ...items[i], rate: e.target.value }; setBlk({ ...blk, customLineItems: items }); }, className: fieldBase, placeholder: '0' }))),
          React.createElement('button', { onClick: () => { const items = (blk.customLineItems || []).filter((_, j) => j !== i); setBlk({ ...blk, customLineItems: items }); }, className: 'text-err text-[10px] hover:underline mt-5 flex-shrink-0' }, 'Remove'))),
        React.createElement(Button, { size: 'sm', variant: 'ghost', icon: Plus, onClick: () => setBlk({ ...blk, customLineItems: [...(blk.customLineItems || []), { category: '', rate: '' }] }), className: 'w-full' }, '+ Add Line Item'),
        React.createElement('div', { className: 'px-3 py-2 rounded-lg bg-brand-50 text-xs text-brand-600 mt-2' }, 'Every line item must have a valid category or the enrollment cannot be saved.')),
      React.createElement('div', { className: 'border-t border-line mt-2 pt-2' },
        React.createElement('label', { className: labelCls }, 'Total Amount (Rs.)'),
        React.createElement('input', { type: 'number', value: blk.amount, onChange: (e) => setBlk({ ...blk, amount: e.target.value }), className: fieldBase, placeholder: 'Sum of all line items' }))) : null,
    !isCustomised ? React.createElement(React.Fragment, null,
      React.createElement('div', { className: CATEGORIES_WITH_BALL.has(blk.program) ? 'grid grid-cols-2 gap-3 items-center' : 'space-y-1' },
        React.createElement('div', { className: 'space-y-1' },
          React.createElement('label', { className: labelCls }, 'Category (Priority 1) *'),
          React.createElement(Dropdown, { value: blk.program, onChange: (v) => { const p = typeof v === 'object' ? (v?.value || '') : (v || ''); setBlk({ ...blk, program: p, ballColor: '', batchId: '' }); }, placeholder: 'Select category...', options: CATEGORY_OPTIONS, getOptionLabel: (o) => o?.label || '', getOptionValue: (o) => o?.value || '' })),
        CATEGORIES_WITH_BALL.has(blk.program) ? React.createElement('div', { className: 'space-y-1' },
          React.createElement('label', { className: labelCls + ' text-brand-600 font-bold' }, 'Ball Color (Priority 2) *'),
          React.createElement(Dropdown, { value: blk.ballColor, onChange: (v) => { const c = typeof v === 'object' ? (v?.value || '') : (v || ''); setBlk({ ...blk, ballColor: c, batchId: '' }); }, placeholder: 'Select ball color...', options: BALL_COLORS.map((c) => ({ value: c, label: c })), getOptionLabel: (o) => o?.label || '', getOptionValue: (o) => o?.value || '' })) : null),

      isPrivate ? React.createElement('div', { className: 'space-y-3 mt-3' },
        React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
          React.createElement('div', { className: 'space-y-1' },
            React.createElement('label', { className: labelCls }, 'Per-Session Rate (Rs.)'),
            React.createElement('input', { type: 'number', value: blk.amount, onChange: (e) => setBlk({ ...blk, amount: e.target.value }), className: fieldBase, placeholder: '800' })),
          React.createElement('div', { className: 'space-y-1' },
            React.createElement('label', { className: labelCls }, 'Assigned Coach'),
            React.createElement('select', { value: blk.coachId || '', onChange: (e) => setBlk({ ...blk, coachId: e.target.value }), className: fieldBase },
              React.createElement('option', { value: '' }, 'Select coach...'), ...(state.coaches || []).map((c) => React.createElement('option', { key: c.id, value: c.id }, c.name))))),
        React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
          React.createElement('div', { className: 'space-y-1' },
            React.createElement('label', { className: labelCls }, 'Joining Date'),
            React.createElement('input', { type: 'date', value: blk.joiningDate, onChange: (e) => setBlk({ ...blk, joiningDate: e.target.value }), className: fieldBase })),
          React.createElement('div', { className: 'space-y-1' },
            React.createElement('label', { className: labelCls }, 'Package Duration'),
            React.createElement('select', { value: blk.packageDuration, onChange: (e) => setBlk({ ...blk, packageDuration: e.target.value }), className: fieldBase },
              React.createElement('option', { value: '' }, 'Skip'), React.createElement('option', { value: 'per-session' }, 'Per Session'), ...DURATION_OPTIONS.filter((d) => d.value !== 'per-session').map((d) => React.createElement('option', { key: d.value, value: d.value }, d.label))))),
        blk.amount ? React.createElement('div', { className: 'grid grid-cols-4 gap-2 mt-2 text-[10px] bg-white rounded-lg p-2 border border-line/50' },
          React.createElement('div', null, React.createElement('span', { className: 'text-ink-faint' }, 'Rate'), React.createElement('p', { className: 'font-semibold text-ok' }, 'Rs.' + (parseFloat(blk.amount) || 0))),
          React.createElement('div', null, React.createElement('span', { className: 'text-ink-faint' }, 'GST'), React.createElement('p', { className: 'font-semibold text-ink' }, 'Rs.' + Math.round((parseFloat(blk.amount) || 0) * GST_RATE))),
          React.createElement('div', null, React.createElement('span', { className: 'text-ink-faint' }, 'Final'), React.createElement('p', { className: 'font-semibold text-ok' }, 'Rs.' + Math.round((parseFloat(blk.amount) || 0) * (1 + GST_RATE)))),
          React.createElement('div', null, React.createElement('span', { className: 'text-ink-faint' }, 'Coach'), React.createElement('p', { className: 'font-semibold text-ink' }, (state.coaches || []).find((c) => c.id === blk.coachId)?.name || '—'))) : null) : null) : null,
    !isPrivate ? React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'grid grid-cols-2 gap-3 mt-3' },
        React.createElement('div', { className: 'space-y-1' },
          React.createElement('label', { className: labelCls }, 'Batch (Priority 3) *'),
          React.createElement(Dropdown, { value: blk.batchId, onChange: (v) => setBlk({ ...blk, batchId: typeof v === 'object' ? (v?.value || '') : (v || '') }), placeholder: !blk.program ? 'Select Category first' : batches.length === 0 ? 'No batches available' : 'Select batch...', disabled: !blk.program || batches.length === 0, options: batches.map((b) => ({ value: b.id, label: `${b.name || `${b.program}${b.ballLevel ? ' · ' + b.ballLevel : ''} (${b.startTime || ''})`} (${b.dayPattern})` })), getOptionLabel: (o) => o?.label || '', getOptionValue: (o) => o?.value || '' })),
        React.createElement('div', { className: 'space-y-1' },
          React.createElement('label', { className: labelCls }, 'Joining Date'),
          React.createElement('input', { type: 'date', value: blk.joiningDate, onChange: (e) => setBlk({ ...blk, joiningDate: e.target.value }), className: fieldBase }))),
      React.createElement('div', { className: 'grid grid-cols-2 gap-3 mt-3' },
        React.createElement('div', { className: 'space-y-1' },
          React.createElement('label', { className: labelCls }, 'Package Duration'),
          React.createElement(Dropdown, { value: blk.packageDuration, onChange: (v) => { const d = typeof v === 'object' ? (v?.value || '') : (v || ''); const dur = DURATION_OPTIONS.find((x) => x.value === d); const months = dur?.months; const endDate = d === 'custom' ? blk.endDate : computeEndDate(blk.joiningDate, months); setBlk({ ...blk, packageDuration: d, endDate }); }, placeholder: 'Skip', options: DURATION_OPTIONS, getOptionLabel: (o) => o?.label || '', getOptionValue: (o) => o?.value || '' })),
        React.createElement('div', { className: 'space-y-1' },
          React.createElement('label', { className: labelCls }, 'End Date ' + (blk.packageDuration === 'custom' ? '(manual)' : '(auto)')),
          React.createElement('input', { type: blk.packageDuration === 'custom' ? 'date' : 'text', value: blk.endDate || '', onChange: (e) => setBlk({ ...blk, endDate: e.target.value }), className: fieldBase, disabled: blk.packageDuration && blk.packageDuration !== 'custom', placeholder: blk.packageDuration ? 'auto-computed' : 'YYYY-MM-DD' }))),
      React.createElement('div', { className: 'border-t border-line mt-3 pt-3' },
        React.createElement('p', { className: 'text-[10px] font-semibold text-ink-muted uppercase mb-2' }, 'Fee & Tax'),
        React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
          React.createElement('div', { className: 'space-y-1' }, React.createElement('label', { className: labelCls }, 'Amount (Rs.)'), React.createElement('input', { type: 'number', value: blk.amount, onChange: (e) => setBlk({ ...blk, amount: e.target.value }), className: fieldBase, placeholder: '8000' })),
          React.createElement('div', { className: 'space-y-1 pt-5' }, React.createElement('label', { className: 'flex items-center gap-2 text-xs' }, React.createElement('input', { type: 'checkbox', checked: blk.taxInclusive, onChange: (e) => setBlk({ ...blk, taxInclusive: e.target.checked }) }), 'Tax-inclusive'))),
        React.createElement('div', { className: 'grid grid-cols-2 gap-3 mt-2' },
          React.createElement('div', { className: 'space-y-1' }, React.createElement('label', { className: labelCls }, 'Discount'), React.createElement('div', { className: 'flex gap-1.5 items-center' }, React.createElement('select', { value: blk.discountType, onChange: (e) => setBlk({ ...blk, discountType: e.target.value }), className: 'flex-shrink-0 h-[38px] w-[72px] sm:w-[80px] px-2 rounded-lg border border-line bg-white text-[12px] text-ink outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all' }, React.createElement('option', { value: '' }, 'None'), React.createElement('option', { value: '%' }, '%'), React.createElement('option', { value: 'flat' }, 'Rs.')), React.createElement('input', { type: 'number', value: blk.discountVal, onChange: (e) => setBlk({ ...blk, discountVal: e.target.value }), className: fieldBase + ' flex-1 min-w-0', disabled: !blk.discountType, placeholder: '0' }))),
          React.createElement('div', { className: 'space-y-1' }, React.createElement('label', { className: labelCls }, 'Discount Reason'), React.createElement('input', { value: blk.discountReason || '', onChange: (e) => setBlk({ ...blk, discountReason: e.target.value }), className: fieldBase, disabled: !blk.discountType, placeholder: 'Required if discount applied' }))),
        blk.amount ? React.createElement('div', { className: 'grid grid-cols-4 gap-2 mt-2 text-[10px] bg-white rounded-lg p-2 border border-line/50' },
          React.createElement('div', null, React.createElement('span', { className: 'text-ink-faint' }, 'Base'), React.createElement('p', { className: 'font-semibold text-ink' }, 'Rs.' + fee.baseAmount)),
          React.createElement('div', null, React.createElement('span', { className: 'text-ink-faint' }, 'Discount'), React.createElement('p', { className: 'font-semibold text-err' }, '-Rs.' + fee.discount)),
          React.createElement('div', null, React.createElement('span', { className: 'text-ink-faint' }, `GST (${Math.round(GST_RATE * 100)}%)`), React.createElement('p', { className: 'font-semibold text-ink' }, 'Rs.' + fee.taxAmount)),
          React.createElement('div', null, React.createElement('span', { className: 'text-ink-faint' }, 'Final'), React.createElement('p', { className: 'font-semibold text-ok' }, 'Rs.' + fee.finalAmount))) : null),
      React.createElement('div', { className: 'border-t border-line mt-3 pt-3' },
        React.createElement('p', { className: 'text-[10px] font-semibold text-ink-muted uppercase mb-2' }, 'Payment'),
        React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
          React.createElement('div', { className: 'space-y-1' }, React.createElement('label', { className: labelCls }, 'Status'), React.createElement(Dropdown, { value: blk.paymentStatus, onChange: (v) => setBlk({ ...blk, paymentStatus: typeof v === 'object' ? (v?.value || 'PAID') : (v || 'PAID') }), options: PAYMENT_STATUSES.map((s) => ({ value: s, label: s })), getOptionLabel: (o) => o?.label || '', getOptionValue: (o) => o?.value || '' }))),
          React.createElement('div', { className: 'space-y-1' }, React.createElement('label', { className: labelCls }, 'Mode'), React.createElement(Dropdown, { value: blk.paymentMode, onChange: (v) => setBlk({ ...blk, paymentMode: typeof v === 'object' ? (v?.value || '') : (v || '') }), placeholder: 'Select...', options: PAYMENT_MODES.map((m) => ({ value: m, label: m })), getOptionLabel: (o) => o?.label || '', getOptionValue: (o) => o?.value || '' }))),
        React.createElement('div', { className: 'grid grid-cols-3 gap-3 mt-2' },
          React.createElement('div', { className: 'space-y-1' }, React.createElement('label', { className: labelCls }, 'Received'), React.createElement('input', { type: 'number', value: blk.amountReceived, onChange: (e) => setBlk({ ...blk, amountReceived: e.target.value, balanceAmount: fee.finalAmount - (parseFloat(e.target.value) || 0) }), className: fieldBase, disabled: blk.paymentStatus === 'COMPLIMENTARY' })),
          React.createElement('div', { className: 'space-y-1' }, React.createElement('label', { className: labelCls }, 'Balance'), React.createElement('input', { type: 'text', value: 'Rs.' + ((fee.finalAmount || 0) - (parseFloat(blk.amountReceived) || 0)), className: fieldBase + ' opacity-50', readOnly: true })),
          React.createElement('div', { className: 'space-y-1' }, React.createElement('label', { className: labelCls }, 'Payment Date'), React.createElement('input', { type: 'date', value: blk.paymentDate, onChange: (e) => setBlk({ ...blk, paymentDate: e.target.value }), className: fieldBase }))),
        React.createElement('div', { className: 'grid grid-cols-2 gap-3 mt-2' },
          React.createElement('div', { className: 'space-y-1' }, React.createElement('label', { className: labelCls }, 'Transaction Ref'), React.createElement('input', { value: blk.transactionRef || '', onChange: (e) => setBlk({ ...blk, transactionRef: e.target.value }), className: fieldBase, placeholder: 'Optional' })),
          React.createElement('div', { className: 'space-y-1' }, React.createElement('label', { className: labelCls }, 'Next Payment Due'), React.createElement('input', { type: 'date', value: blk.nextPaymentDue || '', onChange: (e) => setBlk({ ...blk, nextPaymentDue: e.target.value }), className: fieldBase, disabled: blk.paymentStatus === 'COMPLIMENTARY' || blk.paymentStatus === 'PAID' })))) : null);
}

export default function AdminStudents() {
  const { db, tick } = useDb();
  const [rawQuery, setRawQuery] = useState('');
  const query = useDebounce(rawQuery, 300);
  const [status, setStatus] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const { students, total } = useStudents({ query, status, category: categoryFilter, batch: batchFilter, membership: membershipFilter, payment: paymentFilter });

  // Add Student modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', guardianName: '', guardianPhone: '', guardianEmail: '', membershipType: 'Member', program: '', ballColor: '', batchId: '', sessionsPurchased: '', amount: '', paymentStatus: 'PAID', enrollments: [newEnrollmentBlock()] });
  const [addErrors, setAddErrors] = useState({});
  const [dupCheck, setDupCheck] = useState(null);

  // Edit Student modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', guardianName: '', guardianPhone: '', membershipType: 'Member' });

  // Add Enrollment modal
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ program: '', ballColor: '', batchId: '' });

  // Archive modal
  const [showArchive, setShowArchive] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [playerNotes, setPlayerNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  // Trial conversion
  const [showConvert, setShowConvert] = useState(false);
  const [convertForm, setConvertForm] = useState(newEnrollmentBlock());

  const state = (() => { try { return db.readAll(); } catch { return { batches: [], coaches: [] }; } })();
  const batchOptions = state.batches?.filter((b) => b.status === 'ACTIVE') || [];

  const BALL_COLORS = ['Yellow', 'Green', 'Orange', 'Red'];
  const CATEGORIES_WITH_BALL = new Set(['ADV', 'INT']);
  const CATEGORIES_AUTO_BALL = { GREEN: 'Green', ORANGE: 'Orange', RED: 'Red' };

  const handleAddCategoryChange = (v) => {
    const prog = typeof v === 'object' ? (v?.value || '') : (v || '');
    let nextBall = '';
    if (CATEGORIES_WITH_BALL.has(prog)) {
      nextBall = '';
    } else if (CATEGORIES_AUTO_BALL[prog]) {
      nextBall = CATEGORIES_AUTO_BALL[prog];
    } else {
      nextBall = null;
    }
    setAddForm((f) => ({ ...f, program: prog, ballColor: nextBall, batchId: '' }));
  };

  const handleAddBallColorChange = (v) => {
    const color = typeof v === 'object' ? (v?.value || '') : (v || '');
    setAddForm((f) => ({ ...f, ballColor: color, batchId: '' }));
  };

  const handleEnrollCategoryChange = (v) => {
    const prog = typeof v === 'object' ? (v?.value || '') : (v || '');
    let nextBall = '';
    if (CATEGORIES_WITH_BALL.has(prog)) {
      nextBall = '';
    } else if (CATEGORIES_AUTO_BALL[prog]) {
      nextBall = CATEGORIES_AUTO_BALL[prog];
    } else {
      nextBall = null;
    }
    setEnrollForm((f) => ({ ...f, program: prog, ballColor: nextBall, batchId: '' }));
  };

  const handleEnrollBallColorChange = (v) => {
    const color = typeof v === 'object' ? (v?.value || '') : (v || '');
    setEnrollForm((f) => ({ ...f, ballColor: color, batchId: '' }));
  };

  const getFilteredBatches = (prog, ball) => {
    if (!prog) return [];
    if (CATEGORIES_WITH_BALL.has(prog)) {
      if (!ball) return [];
      return batchOptions.filter((b) =>
        b.program === prog && (b.ballLevel || '').toLowerCase() === ball.toLowerCase()
      );
    }
    if (['GREEN', 'ORANGE', 'RED', 'ADULT', 'WEEKEND', 'FITNESS'].includes(prog)) {
      return batchOptions.filter((b) => b.program === prog);
    }
    if (prog === 'JDP' || prog === 'HPP') {
      return batchOptions;
    }
    return batchOptions;
  };

  const addFilteredBatches = getFilteredBatches(addForm.program, addForm.ballColor);
  const isAddClassificationReady = Boolean(
    addForm.program && (!CATEGORIES_WITH_BALL.has(addForm.program) || addForm.ballColor)
  );
  const addBatchPlaceholder = !addForm.program
    ? 'Select Category first'
    : CATEGORIES_WITH_BALL.has(addForm.program) && !addForm.ballColor
    ? 'Select Ball Color first'
    : 'Skip or select batch...';

  const enrollFilteredBatches = getFilteredBatches(enrollForm.program, enrollForm.ballColor);
  const isEnrollClassificationReady = Boolean(
    enrollForm.program && (!CATEGORIES_WITH_BALL.has(enrollForm.program) || enrollForm.ballColor)
  );
  const enrollBatchPlaceholder = !enrollForm.program
    ? 'Select Category first'
    : CATEGORIES_WITH_BALL.has(enrollForm.program) && !enrollForm.ballColor
    ? 'Select Ball Color first'
    : 'Select batch...';

  // Duplicate check
  const checkDup = async () => {
    if (!addForm.name || !addForm.guardianPhone) return;
    const dup = await db.checkDuplicateStudent({ name: addForm.name, guardianPhone: addForm.guardianPhone });
    setDupCheck(dup);
  };

  const handleAddStudent = async () => {
    const errors = {};
    if (!addForm.name.trim()) errors.name = 'Name is required';
    if (Object.keys(errors).length > 0) { setAddErrors(errors); return; }
    try {
      const student = await db.upsertStudent({
        name: addForm.name.trim(),
        guardianName: addForm.guardianName || addForm.name + "'s Guardian",
        guardianPhone: addForm.guardianPhone || '',
        guardianEmail: addForm.guardianEmail || '',
        guardianRelationship: addForm.guardianRelationship || 'Father',
        alternatePhone: addForm.alternatePhone || '',
        membershipType: addForm.membershipType,
        status: addForm.membershipType === 'Guest' ? 'TRIAL' : 'ACTIVE',
        remarks: addForm.remarks || '',
        enrolledFrom: new Date().toISOString().split('T')[0],
      });

      const blocks = addForm.membershipType === 'Guest' ? addForm.enrollments.slice(0, 1) : addForm.enrollments;

      for (const blk of blocks) {
        if (blk.enrollmentType === 'Customised') {
          if (!blk.customLineItems || blk.customLineItems.length === 0) {
            throw new Error('Customised package requires at least one line item mapped to a category');
          }
          for (const item of blk.customLineItems) {
            if (!item.category) throw new Error('Each custom line item must map to a valid category');
          }
          const totalRate = blk.customLineItems.reduce((sum, item) => sum + (parseFloat(item.rate) || 0), 0);
          const finalAmt = parseFloat(blk.amount) || totalRate;
          const fee = calcFee(finalAmt, blk.taxInclusive, blk.discountType, blk.discountVal, GST_RATE);
          const rec = parseFloat(blk.amountReceived) || 0;
          await db.upsertEnrollment({
            studentId: student.id,
            batchId: null,
            billingProgram: blk.customLineItems[0]?.category || 'ADV',
            enrollmentType: 'Customised',
            customLineItems: blk.customLineItems,
            status: 'ACTIVE',
            startDate: blk.joiningDate || new Date().toISOString().split('T')[0],
          });
          await db.upsertPackage({
            studentId: student.id,
            program: blk.customLineItems[0]?.category || 'ADV',
            enrollmentType: 'Customised',
            packageDuration: blk.packageDuration || null,
            amount: fee.finalAmount,
            paymentStatus: blk.paymentStatus || 'PAID',
            paymentMode: blk.paymentMode || '',
            amountReceived: rec,
            balanceAmount: fee.finalAmount - rec,
            paymentDate: blk.paymentDate || new Date().toISOString().split('T')[0],
            transactionRef: blk.transactionRef || '',
            gstRate: GST_RATE,
            taxInclusive: blk.taxInclusive,
            baseAmount: fee.baseAmount,
            taxAmount: fee.taxAmount,
            discount: fee.discount,
            discountReason: blk.discountReason || null,
            validTo: blk.endDate || '',
          });
        } else if (blk.enrollmentType === 'Private') {
          const rate = parseFloat(blk.amount) || 0;
          const fee = calcFee(rate, blk.taxInclusive, blk.discountType, blk.discountVal, GST_RATE);
          await db.upsertEnrollment({
            studentId: student.id,
            batchId: null,
            coachId: blk.coachId || null,
            billingProgram: 'PRIVATE',
            enrollmentType: 'Private',
            status: 'ACTIVE',
            startDate: blk.joiningDate || new Date().toISOString().split('T')[0],
          });
          await db.upsertPackage({
            studentId: student.id,
            program: 'PRIVATE',
            coachId: blk.coachId || null,
            enrollmentType: 'Private',
            packageDuration: blk.packageDuration || 'per-session',
            amount: fee.finalAmount,
            paymentStatus: blk.paymentStatus || 'PAID',
            paymentMode: blk.paymentMode || '',
            amountReceived: parseFloat(blk.amountReceived) || 0,
            balanceAmount: fee.finalAmount - (parseFloat(blk.amountReceived) || 0),
            paymentDate: blk.paymentDate || new Date().toISOString().split('T')[0],
            transactionRef: blk.transactionRef || '',
            gstRate: GST_RATE,
            baseAmount: fee.baseAmount,
            taxAmount: fee.taxAmount,
            discount: fee.discount,
            validTo: blk.endDate || '',
          });
        } else {
          // Group, Add-on, HPP, Guest
          if (blk.program && blk.batchId) {
            await db.upsertEnrollment({
              studentId: student.id,
              batchId: blk.batchId,
              billingProgram: blk.program,
              ballLevel: blk.ballColor || null,
              enrollmentType: blk.enrollmentType || 'Group',
              status: 'ACTIVE',
              startDate: blk.joiningDate || new Date().toISOString().split('T')[0],
            });
            if (blk.amount || blk.packageDuration) {
              const dm = DURATION_OPTIONS.find((d) => d.value === blk.packageDuration)?.months;
              const ed = blk.packageDuration === 'custom' ? blk.endDate : computeEndDate(blk.joiningDate, dm);
              const fee = calcFee(blk.amount, blk.taxInclusive, blk.discountType, blk.discountVal, GST_RATE);
              const rec = parseFloat(blk.amountReceived) || 0;
              await db.upsertPackage({
                studentId: student.id,
                program: blk.program,
                packageDuration: blk.packageDuration || null,
                endDate: ed || null,
                sessionsPurchased: 0,
                sessionsUsed: 0,
                amount: fee.finalAmount,
                paymentStatus: blk.paymentStatus || 'PAID',
                paymentMode: blk.paymentMode || '',
                amountReceived: rec,
                balanceAmount: fee.finalAmount - rec,
                paymentDate: blk.paymentDate || new Date().toISOString().split('T')[0],
                transactionRef: blk.transactionRef || '',
                gstRate: GST_RATE,
                taxInclusive: blk.taxInclusive,
                baseAmount: fee.baseAmount,
                taxAmount: fee.taxAmount,
                discount: fee.discount,
                discountReason: blk.discountReason || null,
                validTo: ed || '',
              });
            }
          }
        }
      }

      toast.success(`Student "${addForm.name}" created with enrollment(s)`);
      setShowAdd(false);
      setAddForm({
        name: '', guardianName: '', guardianPhone: '', guardianEmail: '',
        guardianRelationship: 'Father', alternatePhone: '', remarks: '',
        membershipType: 'Member', program: '', ballColor: '', batchId: '',
        sessionsPurchased: '', amount: '', paymentStatus: 'PAID',
        enrollments: [newEnrollmentBlock()]
      });
      setAddErrors({}); setDupCheck(null);
    } catch (e) { toast.error(e.message); }
  };


  const handleEdit = async () => {
    if (!selected) return;
    try {
      await db.upsertStudent({ ...selected, name: editForm.name, guardianName: editForm.guardianName, guardianPhone: editForm.guardianPhone, guardianEmail: editForm.guardianEmail, guardianRelationship: editForm.guardianRelationship, alternatePhone: editForm.alternatePhone, membershipType: editForm.membershipType, remarks: editForm.remarks });
      toast.success('Student updated');
      setShowEdit(false);
    } catch (e) { toast.error(e.message); }
  };

  const handleArchive = async () => {
    if (!archiveReason.trim()) { toast.error('Reason is required to archive'); return; }
    try {
      await db.archiveStudent({ studentId: selected.id, reason: archiveReason });
      toast.success(`"${selected.name}" archived`);
      setShowArchive(false); setSelected(null); setArchiveReason('');
    } catch (e) { toast.error(e.message); }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selected) return;
    try {
      const note = await db.createPlayerNote({ studentId: selected.id, date: new Date().toISOString().slice(0, 10), note: newNote.trim() });
      setPlayerNotes((prev) => [note, ...prev]);
      setNewNote('');
      toast.success('Note added');
    } catch (e) { toast.error(e.message); }
  };

  const loadNotes = async (studentId) => {
    try {
      const notes = await db.getPlayerNotes(studentId);
      setPlayerNotes(notes);
    } catch { setPlayerNotes([]); }
  };

  const handleAddEnrollment = async () => {
    if (!enrollForm.program || !enrollForm.batchId) { toast.error('Select a category and batch'); return; }
    try {
      const enr = await db.upsertEnrollment({ studentId: selected.id, batchId: enrollForm.batchId, billingProgram: enrollForm.program, status: 'ACTIVE', enrollmentType: enrollForm.enrollmentType || 'Group', startDate: enrollForm.joiningDate });
      const dm = DURATION_OPTIONS.find((d) => d.value === enrollForm.packageDuration)?.months;
      const ed = enrollForm.packageDuration === 'custom' ? enrollForm.endDate : computeEndDate(enrollForm.joiningDate, dm);
      const fee = calcFee(enrollForm.amount, enrollForm.taxInclusive, enrollForm.discountType, enrollForm.discountVal, GST_RATE);
      if (enrollForm.packageDuration || enrollForm.amount) {
        await db.upsertPackage({ studentId: selected.id, program: enrollForm.program, entity: selected.entity || 'The Club', packageDuration: enrollForm.packageDuration || null, endDate: ed || null, sessionsPurchased: 0, sessionsUsed: 0, amount: fee.finalAmount, paymentStatus: enrollForm.paymentStatus, paymentMode: enrollForm.paymentMode, amountReceived: parseFloat(enrollForm.amountReceived) || 0, balanceAmount: fee.finalAmount - (parseFloat(enrollForm.amountReceived) || 0), paymentDate: enrollForm.paymentDate, transactionRef: enrollForm.transactionRef, gstRate: GST_RATE, taxInclusive: enrollForm.taxInclusive, baseAmount: fee.baseAmount, taxAmount: fee.taxAmount, discount: fee.discount, discountReason: enrollForm.discountReason || null, validTo: ed || '', });
      }      // Record category history if the new category differs from existing
      const existing = (selected.enrollments || []).filter((e) => e.billingProgram !== enrollForm.program);
      const priorCat = selected.programs?.[0] || '';
      if (priorCat && priorCat !== enrollForm.program) {
        await db.recordCategoryChange({ enrollmentId: enr.id, studentId: selected.id, previousCategory: priorCat, newCategory: enrollForm.program, effectiveDate: enrollForm.joiningDate });
      }
      toast.success('Enrollment added');
      setShowEnroll(false); setEnrollForm(newEnrollmentBlock());
    } catch (e) { toast.error(e.message); }
  };

  // Convert trial student to regular enrollment
  const handleConvert = async () => {
    if (!selected) return;
    const G = GST_RATE;
    try {
      await db.upsertStudent({ ...selected, membershipType: 'Member', status: 'ACTIVE' });
      if (convertForm.program && convertForm.batchId) {
        await db.upsertEnrollment({ studentId: selected.id, batchId: convertForm.batchId, billingProgram: convertForm.program, status: 'ACTIVE', startDate: convertForm.joiningDate });
        const dm = DURATION_OPTIONS.find((d) => d.value === convertForm.packageDuration)?.months;
        const ed = convertForm.packageDuration === 'custom' ? convertForm.endDate : computeEndDate(convertForm.joiningDate, dm);
        const fee = calcFee(convertForm.amount, convertForm.taxInclusive, convertForm.discountType, convertForm.discountVal, G);
        const rec = parseFloat(convertForm.amountReceived) || 0;
        await db.upsertPackage({ studentId: selected.id, program: convertForm.program, packageDuration: convertForm.packageDuration || null, endDate: ed || null, sessionsPurchased: 0, sessionsUsed: 0, amount: fee.finalAmount, paymentStatus: convertForm.paymentStatus, paymentMode: convertForm.paymentMode, amountReceived: rec, balanceAmount: fee.finalAmount - rec, paymentDate: convertForm.paymentDate, transactionRef: convertForm.transactionRef, gstRate: G, taxInclusive: convertForm.taxInclusive, baseAmount: fee.baseAmount, taxAmount: fee.taxAmount, discount: fee.discount, discountReason: convertForm.discountReason || null, validTo: ed || '', });
      }
      toast.success(selected.name + ' converted to regular enrollment');
      setShowConvert(false);
    } catch (e) { toast.error(e.message); }
  };

  // Pre-fill convert form when opening
  useEffect(() => {
    if (showConvert && selected) {
      const blk = newEnrollmentBlock();
      blk.program = selected.programs?.[0] || '';
      blk.batchId = selected.batch?.id || '';
      setConvertForm(blk);
    }
  }, [showConvert, selected?.id]);

  const openEdit = () => {
    if (!selected) return;
    setEditForm({ name: selected.name, guardianName: selected.guardianName, guardianPhone: selected.guardianPhone, guardianEmail: selected.guardianEmail || '', guardianRelationship: selected.guardianRelationship || 'Father', alternatePhone: selected.alternatePhone || '', membershipType: selected.membershipType || 'Member', remarks: selected.remarks || '' });
    setShowEdit(true);
  };

  // Load player notes when student is selected
  useEffect(() => {
    if (selected) { loadNotes(selected.id); setNewNote(''); } else { setPlayerNotes([]); }
  }, [selected?.id]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input value={rawQuery} onChange={(e) => setRawQuery(e.target.value)} placeholder="Search students..."
              className="w-full pl-9 pr-4 h-[38px] rounded-lg bg-canvas-soft border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10" />
          </div>
          <Dropdown
            className="w-36 sm:w-40 flex-shrink-0"
            value={status}
            onChange={(v) => setStatus(typeof v === 'object' ? (v.value || v) : v)}
            options={[{ value: 'all', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]}
            getOptionLabel={(o) => o.label}
            getOptionValue={(o) => o.value}
          />
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
          <span className="text-xs text-ink-muted">{total} students</span>
          <Button size="sm" icon={Plus} className="whitespace-nowrap" onClick={() => setShowAdd(true)}>Add Student</Button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Dropdown className="w-full sm:w-36" value={categoryFilter} onChange={(v) => setCategoryFilter(typeof v === 'object' ? (v.value || '') : v)} placeholder="All Categories" options={[{ value: '', label: 'All' }, ...CATEGORY_OPTIONS]} getOptionLabel={(o) => o.label || 'All'} getOptionValue={(o) => o.value || ''} />
        <Dropdown className="w-full sm:w-44" value={batchFilter} onChange={(v) => setBatchFilter(typeof v === 'object' ? (v.value || '') : v)} placeholder="All Batches" options={[{ value: '', label: 'All' }, ...batchOptions.map((b) => ({ value: b.id, label: `${b.program} ${b.dayPattern}` }))]} getOptionLabel={(o) => o.label || 'All'} getOptionValue={(o) => o.value || ''} />
        <Dropdown className="w-full sm:w-36" value={membershipFilter} onChange={(v) => setMembershipFilter(typeof v === 'object' ? (v.value || '') : v)} placeholder="All Membership" options={[{ value: '', label: 'All' }, { value: 'Member', label: 'Member' }, { value: 'Non-member', label: 'Non-member' }, { value: 'Guest', label: 'Guest' }]} getOptionLabel={(o) => o.label || 'All'} getOptionValue={(o) => o.value || ''} />
        <Dropdown className="w-full sm:w-36" value={paymentFilter} onChange={(v) => setPaymentFilter(typeof v === 'object' ? (v.value || '') : v)} placeholder="All Payment" options={[{ value: '', label: 'All' }, { value: 'PAID', label: 'Paid' }, { value: 'PENDING', label: 'Pending' }, { value: 'PARTIAL', label: 'Partial' }, { value: 'COMPLIMENTARY', label: 'Complimentary' }]} getOptionLabel={(o) => o.label || 'All'} getOptionValue={(o) => o.value || ''} />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-line">
          {students.map((s) => {
            const blocked = !s.eligibility.markable;
            const isInactive = s.status === 'INACTIVE' || s.status === 'TRIAL';
            return (
              <div key={s.id} onClick={() => setSelected(s)}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-canvas-soft cursor-pointer transition-colors ${blocked && !isInactive ? 'opacity-50' : ''} ${isInactive ? 'opacity-40' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-bold flex-shrink-0">{s.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{s.name}</p>
                  <p className="text-[11px] text-ink-muted truncate">{s.programs?.join(', ') || 'No program'} · {s.batch?.name || s.batch?.program || 'No batch'}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                  {s.membershipType === 'Guest' ? <StatusPill status="guest" /> : s.membershipType === 'Non-member' ? <StatusPill status="Non-member" /> : null}
                  {s.status === 'TRIAL' && <StatusPill status="trial" />}
                  {s.programs?.map((p) => <StatusPill key={p} status={p} />)}
                  {blocked && !isInactive && <EligibilityStatusPill package={s.package} />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Student Detail Modal — Consolidated Profile (UC-2 / WF-2.3) */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} size="lg">
        {selected && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* 1. Basic & Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-canvas-soft p-3 rounded-xl border border-line/60">
              <div><p className="text-ink-faint">Name</p><p className="font-semibold text-ink">{selected.name}</p></div>
              <div><p className="text-ink-faint">Guardian</p><p className="font-semibold text-ink">{selected.guardianName}</p></div>
              <div><p className="text-ink-faint">Phone</p><p className="font-semibold text-ink">{selected.guardianPhone || '—'}</p></div>
              <div><p className="text-ink-faint">Email</p><p className="font-semibold text-ink">{selected.guardianEmail || '—'}</p></div>
              <div><p className="text-ink-faint">Relationship</p><p className="font-semibold text-ink">{selected.guardianRelationship || '—'}</p></div>
              <div><p className="text-ink-faint">Membership / Status</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-semibold text-ink">{selected.membershipType || 'Member'}</span>
                  <StatusPill status={selected.status} />
                </div>
              </div>
            </div>

            {/* 2. Enrolled Group Batches (Consolidated) */}
            <div>
              <h4 className="text-xs font-semibold text-ink-muted mb-1.5">Group Batches ({selected.enrollments?.length || 0})</h4>
              {(!selected.enrollments || selected.enrollments.length === 0) ? (
                <p className="text-xs text-ink-faint py-2 px-3 bg-canvas-soft rounded-lg">No active group batch enrollments.</p>
              ) : (
                <div className="space-y-1.5">
                  {selected.enrollments.map((enr) => {
                    const b = state.batches.find((batch) => batch.id === enr.batchId);
                    const c = state.courts.find((court) => court.id === b?.courtId);
                    const coach = state.coaches.find((coach) => coach.id === b?.primaryCoachId);
                    return (
                      <div key={enr.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-canvas-soft text-xs border border-line/40">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-ink">{enr.billingProgram || b?.program}</span>
                          {enr.ballLevel && <span className="text-brand-600 font-medium">{enr.ballLevel}</span>}
                          <span className="text-ink-muted">{b?.dayPattern} · {b ? `${formatTime12h(b.startTime)} - ${formatTime12h(b.endTime)}` : 'No batch'}</span>
                          {enr.enrollmentType && enr.enrollmentType !== 'Group' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-50 text-brand-600 font-medium">{enr.enrollmentType}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-ink-faint text-[11px] ml-auto">
                          <span>{c?.name || 'Court —'}</span>
                          <span>•</span>
                          <span>Coach: {coach?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Scheduled Private Sessions (Consolidated) */}
            {(() => {
              const privates = (state.privateSessions || []).filter((ps) => ps.studentId === selected.id || ps.clientName === selected.name);
              if (privates.length === 0) return null;
              return (
                <div>
                  <h4 className="text-xs font-semibold text-ink-muted mb-1.5">Private Coaching Sessions ({privates.length})</h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {privates.map((ps) => {
                      const coach = state.coaches.find((c) => c.id === ps.coachId);
                      return (
                        <div key={ps.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-canvas-soft text-xs border border-line/40">
                          <span className="text-ink font-medium">{formatDateDDMMYY(ps.date)} · {formatTime12h(ps.startTime || ps.time)}</span>
                          <span className="text-ink-muted">Coach: {coach?.name || ps.coachName || '—'}</span>
                          <StatusPill status={ps.status || 'confirmed'} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* 4. Package & Payment Position (Consolidated — Base, Tax, Total, Paid, Pending, Mode, Due Date) */}
            {selected.package && (
              <div>
                <h4 className="text-xs font-semibold text-ink-muted mb-1.5">Package & Payment Position</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-canvas-soft rounded-xl p-3 border border-line/60">
                  <div>
                    <p className="text-[10px] uppercase text-ink-faint font-semibold">Total Amount</p>
                    <p className="font-bold text-ink text-sm">₹{(selected.package.amount || selected.package.finalAmount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-ink-faint mt-0.5">Base: ₹{(selected.package.baseAmount || Math.round((selected.package.amount || 0) / 1.18)).toLocaleString('en-IN')} + GST</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-ink-faint font-semibold">Amount Paid</p>
                    <p className="font-bold text-ok text-sm">₹{(selected.package.amountReceived || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-ink-faint mt-0.5">Mode: {selected.package.paymentMode || 'Not recorded'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-ink-faint font-semibold">Pending Balance</p>
                    <p className="font-bold text-err text-sm">₹{Math.max(0, (selected.package.amount || 0) - (selected.package.amountReceived || 0)).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-ink-faint mt-0.5">{selected.package.nextPaymentDue ? `Due: ${formatDateDDMMYY(selected.package.nextPaymentDue)}` : 'No due date'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-ink-faint font-semibold">Package Status</p>
                    <div className="mt-0.5"><EligibilityStatusPill package={selected.package} /></div>
                    <p className="text-[10px] text-ink-faint mt-0.5">{selected.package.validTo ? `Valid to: ${formatDateDDMMYY(selected.package.validTo)}` : ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Monthly Attendance % */}
            <AttendancePctCard studentId={selected.id} db={db} />

            {selected.isAmbiguous && (
              <div className="px-3 py-2 rounded-lg bg-brand-50 text-xs text-brand-600">
                This student has multiple active categories ({selected.programs.join(', ')}). The lowest-rank category takes precedence.
              </div>
            )}

            {/* 6. Dated Category History */}
            <CategoryHistoryCard studentId={selected.id} db={db} />


            <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
              <Button size="sm" variant="secondary" icon={Pencil} onClick={openEdit}>Edit</Button>
              <Button size="sm" variant="secondary" icon={UserPlus} onClick={() => setShowEnroll(true)}>Add Enrollment</Button>
              <Button size="sm" variant="danger" icon={Archive} onClick={() => setShowArchive(true)}>Archive</Button>
              {selected.status === 'TRIAL' && (
                <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => setShowConvert(true)}>Convert to Enrollment</Button>
              )}
              {selected.package && (parseInt(selected.package.amountReceived || 0) < (selected.package.amount || 0)) && (
                <Button size="sm" variant="secondary" icon={Mail} onClick={async (e) => {
                  e.stopPropagation();
                  const pendingAmount = (selected.package.amount || 0) - (parseInt(selected.package.amountReceived) || 0);
                  if (!selected.guardianEmail) { toast.error('Guardian email is not available'); return; }
                  const mailto = preparePaymentReminder({
                    studentName: selected.name,
                    guardianEmail: selected.guardianEmail,
                    program: selected.package.program,
                    pendingAmount,
                    hasPaymentUrl: false,
                    paymentUrl: '',
                  });
                  await db.logPaymentReminder({
                    studentId: selected.id,
                    packageId: selected.package.id,
                    guardianEmail: selected.guardianEmail,
                    pendingAmount,
                  });
                  toast.success('Opening payment reminder email');
                  window.open(mailto, '_blank');
                }}>Send Payment Reminder</Button>
              )}
            </div>

            {/* Player Notes Section */}
            <div className="border-t border-line pt-3 mt-2">
              <h4 className="text-xs font-semibold text-ink-muted flex items-center gap-1.5 mb-2"><FileText className="w-3.5 h-3.5" />Player Notes</h4>
              <div className="flex gap-2 mb-2">
                <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..."
                  className="flex-1 h-[34px] px-3 rounded-lg border border-line bg-white text-[12px] outline-none focus:ring-2 focus:ring-brand/10" />
                <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>Add</Button>
              </div>
              {playerNotes.length === 0 ? (
                <p className="text-[11px] text-ink-faint">No notes yet.</p>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {playerNotes.map((n) => (
                    <div key={n.id} className="px-3 py-1.5 rounded-lg bg-canvas-soft text-[11px]">
                      <p className="text-ink">{n.note}</p>
                      <p className="text-ink-faint mt-0.5">{n.date} · by {n.createdBy?.replace('user_', '') || 'staff'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Student Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setDupCheck(null); }} title="Add Student" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Basic Details */}
          <div className="space-y-1">
            <label className={labelCls}>Name *</label>
            <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} onBlur={checkDup}
              className={`${fieldBase} ${addErrors.name ? 'border-red-300' : ''}`} placeholder="Student name" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={labelCls}>Guardian Name</label>
              <input value={addForm.guardianName} onChange={(e) => setAddForm((f) => ({ ...f, guardianName: e.target.value }))} className={fieldBase} placeholder="Guardian" />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Guardian Phone</label>
              <input value={addForm.guardianPhone} onChange={(e) => setAddForm((f) => ({ ...f, guardianPhone: e.target.value }))} onBlur={checkDup} className={fieldBase} placeholder="Phone" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="space-y-1">
              <label className={labelCls}>Guardian Email</label>
              <input type="email" value={addForm.guardianEmail || ''} onChange={(e) => setAddForm((f) => ({ ...f, guardianEmail: e.target.value }))} className={fieldBase} placeholder="email@example.com" />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Relationship</label>
              <Dropdown value={addForm.guardianRelationship} onChange={(v) => setAddForm((f) => ({ ...f, guardianRelationship: typeof v === 'object' ? (v.value || v) : v }))} options={GUARDIAN_RELATIONSHIPS.map((r) => ({ value: r, label: r }))} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Alt Phone</label>
              <input value={addForm.alternatePhone} onChange={(e) => setAddForm((f) => ({ ...f, alternatePhone: e.target.value }))} className={fieldBase} placeholder="Optional" />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Membership</label>
            <Dropdown value={addForm.membershipType} onChange={(v) => { const m = typeof v === 'object' ? (v.value || 'Member') : (v || 'Member'); setAddForm((f) => ({ ...f, membershipType: m })); }} options={[{ value: 'Member', label: 'Member' }, { value: 'Non-member', label: 'Non-member' }, { value: 'Guest', label: 'Guest / Trial' }]} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Remarks</label>
            <textarea value={addForm.remarks || ''} onChange={(e) => setAddForm((f) => ({ ...f, remarks: e.target.value }))} className="w-full h-16 px-3 py-2 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10 resize-none" placeholder="Medical info, special requirements, etc." />
          </div>

          {dupCheck && <div className="px-3 py-2 rounded-lg bg-warn-bg text-xs text-warn">Possible duplicate: "{dupCheck.name}" with phone {dupCheck.guardianPhone} already exists (ID: {dupCheck.id}).</div>}

          {/* Guest/Trial: lightweight form */}
          {addForm.membershipType === 'Guest' ? (
            <div className="border-t border-line pt-3">
              <p className="text-[10px] font-semibold text-ink-muted uppercase mb-2">Trial Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Trial Date</label>
                  <input type="date" value={addForm.enrollments[0].joiningDate} onChange={(e) => setAddForm((f) => ({ ...f, enrollments: [{ ...f.enrollments[0], joiningDate: e.target.value }] }))} className={fieldBase} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Trial Category</label>
                  <Dropdown value={addForm.enrollments[0].program} onChange={(v) => { const p = typeof v === 'object' ? (v?.value || '') : (v || ''); setAddForm((f) => ({ ...f, enrollments: [{ ...f.enrollments[0], program: p }] })); }} placeholder="Category" options={CATEGORY_OPTIONS} getOptionLabel={(o) => o?.label || ''} getOptionValue={(o) => o?.value || ''} />
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <label className={labelCls}>Trial Batch</label>
                <Dropdown value={addForm.enrollments[0].batchId} onChange={(v) => setAddForm((f) => ({ ...f, enrollments: [{ ...f.enrollments[0], batchId: typeof v === 'object' ? (v.value || '') : (v || '') }] }))} placeholder="Select batch..." options={batchOptions.map((b) => ({ value: b.id, label: `${b.name || `${b.program}${b.ballLevel ? ' · ' + b.ballLevel : ''} (${b.startTime || ''})`} (${b.dayPattern})` }))} getOptionLabel={(o) => o?.label || ''} getOptionValue={(o) => o?.value || ''} />
              </div>
            </div>
          ) : (
            <div className="border-t border-line pt-3">
              <p className="text-[10px] font-semibold text-ink-muted uppercase mb-2">Enrollments</p>
              {addForm.enrollments.map((blk, idx) => (
                <div key={idx} className="mb-3">
                  {renderEnrollmentBlock(blk, (newBlk) => { const e = [...addForm.enrollments]; e[idx] = newBlk; setAddForm((f) => ({ ...f, enrollments: e })); }, addForm.enrollments.length > 1, () => { const e = [...addForm.enrollments]; e.splice(idx, 1); setAddForm((f) => ({ ...f, enrollments: e.length > 0 ? e : [newEnrollmentBlock()] })); }, batchOptions)}
                </div>
              ))}
              <Button size="sm" variant="ghost" icon={Plus} onClick={() => setAddForm((f) => ({ ...f, enrollments: [...f.enrollments, newEnrollmentBlock()] }))} className="w-full">+ Add Another Enrollment</Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowAdd(false); setDupCheck(null); }}>Cancel</Button>
            <Button onClick={handleAddStudent}>Create Student</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Student" size="sm">
        <div className="space-y-3">
          <div className="space-y-1"><label className={labelCls}>Name</label><input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={fieldBase} /></div>
          <div className="space-y-1"><label className={labelCls}>Guardian Name</label><input value={editForm.guardianName} onChange={(e) => setEditForm((f) => ({ ...f, guardianName: e.target.value }))} className={fieldBase} /></div>
          <div className="space-y-1"><label className={labelCls}>Guardian Phone</label><input value={editForm.guardianPhone} onChange={(e) => setEditForm((f) => ({ ...f, guardianPhone: e.target.value }))} className={fieldBase} /></div>
          <div className="space-y-1"><label className={labelCls}>Guardian Email</label><input type="email" value={editForm.guardianEmail || ''} onChange={(e) => setEditForm((f) => ({ ...f, guardianEmail: e.target.value }))} className={fieldBase} placeholder="email@example.com" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><label className={labelCls}>Relationship</label><Dropdown value={editForm.guardianRelationship} onChange={(v) => setEditForm((f) => ({ ...f, guardianRelationship: typeof v === 'object' ? (v.value || v) : v }))} options={GUARDIAN_RELATIONSHIPS.map((r) => ({ value: r, label: r }))} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} /></div>
            <div className="space-y-1"><label className={labelCls}>Alt Phone</label><input value={editForm.alternatePhone || ''} onChange={(e) => setEditForm((f) => ({ ...f, alternatePhone: e.target.value }))} className={fieldBase} /></div>
          </div>
          <div className="space-y-1"><label className={labelCls}>Membership</label><Dropdown value={editForm.membershipType} onChange={(v) => setEditForm((f) => ({ ...f, membershipType: typeof v === 'object' ? (v.value || 'Member') : (v || 'Member') }))} options={[{ value: 'Member', label: 'Member' }, { value: 'Non-member', label: 'Non-member' }, { value: 'Guest', label: 'Guest / Trial' }]} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} /></div>
          <div className="space-y-1"><label className={labelCls}>Remarks</label><textarea value={editForm.remarks || ''} onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))} className="w-full h-16 px-3 py-2 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10 resize-none" /></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button><Button onClick={handleEdit}>Save</Button></div>
        </div>
      </Modal>

      {/* Add Enrollment Modal (for existing students) */}
      <Modal open={showEnroll} onClose={() => setShowEnroll(false)} title="Add Enrollment" size="lg">
        <div className="space-y-4 max-h-[65vh] overflow-y-auto">
          {renderEnrollmentBlock(enrollForm, setEnrollForm, false, null, batchOptions)}
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setShowEnroll(false)}>Cancel</Button><Button onClick={handleAddEnrollment} disabled={!enrollForm.program}>Add Enrollment</Button></div>
        </div>
      </Modal>

      {/* Convert Trial to Enrollment */}
      <Modal open={showConvert} onClose={() => setShowConvert(false)} title={`Convert "${selected?.name}" to Enrollment`} size="lg">
        <div className="space-y-4 max-h-[65vh] overflow-y-auto">
          <p className="text-xs text-ink-muted">Convert this trial student to a regular enrollment.</p>
          {renderEnrollmentBlock(convertForm, setConvertForm, false, null, batchOptions)}
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setShowConvert(false)}>Cancel</Button><Button onClick={handleConvert} disabled={!convertForm.program}>Convert to Enrollment</Button></div>
        </div>
      </Modal>

      {/* Archive Modal */}
      <Modal open={showArchive} onClose={() => setShowArchive(false)} title={`Archive "${selected?.name}"`} size="sm">
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">This will set the student to inactive. They will remain visible in history but won't appear in active lists.</p>
          <div className="space-y-1"><label className={labelCls}>Reason *</label><textarea value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} className="w-full h-20 px-3 py-2 rounded-lg border border-line text-[13px] outline-none focus:ring-2 focus:ring-brand/10 resize-none" placeholder="Why is this student being archived?" /></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="secondary" onClick={() => setShowArchive(false)}>Cancel</Button><Button variant="danger" onClick={handleArchive}>Archive Student</Button></div>
        </div>
      </Modal>
    </div>
  );
}

// F2: Monthly attendance percentage card — loads on student select
function AttendancePctCard({ studentId, db }) {
  const [data, setData] = useState(null);
  const now = new Date();
  useEffect(() => {
    db.getMonthlyAttendancePct(studentId, now.getMonth() + 1, now.getFullYear()).then(setData).catch(() => setData(null));
  }, [studentId]);
  if (!data || data.total === 0) return null;
  return React.createElement('div', { className: 'rounded-lg bg-canvas-soft p-3 text-xs' },
    React.createElement('p', { className: 'font-semibold text-ink-muted mb-1' }, 'Monthly Attendance'),
    React.createElement('div', { className: 'flex items-center gap-2' },
      React.createElement('span', { className: 'text-lg font-bold text-ink' }, data.pct + '%'),
      React.createElement('span', { className: 'text-ink-faint' }, data.present + '/' + data.total + ' sessions'),
      React.createElement('span', { className: 'ml-auto text-[10px] text-ink-faint' }, now.toLocaleString('default', { month: 'short' }) + ' ' + now.getFullYear())));
}

// F5: Category history section — loads on student select
function CategoryHistoryCard({ studentId, db }) {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    db.getCategoryHistory(studentId).then(setHistory).catch(() => setHistory([]));
  }, [studentId]);
  if (!history || history.length === 0) return null;
  return React.createElement('div', { className: 'border-t border-line pt-3' },
    React.createElement('h4', { className: 'text-xs font-semibold text-ink-muted mb-2' }, 'Category History'),
    React.createElement('div', { className: 'space-y-1' },
      history.map((h, i) => React.createElement('div', { key: h.id || i, className: 'flex items-center gap-2 px-2 py-1 text-[11px]' },
        React.createElement('span', { className: 'text-ink-faint w-20' }, h.effectiveDate),
        React.createElement('span', { className: 'text-ink-muted' }, h.previousCategory),
        React.createElement('span', { className: 'text-ink-faint' }, '\u2192'),
        React.createElement('span', { className: 'font-semibold text-ink' }, h.newCategory),
        React.createElement('span', { className: 'text-ink-faint ml-auto text-[10px]' }, 'by ' + (h.changedBy || '').replace('user_', ''))))));
}