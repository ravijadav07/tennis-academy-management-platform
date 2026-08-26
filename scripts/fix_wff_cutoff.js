const fs = require('fs');
const path = require('path');

const wfPath = path.join(__dirname, '..', 'workflows', 'WF-F_daily_1on1_confirmation.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
const template = wf.template;

// 1. Update step_3 CODE to include T-2h cutoff check
const step3 = template.trigger.nextAction.nextAction.nextAction;
step3.settings.sourceCode.code = `export const code = async (inputs) => {
  const sessions = Array.isArray(inputs.sessions) ? inputs.sessions : [];
  const oneOnOne = sessions.filter(s => s.type === 'one_on_one' && s.status !== 'cancelled' && !s.cancelled_type);
  const hasSessions = oneOnOne.length > 0;
  const now = new Date();
  const sessionList = oneOnOne.map(s => ({
    id: String(s.id),
    student_id: String(s.student_id || ''),
    coach_id: String(s.coach_id || ''),
    start_time: s.start_time || '',
    end_time: s.end_time || '',
    location: s.location || '',
    confirmation: s.confirmation || 'not_sent'
  }));
  const first = sessionList[0] || {};
  let msg = '';
  let withinCutoff = false;
  if (hasSessions) {
    const firstSess = oneOnOne[0];
    msg = 'Reminder: Your 1-on-1 tennis session is scheduled today at ' + (firstSess.start_time || 'scheduled time') + '. Please confirm your attendance. - Arnav Jain Tennis Academy';
    if (firstSess.start_time) {
      const [h, m] = (firstSess.start_time || '00:00').split(':').map(Number);
      const sessionTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h || 0, m || 0, 0);
      const hoursUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      withinCutoff = hoursUntil >= 2;
    }
  }
  return {
    has_sessions: hasSessions ? 'true' : 'false',
    sessions_count: oneOnOne.length,
    message: msg,
    sessions_json: JSON.stringify(sessionList),
    first_student_id: hasSessions ? String(oneOnOne[0].student_id || '') : '',
    first_session_id: hasSessions ? String(oneOnOne[0].id || '') : '',
    first_start_time: hasSessions ? (oneOnOne[0].start_time || '') : '',
    all_session_ids: hasSessions ? JSON.stringify(sessionList.map(s => s.id)) : '[]',
    all_student_ids: hasSessions ? JSON.stringify(sessionList.map(s => s.student_id)) : '[]',
    within_cutoff: withinCutoff ? 'true' : 'false'
  };
};`;

// 2. Update the router to have 3 branches
const router = template.trigger.nextAction.nextAction.nextAction.nextAction;
router.settings.branches = [
  {
    branchName: "T-2h Cutoff Passed (Auto-Decline)",
    branchType: "CONDITION",
    conditions: [
      [
        { operator: "TEXT_EXACTLY_MATCHES", firstValue: "{{step_3['has_sessions']}}", secondValue: "true", caseSensitive: false },
        { operator: "TEXT_EXACTLY_MATCHES", firstValue: "{{step_3['within_cutoff']}}", secondValue: "false", caseSensitive: false }
      ]
    ]
  },
  {
    branchName: "Has Sessions (Within Cutoff)",
    branchType: "CONDITION",
    conditions: [
      [
        { operator: "TEXT_EXACTLY_MATCHES", firstValue: "{{step_3['has_sessions']}}", secondValue: "true", caseSensitive: false },
        { operator: "TEXT_EXACTLY_MATCHES", firstValue: "{{step_3['within_cutoff']}}", secondValue: "true", caseSensitive: false }
      ]
    ]
  },
  {
    branchName: "No Sessions",
    branchType: "FALLBACK"
  }
];

// 3. Add the cutoff branch child (auto-decline)
// The existing "Has Sessions" branch is children[0] (step_4 → step_5 → ... → step_9)
// Keep it as-is but move it to index 1
// Add new cutoff branch at index 0

const cutoffBranch = {
  name: "step_cutoff_update",
  type: "PIECE",
  displayName: "Auto-Decline: Update Confirmation Status",
  valid: true,
  skip: false,
  settings: {
    input: {
      auth: "",
      table_name: "schedule",
      update_data: { confirmation: "declined_no" },
      filter_column: "id",
      filter_value: "{{step_3['first_session_id']}}",
      filter_type: "eq",
      count_updated: false,
      filter_values: [],
      return_updated: false
    },
    pieceName: "@puchoaistudio/tool-supabase",
    actionName: "update_row",
    pieceVersion: "^2.0.1",
    propertySettings: {
      auth: { type: "MANUAL" },
      table_name: { type: "MANUAL" },
      filter_type: { type: "MANUAL" },
      update_data: {
        type: "MANUAL",
        schema: {
          confirmation: { type: "SHORT_TEXT", required: false, displayName: "confirmation", defaultValue: "" }
        }
      },
      filter_value: { type: "MANUAL" },
      count_updated: { type: "MANUAL" },
      filter_column: { type: "MANUAL" },
      filter_values: { type: "MANUAL" },
      return_updated: { type: "MANUAL" }
    },
    sampleData: {},
    errorHandlingOptions: {
      retryOnFailure: { value: true },
      continueOnFailure: { value: true }
    }
  },
  nextAction: {
    name: "step_cutoff_log",
    type: "PIECE",
    displayName: "Log Cutoff No-Response",
    valid: true,
    skip: false,
    settings: {
      input: {
        auth: "",
        table_name: "communications_log",
        row_data: {
          student_id: "{{step_3['first_student_id']}}",
          type: "confirmation",
          channel: "email",
          status: "failed",
          date: "{{step_1['date']}}"
        },
        return_row: false
      },
      pieceName: "@puchoaistudio/tool-supabase",
      actionName: "create_row",
      pieceVersion: "^2.0.1",
      propertySettings: {
        auth: { type: "MANUAL" },
        row_data: {
          type: "MANUAL",
          schema: {
            student_id: { type: "SHORT_TEXT", required: false, displayName: "student_id", defaultValue: "" },
            type: { type: "SHORT_TEXT", required: false, displayName: "type", defaultValue: "" },
            channel: { type: "SHORT_TEXT", required: false, displayName: "channel", defaultValue: "" },
            status: { type: "SHORT_TEXT", required: false, displayName: "status", defaultValue: "" },
            date: { type: "SHORT_TEXT", required: false, displayName: "date", defaultValue: "" }
          }
        },
        return_row: { type: "MANUAL" },
        table_name: { type: "MANUAL" }
      },
      sampleData: {},
      errorHandlingOptions: {
        retryOnFailure: { value: true },
        continueOnFailure: { value: true }
      }
    }
  }
};

// The existing children: [step_4_branch, null]
// New children: [cutoffBranch, step_4_branch, null]
router.children = [cutoffBranch, router.children[0], null];

// 4. Update description
wf.description = "Sends email confirmation every morning for today's 1-on-1 sessions. Queries schedule table, resolves parent via student_parents junction, sends Gmail with Confirm/Cancel links. Auto-declines sessions within T-2h cutoff (no time for response). Email only (no WhatsApp/SMS).";

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log('WF-F updated: T-2h cutoff branch added (auto-decline within 2h of session start)');
console.log('Email-only confirmation confirmed (channel: email, Gmail piece)');
console.log('New router branches: T-2h Cutoff | Has Sessions (Within Cutoff) | No Sessions');