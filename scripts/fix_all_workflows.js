const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
  return JSON.parse(content);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

const TOOL_VERSIONS = {
  '@puchoaistudio/tool-schedule': '^2.0.0',
  '@puchoaistudio/tool-google-sheets': '^2.0.9',
  '@puchoaistudio/tool-date-helper': '^2.0.0',
  '@puchoaistudio/tool-webhook': '^2.0.4',
  '@puchoaistudio/tool-gmail': '^2.0.4',
  '@puchoaistudio/tool-store': '^2.0.0',
  '@puchoaistudio/tool-llm-ai': '^2.1.0'
};

const workflowsDir = path.join(__dirname, '..', 'workflows');
const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.json') && f !== 'Dummy workflow for sample tools versions.json');

files.forEach(file => {
  const filePath = path.join(workflowsDir, file);
  const wf = readJson(filePath);
  let modified = false;

  // 1. Ensure pieces array contains date-helper if not present (except pure store/schedule without date)
  if (!wf.pieces) wf.pieces = [];
  if (!wf.pieces.includes('@puchoaistudio/tool-date-helper')) {
    wf.pieces.push('@puchoaistudio/tool-date-helper');
    modified = true;
  }

  // 2. Traverse actions and update pieceVersions
  function updateAction(action) {
    if (!action) return;
    if (action.type === 'PIECE' || action.type === 'TOOL_TRIGGER') {
      const pName = action.settings?.pieceName;
      if (pName && TOOL_VERSIONS[pName]) {
        if (action.settings.pieceVersion !== TOOL_VERSIONS[pName]) {
          action.settings.pieceVersion = TOOL_VERSIONS[pName];
          modified = true;
        }
      }
    }

    // Specialize code steps for robust camelCase/snake_case payload parsing
    if (action.type === 'CODE' && file === 'WF-D_student_onboarding.json' && action.name === 'step_1') {
      action.settings.sourceCode.code = `export const code = async (inputs) => {
  const p = typeof inputs.payload === 'string' ? JSON.parse(inputs.payload) : (inputs.payload || {});
  const name = (p.name || p.student_name || p.studentName || '').trim();
  const phone = (p.guardianPhone || p.phone || p.parent_phone || p.guardian_phone || '').trim();
  const email = (p.guardianEmail || p.email || p.parent_email || p.guardian_email || '').trim();
  const valid = name.length > 0 && (phone.length > 0 || email.length > 0);
  return {
    valid: valid,
    student_id: p.studentId || p.student_id || '',
    student_name: name,
    guardian_name: p.guardianName || p.parent_name || (name ? name + "'s Guardian" : ''),
    guardian_phone: phone,
    guardian_email: email,
    guardian_relationship: p.guardianRelationship || p.guardian_relationship || 'Father',
    alternate_phone: p.alternatePhone || p.alternate_phone || '',
    membership_type: p.membershipType || p.membership_type || 'Member',
    status: p.status || 'ACTIVE',
    remarks: p.remarks || '',
    enrolled_from: p.enrolledFrom || p.enrolled_from || new Date().toISOString().split('T')[0],
    enrollment_type: p.enrollmentType || p.enrollment_type || 'Group',
    program: p.program || p.category || '',
    ball_color: p.ballColor || p.ball_color || '',
    batch_id: p.batchId || p.batch_id || '',
    joining_date: p.joiningDate || p.joining_date || p.start_date || new Date().toISOString().split('T')[0],
    package_duration: p.packageDuration || p.package_duration || '',
    end_date: p.endDate || p.end_date || '',
    amount: parseInt(p.amount || '0'),
    base_amount: parseFloat(p.baseAmount || p.amount || '0'),
    tax_amount: parseFloat(p.taxAmount || '0'),
    discount: parseFloat(p.discount || '0'),
    tax_inclusive: p.taxInclusive || false,
    discount_type: p.discountType || '',
    discount_val: p.discountVal || '',
    discount_reason: p.discountReason || '',
    payment_status: p.paymentStatus || p.payment_status || 'PAID',
    payment_mode: p.paymentMode || p.payment_mode || '',
    amount_received: parseFloat(p.amountReceived || p.amount_received || p.amount || '0'),
    balance_amount: parseFloat(p.balanceAmount || p.balance_amount || '0'),
    payment_date: p.paymentDate || p.payment_date || new Date().toISOString().split('T')[0],
    transaction_ref: p.transactionRef || p.transaction_ref || '',
    next_payment_due: p.nextPaymentDue || p.next_payment_due || '',
    coach_id: p.coachId || p.coach_id || '',
    enrollments: p.enrollments || [],
    error: valid ? '' : 'Missing required fields: name and at least phone or email'
  };
};`;
      modified = true;
    }

    if (action.type === 'CODE' && file === 'WF-I_direct_payment_capture.json' && action.name === 'step_1') {
      action.settings.sourceCode.code = `export const code = async (inputs) => {
  const p = typeof inputs.payload === 'string' ? JSON.parse(inputs.payload) : (inputs.payload || {});
  const payment_id = p.payment_id || p.paymentId || p.id || '';
  const student_id = p.student_id || p.studentId || '';
  const student_name = p.student_name || p.studentName || p.name || '';
  const parent_name = p.parent_name || p.parentName || p.guardianName || '';
  const parent_email = p.parent_email || p.parentEmail || p.email || p.guardianEmail || '';
  const parent_phone = p.parent_phone || p.parentPhone || p.phone || p.guardianPhone || '';
  const amount = parseFloat(p.amount || '0');
  const status = p.status || 'PAID';
  const gateway = p.gateway || 'Stripe';
  const type = p.type || 'Group';
  const entity = p.business_entity || p.businessEntity || p.entity || 'tots-tennis';
  const ref = p.transactionRef || p.ref || '';
  const payment_date = p.paymentDate || p.payment_date || new Date().toISOString().split('T')[0];
  return {
    valid: Boolean(payment_id || student_name),
    payment_id,
    student_id,
    student_name,
    parent_name,
    parent_email,
    parent_phone,
    amount,
    status,
    gateway,
    type,
    business_entity: entity,
    entity,
    transaction_ref: ref,
    payment_date
  };
};`;
      modified = true;
    }

    if (action.type === 'CODE' && file === 'WF-L_coach_payroll_leave.json' && action.name === 'step_1_route') {
      action.settings.sourceCode.code = `export const code = async (inputs) => {
  const p = typeof inputs.payload === 'string' ? JSON.parse(inputs.payload) : (inputs.payload || {});
  const action_type = p.action || p.type || (p.leaveType ? 'leave.apply' : 'payroll.compute');
  return {
    action: action_type,
    coach_id: p.coachId || p.coach_id || '',
    coach_name: p.coachName || p.coach_name || '',
    coach_email: p.coachEmail || p.coach_email || '',
    coach_phone: p.coachPhone || p.coach_phone || '',
    type: (p.type || p.leaveType || 'CASUAL').toUpperCase(),
    start_date: p.startDate || p.start_date || '',
    end_date: p.endDate || p.end_date || '',
    reason: p.reason || '',
    status: p.status || 'PENDING',
    applied_date: p.appliedDate || p.applied_date || new Date().toISOString().split('T')[0]
  };
};`;
      modified = true;
    }

    if (action.nextAction) updateAction(action.nextAction);
    if (action.onSuccess) updateAction(action.onSuccess);
    if (action.onFailure) updateAction(action.onFailure);
    if (action.children) action.children.forEach(c => updateAction(c));
  }

  if (wf.template?.trigger) updateAction(wf.template.trigger);

  if (modified) {
    writeJson(filePath, wf);
    console.log(`Updated workflow: ${file}`);
  }
});
