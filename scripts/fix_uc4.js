const fs = require('fs');
let data = JSON.parse(fs.readFileSync('workflows/UC-4_renewal_reminder_engine.json', 'utf8'));

const step2 = data.template.trigger.nextAction.nextAction;

const newCode = `export const code = async (inputs) => {
  const pkgs = Array.isArray(inputs.packages) ? inputs.packages : [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  today.setHours(0, 0, 0, 0);

  const messages = {
    d_minus_6: "Friendly reminder: Your child's tennis package at Arnav Jain Tennis Academy expires in 6 days. Please renew to ensure uninterrupted training.",
    d_plus_7: "It has been a week since your package expired. We miss your child on court! Renew now at Arnav Jain Tennis Academy to continue training.",
    d_plus_14: "Your child has been away for 2 weeks. Their spot is reserved — renew now at Arnav Jain Tennis Academy!",
    d_plus_21: "Three weeks since expiry. Your child's progress matters — renew today at Arnav Jain Tennis Academy!",
    d_plus_28: "Final reminder: Your package expired a month ago. Please renew at Arnav Jain Tennis Academy to continue your child's tennis journey.",
    lapsed: "Your child's package has been inactive for over 35 days and has been marked as lapsed. Please contact Arnav Jain Tennis Academy to re-enroll."
  };

  const actions = [];

  for (const p of pkgs) {
    if (p.status === 'cancelled' || p.status === 'lapsed') continue;

    const expiry = new Date(p.expiry_date);
    expiry.setHours(0, 0, 0, 0);
    const diffMs = expiry.getTime() - today.getTime();
    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const lastReminder = p.last_reminder_at ? new Date(p.last_reminder_at).toISOString().slice(0, 10) : '';
    if (lastReminder === todayStr) continue;

    const overdueDays = daysUntilExpiry <= 0 ? Math.abs(daysUntilExpiry) : 0;

    if (overdueDays >= 35) {
      actions.push({
        action: 'lapse',
        package_id: String(p.id || ''),
        student_id: String(p.student_id || ''),
        stage: 'dormant',
        message: messages.lapsed,
        overdue_days: String(overdueDays)
      });
      continue;
    }

    if (overdueDays > 0 && [7, 14, 21, 28].includes(overdueDays)) {
      const stage = 'd_plus_' + String(overdueDays);
      actions.push({
        action: 'nudge',
        package_id: String(p.id || ''),
        student_id: String(p.student_id || ''),
        stage: stage,
        message: messages[stage] || 'Please renew your package at Arnav Jain Tennis Academy.',
        overdue_days: String(overdueDays)
      });
      continue;
    }

    if (daysUntilExpiry === 6) {
      actions.push({
        action: 'remind',
        package_id: String(p.id || ''),
        student_id: String(p.student_id || ''),
        stage: 'd_minus_6',
        message: messages.d_minus_6,
        overdue_days: '0'
      });
    }
  }

  const first = actions[0] || {};

  return {
    action: first.action || 'skip',
    package_id: first.package_id || '',
    student_id: first.student_id || '',
    stage: first.stage || '',
    message: first.message || '',
    overdue_days: first.overdue_days || '0',
    actions: actions,
    actions_count: actions.length,
    now: new Date().toISOString()
  };
};`;

step2.settings.sourceCode.code = newCode;
console.log('Updated UC-4 CODE step');

// Now add LAPSED branch to the router
const router = step2.nextAction;
const branches = router.settings.branches;

// Insert LAPSED branch before SKIP (fallback)
branches.splice(branches.length - 1, 0, {
  branchName: 'LAPSED',
  branchType: 'CONDITION',
  conditions: [[
    { operator: 'TEXT_EXACTLY_MATCHES', firstValue: '{{step_2[\"action\"]}}', secondValue: 'lapse', caseSensitive: false }
  ]]
});
console.log('Added LAPSED branch to router');

// Add LAPSED child: find student-parent, find parent, send email, update package, log reminder
const lapseA = {
  name: 'step_lapse_a',
  type: 'PIECE',
  displayName: 'Find Student-Parent Link for Lapse',
  valid: true, skip: false,
  settings: {
    input: {
      auth: '', table_name: 'student_parents', page: 1, pageSize: 20,
      filters: [{ column: 'student_id', operator: 'eq', value: '{{step_2["student_id"]}}' }]
    },
    pieceName: '@puchoaistudio/tool-supabase',
    actionName: 'search_rows',
    pieceVersion: '^2.0.1',
    propertySettings: {
      auth: { type: 'MANUAL' }, page: { type: 'MANUAL' }, columns: { type: 'MANUAL' },
      filters: { type: 'MANUAL' }, pageSize: { type: 'MANUAL' }, table_name: { type: 'MANUAL' },
      countOption: { type: 'MANUAL' }
    },
    sampleData: {},
    errorHandlingOptions: { retryOnFailure: { value: true }, continueOnFailure: { value: false } }
  }
};

const lapseB = {
  name: 'step_lapse_b',
  type: 'PIECE',
  displayName: 'Find Parent for Lapse',
  valid: true, skip: false,
  settings: {
    input: {
      auth: '', table_name: 'parents', page: 1, pageSize: 20,
      filters: [{ column: 'id', operator: 'eq', value: '{{step_lapse_a[0]["parent_id"]}}' }]
    },
    pieceName: '@puchoaistudio/tool-supabase',
    actionName: 'search_rows',
    pieceVersion: '^2.0.1',
    propertySettings: {
      auth: { type: 'MANUAL' }, page: { type: 'MANUAL' }, columns: { type: 'MANUAL' },
      filters: { type: 'MANUAL' }, pageSize: { type: 'MANUAL' }, table_name: { type: 'MANUAL' },
      countOption: { type: 'MANUAL' }
    },
    sampleData: {},
    errorHandlingOptions: { retryOnFailure: { value: true }, continueOnFailure: { value: false } }
  }
};

const lapseC = {
  name: 'step_lapse_c',
  type: 'PIECE',
  displayName: 'Send Lapse Notification Email',
  valid: true, skip: false,
  settings: {
    input: {
      auth: '',
      receiver: ['{{step_lapse_b[0]["email"]}}'],
      subject: 'Package Lapsed - Arnav Jain Tennis Academy',
      body: '{{step_2["message"]}}',
      body_type: 'text',
      cc: [], bcc: [], reply_to: [],
      draft: false
    },
    pieceName: '@puchoaistudio/tool-gmail',
    actionName: 'send_email',
    pieceVersion: '^2.0.4',
    propertySettings: {
      auth: { type: 'MANUAL' }, receiver: { type: 'MANUAL' }, subject: { type: 'MANUAL' },
      body: { type: 'MANUAL' }, body_type: { type: 'MANUAL' }, cc: { type: 'MANUAL' },
      bcc: { type: 'MANUAL' }, reply_to: { type: 'MANUAL' }, draft: { type: 'MANUAL' },
      from: { type: 'MANUAL' }, sender_name: { type: 'MANUAL' },
      attachment: { type: 'MANUAL' }, attachment_name: { type: 'MANUAL' }
    },
    sampleData: {},
    errorHandlingOptions: { retryOnFailure: { value: false }, continueOnFailure: { value: true } }
  }
};

const lapseD = {
  name: 'step_lapse_d',
  type: 'PIECE',
  displayName: 'Update Package to Lapsed',
  valid: true, skip: false,
  settings: {
    input: {
      auth: '', table_name: 'packages',
      update_data: {
        reminder_stage: 'dormant',
        status: 'lapsed',
        last_reminder_at: '{{step_2["now"]}}',
        overdue_days: '{{step_2["overdue_days"]}}'
      },
      filter_column: 'id',
      filter_value: '{{step_2["package_id"]}}',
      filter_type: 'eq',
      count_updated: false, filter_values: [], return_updated: false
    },
    pieceName: '@puchoaistudio/tool-supabase',
    actionName: 'update_row',
    pieceVersion: '^2.0.1',
    propertySettings: {
      auth: { type: 'MANUAL' }, table_name: { type: 'MANUAL' }, filter_type: { type: 'MANUAL' },
      update_data: {
        type: 'MANUAL',
        schema: {
          reminder_stage: { type: 'SHORT_TEXT', required: false, displayName: 'reminder_stage', defaultValue: '' },
          status: { type: 'SHORT_TEXT', required: false, displayName: 'status', defaultValue: '' },
          last_reminder_at: { type: 'SHORT_TEXT', required: false, displayName: 'last_reminder_at', defaultValue: '' },
          overdue_days: { type: 'SHORT_TEXT', required: false, displayName: 'overdue_days', defaultValue: '' }
        }
      },
      filter_value: { type: 'MANUAL' }, count_updated: { type: 'MANUAL' },
      filter_column: { type: 'MANUAL' }, filter_values: { type: 'MANUAL' },
      return_updated: { type: 'MANUAL' }
    },
    sampleData: {},
    errorHandlingOptions: { retryOnFailure: { value: true }, continueOnFailure: { value: false } }
  }
};

const lapseE = {
  name: 'step_lapse_e',
  type: 'PIECE',
  displayName: 'Log Lapse Reminder',
  valid: true, skip: false,
  settings: {
    input: {
      auth: '', table_name: 'reminders',
      row_data: {
        student_id: '{{step_2["student_id"]}}',
        package_id: '{{step_2["package_id"]}}',
        channel: 'email',
        stage: 'dormant',
        status: 'sent'
      },
      return_row: true
    },
    pieceName: '@puchoaistudio/tool-supabase',
    actionName: 'create_row',
    pieceVersion: '^2.0.1',
    propertySettings: {
      auth: { type: 'MANUAL' },
      row_data: {
        type: 'MANUAL',
        schema: {
          student_id: { type: 'SHORT_TEXT', required: false, displayName: 'student_id', defaultValue: '' },
          package_id: { type: 'SHORT_TEXT', required: false, displayName: 'package_id', defaultValue: '' },
          channel: { type: 'SHORT_TEXT', required: false, displayName: 'channel', defaultValue: '' },
          stage: { type: 'SHORT_TEXT', required: false, displayName: 'stage', defaultValue: '' },
          status: { type: 'SHORT_TEXT', required: false, displayName: 'status', defaultValue: '' }
        }
      },
      return_row: { type: 'MANUAL' },
      table_name: { type: 'MANUAL' }
    },
    sampleData: {},
    errorHandlingOptions: { retryOnFailure: { value: true }, continueOnFailure: { value: false } }
  }
};

// Chain: lapse_a → lapse_b → lapse_c → lapse_d → lapse_e
lapseD.nextAction = lapseE;
lapseC.nextAction = lapseD;
lapseB.nextAction = lapseC;
lapseA.nextAction = lapseB;

// Insert LAPSED child at the correct position in children array
// children: [REMIND branch, NUDGE branch, SKIP (null), ...]
// We need to insert LAPSED child before SKIP (null)
const children = router.children;
// Find the null (SKIP) entry
const skipIdx = children.findIndex(c => c === null);
if (skipIdx === -1) {
  children.push(lapseA);
} else {
  children.splice(skipIdx, 0, lapseA);
}
console.log('Added LAPSED child chain at index', skipIdx === -1 ? children.length - 1 : skipIdx);
console.log('Branches:', branches.length, 'Children:', children.length);

fs.writeFileSync('workflows/UC-4_renewal_reminder_engine.json', JSON.stringify(data, null, 2));
console.log('Written UC-4 engine');