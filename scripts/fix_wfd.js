const fs = require('fs');
let data = JSON.parse(fs.readFileSync('workflows/WF-D_student_onboarding.json', 'utf8'));
const trigger = data.template.trigger;
const step1 = trigger.nextAction;
const oldRouter = step1.nextAction;

// === STEP 1: Update step_1 CODE to add dup_check fields ===
let code = step1.settings.sourceCode.code;
const returnPos = code.indexOf('return {');
code = code.slice(0, returnPos) + '  const dupCheck = name.length > 0 && phone.length > 0 ? { name, phone } : null;\n  ' + code.slice(returnPos);
code = code.replace(
  '    expiry_date: expiry,',
  '    expiry_date: expiry,\n    dup_check_name: dupCheck ? dupCheck.name : "",\n    dup_check_phone: dupCheck ? dupCheck.phone : "",'
);
step1.settings.sourceCode.code = code;
console.log('1. Added dup_check to step_1 CODE');

// === STEP 2: Create step_1_dup (duplicate search) ===
const step1dup = {
  name: 'step_1_dup',
  type: 'PIECE',
  displayName: 'Check For Duplicate Student by Name+Phone',
  valid: true, skip: false,
  settings: {
    input: {
      auth: '', table_name: 'students', page: 1, pageSize: 1,
      filters: [{ column: 'name', operator: 'eq', value: '{{step_1["dup_check_name"]}}' }]
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
  },
  nextAction: oldRouter
};
step1.nextAction = step1dup;
console.log('2. Inserted step_1_dup');

// === STEP 3: Add 'Duplicate Student' branch ===
const branches = oldRouter.settings.branches;

branches.unshift({
  branchName: 'Duplicate Student',
  branchType: 'CONDITION',
  conditions: [[
    { operator: 'TEXT_EXACTLY_MATCHES', firstValue: '{{step_1["valid"]}}', secondValue: 'true', caseSensitive: false },
    { operator: 'TEXT_EXACTLY_MATCHES', firstValue: '{{step_1_dup["rows_count"]}}', secondValue: '1', caseSensitive: false }
  ]]
});

// Change 'Valid Payload' to 'Valid with Parent Info' and add parent condition
branches[1].branchName = 'Valid with Parent Info';
branches[1].conditions[0].push({
  operator: 'TEXT_EXACTLY_MATCHES', firstValue: '{{step_1["has_parent"]}}', secondValue: 'true', caseSensitive: false
});

// Insert 'Valid without Parent Info' before Invalid
branches.splice(2, 0, {
  branchName: 'Valid without Parent Info',
  branchType: 'CONDITION',
  conditions: [[
    { operator: 'TEXT_EXACTLY_MATCHES', firstValue: '{{step_1["valid"]}}', secondValue: 'true', caseSensitive: false },
    { operator: 'TEXT_EXACTLY_MATCHES', firstValue: '{{step_1["has_parent"]}}', secondValue: 'false', caseSensitive: false }
  ]]
});

oldRouter.displayName = 'Route by Validation, Parent Info & Duplicate Check';
console.log('3. Updated router branches');

// === STEP 4: Add step_dup_error as children[0] ===
const dupError = {
  name: 'step_dup_error',
  type: 'PIECE',
  displayName: 'Return Duplicate Error',
  valid: true, skip: false,
  settings: {
    input: {
      fields: {
        body: { success: false, error: 'Student with name {{step_1["student_name"]}} already exists. Duplicate enrollment prevented.' },
        status: 409, headers: {}
      },
      respond: 'stop', responseType: 'json'
    },
    pieceName: '@puchoaistudio/tool-webhook',
    actionName: 'return_response',
    pieceVersion: '^2.0.4',
    propertySettings: {
      fields: {
        type: 'MANUAL',
        schema: {
          body: { type: 'JSON', required: true, displayName: 'JSON Body' },
          status: { type: 'NUMBER', required: false, displayName: 'Status', defaultValue: 200 },
          headers: { type: 'OBJECT', required: false, displayName: 'Headers' }
        }
      },
      respond: { type: 'MANUAL' },
      responseType: { type: 'MANUAL' }
    },
    sampleData: {},
    errorHandlingOptions: { retryOnFailure: { value: false }, continueOnFailure: { value: false } }
  }
};

oldRouter.children.unshift(dupError);
console.log('4. Added Dup Error child');

// === STEP 5: Build no-parent branch ===
// Original children: [dupError, step_2 (with-parent), step_error (invalid)]
const withParentBranch = oldRouter.children[1];

const fullStep2 = withParentBranch;
const fullStep3 = fullStep2.nextAction;
const fullStep4 = fullStep3.nextAction;
const fullStep5 = fullStep4.nextAction;
const fullStep6 = fullStep5.nextAction;
const fullStep7 = fullStep6.nextAction;
const fullStep8 = fullStep7.nextAction;

// step_2np: clone step_2 (create student)
const step2np = JSON.parse(JSON.stringify(fullStep2));
step2np.name = 'step_2np';

// step_3np: clone step_5 (create package)
const step3np = JSON.parse(JSON.stringify(fullStep5));
step3np.name = 'step_3np';
step3np.displayName = 'Create Package';
step3np.settings.input.row_data.student_id = '{{step_2np["id"]}}';

// step_3np_log: comm log entry
const step3npLog = {
  name: 'step_3np_log',
  type: 'PIECE',
  displayName: 'Log Enrollment (No Parent)',
  valid: true, skip: false,
  settings: {
    input: {
      auth: '', table_name: 'communications_log',
      row_data: {
        student_id: '{{step_2np["id"]}}',
        type: 'welcome', channel: 'email', status: 'sent',
        date: '{{step_1["start_date"]}}'
      },
      return_row: false
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
          type: { type: 'SHORT_TEXT', required: false, displayName: 'type', defaultValue: '' },
          channel: { type: 'SHORT_TEXT', required: false, displayName: 'channel', defaultValue: '' },
          status: { type: 'SHORT_TEXT', required: false, displayName: 'status', defaultValue: '' },
          date: { type: 'SHORT_TEXT', required: false, displayName: 'date', defaultValue: '' }
        }
      },
      return_row: { type: 'MANUAL' },
      table_name: { type: 'MANUAL' }
    },
    sampleData: {},
    errorHandlingOptions: { retryOnFailure: { value: true }, continueOnFailure: { value: false } }
  }
};

// step_4np: return success (clone step_8)
const step4np = JSON.parse(JSON.stringify(fullStep8));
step4np.name = 'step_4np';
step4np.displayName = 'Return Success';
step4np.settings.input.fields.body = {
  success: true,
  student_id: '{{step_2np["id"]}}',
  package_id: '{{step_3np["id"]}}',
  message: 'Student enrolled successfully (no parent info provided)'
};

// Chain
step3npLog.nextAction = step4np;
step3np.nextAction = step3npLog;
step2np.nextAction = step3np;

// Insert at children[2] (before step_error)
oldRouter.children.splice(2, 0, step2np);

console.log('5. Built and inserted no-parent branch');

// === STEP 6: Fix with-parent comm log to include parent_id properly ===
// step_7 (comm log) references step_3['id'] which is parent id - that's correct
// No additional fix needed for that

console.log('Children:', oldRouter.children.length, 'Branches:', branches.length);
fs.writeFileSync('workflows/WF-D_student_onboarding.json', JSON.stringify(data, null, 2));
console.log('Written WF-D successfully');