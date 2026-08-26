const fs = require('fs');

function webhookTrigger(input={}) {
  return {
    authType: 'none',
    authFields: {},
    ...input
  };
}

function webhookTriggerSettings() {
  return {
    pieceName: '@puchoaistudio/tool-webhook',
    pieceVersion: '^2.0.4',
    triggerName: 'catch_webhook',
    input: webhookTrigger(),
    propertySettings: {
      authType: { type: 'MANUAL' },
      authFields: { type: 'MANUAL', schema: {} },
      liveMarkdown: { type: 'MANUAL' },
      syncMarkdown: { type: 'MANUAL' },
      testMarkdown: { type: 'MANUAL' }
    },
    sampleData: {}
  };
}

function codeNode(name, displayName, inputs, code, nextN) {
  return {
    name,
    type: 'CODE',
    valid: true,
    skip: false,
    settings: {
      input: inputs,
      sourceCode: { code, packageJson: '{}' },
      propertySettings: Object.fromEntries(Object.keys(inputs).map(k => [k, { type: 'MANUAL' }])),
      sampleData: {},
      errorHandlingOptions: { retryOnFailure: { value: false }, continueOnFailure: { value: false } }
    },
    nextAction: nextN || null,
    displayName: displayName
  };
}

function supabaseNode(name, displayName, actionName, input, nextN, retry=true, cont=false) {
  return {
    name,
    type: 'PIECE',
    valid: true,
    skip: false,
    settings: {
      input: { auth: '', ...input },
      pieceName: '@puchoaistudio/tool-supabase',
      actionName,
      pieceVersion: '^2.0.0',
      propertySettings: Object.fromEntries(
        ['auth', ...Object.keys(input)].map(k => {
          if (k === 'values') return [k, { type: 'MANUAL' }];
          return [k, { type: 'MANUAL' }];
        })
      ),
      sampleData: {},
      errorHandlingOptions: { retryOnFailure: { value: retry }, continueOnFailure: { value: cont } }
    },
    nextAction: nextN || null,
    displayName: displayName
  };
}

function whatsappNode(name, displayName, input, nextN) {
  // Replaced by gmailNode — kept for backward compat, delegates to gmailNode
  return gmailNode(name, displayName, {
    receiver: input.to,
    subject: 'Notification - Arnav Jain Tennis Academy',
    body: input.text,
    body_type: 'text'
  }, nextN);
}

function gmailNode(name, displayName, input, nextN) {
  return {
    name,
    type: 'PIECE',
    valid: true,
    skip: false,
    settings: {
      input: {
        auth: '',
        cc: [],
        bcc: [],
        reply_to: [],
        draft: false,
        ...input
      },
      pieceName: '@puchoaistudio/tool-gmail',
      actionName: 'send_email',
      pieceVersion: '^2.0.4',
      propertySettings: {
        auth: { type: 'MANUAL' },
        receiver: { type: 'MANUAL' },
        subject: { type: 'MANUAL' },
        body: { type: 'MANUAL' },
        body_type: { type: 'MANUAL' },
        cc: { type: 'MANUAL' },
        bcc: { type: 'MANUAL' },
        reply_to: { type: 'MANUAL' },
        draft: { type: 'MANUAL' },
        from: { type: 'MANUAL' },
        sender_name: { type: 'MANUAL' },
        attachment: { type: 'MANUAL' },
        attachment_name: { type: 'MANUAL' }
      },
      sampleData: {},
      errorHandlingOptions: { retryOnFailure: { value: false }, continueOnFailure: { value: true } }
    },
    nextAction: nextN || null,
    displayName: displayName
  };
}

function webhookReturnNode(name, displayName, bodyFields, status, nextN) {
  return {
    name,
    type: 'PIECE',
    valid: true,
    skip: false,
    settings: {
      input: {
        fields: { body: bodyFields, status, headers: {} },
        respond: 'stop',
        responseType: 'json'
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
    },
    nextAction: nextN || null,
    displayName: displayName
  };
}

function routerNode(name, displayName, branches, children, nextN) {
  return {
    name,
    type: 'ROUTER',
    valid: true,
    skip: false,
    settings: {
      branches,
      executionType: 'EXECUTE_FIRST_MATCH'
    },
    children,
    nextAction: nextN || null,
    displayName: displayName
  };
}

function buildWorkflow(name, desc, displayName, triggerDisplayName, pieces, triggerNextAction) {
  return {
    created: '1754800000001',
    updated: '1754800000001',
    name,
    description: desc,
    tags: [],
    pieces,
    template: {
      displayName,
      trigger: {
        name: 'trigger',
        type: 'TOOL_TRIGGER',
        displayName: triggerDisplayName,
        valid: true,
        settings: webhookTriggerSettings(),
        nextAction: triggerNextAction
      },
      valid: true,
      agentIds: [],
      connectionIds: [],
      schemaVersion: '7'
    },
    blogUrl: ''
  };
}

// ==================== WF-I: Direct Payment Capture ====================
const wfISuccess = webhookReturnNode('step_9', 'Return Success Response', {
  success: true,
  student_id: "{{step_1['student_id']}}",
  payment_id: "{{step_3['id']}}",
  message: 'Payment captured successfully'
}, 200);

const wfIResetG = supabaseNode('step_7', 'Reset GC Workflow WF-G', 'upsert_row', {
  table: 'workflow_state',
  values: {
    workflow_key: 'WF-G_reset',
    entity_key: 'student_id',
    entity_value: "{{step_1['student_id']}}",
    state_json: { reset: true }
  }
}, wfISuccess, false, false);

const wfIStopH = supabaseNode('step_6', 'Stop Reminder Workflow WF-H', 'upsert_row', {
  table: 'workflow_state',
  values: {
    workflow_key: 'WF-H_stop',
    entity_key: 'student_id',
    entity_value: "{{step_1['student_id']}}",
    state_json: { stop: true }
  }
}, wfIResetG, false, false);

const wfIUpdatePkg = supabaseNode('step_5', 'Update Package to Paid', 'update_row', {
  table: 'packages',
  values: { payment_status: 'paid', status: 'active' },
  search_column: 'student_id',
  search_value: "{{step_1['student_id']}}"
}, wfIStopH, true, false);

const wfIFindPkg = supabaseNode('step_4', 'Find Active Package', 'search_rows', {
  table: 'packages',
  search_column: 'student_id',
  search_value: "{{step_1['student_id']}}"
}, wfIUpdatePkg, false, false);

const wfICreatePmt = supabaseNode('step_3', 'Create Payment Record', 'create_row', {
  table: 'payments',
  values: {
    student_id: "{{step_1['student_id']}}",
    amount: "{{step_1['amount']}}",
    gateway: "{{step_1['gateway']}}",
    type: 'direct',
    status: 'paid',
    date: "{{step_1['date']}}",
    stripe_payment_intent_id: "{{step_1['payment_intent_id']}}"
  }
}, wfIFindPkg, true, false);

const wfIFindStudent = supabaseNode('step_2', 'Find Student', 'search_rows', {
  table: 'students',
  search_column: 'id',
  search_value: "{{step_1['student_id']}}"
}, wfICreatePmt, true, false);

const wfIError = webhookReturnNode('step_error', 'Return Error Response', {
  success: false,
  error: "{{step_1['error']}}"
}, 400);

const wfIRouter = routerNode('step_router', 'Route by Validation', [
  {
    branchName: 'Valid Payment',
    branchType: 'CONDITION',
    conditions: [[{ operator: 'TEXT_EXACTLY_MATCHES', firstValue: "{{step_1['valid']}}", secondValue: 'true', caseSensitive: false }]]
  },
  { branchName: 'Invalid', branchType: 'FALLBACK' }
], [wfIFindStudent, wfIError]);

const wfIParse = codeNode('step_1', 'Parse Payment Payload', { payload: "{{trigger['body']}}" },
  'export const code = async (inputs) => {\\n  const p = typeof inputs.payload === \"string\" ? JSON.parse(inputs.payload) : inputs.payload;\\n  const studentId = (p.student_id || \"\").toString().trim();\\n  const amount = parseInt(p.amount || \"0\");\\n  const gateway = (p.gateway || \"stripe\").trim();\\n  const paymentIntentId = (p.payment_intent_id || p.stripe_payment_intent_id || \"\").trim();\\n  const date = (p.date || p.created_at || new Date().toISOString().split(\"T\")[0]).trim();\\n  const parentPhone = (p.parent_phone || \"\").trim();\\n  const parentName = (p.parent_name || \"\").trim();\\n  const valid = studentId.length > 0 && amount > 0 && gateway.length > 0;\\n  return {\\n    valid: valid,\\n    student_id: studentId,\\n    amount: amount,\\n    gateway: gateway,\\n    payment_intent_id: paymentIntentId,\\n    date: date,\\n    parent_phone: parentPhone,\\n    parent_name: parentName,\\n    error: valid ? \"\" : \"Missing required fields: student_id, amount, gateway\"\\n  };\\n};',
  wfIRouter);

const wfI = buildWorkflow('WF-I Direct Payment Capture',
  'Captures Stripe payment_intent.succeeded webhook, creates payment record, updates package status, resets reminder workflows',
  'WF-I Direct Payment Capture', 'Catch Payment Webhook',
  ['@puchoaistudio/tool-webhook', '@puchoaistudio/tool-supabase'],
  wfIParse);

fs.writeFileSync('workflows/WF-I_direct_payment_capture.json', JSON.stringify(wfI, null, 2));
console.log('WF-I written successfully');

// Verify
const v1 = JSON.parse(fs.readFileSync('workflows/WF-I_direct_payment_capture.json', 'utf8'));
console.log('WF-I verified: pieces=' + v1.pieces.length + ', template valid=' + v1.template.valid);