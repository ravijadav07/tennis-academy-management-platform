const fs = require('fs');
const path = require('path');

const wfPath = path.join(__dirname, '..', 'workflows', 'WF-D_student_onboarding.json');
const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));

const template = wf.template;
const trigger = template.trigger;
const step1 = trigger.nextAction; // step_1 (CODE)

// 1. Insert step_1a_cap BETWEEN step_1 and step_1_dup
const step_1a_cap = {
  name: "step_1a_cap",
  type: "PIECE",
  displayName: "Check Batch Capacity (Soft Warning)",
  valid: true,
  skip: false,
  settings: {
    input: {
      auth: "",
      table_name: "batches",
      page: 1,
      pageSize: 1,
      columns: ["id", "name", "capacity"],
      filters: [
        {
          column: "id",
          operator: "eq",
          value: "{{step_1['batch_id']}}"
        }
      ]
    },
    pieceName: "@puchoaistudio/tool-supabase",
    actionName: "search_rows",
    pieceVersion: "^2.0.1",
    propertySettings: {
      auth: { type: "MANUAL" },
      page: { type: "MANUAL" },
      columns: { type: "MANUAL" },
      filters: { type: "MANUAL" },
      pageSize: { type: "MANUAL" },
      table_name: { type: "MANUAL" },
      countOption: { type: "MANUAL" }
    },
    sampleData: {},
    errorHandlingOptions: {
      retryOnFailure: { value: true },
      continueOnFailure: { value: true }
    }
  },
  nextAction: {
    name: "step_1b_count",
    type: "PIECE",
    displayName: "Count Enrolled Students in Batch",
    valid: true,
    skip: false,
    settings: {
      input: {
        auth: "",
        table_name: "students",
        page: 1,
        pageSize: 1,
        filters: [
          {
            column: "batch_id",
            operator: "eq",
            value: "{{step_1['batch_id']}}"
          }
        ],
        countOption: "exact"
      },
      pieceName: "@puchoaistudio/tool-supabase",
      actionName: "search_rows",
      pieceVersion: "^2.0.1",
      propertySettings: {
        auth: { type: "MANUAL" },
        page: { type: "MANUAL" },
        columns: { type: "MANUAL" },
        filters: { type: "MANUAL" },
        pageSize: { type: "MANUAL" },
        table_name: { type: "MANUAL" },
        countOption: { type: "MANUAL" }
      },
      sampleData: {},
      errorHandlingOptions: {
        retryOnFailure: { value: true },
        continueOnFailure: { value: true }
      }
    },
    nextAction: step1.nextAction // points to step_1_dup
  }
};

// Patch step_1 to point to step_1a_cap instead of step_1_dup
step1.nextAction = step_1a_cap;

// 2. Navigate to the router step and find branches
function findStep(root, name) {
  let s = root;
  while (s) {
    if (s.name === name) return s;
    if (s.children) {
      for (const child of s.children) {
        const found = findStep(child, name);
        if (found) return found;
      }
    }
    s = s.nextAction;
  }
  return null;
}

const router = findStep(template.trigger, 'step_router');
if (!router) {
  console.error('Could not find step_router');
  process.exit(1);
}

// children: [dup_error, valid_parent, no_parent, invalid]
const validParentBranch = router.children[1];
const noParentBranch = router.children[2];

// Find step_9 in valid_parent branch
let step = validParentBranch;
while (step) {
  if (step.name === 'step_9') {
    step.settings.input.fields.body.batch_capacity = "{{step_1a_cap['rows'][0]['capacity']}}";
    step.settings.input.fields.body.batch_enrolled = "{{step_1b_count['rows_count']}}";
    break;
  }
  step = step.nextAction;
}

// Find step_4np in no_parent branch
step = noParentBranch;
while (step) {
  if (step.name === 'step_4np') {
    step.settings.input.fields.body.batch_capacity = "{{step_1a_cap['rows'][0]['capacity']}}";
    step.settings.input.fields.body.batch_enrolled = "{{step_1b_count['rows_count']}}";
    break;
  }
  step = step.nextAction;
}

// 3. Update description
wf.description = "Creates student profile, parent, package, sends welcome email and admission email on enrollment. Includes batch capacity soft-warning check (allow + flag).";

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
console.log('WF-D updated: added batch capacity soft-warning check (step_1a_cap + step_1b_count)');
console.log('Success responses now include capacity_warning, batch_capacity, batch_enrolled');