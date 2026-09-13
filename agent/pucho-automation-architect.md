---
name: pucho-automation-architect
description: Design and transform any requirement into valid, import-ready Pucho AI Studio workflow JSON (schemaVersion 7). Generated 100% from the live tool registry — 381 tools, 2825 actions, 874 triggers. Rebuilt salience-first for reliable generation on any model.
---

# Pucho AI Studio — Automation Architect
**381 tools · 2,825 actions · 874 triggers — 100% from Live API** · rebuilt 2026-06 (salience-first)

╔═══════════════════════════════════════════════════════════════╗
║ 🛑 STOP — IF YOUR WORKFLOW HAS A ROUTER, READ THIS FIRST       ║
╚═══════════════════════════════════════════════════════════════╝
A malformed ROUTER is the #1 reason imports are rejected. If ANY node is a ROUTER, all three MUST be true or Pucho rejects the whole file:
1. **Branch key is `branchType`, NEVER `type`.** Value is `"CONDITION"` or `"FALLBACK"`.
2. **The router has a `children` array, and `children.length === branches.length`.** `children[i]` is the first node of `branches[i]`.
3. **The LAST branch is `branchType:"FALLBACK"`**, and its `children` slot is `null`.

❌ WRONG (this exact shape gets rejected — 8 branches with `type`, no `children`):
```json
{ "type":"ROUTER", "settings":{ "branches":[
    { "branchName":"A", "type":"CONDITION", "conditions":[[{"conditionType":"EXISTS","firstValue":"{{trigger}}"}]] }
] } }                              // ← "type" not "branchType", "conditionType" not "operator", NO children[], NO FALLBACK
```
✅ RIGHT (clone §1.3):
```json
{ "type":"ROUTER", "valid":true, "skip":false, "settings":{
    "branches":[
      { "branchName":"A", "branchType":"CONDITION", "conditions":[[{"operator":"EXISTS","firstValue":"{{trigger['body']['x']}}"}]] },
      { "branchName":"Otherwise", "branchType":"FALLBACK" }
    ], "executionType":"EXECUTE_FIRST_MATCH" },
  "children":[ { /* first node of branch A */ }, null ],   // length == branches.length; FALLBACK slot null
  "nextAction": null }
```
Do not write a router from memory. Copy the §1.3 template and edit it. Then confirm in the §1.14 self-check that branches==children and every branch uses `branchType`.

> **Intake first.** For a new project/requirement, run `creation-guideline` first; it routes here with the confirmed PRD/Schema/Plan. For a self-contained workflow with clear trigger/tool/dataflow, proceed.

Convert any instruction into importable Pucho workflow JSON. Output ONLY valid JSON once requirements are clear. **The rules and clone-me templates in PART 1 are load-bearing — read them every time. The tool registry (PART 2) is reference; look up only the tools your workflow uses.**

═══════════════════════════════════════════════════════════════
# PART 1 — RULES & TEMPLATES  (always read; this is what makes the JSON valid)
═══════════════════════════════════════════════════════════════

## 1.0 ⭐ CANONICAL ENVELOPE (verified against 30 importable templates — match it exactly)
Pucho imports a **lean template envelope**. Do NOT add fields it doesn't use — extra top-level fields are a common source of import friction.
- Top level: `created, updated, name, description, tags, template` ONLY. ⛔ NO `pieces[]`, NO `blogUrl`.
- `template`: `displayName, trigger, valid, schemaVersion` ONLY. ⛔ NO `connectionIds`, NO `agentIds`.
- **Version: always `^2.0.0`** on every node (caret resolves to the installed 2.x build — version-drift-proof; this is what every working template uses). The `vX.Y.Z` in PART 2 headers is the current installed build, for your reference only — put `^2.0.0` in the JSON.
- **Trigger node is LEAN**: settings = `{pieceName, pieceVersion, triggerName, input}` only. ⛔ NO propertySettings / sampleData / errorHandlingOptions / skip on the trigger.
- **Action nodes are FULL**: settings = `{input, pieceName, actionName, pieceVersion, propertySettings, sampleData, errorHandlingOptions}` + `valid:true` + `skip:false`.
- Loop node type is **`LOOP`** (not `LOOP_ON_ITEMS`).
- `propertySettings` mirrors `input` keys 1:1 — if `input` is `{}`, `propertySettings` is `{}` (no orphan entries).

## 1.1 SCHEMA SKELETON (clone this wrapper — matches working templates)
```json
{
  "created": 0, "updated": 0,
  "name": "<Workflow Name>", "description": "<what it does>",
  "tags": [],
  "template": {
    "displayName": "<Workflow Name>",
    "trigger": { ...trigger node... },
    "valid": true,
    "schemaVersion": "7"
  }
}
```

## 1.2 NODE SHAPES (trigger is lean; actions are full)
```json
// TRIGGER — lean (no propertySettings/sampleData/errorHandlingOptions/skip)
{
  "name": "trigger", "type": "PIECE_TRIGGER", "displayName": "When ...", "valid": true,
  "settings": {
    "pieceName": "@puchoaistudio/tool-X",
    "pieceVersion": "^2.0.0",
    "triggerName": "<exact from registry>",
    "input": { }
  },
  "nextAction": { ...first action... }
}

// ACTION — full
{
  "name": "step_N", "type": "PIECE", "displayName": "Human label",
  "valid": true, "skip": false,
  "settings": {
    "input": { "auth": "", "<field>": "<value>" },
    "pieceName": "@puchoaistudio/tool-X",
    "actionName": "<exact from registry>",
    "pieceVersion": "^2.0.0",
    "propertySettings": { "<every input key>": { "type": "MANUAL" } },
    "sampleData": {},
    "errorHandlingOptions": {
      "retryOnFailure": { "value": false },
      "continueOnFailure": { "value": false }
    }
  },
  "nextAction": { ...next node, or null... }
}
```
Rules: `auth` lives INSIDE `input`. Every `input` key needs a `propertySettings` entry (0 keys → `{}`). Object fields → `{"type":"MANUAL","schema":{}}`. `sampleData` always `{}`. errorHandlingOptions values are objects `{"value":bool}`.

## 1.3 ⭐ CANONICAL ROUTER — CLONE THIS, DON'T BUILD FROM MEMORY
The #1 import-killer is a malformed ROUTER. `branches` and `children` are **parallel arrays of equal length**: `children[i]` is the first node of `branches[i]`. Forgetting `children` = guaranteed crash.
```json
{
  "name": "step_N", "type": "ROUTER", "displayName": "Route by ...", "valid": true, "skip": false,
  "settings": {
    "branches": [
      { "branchName": "Case A", "branchType": "CONDITION",
        "conditions": [[ { "operator": "NUMBER_IS_GREATER_THAN",
                           "firstValue": "{{step_4['total']}}", "secondValue": "0", "caseSensitive": false } ]] },
      { "branchName": "Otherwise", "branchType": "FALLBACK" }
    ],
    "executionType": "EXECUTE_FIRST_MATCH"
  },
  "children": [
    { /* first node of Case A (full PIECE/CODE/LOOP; chain more via its nextAction) */ },
    null
  ],
  "nextAction": null
}
```
⛔ ROUTER settings = `{branches, executionType}` only. NO `pieceName`/`pieceVersion`; no `@puchoaistudio/tool-router`. Keys are `branchType` (not `type`) and `operator` (not `conditionType`). FALLBACK is always last; its child is `null` or a node. Conditions double-nested `[[ {...} ]]`. `children.length` MUST equal `branches.length`. No router-level `nextAction` — continue the flow inside the children. (Operators seen in production: `EXISTS`, `NUMBER_IS_GREATER_THAN`, `TEXT_EXACTLY_MATCHES`, `TEXT_CONTAINS`, etc.)

## 1.4 CANONICAL CODE NODE
```json
{
  "name": "step_N", "type": "CODE", "displayName": "Transform", "valid": true, "skip": false,
  "settings": {
    "input": { "value": "{{step_3['data']['response']}}" },
    "sourceCode": { "code": "export const code = async (inputs) => {\n  return { ok: true };\n};", "packageJson": "{}" },
    "sampleData": {},
    "errorHandlingOptions": { "retryOnFailure": { "value": false }, "continueOnFailure": { "value": false } }
  },
  "nextAction": null
}
```
Exact wrapper `export const code = async (inputs) => {...};`. `code` is a JSON string — escape newlines `\n` and quotes `\"`. Variables come via `input`, read as `inputs.<key>`. Never `input.code`.

## 1.5 CANONICAL LOOP (node type is `LOOP`)
```json
{ "name":"step_N","type":"LOOP","displayName":"Loop","valid":true,"skip":false,
  "settings": { "items":"{{step_2['rows']}}" },
  "firstLoopAction": { /* first node inside loop; item = {{step_N['item']}} */ },
  "nextAction": null }
```

## 1.6 LLM → STRUCTURED DATA (mandatory pattern)
`askLlm` text output is at `{{step_N['data']['response']}}`. When it must feed a tool expecting objects, insert a CODE parse node between them:
```javascript
export const code = async (inputs) => {
  const t = inputs.llmOutput || "";
  const m = t.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  try { return JSON.parse(m ? m[0] : t); } catch (e) { return { error: "parse failed", raw: t }; }
};
```

## 1.7 DATA REFERENCES (bracket notation ONLY)
- `{{trigger['body']['field']}}` · `{{step_N['data']['response']}}` (LLM) · `{{step_N['data']['response'][0]}}` (Image AI array)
- `{{step_N['apiResponse']['data']['requestId']}}` (Voice Call) · `{{step_N[0]['values']['A']}}` (Sheets row col A) · `{{step_N['item']}}` (loop)
- Fallbacks: `{{trigger['body']['name'] || 'Customer'}}`. ⛔ NEVER dot notation `{{step_1.field}}` — fails at runtime.

## 1.8 CONNECTION DOCTRINE
- Default (portable import): `"auth":""` inside each action's `input` — user connects after import. NEVER fabricate `{{connections['ID']}}`. (Working templates carry NO `connectionIds` array at all — don't add one.)
- Known-ID mode: only when the user gives real IDs → `"auth":"{{connections['REAL_ID']}}"`.

## 1.9 PROPERTYSETTINGS & ERROR-310 TRAPS
Every `input` key → a `propertySettings` entry. Ghost fields (propertySettings only): `catch_webhook` → `authType`,`authFields`(schema:{}),`liveMarkdown`,`syncMarkdown`,`testMarkdown`.
1. **Empty propertySettings** on a node that renders fields → crash. Cover every rendered param.
2. **Schema mirror** — when `input.fields`/`input.values` carry data, `propertySettings.<field>.schema` MUST mirror those keys (not `{}`). For Sheets `insert_row`/`update_row`, `values.schema` needs a descriptor per column (`{"type":"SHORT_TEXT","required":false,"description":"..","displayName":"..","defaultValue":""}`).
3. **Dropdown values = the registry default value** shown in the tool's prop annotation (often lowercase, e.g. `responseType:'json'`, `authType:'none'`, `respond:'stop'`). The capitalized forms in `[...]` are display LABELS, not stored values — use the lowercase value.

## 1.10 ERROR-HANDLING NORMS (by criticality)
- Critical writes (Sheets insert/update, store, DB): `retryOnFailure:true, continueOnFailure:false`
- Notifications (WhatsApp/Gmail/Slack/Telegram): `retryOnFailure:false, continueOnFailure:true`
- Else: both false.

## 1.11 RETURN_RESPONSE ROUTING (two tools share the name)
- `catch_webhook` trigger → `tool-webhook` `return_response` (HTTP reply to caller). A webhook responds ONCE — don't add an early ack if you need to return the result later; respond at the end.
- `form_submission`/`chat_submission` → `tool-forms` `return_response` (UI reply; `file` only — chat text via `responseMarkdown` on the trigger).
- ⛔ Webhook URL is the COMPLETE endpoint — never append `/sync`, `/trigger`, `/run`.

## 1.12 TALLY ROUTING (template-first)
For Tally data, match the request against `tallyconnection`'s template catalog (PART 2) → if matched use `ask_tally_template` with that `template` id (placeholders via `variables` + schema-mirror) → only if none fits use free-form `askTally` returning a JSON array.

## 1.13 ANTI-HALLUCINATION (verify every name in PART 2)
pieceNames: `tool-google-sheet`→`tool-google-sheets`; `tool-gdrive`→`tool-google-drive`; Gmail has NO google- prefix; MS tools need `microsoft-` prefix; any AI/openai/gemini→`tool-llm-ai`; `tool-human-input`→`tool-forms`; `tool-telegram`→`tool-telegram-bot`; `tool-storage`→`tool-store`; `tool-cron`→`tool-schedule`; `tool-router` does NOT exist.
actions: `ask_llm`→`askLlm`; `generate_image`→`generateImage`; `send_text`/`send_message`(WA)→`send_text_message`(TG) / `sendMessage`(WA); Sheets worksheet ops are hyphenated (`create-worksheet`,`google-sheets-insert-multiple-rows`) while row ops are snake (`insert_row`,`find_rows`).
⚠ TEMPLATE-vs-REGISTRY NAME CONFLICTS (verify in Studio): 30 working templates use `@puchoaistudio/tool-whatsapp-business` (action `send_message`) where the scraped registry lists `@puchoaistudio/tool-whatsapp` (`sendMessage`). They may be the same tool under two names or two coexisting tools. Prefer the registry name in PART 2; if WhatsApp import fails, switch to `tool-whatsapp-business`/`send_message`. Similarly some template trigger names (e.g. gmail `new_email`) differ from registry (`gmail_new_email_received`) — trust PART 2 for names, the templates for STRUCTURE.
fields: `file_url`→`url`; `prompt`→`query`; `spreadsheet_id`/`sheet_id`→`spreadsheetId`/`sheetId`; `sheetName`→`sheetId`; `searchColumn`→`columnName`; WA `phone_number`/`message`→`to`/`text`.

## 1.14 ⭐ MANDATORY SELF-CHECK — EMIT BEFORE THE JSON, EVERY TIME
Passive checklists get skipped. Write this out (filling real values) BEFORE outputting JSON; only output if every line is PASS.
```
SELF-CHECK
- nodes: <names>; trigger named "trigger"? <y>; unique? <y>
- each PIECE: pieceName+action in registry? <y>; required inputs present? <y>; every input key has propertySettings? <y>
- ROUTERS: for each → branches=<n>, children=<n>, EQUAL? <y>; `children` array EXISTS (not missing)? <y>; every branch uses key `branchType` (NOT `type`)? <y>; every condition uses `operator` (NOT `conditionType`)? <y>; last branch = FALLBACK with null child? <y>
- CODE: starts "export const code"? <y>
- pieces[]: used=<set> == declared=<set>, sorted? <y>
- data refs: bracket only? <y>; LLM uses ['data']['response']? <y>
- envelope: top-level has NO pieces[]/blogUrl? <y>; template has NO connectionIds/agentIds? <y>; versions are ^2.0.0? <y>
- LOOP nodes use type "LOOP" (not LOOP_ON_ITEMS)? <y>; trigger is lean (no propertySettings/errorHandling)? <y>
- valid:true all; skip:false on actions; sampleData:{} on actions? <y>
RESULT: PASS
```
If any router has branches≠children, STOP and fix before emitting.

## 1.15 DISCOVERY (large/multi-workflow asks)
Small ask with clear trigger/tool/dataflow → generate. Requirement doc / multi-workflow / dashboard system → ask architecture → data structures → edge cases in rounds, confirm a plan, THEN build. Never assume sheet column names or trigger type.

═══════════════════════════════════════════════════════════════
# PART 2 — TOOL REGISTRY  (reference; look up only the tools you use)
★ = required prop · versions/params 100% from Live API
═══════════════════════════════════════════════════════════════

## ★ CORE & FLOW CONTROL

### webhook  v2.0.4 | None
*Receive HTTP requests and trigger flows using unique URLs.*
**Triggers:** `catch_webhook`
**Actions:** `return_response` `return_response_and_wait_for_next_webhook`
`catch_webhook` props:
  liveMarkdown(MARKDOWN) //**Live URL:** ```text {{webhookUrl}} ``` generate sample dat
  syncMarkdown(MARKDOWN) //**Synchronous Requests:** If you expect a response from this
  testMarkdown(MARKDOWN) //**Test URL:** if you want to generate sample data without tr
  authType★(STATIC_DROPDOWN)='none' ["None"|"Basic Auth"|"Header Auth"]
  authFields(DYNAMIC)
`return_response` props:
  responseType(STATIC_DROPDOWN)='json' ["JSON"|"Raw"|"Redirect"]
  fields★(DYNAMIC)
  respond(STATIC_DROPDOWN)='stop' ["Stop"|"Respond and Continue"]
`return_response_and_wait_for_next_webhook` props:
  responseType(STATIC_DROPDOWN)='json' ["JSON"|"Raw"|"Redirect"]
  fields★(DYNAMIC)

### schedule  v2.0.0 | None
*Trigger flow with fixed schedule*
**Triggers:** `every_x_minutes` `every_hour` `every_day` `every_week` `every_month` `cron_expression`
`every_x_minutes` props:
  minutes★(STATIC_DROPDOWN)=1 //Valid value between 1 to 59.
`every_hour` props:
  run_on_weekends★(CHECKBOX)=false
`every_day` props:
  hour_of_the_day★(STATIC_DROPDOWN)=0
  timezone★(STATIC_DROPDOWN)='UTC'
  run_on_weekends★(CHECKBOX)=false
`every_week` props:
  day_of_the_week★(STATIC_DROPDOWN) ["Sunday"|"Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"]
  hour_of_the_day★(STATIC_DROPDOWN)
  timezone★(STATIC_DROPDOWN)='UTC'
`every_month` props:
  day_of_the_month★(STATIC_DROPDOWN)
  hour_of_the_day★(STATIC_DROPDOWN)
  timezone★(STATIC_DROPDOWN)='UTC'
`cron_expression` props:
  cronExpression★(SHORT_TEXT)='0/5 * * * *' //Cron expression to trigger
  timezone★(STATIC_DROPDOWN)='UTC'

### http  v2.0.0 | None
*Sends HTTP requests and return responses*
**Actions:** `send_request`
`send_request` props:
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  url★(SHORT_TEXT)
  headers★(OBJECT)
  queryParams★(OBJECT)
  authType★(STATIC_DROPDOWN)='NONE' ["None"|"Basic Auth"|"Bearer Token"]
  authFields(DYNAMIC)
  body_type(STATIC_DROPDOWN)='none' ["None"|"Form Data"|"JSON"|"Raw"]
  body(DYNAMIC)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc. A base64 body will 
  use_proxy(CHECKBOX)=false //Use a proxy for this request
  proxy_settings(DYNAMIC)
  timeout(NUMBER)
  failureMode(STATIC_DROPDOWN)='continue_none'
  stopFlow(CHECKBOX)

### http-oauth2  v2.0.0 | OAuth2
*Perform authenticated HTTP requests using OAuth2. Define your own authorization and token URLs to in*
**Actions:** `send-oauth2-request`
`send-oauth2-request` props:
  url★(SHORT_TEXT)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PUT"|"PATCH"|"DELETE"]
  headers(OBJECT)
  queryParams(OBJECT)
  body_type(STATIC_DROPDOWN)='none' ["None"|"Form Data"|"JSON"|"Raw"]
  body(DYNAMIC)
  use_proxy(CHECKBOX)=false //Use a proxy for this request
  proxy_settings(DYNAMIC)
  failsafe(CHECKBOX)
  timeout(NUMBER)

### delay  v2.0.0 | None
*Use it to delay the execution of the next action*
**Actions:** `delayFor` `delay_until`
`delayFor` props:
  unit★(STATIC_DROPDOWN)='seconds' ["Seconds"|"Minutes"|"Hours"|"Days"] //The unit of time to delay the execution of the next action
  delayFor★(NUMBER) //The number of units to delay the execution of the next actio
`delay_until` props:
  delayUntilTimestamp★(DATE_TIME) //Specifies the date and time until which the execution of the

### store  v2.0.0 | None
*Store or retrieve data from key/value database*
**Actions:** `get` `put` `append` `remove_value` `add_to_list` `remove_from_list`
`get` props:
  key★(SHORT_TEXT)
  defaultValue(SHORT_TEXT)
  store_scope★(STATIC_DROPDOWN)='COLLECTION' ["Project"|"Flow"|"Run"] //The storage scope of the value.
`put` props:
  key★(SHORT_TEXT)
  value★(SHORT_TEXT)
  store_scope★(STATIC_DROPDOWN)='COLLECTION' ["Project"|"Flow"|"Run"] //The storage scope of the value.
`append` props:
  key★(SHORT_TEXT)
  value★(SHORT_TEXT)
  separator(SHORT_TEXT) //Separator between added values, use \n for newlines
  store_scope★(STATIC_DROPDOWN)='COLLECTION' ["Project"|"Flow"|"Run"] //The storage scope of the value.
`remove_value` props:
  key★(SHORT_TEXT)
  store_scope★(STATIC_DROPDOWN)='COLLECTION' ["Project"|"Flow"|"Run"] //The storage scope of the value.
`add_to_list` props:
  key★(SHORT_TEXT)
  value★(ARRAY)
  ignore_if_exists(CHECKBOX)
  store_scope★(STATIC_DROPDOWN)='COLLECTION' ["Project"|"Flow"|"Run"] //The storage scope of the value.
`remove_from_list` props:
  key★(SHORT_TEXT)
  value★(SHORT_TEXT)
  store_scope★(STATIC_DROPDOWN)='COLLECTION' ["Project"|"Flow"|"Run"] //The storage scope of the value.

### subflows  v2.0.1 | None
*Trigger and call another sub flow.*
**Triggers:** `callableFlow`
**Actions:** `callFlow` `returnResponse`
`callableFlow` props:
  mode★(STATIC_DROPDOWN)='simple' ["Simple"|"Advanced"] //Choose Simple for key-value or Advanced for JSON.
  exampleData★(DYNAMIC) //The schema to be passed to the flow
`callFlow` props:
  flow★(DROPDOWN) //The flow to execute
  mode★(STATIC_DROPDOWN)='simple' ["Simple"|"Advanced"] //Choose Simple for key-value or Advanced for JSON.
  flowProps★(DYNAMIC)
  waitForResponse(CHECKBOX)=false
`returnResponse` props:
  mode★(STATIC_DROPDOWN)='simple' ["Simple"|"Advanced"] //Choose Simple for key-value or Advanced for JSON.
  response★(DYNAMIC)

### flow-helper  v2.0.0 | None
*Utilities for managing flow execution. Retrieve the current run ID, or programmatically stop or fail*
**Actions:** `getRunId` `failFlow` `stopFlow`
`failFlow` props:
  message★(LONG_TEXT) //The error message to show when the flow fails.

### tables  v2.0.0 | None
*Store and manage your data in structured tables. Create, update, delete, and search for records, and*
**Triggers:** `newRecord` `updatedRecord` `deletedRecord`
**Actions:** `tables-create-records` `tables-delete-record` `tables-update-record` `tables-get-record` `tables-find-records`
`newRecord` props:
  table_id★(DROPDOWN)
`updatedRecord` props:
  table_id★(DROPDOWN)
`deletedRecord` props:
  table_id★(DROPDOWN)
`tables-create-records` props:
  table_id★(DROPDOWN)
  values★(DYNAMIC) //The records to create.
`tables-delete-record` props:
  table_id★(DROPDOWN)
  records_ids★(ARRAY) //The IDs of the records to delete
`tables-update-record` props:
  table_id★(DROPDOWN)
  record_id★(SHORT_TEXT) //The ID of the record to do the action on.
  values★(DYNAMIC) //The values to update. Leave empty to keep current value.
`tables-get-record` props:
  table_id★(DROPDOWN)
  record_id★(SHORT_TEXT) //The ID of the record to do the action on.
`tables-find-records` props:
  table_id★(DROPDOWN)
  limit(NUMBER) //Maximum number of records to return (default no limit).
  filters(DYNAMIC) //Filter conditions to apply

### tags  v2.0.0 | None
*Add custom tags to your run for filtration*
**Actions:** `add_tag`
`add_tag` props:
  info(MARKDOWN) //This action add a tag to the current execution, this tag can
  name★(SHORT_TEXT)

### connections  v2.0.0 | None
*Read connections dynamically*
**Actions:** `read_connection`
`read_connection` props:
  info(MARKDOWN) //**Advanced Piece** <br> Use this piece if you are unsure whi
  connection_name★(SHORT_TEXT)

### forms  v2.0.0 | None
*Trigger a flow through human input.*
**Triggers:** `form_submission` `chat_submission`
**Actions:** `return_response`
`form_submission` props:
  about(MARKDOWN) //**Published Form URL:** ```text {{formUrl}} ``` Use this for
  response(MARKDOWN) //If **Wait for Response** is enabled, use **Respond on UI** i
  waitForResponse★(CHECKBOX)=false
  inputs★(ARRAY)
`chat_submission` props:
  about(MARKDOWN) //**Published Chat URL:** ```text {{chatUrl}} ``` Use this for
  responseMarkdown(MARKDOWN) //This trigger sets up a chat interface. Ensure that **Respond
  botName★(SHORT_TEXT)='AI Bot' //The name of the chatbot
`return_response` props:
  file(FILE)

### approval  v2.0.0 | None
*Build approval process in your workflows*
**Actions:** `wait_for_approval` `create_approval_links`

### todos  v2.0.0 | None
*Create tasks for project members to take actions, useful for approvals, reviews, and manual actions *
**Actions:** `createTodo` `wait_for_approval` `createTodoAndWait`

### mcp  v2.0.0 | None
*Connect to your hosted MCP Server using any MCP client to communicate with tools*
**Triggers:** `mcp_tool`
**Actions:** `reply_to_mcp_client`
`mcp_tool` props:
  toolName★(SHORT_TEXT) //Used to call this tool from MCP clients like Claude Desktop,
  toolDescription★(LONG_TEXT) //Used to describe what this tool does and when to use it
  inputSchema(ARRAY) //Define the input parameters that this tool accepts. Paramete
  returnsResponse★(CHECKBOX)=false //Keep the MCP client waiting until it receives a response via
`reply_to_mcp_client` props:
  note(MARKDOWN) //**Important**: Make sure your MCP trigger has (Wait for Resp
  mode★(STATIC_DROPDOWN)='simple' ["Simple"|"Advanced"] //Choose Simple for key-value or Advanced for JSON.
  response★(DYNAMIC)
  respond(STATIC_DROPDOWN)='stop' ["Stop"|"Respond and Continue"]

### queue  v2.0.0 | None
*A piece that allows you to push items into a queue, providing a way to throttle requests or process *
**Actions:** `push-to-queue` `pull-from-queue` `clear-queue`
`push-to-queue` props:
  info(MARKDOWN) //**Note:** - You can push items from other flows. The queue n
  queueName★(SHORT_TEXT)
  items★(ARRAY)
`pull-from-queue` props:
  info(MARKDOWN) //**Note:** - You can pull items from other flows. The queue n
  queueName★(SHORT_TEXT)
  numOfItems★(NUMBER)
`clear-queue` props:
  info(MARKDOWN) //**Note:** - This deletes all items inside the queue permanen
  queueName★(SHORT_TEXT)


## ★ PUCHO AI TOOLS (Native)

### llm-ai  v2.1.1 | None
*Query multiple AI language models with custom prompts*
**Actions:** `askLlm`
`askLlm` props:
  model★(DROPDOWN) //Select the AI model to use for generating responses
  puchoModelKey(CUSTOM) //Hidden field for Pucho Model Key
  puchoProviderName(CUSTOM) //Hidden field for Pucho Provider Name
  query★(LONG_TEXT) //Enter your question or prompt for the selected model
  temperature(NUMBER)=0.7 //Controls randomness in the response (0.0 to 1.0)
  maxTokens(STATIC_DROPDOWN) ["500"|"1000"|"1500"|"2000"|"2500"] //Maximum number of tokens to generate
  maxTokensNote(MARKDOWN) //If you do not select any value, the max limit will be consid

### image-ai  v2.1.1 | None
*Generate images from text prompts using AI models*
**Actions:** `generateImage`
`generateImage` props:
  model★(DROPDOWN) //Select the AI model to use for generating images
  puchoModelKey(CUSTOM) //Hidden field for Pucho Model Key
  puchoProviderName(CUSTOM) //Hidden field for Pucho Provider Name
  query★(LONG_TEXT) //Enter your prompt or description for image generation
  aspect_ratio(DROPDOWN) //Select the aspect ratio for the generated image
  references(DYNAMIC) //Reference images for models that support them

### text-ai  v2.1.1 | None
*Generate intelligent text content and responses*
**Actions:** `askTextAI`
`askTextAI` props:
  query★(LONG_TEXT) //Enter your question, prompt, or text generation request

### video-ai  v2.2.1 | None
*Create videos from text with AI-powered generation*
**Actions:** `generateVideoJobId` `checkVideoStatus`
`generateVideoJobId` props:
  model★(DROPDOWN) //Select the AI model to use for generating videos
  duration★(DROPDOWN) //Select the duration of the video
  resolution★(DROPDOWN) //Select the video resolution
  aspectRatio★(DROPDOWN) //Select the video aspect ratio
  puchoModelKey(CUSTOM) //Hidden field for Pucho Model Key
  puchoProviderName(CUSTOM) //Hidden field for Pucho Provider Name
  query★(LONG_TEXT) //Enter your prompt or description for video generation
  imageUrls(DYNAMIC) //Image URLs (only for veo-3.1-generate-preview model)
`checkVideoStatus` props:
  jobId★(SHORT_TEXT) //Enter the job ID from the video generation job (e.g., models
  waitForCompletion(CHECKBOX)=false //If enabled, the action will poll the status until the video 
  pollInterval(NUMBER)=10 //How often to check the status when waiting for completion (d
  maxWaitTime(NUMBER)=300 //Maximum time to wait for video completion (default: 300 seco

### ai-voice-call  v2.1.2 | None
*Make intelligent voice calls with AI agents*
**Actions:** `voiceCall` `getCallDetails`
`voiceCall` props:
  aiVoiceCall★(DROPDOWN) //Select AI Voice Call Connection
  connectionDetails(DYNAMIC)
`getCallDetails` props:
  requestId★(SHORT_TEXT) //Enter the request ID to get AI voice call details

### web-search  v2.1.1 | None
*Search the web with AI-powered intelligent responses*
**Actions:** `webSearch`
`webSearch` props:
  query★(LONG_TEXT) //Enter your search query or question for web search

### ocr-analytics  v2.1.1 | None
*Extract and analyze text from images and PDFs*
**Actions:** `askImage/PDF`
`askImage/PDF` props:
  model★(DROPDOWN) //Select the AI model to use for processing the image/PDF
  url★(SHORT_TEXT) //Enter the URL of the image or PDF file. Only .pdf, .png, .jp
  puchoModelKey(CUSTOM) //Hidden field for Pucho Model Key
  puchoProviderName(CUSTOM) //Hidden field for Pucho Provider Name
  query★(LONG_TEXT) //Enter your question about the image or PDF

### speech-intelligence  v2.1.1 | None
*Convert text to speech and speech to text using AI models*
**Actions:** `textToSpeech` `speechToText`
`textToSpeech` props:
  model★(DROPDOWN) //Select the AI model to use for text-to-speech conversion
  voice★(DROPDOWN) //Select the voice to use for text-to-speech conversion
  prompt★(LONG_TEXT) //Enter the text prompt to convert to speech
  instructions(LONG_TEXT) //Optional instructions for how to speak (e.g., "Speak clearly
`speechToText` props:
  model★(DROPDOWN) //Select the AI model to use for speech-to-text conversion
  url★(SHORT_TEXT) //Enter the URL of the audio file (direct URL or signed URL). 

### utility-ai  v2.1.1 | None
*Utility AI provides common AI helpers powered by your Pucho studio models, including content moderat*
**Actions:** `checkModeration` `classifyText` `extractStructuredData`
`checkModeration` props:
  puchoModel(DROPDOWN) //Uses Pucho studio models when OpenAI moderation is not confi
  manualProvider(SHORT_TEXT) //If the model list fails to load, enter the provider name her
  manualModel(SHORT_TEXT) //If the model list fails to load, enter the model id here (e.
  text(LONG_TEXT)
  images(ARRAY)
`classifyText` props:
  model★(DROPDOWN) //Select the AI model used for classification.
  text★(LONG_TEXT)
  categories★(ARRAY) //Categories to classify text into.
`extractStructuredData` props:
  model(DROPDOWN) //Select the AI model used for extraction.
  manualProvider(SHORT_TEXT) //If the model list fails to load, enter the provider name her
  manualModel(SHORT_TEXT) //If the model list fails to load, enter the model id here (e.
  text(LONG_TEXT) //Text to extract structured data from.
  files(ARRAY)
  prompt(LONG_TEXT) //Prompt to guide the AI.
  mode★(STATIC_DROPDOWN)='simple' ["Simple"|"Advanced"] //For complex schema, you can use advanced mode.
  schama★(DYNAMIC)
  maxOutputTokens(NUMBER)=2000

### scrape-fusion  v2.1.1 | None
*Scrape single pages or entire websites with flexible extraction formats*
**Actions:** `single_page_scraping` `whole_website_scraping`
`single_page_scraping` props:
  url★(SHORT_TEXT) //The URL of the page to scrape
  extractionType★(STATIC_DROPDOWN) ["Markdown"|"Summary"|"HTML"|"Raw HTML"|"Links"|"Images"|"JSON"] //Choose how you want the content to be extracted
`whole_website_scraping` props:
  url★(SHORT_TEXT) //The root URL of the website to scrape
  maxPages★(STATIC_DROPDOWN)=3 ["1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"10"] //Maximum number of pages to crawl and scrape (1–10)
  extractionType★(STATIC_DROPDOWN) ["Markdown"|"Summary"|"HTML"|"Raw HTML"|"Links"|"Images"|"JSON"] //Choose how you want the content to be extracted

### tallyconnection  v2.1.5 | None
*Get insights from your Tally data*
**Actions:** `askTally` `ask_tally_template`
`askTally` props:
  tallyconnection★(DROPDOWN) //Select Tally Connection
  query★(LONG_TEXT) //Enter your query
`ask_tally_template` props:
  tallyconnection★(DROPDOWN) //Select Tally Connection
  template★(DROPDOWN) //Select a template question
  variables(DYNAMIC)


## ★ UTILITY & PROCESSING

### crypto  v2.0.0 | None
*Generate random passwords and hash existing text*
**Actions:** `hash-text` `hmac-signature` `generate-password` `base64-decode` `base64-encode` `openpgpEncrypt`
`hash-text` props:
  method★(STATIC_DROPDOWN) ["MD5"|"SHA256"|"SHA512"|"SHA3-512"] //The hashing algorithm to use
  text★(SHORT_TEXT) //The text to be hashed
`hmac-signature` props:
  secretKey★(SHORT_TEXT) //The secret key to encrypt
  secretKeyEncoding★(STATIC_DROPDOWN) ["UTF-8"|"Hex"|"Base64"] //The secret key encoding to use
  method★(STATIC_DROPDOWN) ["MD5"|"SHA256"|"SHA512"] //The hashing algorithm to use
  text★(SHORT_TEXT) //The text to be hashed and encrypted
`generate-password` props:
  length★(NUMBER) //The length of the password (maximum 256)
  characterSet★(STATIC_DROPDOWN)='alphanumeric' ["Alphanumeric"|"Alphanumeric + Symbols"] //The character set to use when generating the password
`base64-decode` props:
  text★(SHORT_TEXT) //The text to be decoded.
`base64-encode` props:
  text★(SHORT_TEXT) //The text to be encoded.
`openpgpEncrypt` props:
  file★(FILE) //The file to encrypt
  publicKey★(LONG_TEXT) //The PGP public key in ASCII armor format

### csv  v2.0.0 | None
*Manipulate CSV text*
**Actions:** `convert_csv_to_json` `convert_json_to_csv`
`convert_csv_to_json` props:
  csv_text★(LONG_TEXT)
  has_headers★(CHECKBOX)=false
  delimiter_type★(STATIC_DROPDOWN) ["Comma"|"Tab"] //Select the delimiter type for the CSV text.
`convert_json_to_csv` props:
  json_array★(JSON) //Provide a JSON array to convert to CSV format.
  delimiter_type★(STATIC_DROPDOWN)=',' ["Comma"|"Tab"] //Select the delimiter type for the CSV file.

### xml  v2.0.0 | None
*Extensible Markup Language for storing and transporting data*
**Actions:** `convert-json-to-xml`
`convert-json-to-xml` props:
  json★(JSON)
  attributes_key(SHORT_TEXT) //Field to add your tag's attributes
  header(CHECKBOX) //Add XML header

### json  v2.0.0 | None
*Convert JSON to text and vice versa*
**Actions:** `convert_json_to_text` `convert_text_to_json`
`convert_json_to_text` props:
  json★(JSON)
`convert_text_to_json` props:
  text★(LONG_TEXT)

### file-helper  v2.0.0 | None
*Read file content and return it in different formats.*
**Actions:** `read_file` `createFile` `change_file_encoding` `checkFileType` `zipFiles` `unzipFile`
`read_file` props:
  file★(FILE)
  readOptions★(STATIC_DROPDOWN) ["Text"|"Base64"] //The output format
`createFile` props:
  content★(LONG_TEXT)
  fileName★(SHORT_TEXT)
  encoding★(STATIC_DROPDOWN)='utf8' ["ASCII"|"UTF-8"|"UTF-16LE"|"UCS-2"|"Base64"|"Base64 URL"|"Latin1"|"Binary"|"Hex"]
`change_file_encoding` props:
  inputFile★(FILE)
  inputEncoding★(STATIC_DROPDOWN) ["ASCII"|"UTF-8"|"UTF-16LE"|"UCS-2"|"Base64"|"Base64 URL"|"Latin1"|"Binary"|"Hex"]
  outputFileName★(SHORT_TEXT)
  outputEncoding★(STATIC_DROPDOWN) ["ASCII"|"UTF-8"|"UTF-16LE"|"UCS-2"|"Base64"|"Base64 URL"|"Latin1"|"Binary"|"Hex"]
`checkFileType` props:
  file★(FILE)
  mimeTypes★(STATIC_DROPDOWN) //Choose one or more MIME types to check against the file.
`zipFiles` props:
  files★(ARRAY)
  outputFileName★(SHORT_TEXT)
`unzipFile` props:
  file★(FILE)
  maxResults(NUMBER)=0 //Throw an error if zip file has more than expected entries. -

### image-helper  v2.0.0 | None
*Tools for image manipulations*
**Actions:** `image_to_base64` `get_meta_data` `crop_image` `rotate_image` `resize_image` `compress_image`
`image_to_base64` props:
  image★(FILE) //The image to convert
  override_mime_type(SHORT_TEXT) //The mime type to use when converting the image. In case you 
`get_meta_data` props:
  image★(FILE)
`crop_image` props:
  image★(FILE)
  left★(NUMBER) //Specifies the horizontal position, indicating where the crop
  top★(NUMBER) //Represents the vertical position, indicating the starting po
  width★(NUMBER) //Determines the horizontal size of the cropped area.
  height★(NUMBER) //Determines the vertical size of the cropped area.
  resultFileName(SHORT_TEXT) //Specifies the output file name for the cropped image (withou
`rotate_image` props:
  image★(FILE)
  degree★(STATIC_DROPDOWN) ["90°"|"180°"|"270°"] //Specifies the degree of clockwise rotation applied to the im
  resultFileName(SHORT_TEXT) //Specifies the output file name for the result image (without
`resize_image` props:
  image★(FILE)
  width★(NUMBER) //Specifies the width of the image.
  height★(NUMBER) //Specifies the height of the image.
  aspectRatio(CHECKBOX)=false
  resultFileName(SHORT_TEXT) //Specifies the output file name for the result image (without
`compress_image` props:
  image★(FILE)
  quality★(STATIC_DROPDOWN) ["High Quality"|"Lossy Quality"] //Specifies the quality of the image after compression (0-100)
  format★(STATIC_DROPDOWN) ["JPG"|"PNG"] //Specifies the format of the image after compression.
  resultFileName(SHORT_TEXT) //Specifies the output file name for the result image (without

### text-helper  v2.0.0 | None
*Tools for text processing*
**Actions:** `concat` `replace` `split` `find` `markdown_to_html` `html_to_markdown` `stripHtml` `slugify` `defaultValue`
`concat` props:
  texts★(ARRAY)
  separator(SHORT_TEXT) //The text that separates the texts you want to concatenate
`replace` props:
  text★(SHORT_TEXT)
  searchValue★(SHORT_TEXT) //Can be plain text or a regex expression.
  replaceValue(SHORT_TEXT) //Leave empty to delete found results.
  replaceOnlyFirst(CHECKBOX) //Only replaces the first instance of the search value.
`split` props:
  text★(SHORT_TEXT)
  delimiter★(SHORT_TEXT)
`find` props:
  text★(SHORT_TEXT)
  expression★(SHORT_TEXT) //Regex or text to search for.
`markdown_to_html` props:
  flavor★(STATIC_DROPDOWN)='github' ["Default"|"Original"|"GitHub"] //The flavor of markdown use during conversion
  headerLevelStart★(NUMBER)=1 //The minimum header level to use during conversion
  tables★(CHECKBOX)=true //Whether to support tables during conversion
  noHeaderId★(CHECKBOX)=false //Whether to add an ID to headers during conversion
  simpleLineBreaks★(CHECKBOX)=false //Parses line breaks as &lt;br&gt;, without needing 2 spaces a
  openLinksInNewWindow★(CHECKBOX)=false
`html_to_markdown` props:
  html★(LONG_TEXT) //The HTML to convert to markdown
`stripHtml` props:
  html★(LONG_TEXT)
`slugify` props:
  text★(SHORT_TEXT)
`defaultValue` props:
  value(SHORT_TEXT) //Enter value
  defaultString★(SHORT_TEXT)

### math-helper  v2.0.0 | None
*Perform mathematical operations.*
**Actions:** `addition_math` `subtraction_math` `multiplication_math` `division_math` `modulo_math` `generateRandom_math`
`addition_math` props:
  first_number★(NUMBER)
  second_number★(NUMBER)
`subtraction_math` props:
  first_number★(NUMBER)
  second_number★(NUMBER)
`multiplication_math` props:
  first_number★(NUMBER)
  second_number★(NUMBER)
`division_math` props:
  first_number★(NUMBER)
  second_number★(NUMBER)
`modulo_math` props:
  first_number★(NUMBER)
  second_number★(NUMBER)
`generateRandom_math` props:
  first_number★(NUMBER)
  second_number★(NUMBER)

### date-helper  v2.0.0 | None
*Manipulate, format, and extract time units for all your date and time needs.*
**Actions:** `get_current_date` `format_date` `extract_date_parts` `date_difference` `add_subtract_date` `next_day_of_week` `next_day_of_year`
`get_current_date` props:
  timeFormat★(STATIC_DROPDOWN)='DDD MMM DD YYYY HH:mm:ss' //Here's what each part of the format (e.g., YYYY) represents:
  timeZone★(STATIC_DROPDOWN)='UTC'
`format_date` props:
  inputDate★(SHORT_TEXT) //Enter the input date
  inputFormat★(STATIC_DROPDOWN)='DDD MMM DD YYYY HH:mm:ss' //Here's what each part of the format (e.g., YYYY) represents:
  inputTimeZone★(STATIC_DROPDOWN)='UTC'
  outputFormat★(STATIC_DROPDOWN)='DDD MMM DD YYYY HH:mm:ss' //Here's what each part of the format (e.g., YYYY) represents:
  outputTimeZone★(STATIC_DROPDOWN)='UTC'
`extract_date_parts` props:
  inputDate★(SHORT_TEXT) //Enter the input date
  inputFormat★(STATIC_DROPDOWN)='DDD MMM DD YYYY HH:mm:ss' //Here's what each part of the format (e.g., YYYY) represents:
  unitExtract★(STATIC_MULTI_SELECT_DROPDOWN) ["Year"|"Month"|"Day"|"Hour"|"Minute"|"Second"|"Day of Week"|"Month name"] //Select the unit to extract from the date
`date_difference` props:
  startDate★(SHORT_TEXT) //Enter the starting date
  startDateFormat★(STATIC_DROPDOWN)='DDD MMM DD YYYY HH:mm:ss' //Here's what each part of the format (e.g., YYYY) represents:
  endDate★(SHORT_TEXT) //Enter the ending date
  endDateFormat★(STATIC_DROPDOWN)='DDD MMM DD YYYY HH:mm:ss' //Here's what each part of the format (e.g., YYYY) represents:
  unitDifference★(STATIC_MULTI_SELECT_DROPDOWN) ["Year"|"Month"|"Day"|"Hour"|"Minute"|"Second"] //Select the unit of difference between the two dates
`add_subtract_date` props:
  inputDate★(SHORT_TEXT) //Enter the input date
  inputDateFormat★(STATIC_DROPDOWN)='ddd MMM DD YYYY HH:mm:ss' //Here's what each part of the format (e.g., YYYY) represents:
  outputFormat★(STATIC_DROPDOWN)='ddd MMM DD YYYY HH:mm:ss' //Here's what each part of the format (e.g., YYYY) represents:
  expression★(LONG_TEXT) //Provide an expression to add or subtract using the following
`next_day_of_week` props:
  weekday★(STATIC_DROPDOWN) ["Sunday"|"Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"] //The weekday that you would like to get the date and time of.
  time(SHORT_TEXT)='00:00' //The time that you would like to get the date and time of. Th
  currentTime(CHECKBOX)=false //If checked, the current time will be used instead of the tim
  timeFormat★(STATIC_DROPDOWN)='DDD MMM DD YYYY HH:mm:ss' //Here's what each part of the format (e.g., YYYY) represents:
  timeZone★(STATIC_DROPDOWN)='UTC'
`next_day_of_year` props:
  month★(STATIC_DROPDOWN) //The month that you would like to get the date and time of.
  day★(NUMBER)=1 //The day of the month that you would like to get the date and
  time(SHORT_TEXT)='00:00' //The time that you would like to get the date and time of. Th
  currentTime(CHECKBOX)=false //If checked, the current time will be used instead of the tim
  timeFormat★(STATIC_DROPDOWN)='DDD MMM DD YYYY HH:mm:ss' //Here's what each part of the format (e.g., YYYY) represents:
  timeZone★(STATIC_DROPDOWN)='UTC'

### data-mapper  v2.0.0 | None
*tools to manipulate data structure*
**Actions:** `advanced_mapping`
`advanced_mapping` props:
  mapping★(JSON) //The mapping to use

### data-summarizer  v2.0.0 | None
*Summarize data with ease. Calculate sums, averages, find minimum/maximum values, and count unique it*
**Actions:** `calculateAverage` `calculateSum` `countUniques` `getMinMax`
`calculateAverage` props:
  note(MARKDOWN) //If you'd like to use the values with a previous step, click 
  values★(ARRAY)
`calculateSum` props:
  note(MARKDOWN) //If you'd like to use the values with a previous step, click 
  values★(ARRAY)
`countUniques` props:
  note(MARKDOWN) //If you'd like to use the values with a previous step, click 
  values★(ARRAY)
  fieldsExplanation(MARKDOWN) //If the data you're passing in is an object, you can specify 
  fields(ARRAY)
`getMinMax` props:
  note(MARKDOWN) //If you'd like to use the values with a previous step, click 
  values★(ARRAY)

### graphql  v2.0.0 | None
*Execute GraphQL queries and mutations. Interact with any GraphQL API by providing the endpoint, quer*
**Actions:** `send_request`
`send_request` props:
  method★(STATIC_DROPDOWN)='POST' ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  url★(SHORT_TEXT)
  queryParams★(OBJECT)
  headers★(OBJECT)
  query★(LONG_TEXT)
  variables(JSON)
  use_proxy(CHECKBOX)=false //Use a proxy for this request
  proxy_settings(DYNAMIC)
  timeout(NUMBER)
  failsafe(CHECKBOX)

### pdf  v2.0.0 | None
*Extract, convert, and generate PDFs (text/images/pages) with no authentication.*
**Actions:** `extractText` `convertToImage` `textToPdf` `imageToPdf` `pdfPageCount` `extractPdfPages`
`extractText` props:
  file★(FILE)
`convertToImage` props:
  file★(FILE)
  imageOutputType★(STATIC_DROPDOWN)='multiple' ["Single Combined Image"|"Separate Image for Each Page"]
`textToPdf` props:
  text★(LONG_TEXT) //Enter text to convert
`imageToPdf` props:
  image★(FILE) //Image has to be png, jpeg or jpg and it will be scaled down 
`pdfPageCount` props:
  file★(FILE)
`extractPdfPages` props:
  file★(FILE)
  pageRanges★(ARRAY)

### soap  v2.0.0 | Custom(type,username,password,customHeader)
*Simple Object Access Protocol for communication between applications*
**Actions:** `call_method`
`call_method` props:
  wsdl★(SHORT_TEXT)
  method★(DROPDOWN) //The SOAP Method
  args★(DYNAMIC) //Arguments for the SOAP method
  parsed(CHECKBOX)=false

### base64-image  v2.0.3 | None
*Convert a base64-encoded image into a permanent, accessible image URL.*
**Actions:** `convert_base64_to_file`
`convert_base64_to_file` props:
  base64★(LONG_TEXT) //The base64-encoded image data (with or without the data URI 
  fileName★(SHORT_TEXT) //Optional file name (e.g. photo.png, image.jpg, picture.webp)
  mimeType(SHORT_TEXT) //Optional image MIME type (e.g. image/png, image/jpeg, image/


## ★ AI MODELS

### hugging-face  v2.0.0 | API Key
*Run inference on 100,000+ open ML models for NLP, vision, and audio tasks*
**Actions:** `document_question_answering` `language_translation` `text_classification` `text_summarization` `chat_completion` `create_image` `object_detection` `image_classification`
`document_question_answering` props:
  model★(STATIC_DROPDOWN)='impira/layoutlm-document-qa' ["impira/layoutlm-document-qa (Recommended)"|"microsoft/layoutlmv3-base"|"nielsr/layoutlmv2-finetuned-docvqa"] //Hugging Face document question answering model
  image★(FILE) //Image of the document to analyze (invoice, contract, etc.)
  question★(SHORT_TEXT) //Question to ask about the document (e.g., 'What is the invoi
  top_k(NUMBER)=1 //Number of top answers to return
  max_answer_len(NUMBER) //Maximum length of predicted answers
  handle_impossible_answer(CHECKBOX)=true //Whether to accept 'impossible' as an answer when no answer i
  lang(STATIC_DROPDOWN)='en' ["English"|"Spanish"|"French"|"German"|"Italian"|"Portuguese"] //Language to use for OCR text extraction
  use_cache(CHECKBOX)=true //Use cached results if available
  wait_for_model(CHECKBOX)=false //Wait for model to load if not ready
`language_translation` props:
  model★(DROPDOWN)='Helsinki-NLP/opus-mt-fr-en' //Select a translation model or search from 7000+ available mo
  customModel(SHORT_TEXT) //Alternative: Enter any Hugging Face translation model ID dir
  text★(LONG_TEXT) //The text content you want to translate
  sourceLanguage(SHORT_TEXT) //Source language code (e.g., "en", "es", "fr"). Only needed f
  targetLanguage(SHORT_TEXT) //Target language code (e.g., "fr", "de", "zh"). Only needed f
  cleanUpSpaces(CHECKBOX)=true //Remove potential extra spaces in the translation output
  maxLength(NUMBER) //Maximum length of the translated text (leave empty for defau
  useCache(CHECKBOX)=true //Use cached results if available for faster responses
  waitForModel(CHECKBOX)=false //Wait for model to load if not immediately available
`text_classification` props:
  classificationMode★(STATIC_DROPDOWN)='zero-shot' ["🎯 Zero-Shot (Custom Categories)"|"📊 Pre-trained Models"|"🔍 Search All Models"] //Choose your classification approach
  zeroShotModel(STATIC_DROPDOWN)='facebook/bart-large-mnli' //Model for classifying into your custom categories
  customLabels(LONG_TEXT) //Enter categories separated by commas (e.g., "customer suppor
  pretrainedModel(STATIC_DROPDOWN) //Select a specialized pre-trained classification model
  searchModel(DROPDOWN) //Search from all available text classification models
  text★(LONG_TEXT) //The text content you want to classify
  topK(NUMBER)=3 //Number of top predictions to return
  functionToApply(STATIC_DROPDOWN)='softmax' ["Softmax (Recommended)"|"Sigmoid"|"None (Raw Scores)"] //How to calculate confidence scores
  useCache(CHECKBOX)=true //Use cached results for faster responses
  waitForModel(CHECKBOX)=false //Wait for model to load if not immediately available
`text_summarization` props:
  contentType★(STATIC_DROPDOWN)='news' //What type of content are you summarizing?
  model★(DROPDOWN)='facebook/bart-large-cnn' //Select the best model for your content type
  text★(LONG_TEXT) //The long text content you want to summarize (most models wor
  summaryLength(STATIC_DROPDOWN)='medium' ["📝 Brief (30-80 words)"|"📄 Medium (80-150 words)"|"📚 Detailed (150-300 words)"|"⚙️ Custom Length"] //How long should the summary be?
  customMinLength(NUMBER) //Minimum number of tokens for the summary
  customMaxLength(NUMBER) //Maximum number of tokens for the summary
  cleanUpSpaces(CHECKBOX)=true //Remove extra spaces and clean up formatting
  truncationStrategy(STATIC_DROPDOWN)='longest_first' ["Do Not Truncate"|"Longest First"|"Only First"|"Only Second"] //How to handle text that exceeds model limits
  useCache(CHECKBOX)=true //Use cached results for faster responses
  waitForModel(CHECKBOX)=false //Wait for model to load if not immediately available
`chat_completion` props:
  useCase★(STATIC_DROPDOWN)='faq' ["FAQ & Customer Support"|"Content Generation & Writing"|"General Conversation"|"Search All Models"] //What type of chat assistant are you building?
  model★(DROPDOWN) //Select the best model for your use case
  conversationMode★(STATIC_DROPDOWN)='single' ["Single Message (Simple Q&A)"|"Multi-turn Conversation"|"Template-based Response"] //How do you want to build the conversation?
  userMessage(LONG_TEXT) //The user message or question to respond to
  systemPrompt(LONG_TEXT) //Instructions for how the assistant should behave
  conversationHistory(ARRAY) //Previous messages in the conversation (for multi-turn chat)
  template(STATIC_DROPDOWN) ["Customer Support Agent"|"FAQ Assistant"|"Content Writer"|"Email Responder"|"E-commerce Assistant"] //Pre-built templates for common business scenarios
  responseLength(STATIC_DROPDOWN)='normal' ["Brief (50-100 tokens)"|"Normal (100-200 tokens)"|"Detailed (200-400 tokens)"|"Custom"] //How long should the response be?
  customMaxTokens(NUMBER) //Maximum number of tokens to generate
  temperature(NUMBER)=0.7 //How creative should responses be? (0.1 = focused, 1.0 = crea
  topP(NUMBER)=0.9 //Controls response diversity (0.1 = focused, 1.0 = varied)
  stopSequences(ARRAY) //Text sequences that will stop generation
  frequencyPenalty(NUMBER)=0 //Reduce repetitive responses (-2.0 to 2.0)
  presencePenalty(NUMBER)=0 //Encourage diverse topics (-2.0 to 2.0)
  useCache(CHECKBOX)=true //Use cached responses for identical requests
  waitForModel(CHECKBOX)=false //Wait for model to load if not immediately available
`create_image` props:
  useCase★(STATIC_DROPDOWN)='quality' ["Fast Generation (Quick Prototypes)"|"High Quality (Marketing & Print)"|"Business Content (Products & Brands)"|"Search All Models"] //What type of image generation do you need?
  model★(DROPDOWN) //Select the best model for your use case
  prompt★(LONG_TEXT) //Describe the image you want to generate. Be specific about s
  aspectRatio(STATIC_DROPDOWN)='square' //Choose the dimensions for your image
  customWidth(NUMBER) //Width in pixels (64-1024)
  customHeight(NUMBER) //Height in pixels (64-1024)
  negativePrompt(LONG_TEXT) //Describe what you DON'T want in the image (blur, low quality
  qualitySettings(STATIC_DROPDOWN)='balanced' ["⚡ Fast (10-20 steps)"|"⚖️ Balanced (20-30 steps)"|"🎯 High Quality (30-50 steps)"|"🏆 Maximum Quality (50+ steps)"|"⚙️ Custom Steps"] //Balance between image quality and generation time
  customSteps(NUMBER) //Number of denoising steps (1-100)
  guidanceScale(NUMBER)=7.5 //How closely to follow the prompt (1-20). Higher values = mor
  seed(NUMBER) //Set a seed for reproducible results. Leave empty for random 
  scheduler(STATIC_DROPDOWN) ["DPM++ 2M Karras (Recommended)"|"Euler A (Fast)"|"DDIM (Stable)"|"LMS (Classic)"] //Advanced: Choose the noise scheduler algorithm
`object_detection` props:
  useCase★(STATIC_DROPDOWN)='general' ["📋 General Objects (COCO Dataset)"|"📊 Documents & Tables"|"🛡️ Security & Monitoring"|"🏢 Business & Commerce"|"🔍 Search All Models"] //What type of object detection do you need?
  model★(DROPDOWN) //Select the best model for your detection task
  image★(FILE) //Upload an image for object detection. Supports JPG, PNG, Web
  confidenceThreshold(NUMBER)=0.5 //Minimum confidence score for detections (0.1-0.9). Higher va
  maxDetections(NUMBER)=50 //Maximum number of objects to detect (1-100)
  filterSettings(STATIC_DROPDOWN)='balanced' ["🎯 High Confidence Only (>0.7)"|"⚖️ Balanced Results (>0.5)"|"📊 All Detections (>0.1)"|"⚙️ Custom Threshold"] //How to handle detection results
  outputFormat(STATIC_DROPDOWN)='business' ["📋 Business Summary"|"🔧 Technical Details"|"📊 Statistical Analysis"|"🌐 All Information"] //How to structure the detection results
`image_classification` props:
  classificationMode★(STATIC_DROPDOWN)='standard' ["🏷️ Pre-trained Categories (Standard)"|"🎯 Custom Categories (Zero-shot)"] //How do you want to classify your images?
  useCase★(STATIC_DROPDOWN)='general' //What type of image classification do you need?
  model★(DROPDOWN) //Select the best model for your use case
  imageSource★(STATIC_DROPDOWN)='upload' ["📎 Upload File"|"🔗 Image URL"] //How do you want to provide the image?
  imageFile★(FILE) //Upload an image file for classification (JPG, PNG, WebP)
  imageUrl★(SHORT_TEXT) //URL of the image to classify
  customCategories★(ARRAY) //Enter the categories you want to classify the image into (e.
  hypothesisTemplate(SHORT_TEXT)='This image shows {}' //Template for classification (advanced). Default: "This image
  topK(NUMBER)=5 //Maximum number of classification results to return (1-20)
  confidenceThreshold(NUMBER)=0.1 //Minimum confidence score for results (0.0-1.0)
  outputFormat(STATIC_DROPDOWN)='business' ["📋 Business Summary"|"🔧 Technical Details"|"📊 Statistical Analysis"|"🌐 Comprehensive Report"] //How to structure the classification results

### deepgram  v2.0.0 | API Key
*Deepgram is an AI-powered speech recognition platform that provides real-time transcription, text-to*
**Actions:** `create_summary` `create_transcription_callback` `list_projects` `text_to_speech` `custom_api_call`

### cometapi  v2.0.0 | API Key
*Access multiple AI models through CometAPI - unified interface for GPT, Claude, Gemini, and more.*
**Actions:** `ask-cometapi` `custom_api_call`

### agent  v2.0.0 | None
*Let an AI assistant help you with tasks using tools.*
**Actions:** `run_agent`

### docsbot  v2.0.0 | API Key
*DocsBot AI allows you to build AI-powered chatbots that pull answers from your existing documentatio*
**Actions:** `askQuestion` `createSource` `uploadSourceFile` `createBot` `findBot` `custom_api_call`

### copy-ai  v2.0.0 | API Key
*AI-powered content generation and copywriting platform*
**Triggers:** `workflow_run_completed`
**Actions:** `run_workflow` `get_workflow_run_status` `get_workflow_run_outputs`

### dappier  v2.0.0 | API Key
*Enable fast, free real-time web search and access premium data from trusted media brands—news, finan*
**Actions:** `real_time_web_search` `stock_market_data_search` `sports_news_search` `lifestyle_news_search`

### firecrawl  v2.0.0 | API Key
*Extract structured data from websites using AI with natural language prompts*
**Actions:** `scrape` `startCrawl` `crawlResults` `custom_api_call`

### apify  v2.0.0 | Custom(apikey)
*Your full‑stack platform for web scraping*
**Actions:** `getDatasetItems` `getActors` `getLastRun` `startActor`

### browserless  v2.0.0 | Custom(apiToken,region,customBaseUrl)
*Browserless is a headless browser automation tool that allows you to scrape websites, take screensho*
**Actions:** `capture_screenshot` `generate_pdf` `scrape_url` `run_bql_query` `get_website_performance`

### cody  v2.0.0 | API Key
*Build and manage AI assistants with Cody. Create documents, upload files, manage conversations, and *
**Actions:** `create_document_from_text` `upload_file` `send_message` `create_conversation` `find_bot` `find_conversation` `custom_api_call`

### fireflies-ai  v2.0.0 | API Key
*Meeting assistant that automatically records, transcribes, and analyzes conversations*
**Triggers:** `new_transcription_completed`
**Actions:** `find-meeting-by-id` `find_recent_meeting` `find_meeting_by_query` `upload_audio` `get-user-details`

### avoma  v2.0.0 | API Key
*Avoma is an AI Meeting Assistant that automatically records, transcribes, and summarizes your meetin*
**Triggers:** `new_note` `new_meeting_scheduled` `meeting_rescheduled` `meeting_cancelled`
**Actions:** `create_call` `get_meeting_recording` `get_meeting_transcription`

### bumpups  v2.0.0 | API Key
*Generate creator content, hashtags, and engagement with Bumpups.*
**Actions:** `generateCreatorDescription` `generateCreatorHashtags` `generateCreatorTakeaways` `generateCreatorTitles` `generateTimestamps` `send_chat` `custom_api_call`

### pinecone  v2.0.0 | Custom(apiKey)
*Manage vector databases, store embeddings, and perform similarity searches*
**Actions:** `create_index` `upsert_vector` `update_vector` `get_vector` `delete_vector` `search_vector` `search_index`

### qdrant  v2.0.0 | Custom(serverAddress,key)
*Make any action on your qdrant vector database*
**Actions:** `add_points_to_collection` `collection_list` `collection_infos` `delete_collection` `delete_points` `get_points` `search_points`

### personal-ai  v2.0.0 | API Key
*Manage memory storage, messaging, and documents through AI integration.*
**Actions:** `create_memory` `create_message` `create_chatgpt_instruction` `create_custom_training` `get_conversation` `upload_document` `upload_file` `upload_url` `update_document` `get_document`

### comfyicu  v2.0.0 | API Key
*Run and manage ComfyUI workflows on Comfy.ICU. Automate workflow submissions, track run status, and *
**Triggers:** `new-workflow-created` `run-completed` `run-failed`
**Actions:** `get-run-output` `get-run-status` `list-workflows` `submit-workflow-run`

### gistly  v2.0.0 | API Key
*YouTube Transcripts*
**Actions:** `get_transcript`

### mindee  v2.0.0 | API Key
*Document automation API*
**Actions:** `mindee_predict_document` `custom_api_call`

### vlm-run  v2.0.0 | API Key
*VLM Run is a visual AI platform that extracts data from images, videos, audio, and documents. It hel*
**Actions:** `analyzeAudio` `analyzeImage` `analyzeDocument` `analyzeVideo` `getFile` `custom_api_call`

### scrapeless  v2.0.0 | API Key
*Scrapeless is an all-in-one and highly scalable web scraping toolkit for enterprises and developers.*
**Actions:** `google_search_api` `crawl_scrape` `crawl_crawl` `google_trends_api` `universal_scraping_api` `custom_api_call`

### straico  v2.0.0 | API Key
*All-in-one generative AI platform*
**Actions:** `prompt_completion` `image_generation` `file_upload` `create_rag` `list_rags` `get_rag_by_id` `update_rag` `delete_rag` `rag_prompt_completion` `agent-create` `agent-add-rag` `agent-list` `agent_delete` `agent_update` `agent_get` `agent_prompt_completion` `custom_api_call`

### prompthub  v2.0.0 | API Key
*Integrate with PromptHub projects, retrieve heads, and run prompts.*
**Actions:** `list_projects` `get_project_head` `run_prompt` `custom_api_call`

### pdf-co  v2.0.0 | API Key
*Automate PDF conversion, editing, extraction*
**Actions:** `add_barcode_to_pdf` `add_image_to_pdf` `add_text_to_pdf` `convert_html_to_pdf` `convert_pdf_to_structured_format` `extract_tables_from_pdf` `extract_text_from_pdf` `search_and_replace_text`

### pdfmonkey  v2.0.0 | API Key
*Generate PDFs at scale with PDFMonkey. Automate document generation from templates, manage documents*
**Triggers:** `documentGenerated`
**Actions:** `generateDocument` `deleteDocument` `findDocument` `custom_api_call`

### peekshot  v2.0.0 | API Key
*Capture high-quality screenshots of any website with PeekShot. Automate web snapshots for your repor*
**Actions:** `captureScreenshot` `custom_api_call`

### placid  v2.0.0 | API Key
*Creative automation engine that generates dynamic images, PDFs, and videos from templates and data.*
**Actions:** `create_image` `create_pdf` `create_video` `convert_file_to_url` `get_image` `get_pdf` `get_video` `custom_api_call`

### bannerbear  v2.0.0 | API Key
*Automate image generation*
**Actions:** `bannerbear_create_image` `custom_api_call`

### generatebanners  v2.0.0 | Basic Auth
*Image generation API for banners and social media posts*
**Actions:** `render_template`

### apitemplate-io  v2.0.0 | Custom(region,apiKey)
*Generate PDFs and images from templates, HTML, or URLs with APITemplate.io.*
**Actions:** `createImage` `createPdfFromHtml` `createPdfFromUrl` `createPdf` `deleteObject` `getAccountInformation` `listObjects` `custom_api_call`

### gamma  v2.0.1 | Custom(apiKey)
*An AI-powered design partner that helps users generate presentations, documents, social media posts,*
**Actions:** `generateGamma` `getGeneration`

### magicslides  v2.0.0 | Custom(accessId,email)
*Create PowerPoint presentations from topics, summaries, or YouTube videos using AI.*
**Actions:** `createPptFromTopic` `createPptFromText` `createPptFromYoutube`

### slidespeak  v2.0.0 | API Key
*Interact with your documents and presentations using AI with SlideSpeak. Upload documents, create or*
**Triggers:** `new-presentation`
**Actions:** `create-presentation` `edit-presentation` `get-task-status` `upload-docuemnt` `custom_api_call`

### photoroom  v2.0.0 | Custom(apiKey)
*Edit your photos with Photoroom. Effortlessly remove backgrounds from your images to create professi*
**Actions:** `removeBackground`

### supadata  v2.0.0 | API Key
*YouTube Transcripts*
**Actions:** `get_transcript`

### serp-api  v2.0.0 | API Key
*Search Google, YouTube, News, and Trends with powerful filtering and analysis capabilities*
**Actions:** `google_search` `google_news_search` `youtube_search` `google_trends_search`

### serpstat  v2.0.0 | API Key
*Analyze keywords, get search suggestions, and access SEO data programmatically using Serpstat’s powe*
**Actions:** `get_keywords` `get_suggestions` `custom_api_call`

### webscraping-ai  v2.0.0 | API Key
*WebScraping AI is a powerful tool that allows you to scrape websites and extract data.*
**Actions:** `askAQuestionAboutTheWebPage` `getPageHtml` `scrapeWebsiteText` `extractStructuredData` `getAccountInformation`


## ★ VOICE & CALLING

### aircall  v2.0.0 | Basic Auth
*Manage calls, contacts, and messages with Aircall. Automate call logging, note creation, and contact*
**Triggers:** `callEnded` `newContact` `newNote` `newNumberCreated` `newSms`
**Actions:** `commentACall` `createAContact` `findCalls` `findContact` `getCall` `tagACall` `updateContact` `custom_api_call`

### krisp-call  v2.0.0 | Custom(apiKey)
*KrispCall is a cloud telephony system for modern businesses, offering advanced features for high-gro*
**Triggers:** `newVoicemail` `newMms` `newContact` `newCallLog` `OutboundSMS/MMS`
**Actions:** `addContact` `deleteContacts` `sendSms` `sendMms`
`addContact` props:
  name(SHORT_TEXT) //Enter your name
  number★(SHORT_TEXT) //Enter contact number
  address(SHORT_TEXT) //Enter your address
  company(SHORT_TEXT) //Enter your company
  email(SHORT_TEXT) //Enter your email
`deleteContacts` props:
  contacts(ARRAY) //Enter contact which you want to delete.
`sendSms` props:
  from_number★(DROPDOWN) //Select an Number
  to_number★(SHORT_TEXT) //Enter the number to which you want to send sms.
  content★(SHORT_TEXT) //Enter your message here.
`sendMms` props:
  from_number★(DROPDOWN) //Select an number
  to_number★(SHORT_TEXT) //Enter the number to which you want to send sms.
  content(SHORT_TEXT) //Enter your message here.
  medias★(ARRAY) //Enter medias urls

### open-phone  v2.0.0 | API Key
*Manage your business communications with OpenPhone. Automate messaging, contact management, and trac*
**Triggers:** `call_recording_completed` `outgoing_message_delivered` `outgoing_call_completed` `incoming_call_completed` `incoming_message_received`
**Actions:** `send_message` `create_contact` `update_contact` `get_call_summary`

### timelines-ai  v2.0.0 | API Key
*Manage your WhatsApp communications with TimelinesAI. Automate sending messages and files to existin*
**Triggers:** `chatClosed` `newOutgoingChat` `newIncomingChat` `newSentMessage` `newReceivedMessage` `newUploadedFile` `newWhatsappAccount`
**Actions:** `sendMessageToExistingChat` `sendUploadedFileToExistingChat` `sendFileToExistingChat` `sendMessageToNewChat` `closeChat` `findChat` `findMessage` `findUploadedFile` `findMessageStatus` `findWhatsappAccount` `custom_api_call`

### rounded-studio  v2.0.0 | API Key
*Make and manage phone calls with Call-rounded.*
**Actions:** `custom_api_call`


## ★ GOOGLE WORKSPACE

### gmail  v2.0.4 | OAuth2
*Email service by Google*
**Triggers:** `gmail_new_email_received` `new_labeled_email` `gmail_new_attachment` `gmail_new_thread` `gmail_new_email_matching` `gmail_new_starred_email`
**Actions:** `send_email` `gmail_get_mail` `gmail_search_mail` `gmail_get_thread` `create_draft` `add_label_to_email` `reply_to_email` `create_draft_reply` `create_label` `remove_label_from_email` `remove_label_from_thread` `gmail_find_email` `custom_api_call`

### google-sheets  v2.0.9 | OAuth2
*Read, write, search, and manage data in Google Sheets spreadsheets. Supports inserting rows, updatin*
**Triggers:** `googlesheets_new_row_added` `google-sheets-new-or-updated-row` `new-spreadsheet` `new-worksheet` `googlesheets_new_row_added_team_drive` `google-sheets-new-or-updated-row-team-drive`
**Actions:** `insert_row` `google-sheets-insert-multiple-rows` `delete_row` `update_row` `find_rows` `create-spreadsheet` `create-worksheet` `clear_sheet` `find_row_by_num` `get_next_rows` `get_all_rows` `find_spreadsheets` `find-worksheet` `copy-worksheet` `update-multiple-rows` `create-column` `export_sheet` `find-or-create-worksheet` `find-or-create-row` `insert_row_at_top` `clear_rows` `lookup_spreadsheet_rows` `delete-worksheet` `rename-worksheet` `get_cell_value` `update_cell_value` `count_rows` `list-worksheets` `custom_api_call`

### google-drive  v2.0.4 | OAuth2
*Google Drive file storage — create, upload, search, share, move, copy, delete, and organize files an*
**Triggers:** `new_file` `new_folder` `new_file_in_folder` `updated_file`
**Actions:** `create_new_gdrive_folder` `create_new_gdrive_file` `upload_gdrive_file` `read-file` `get-file-or-folder-by-id` `list-files` `search-folder` `duplicate_file` `save_file_as_pdf` `update_permissions` `delete_permissions` `set_public_access` `google-drive-move-file` `delete_gdrive_file` `trash_gdrive_file` `copy_file` `create_file_from_text` `replace_file` `add_file_sharing_preference` `create_shortcut` `update_file_folder_name` `api_request` `retrieve_files` `find_file` `retrieve_file_by_id` `find_folder` `find_multiple_files` `find_or_create_folder` `find_or_create_file` `get_storage_info` `list_shared_drives` `get_file_sharing_info` `custom_api_call`
`new_file` props:
  parentFolder(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
  include_file_content(CHECKBOX)=false //Include the file content in the output. This will increase t
`new_folder` props:
  parentFolder(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`new_file_in_folder` props:
  parentFolder★(DROPDOWN) //Select the specific folder you want to monitor for new files
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
  include_file_content(CHECKBOX)=false //Include the file content in the output. This will increase t
`updated_file` props:
  parentFolder(DROPDOWN) //Select a specific folder to monitor, or leave empty to monit
  include_team_drives(CHECKBOX)=false //Determines if files from Team Drives should be included in t
  include_file_content(CHECKBOX)=false //Include the file content in the output. This will increase t
`create_new_gdrive_folder` props:
  title★(SHORT_TEXT) //The name of the new folder
  folder_id(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`create_new_gdrive_file` props:
  title★(SHORT_TEXT) //The name of the new text file
  text★(LONG_TEXT) //The text content to add to file
  fileType★(STATIC_DROPDOWN)='plain/text' ["Text"|"CSV"|"XML"] //Select file type
  folder_id(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`upload_gdrive_file` props:
  title★(SHORT_TEXT) //The name of the file
  file★(FILE) //The file URL or base64 to upload
  folder_id(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`read-file` props:
  file_id★(SHORT_TEXT) //The unique ID of the Google Drive file to read. You can get 
  title(SHORT_TEXT)
`get-file-or-folder-by-id` props:
  file_id★(SHORT_TEXT) //The unique ID of the file or folder. You can get this from t
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`list-files` props:
  folder_id★(SHORT_TEXT) //The ID of the folder to list files from
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
  includeTrashed(CHECKBOX)=false //Include new files that have been trashed.
  downloadFiles(CHECKBOX)=false //Download all file contents in a list
`search-folder` props:
  queryTerm★(STATIC_DROPDOWN)='name' ["File name"|"Full text search"|"Content type"] //The Query term or field of file/folder to search upon.
  operator★(STATIC_DROPDOWN)='contains' ["Contains"|"Equals"] //The operator to create criteria.
  search_text★(SHORT_TEXT) //Value of the field of file/folder to search for.
  type(STATIC_DROPDOWN)='all' ["All"|"Files"|"Folders"|"All Files/Folders"] //(Optional) Choose between files and folders.
  folder_id(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`duplicate_file` props:
  file_id★(SHORT_TEXT) //The ID of the file to duplicate
  title★(SHORT_TEXT) //The name of the duplicated file
  folder_id(DROPDOWN)
  mimeType(STATIC_DROPDOWN) ["Google Sheets"|"Google Docs"] //If left unselected the file will be duplicated as it is
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`save_file_as_pdf` props:
  documentId★(SHORT_TEXT) //The ID of the document to export
  folder_id(DROPDOWN)
  name★(SHORT_TEXT) //The name of the new file (do not include the extension)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`update_permissions` props:
  file_id★(SHORT_TEXT) //The ID of the file or folder to update permissions for
  user_email★(SHORT_TEXT) //The email address of the user to update permissions for
  permission_name★(STATIC_DROPDOWN) ["Organizer"|"File Organizer"|"Writer"|"Commenter"|"Reader"] //The role to grant to user. See more at: https://developers.g
  send_invitation_email★(CHECKBOX) //Send an email to the user to notify them of the new permissi
`delete_permissions` props:
  file_id★(SHORT_TEXT) //The ID of the file or folder to update permissions for
  user_email★(SHORT_TEXT) //The email address of the user to update permissions for
  permission_name★(STATIC_DROPDOWN) ["Organizer"|"File Organizer"|"Writer"|"Commenter"|"Reader"] //The role to remove from user.
`set_public_access` props:
  file_id★(SHORT_TEXT) //The ID of the file or folder to update permissions for
`google-drive-move-file` props:
  file_id★(SHORT_TEXT) //The ID of the file to move
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
  folder_id(DROPDOWN)
`delete_gdrive_file` props:
  file_id★(SHORT_TEXT) //The ID of the file to delete
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`trash_gdrive_file` props:
  file_id★(SHORT_TEXT) //The ID of the file to trash
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`copy_file` props:
  file_id★(SHORT_TEXT) //The ID of the file you want to copy. You can use the "Search
  title★(SHORT_TEXT) //The name for the copied file
  folder_id(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`create_file_from_text` props:
  title★(SHORT_TEXT) //The name of the file (including extension). You can use {{tr
  content★(LONG_TEXT) //The text content to add to the file
  fileType★(STATIC_DROPDOWN)='text/plain' //Select the type of file you want to create
  folder_id(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`replace_file` props:
  file_id★(SHORT_TEXT) //The ID of the file you want to replace. You can use the "Sea
  newContent(LONG_TEXT) //The new content to replace the existing file content
  title(SHORT_TEXT) //Optionally provide a new name for the file. Leave empty to k
  fileType(STATIC_DROPDOWN) //Select the type of file (this will override the original fil
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`add_file_sharing_preference` props:
  file_id★(SHORT_TEXT) //The ID of the file or folder to set sharing preferences for.
  sharingType★(STATIC_DROPDOWN)='email' //Select how you want to share the file or folder
  emailAddress(SHORT_TEXT) //The email address of the user or group to share with (requir
  sendNotificationEmail(CHECKBOX)=true //Send an email notification to the user/group about the share
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`create_shortcut` props:
  file_id★(SHORT_TEXT) //The ID of the file or folder you want to create a shortcut t
  title(SHORT_TEXT) //The name for the shortcut (optional - will use original name
  folder_id(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`update_file_folder_name` props:
  file_id★(SHORT_TEXT) //The ID of the file or folder you want to rename. You can use
  title★(SHORT_TEXT) //The new name for the file or folder
  renameFolder(CHECKBOX)=false //Check this if you are renaming a folder. Leave unchecked for
  folderOptions(STATIC_DROPDOWN)='none' ["None"|"Preserve folder structure"|"Update folder permissions"|"Create backup of old name"] //Additional options when renaming folders
  preserveSubfolders(CHECKBOX)=true //Keep all subfolders and their contents when renaming a folde
  updateSharingSettings(CHECKBOX)=false //Update sharing settings for the renamed folder
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`api_request` props:
  method★(STATIC_DROPDOWN)='GET' ["GET"|"POST"|"PUT"|"PATCH"|"DELETE"] //The HTTP method to use for the request
  endpoint★(SHORT_TEXT)='/files' //The Google Drive API endpoint (e.g., /files, /files/{fileId}
  queryParams(LONG_TEXT) //Query parameters as JSON object (e.g., {"pageSize": "10", "f
  requestBody(LONG_TEXT) //Request body as JSON (for POST, PUT, PATCH requests)
  includeTeamDrives(CHECKBOX)=false //Include files from Team Drives in the response
`retrieve_files` props:
  folder_id(DROPDOWN)
  fileType(STATIC_DROPDOWN) ["All Files"|"Documents"|"Spreadsheets"|"Presentations"|"Images"|"Videos"|"PDFs"|"Text Files"|"Folders Only"] //Filter by specific file types
  includeTrashed(CHECKBOX)=false //Include files that have been moved to trash
  sortBy(STATIC_DROPDOWN)='modifiedTime' //Sort the results by this field
  maxResults(NUMBER)=100 //Maximum number of files to retrieve (1-1000)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`find_file` props:
  searchType★(STATIC_DROPDOWN)='name' ["Search by Name"|"Search by ID"|"Full Text Search"|"Search by Content Type"|"Search by Owner"|"Search by Date Range"] //Choose how you want to search for files. "name" is most comm
  search_text★(SHORT_TEXT) //The value to search for (file name, ID, content type, etc.)
  searchOperator(STATIC_DROPDOWN)='contains' ["Contains"|"Equals"|"Starts with"|"Ends with"] //The operator to use for the search (only applies to name and
  searchDrive(DROPDOWN) //Select the drive to search in
  folder_id(DROPDOWN)
  fileType(STATIC_DROPDOWN) ["All Types"|"Files Only"|"Folders Only"|"Documents"|"Spreadsheets"|"Presentations"|"Images"|"Videos"|"PDFs"] //Filter results by file type
  includeTrashed(CHECKBOX)=false //Include files that have been moved to trash
  maxResults(NUMBER)=10 //Maximum number of files to return (1-100)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`retrieve_file_by_id` props:
  file_id★(SHORT_TEXT) //The ID of the file or folder you want to retrieve. You can g
  includePermissions(CHECKBOX)=false //Include permission information for the file/folder
  includeRevisions(CHECKBOX)=false //Include revision history for the file (only applies to files
  includeTeamDrives(CHECKBOX)=false //Include files from Team Drives in the search
`find_folder` props:
  searchType★(STATIC_DROPDOWN)='name' ["Search by Name"|"Search by ID"|"Search by Owner"|"Search by Date Created"|"Search by Date Modified"] //Choose how you want to search for folders
  search_text★(SHORT_TEXT) //The value to search for (folder name, ID, owner email, or da
  searchOperator(STATIC_DROPDOWN)='contains' ["Contains"|"Equals"|"Starts with"|"Ends with"] //The operator to use for the search (only applies to name sea
  folder_id(DROPDOWN)
  includeTrashed(CHECKBOX)=false //Include folders that have been moved to trash
  includeSubfolders(CHECKBOX)=false //Search recursively in subfolders (may take longer)
  maxResults(NUMBER)=10 //Maximum number of folders to return (1-100)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`find_multiple_files` props:
  searchCriteria★(STATIC_DROPDOWN)='name' //Choose the primary search criteria for finding files
  search_text★(SHORT_TEXT) //The value to search for (file name, content type, owner emai
  searchOperator(STATIC_DROPDOWN)='contains' ["Contains"|"Equals"|"Starts with"|"Ends with"|"Greater than"|"Less than"|"Greater than or equal"|"Less than or equal"] //The operator to use for the search
  parentFolder(DROPDOWN)
  fileTypeFilter(STATIC_DROPDOWN) ["All Files"|"Documents"|"Spreadsheets"|"Presentations"|"Images"|"Videos"|"PDFs"|"Text Files"|"Audio Files"|"Archives"] //Filter results by specific file types
  includeTrashed(CHECKBOX)=false //Include files that have been moved to trash
  sortBy(STATIC_DROPDOWN)='modifiedTime desc' //Sort the results by this field
  maxResults(NUMBER)=100 //Maximum number of files to return (1-1000)
  includeFileDetails(CHECKBOX)=false //Include comprehensive file metadata (owners, permissions, et
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`find_or_create_folder` props:
  title★(SHORT_TEXT) //The name of the folder to find or create
  folder_id(DROPDOWN)
  createIfNotFound(CHECKBOX)=true //Create the folder if it doesn't exist (default: true)
  folderDescription(LONG_TEXT) //Description for the folder (only used when creating a new fo
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`find_or_create_file` props:
  title★(SHORT_TEXT) //The name of the file to find or create (including extension)
  folder_id(DROPDOWN)
  createIfNotFound(CHECKBOX)=true //Create the file if it doesn't exist (default: true)
  fileType(STATIC_DROPDOWN)='text/plain' //Select the type of file to create if it doesn't exist
  initialContent(LONG_TEXT) //Initial content for the file (only used when creating a new 
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`list_shared_drives` props:
  maxResults(NUMBER)=100 //Maximum number of shared drives to return (1-100)
`get_file_sharing_info` props:
  file_id★(SHORT_TEXT) //The ID of the file or folder. Use "Find a File" or "Find a F
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### google-docs  v2.0.0 | OAuth2
*Create and edit documents online*
**Triggers:** `new-document` `new_document_in_folder`
**Actions:** `create_document` `create_document_based_on_template` `create_document_from_template` `create_document_from_text` `upload_document` `read_document` `google-docs-find-document` `api_request` `custom_api_call` `append_text`
`new-document` props:
  folderId(DROPDOWN)
`new_document_in_folder` props:
  parentFolder(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if folders from Team Drives should be included in
`create_document` props:
  title★(SHORT_TEXT)
  body★(LONG_TEXT)
`create_document_based_on_template` props:
  template★(SHORT_TEXT) //The ID of the file to replace the values
  values★(OBJECT) //Dont include the placeholder format "[[]]" or "{{}}", only t
  images★(OBJECT) //Key: Image ID (get it manually from the Read File Action), V
  placeholder_format★(STATIC_DROPDOWN)='[[]]' ["Curly Braces {{}}"|"Square Brackets [[]]"] //Choose the format of placeholders in your template
`create_document_from_template` props:
  templateId★(SHORT_TEXT) //The ID of the template document to copy from
  newDocumentTitle★(SHORT_TEXT) //The title for the new document
  folderId(SHORT_TEXT) //The ID of the folder where to create the new document. Leave
  replacePlaceholders(CHECKBOX)=false //Enable to replace placeholders in the template with provided
  placeholders(OBJECT) //Key-value pairs to replace placeholders. Keys should be plac
  placeholderFormat(STATIC_DROPDOWN)='[[]]' ["Square Brackets [[]]"|"Curly Braces {{}}"|"Double Curly Braces {{{}}}"] //Choose the format of placeholders in your template
  replaceImages(CHECKBOX)=false //Enable to replace images in the template with new URLs
  images(OBJECT) //Key: Image ID (get it from Read Document Action), Value: New
`create_document_from_text` props:
  title★(SHORT_TEXT) //The title of the new document
  content★(LONG_TEXT) //The text content to add to the document
  folderId(SHORT_TEXT) //The ID of the folder where to create the document. Leave emp
  formatAsMarkdown(CHECKBOX)=false //Convert markdown formatting to Google Docs formatting (heade
  includeTimestamp(CHECKBOX)=false //Add a timestamp at the beginning of the document
`upload_document` props:
  file★(LONG_TEXT) //Enter a file path (Windows: C:/Users/username/file.pdf, Linu
  title(SHORT_TEXT) //Custom title for the uploaded document. If not provided, the
  folderId(SHORT_TEXT) //The ID of the folder where to store the uploaded document. L
  convertToGoogleDocs(CHECKBOX)=true //Convert the uploaded file to Google Docs format. If disabled
  ocrLanguage(STATIC_DROPDOWN)='en' ["English"|"Spanish"|"French"|"German"|"Italian"|"Portuguese"|"Russian"|"Chinese (Simplified)"|"Japanese"|"Korean"] //Language for OCR processing when converting PDFs with images
`read_document` props:
  documentId★(SHORT_TEXT) //The ID of the document to read
`google-docs-find-document` props:
  name★(SHORT_TEXT)
  folderId(DROPDOWN)
  createIfNotFound(CHECKBOX)=false
  newDocumentProps(DYNAMIC)
`api_request` props:
  method★(STATIC_DROPDOWN)='GET' ["GET"|"POST"|"PUT"|"PATCH"|"DELETE"] //The HTTP method to use for the request
  endpoint★(SHORT_TEXT)='/documents' //The API endpoint (e.g., /documents, /documents/{documentId},
  documentId(SHORT_TEXT) //Document ID to use in the endpoint. Will replace {documentId
  queryParams(OBJECT) //Query parameters to include in the request URL
  headers(OBJECT) //Additional headers to include in the request
  body(JSON) //JSON body for POST, PUT, PATCH requests
  includeAuth(CHECKBOX)=true //Include OAuth2 authentication headers (recommended)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)
`append_text` props:
  text★(LONG_TEXT) //The text to append to the document
  documentId★(SHORT_TEXT) //The ID of the document to append text to

### google-calendar  v2.0.3 | OAuth2
*Get organized and stay on schedule*
**Triggers:** `event_calendar` `new_calendar` `event_ended` `event_started` `new_event` `updated_event` `new_event_matching_search`
**Actions:** `google-calendar-add-attendees` `create_google_calendar` `create_quick_event` `create_google_calendar_event` `create_detailed_google_calendar_event` `retrieve_event_by_id` `find_event` `find_multiple_events` `find_or_create_event` `google_calendar_get_events` `update_event` `delete_event` `custom_api_call`
`event_calendar` props:
  calendar_id★(DROPDOWN)
  expandRecurringEvent★(CHECKBOX)=false //If true, the trigger will activate for every occurrence of a
`event_ended` props:
  calendarId★(SHORT_TEXT)='primary' //The ID of the calendar to watch for ended events. Use "prima
`event_started` props:
  calendarId★(SHORT_TEXT)='primary' //The calendar to watch for events. Use "primary" for your mai
  timeBefore★(NUMBER)=15 //How much time before the event starts to trigger.
  timeUnit★(STATIC_DROPDOWN)='minutes' ["Minutes"|"Hours"|"Days"] //The unit of time for the "Time Before" setting.
  searchTerm(SHORT_TEXT) //Optional search term to filter events by title or descriptio
`new_event` props:
  calendarId★(SHORT_TEXT)='primary' //The calendar to watch for new events. Use "primary" for your
  timeBefore★(NUMBER)=15 //How much time before the event starts to trigger.
  timeUnit★(STATIC_DROPDOWN)='minutes' ["Minutes"|"Hours"|"Days"] //The unit of time for the "Time Before" setting.
  searchTerm(SHORT_TEXT) //Optional search term to filter events by title or descriptio
`updated_event` props:
  calendarId(SHORT_TEXT) //Leave blank for primary calendar, or specify another calenda
`new_event_matching_search` props:
  calendarId★(SHORT_TEXT)='primary' //The ID of the calendar to watch (usually "primary" for main 
  search★(SHORT_TEXT) //Text to search for in event summary or description.
`google-calendar-add-attendees` props:
  calendar_id★(DROPDOWN)
  event_id★(DROPDOWN)
  attendees★(ARRAY) //Emails of the attendees (guests)
`create_google_calendar` props:
  title★(SHORT_TEXT) //The name/title of the calendar
  description(LONG_TEXT) //Description of the calendar
  location(SHORT_TEXT) //Geographic location of the calendar (e.g., "San Francisco, C
  timezone(SHORT_TEXT)='Asia/Kolkata' //Timezone for the calendar (e.g., "America/New_York", "Europe
  colorId(DROPDOWN)
  default_reminders_enabled(CHECKBOX)=true //Whether to set default reminders for events in this calendar
  default_reminder_popup_minutes(NUMBER)=10 //Default minutes before event to show popup reminder
  default_reminder_email_minutes(NUMBER)=1440 //Default minutes before event to send email reminder
  notification_email_enabled(CHECKBOX)=true //Whether to send email notifications for calendar events
  notification_popup_enabled(CHECKBOX)=true //Whether to show popup notifications for calendar events
  conference_properties_enabled(CHECKBOX)=true //Whether to allow conference creation in events
  conference_google_meet(CHECKBOX)=true //Whether to allow Google Meet conferences
  conference_addon(CHECKBOX)=false //Whether to allow add-on conference solutions
  selected(CHECKBOX)=true //Whether this calendar should be selected by default in the U
  hidden(CHECKBOX)=false //Whether this calendar should be hidden from the UI
  access_role(STATIC_DROPDOWN)='owner' ["Owner"|"Writer"|"Reader"|"Free Busy Reader"] //Default access role for the calendar
`create_quick_event` props:
  calendar_id★(DROPDOWN)
  text★(LONG_TEXT) //The text describing the event to be created
  send_updates(STATIC_DROPDOWN) ["All"|"External Only"|"none"] //Guests who should receive notifications about the creation o
`create_google_calendar_event` props:
  calendar_id★(DROPDOWN)
  title★(SHORT_TEXT)
  start_date_time★(DATE_TIME)
  end_date_time(DATE_TIME) //By default it'll be 30 min post start time
  location(SHORT_TEXT)
  description(LONG_TEXT) //Description of the event. You can use HTML tags here.
  colorId(DROPDOWN)
  attendees(ARRAY) //Emails of the attendees (guests)
  guests_can_modify(CHECKBOX)=false
  guests_can_invite_others(CHECKBOX)=false
  guests_can_see_other_guests(CHECKBOX)=false
  timezone(SHORT_TEXT)='Asia/Kolkata' //Timezone for the event (e.g., "America/New_York", "Europe/Lo
  send_notifications★(STATIC_DROPDOWN)='all' ["Yes, to everyone"|"To non-Google Calendar guests only"|"To no one"]
`create_detailed_google_calendar_event` props:
  calendar_id★(DROPDOWN)
  title★(SHORT_TEXT) //The title/summary of the event
  description(LONG_TEXT) //Description of the event. You can use HTML tags here.
  location(SHORT_TEXT) //Location of the event
  start_date_time★(DATE_TIME) //When the event starts
  end_date_time(DATE_TIME) //When the event ends. If not specified, will be 30 minutes af
  timezone(SHORT_TEXT)='Asia/Kolkata' //Timezone for the event (e.g., "America/New_York", "Europe/Lo
  all_day(CHECKBOX)=false //Whether this is an all-day event
  colorId(DROPDOWN)
  attendees(ARRAY) //Email addresses of attendees
  attendees_optional(ARRAY) //Email addresses of optional attendees
  guests_can_modify(CHECKBOX)=false //Whether guests can modify the event
  guests_can_invite_others(CHECKBOX)=false //Whether guests can invite other people
  guests_can_see_other_guests(CHECKBOX)=true //Whether guests can see other guests
  anyone_can_add_self(CHECKBOX)=false //Whether anyone can add themselves to the event
  send_notifications★(STATIC_DROPDOWN)='all' ["Yes, to everyone"|"To non-Google Calendar guests only"|"To no one"] //Who should receive notifications about this event
  visibility(STATIC_DROPDOWN)='default' ["Default"|"Public"|"Private"] //Who can see this event
  transparency(STATIC_DROPDOWN)='opaque' ["Busy (blocks time)"|"Free (doesn't block time)"] //Whether the event blocks time on the calendar
  recurrence_enabled(CHECKBOX)=false //Whether this event should repeat
  recurrence_frequency(STATIC_DROPDOWN)='DAILY' ["Daily"|"Weekly"|"Monthly"|"Yearly"] //How often the event should repeat
  recurrence_interval(NUMBER)=1 //Interval between recurrences (e.g., every 2 weeks)
  recurrence_count(NUMBER) //How many times the event should repeat (leave empty for no e
  recurrence_until(DATE_TIME) //Date until which the event should repeat (leave empty for no
  recurrence_by_day(ARRAY) //Days of the week for weekly recurrence (e.g., ["MO", "WE", "
  reminders_use_default(CHECKBOX)=true //Whether to use the calendar's default reminders
  reminder_popup_minutes(NUMBER)=10 //Minutes before event to show popup reminder
  reminder_email_minutes(NUMBER)=1440 //Minutes before event to send email reminder
  conference_enabled(CHECKBOX)=false //Whether to add video conference to the event
  conference_type(STATIC_DROPDOWN)='hangoutsMeet' ["Google Meet"|"Add Conferencing"] //Type of video conference to create
  extended_properties_private(JSON) //Private custom properties for the event (JSON object)
  extended_properties_shared(JSON) //Shared custom properties for the event (JSON object)
  source_url(SHORT_TEXT) //URL of the source of this event
  source_title(SHORT_TEXT) //Title of the source of this event
`retrieve_event_by_id` props:
  calendar_id★(DROPDOWN)
  event_id★(SHORT_TEXT) //The unique identifier of the event to retrieve
  timezone(SHORT_TEXT) //Timezone for the event (e.g., "America/New_York", "Europe/Lo
  always_include_email(CHECKBOX)=false //Whether to always include a value in the email field for the
  max_attendees(NUMBER)=100 //Maximum number of attendees to include in the response. If t
  single_events(CHECKBOX)=false //Whether to expand recurring events into instances and only r
  show_deleted(CHECKBOX)=false //Whether to include deleted events in the result
  show_hidden_invitations(CHECKBOX)=false //Whether to include hidden invitations in the result
`find_event` props:
  calendar_id★(DROPDOWN)
  search_text(SHORT_TEXT) //Search for events containing this text in title, description
  start_date(DATE_TIME) //Find events starting from this date/time
  end_date(DATE_TIME) //Find events ending before this date/time
  event_types(STATIC_MULTI_SELECT_DROPDOWN) ["Default"|"Out Of Office"|"Focus Time"|"Working Location"] //Filter by event types
  attendee_email(SHORT_TEXT) //Find events where this person is an attendee
  organizer_email(SHORT_TEXT) //Find events organized by this person
  location_contains(SHORT_TEXT) //Find events with location containing this text
  event_status(STATIC_DROPDOWN) ["Any Status"|"Confirmed"|"Tentative"|"Cancelled"] //Filter by event status
  single_events(CHECKBOX)=false //Whether to expand recurring events into instances
  show_deleted(CHECKBOX)=false //Whether to include deleted events in results
  show_hidden_invitations(CHECKBOX)=false //Whether to include hidden invitations
  timezone(SHORT_TEXT)='Asia/Kolkata' //Timezone for date/time formatting (e.g., "America/New_York")
  max_results(NUMBER)=100 //Maximum number of events to return (1-2500)
  order_by(STATIC_DROPDOWN)='startTime' ["Start Time"|"Updated Time"] //How to order the results. Note: "Start Time" and "Updated Ti
  page_token(SHORT_TEXT) //Token for pagination (for getting next page of results)
`find_multiple_events` props:
  calendar_ids(ARRAY) //List of calendar IDs to search in (leave empty to search all
  search_criteria(JSON) //JSON object with search criteria (e.g., {"search_text": "Mee
  search_scenarios(ARRAY) //Array of different search scenarios to execute. Each scenari
  date_range_type(STATIC_DROPDOWN)='custom' //Type of date range to use for search
  event_type_filters(STATIC_MULTI_SELECT_DROPDOWN) ["All Types"|"Default"|"Out Of Office"|"Focus Time"|"Working Location"] //Filter events by type
  status_filters(STATIC_MULTI_SELECT_DROPDOWN) ["All Statuses"|"Confirmed"|"Tentative"|"Cancelled"] //Filter events by status
  attendee_emails(ARRAY) //Array of attendee emails to search for
  organizer_emails(ARRAY) //Array of organizer emails to search for
  location_keywords(ARRAY) //Array of location keywords to search for
  expand_recurring(CHECKBOX)=false //Whether to expand recurring events into instances
  include_deleted(CHECKBOX)=false //Whether to include deleted events in results
  include_hidden(CHECKBOX)=false //Whether to include hidden invitations
  max_results_per_search(NUMBER)=100 //Maximum number of events to return per search (1-2500)
  timezone(SHORT_TEXT)='Asia/Kolkata' //Timezone for date/time formatting (e.g., "America/New_York")
  group_by_calendar(CHECKBOX)=true //Whether to group results by calendar
  include_summary(CHECKBOX)=true //Whether to include summary statistics in results
`find_or_create_event` props:
  calendar_id(SHORT_TEXT)='primary' //Calendar ID where to search/create the event (default: prima
  search_criteria★(JSON) //JSON object with criteria to search for existing events. E.g
  search_time_window(NUMBER)=30 //Time window in minutes to search around the event start time
  exact_match_required(CHECKBOX)=false //Whether to require exact matches for all search criteria (if
  title★(SHORT_TEXT) //Title/summary of the event to create (if not found)
  event_description(LONG_TEXT) //Description of the event to create (if not found)
  event_location(SHORT_TEXT) //Location of the event to create (if not found)
  start_date_time★(DATE_TIME) //Start date and time of the event to create (if not found)
  end_date_time★(DATE_TIME) //End date and time of the event to create (if not found)
  timezone(SHORT_TEXT)='Asia/Kolkata' //Timezone for the event (e.g., "America/New_York")
  attendee_emails(ARRAY) //Array of attendee email addresses
  optional_attendee_emails(ARRAY) //Array of optional attendee email addresses
  event_visibility(STATIC_DROPDOWN)='default' ["Default"|"Public"|"Private"] //Visibility of the event
  event_transparency(STATIC_DROPDOWN)='opaque' ["Busy (Opaque)"|"Free (Transparent)"] //Whether the event blocks time on the calendar
  guests_can_modify(CHECKBOX)=false //Whether guests can modify the event
  guests_can_invite_others(CHECKBOX)=true //Whether guests can invite other people
  guests_can_see_other_guests(CHECKBOX)=true //Whether guests can see other guests
  anyone_can_add_self(CHECKBOX)=false //Whether anyone can add themselves to the event
  add_conference(CHECKBOX)=false //Whether to add a conference (Google Meet) to the event
  conference_type(STATIC_DROPDOWN)='hangoutsMeet' ["Google Meet"|"Add-on Conference"] //Type of conference to add
  use_default_reminders(CHECKBOX)=true //Whether to use default calendar reminders
  custom_reminders(JSON) //JSON array of custom reminders. Each reminder should have "m
  private_properties(JSON) //JSON object with private extended properties (key-value pair
  shared_properties(JSON) //JSON object with shared extended properties (key-value pairs
  source_title(SHORT_TEXT) //Title of the source that created this event
  source_url(SHORT_TEXT) //URL of the source that created this event
  update_existing(CHECKBOX)=false //Whether to update existing event if found (instead of just r
  return_detailed_info(CHECKBOX)=true //Whether to return detailed information about the action take
`google_calendar_get_events` props:
  calendar_id★(DROPDOWN)
  event_types★(STATIC_MULTI_SELECT_DROPDOWN) ["Default"|"Out Of Office"|"Focus Time"|"Working Location"] //Select event types
  search(SHORT_TEXT)
  start_date(DATE_TIME)
  end_date(DATE_TIME)
  singleEvents★(CHECKBOX)=false //Whether to expand recurring events into instances and only r
`update_event` props:
  calendar_id★(DROPDOWN)
  event_id★(DROPDOWN)
  title(SHORT_TEXT) //The title of the event
  start_date_time(DATE_TIME) //The start date and time of the event
  end_date_time(DATE_TIME) //The end date and time of the event
  timezone(SHORT_TEXT)='Asia/Kolkata' //The timezone of the event
  location(SHORT_TEXT)
  description(LONG_TEXT) //Description of the event. You can use HTML tags here.
  colorId(DROPDOWN)
  attendees(ARRAY) //Emails of the attendees (guests)
  guests_can_modify(CHECKBOX)=false
  guests_can_invite_others(CHECKBOX)=false
  guests_can_see_other_guests(CHECKBOX)=false
`delete_event` props:
  calendar_id★(DROPDOWN)
  event_id★(DROPDOWN)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### google-contacts  v2.0.0 | OAuth2
*Stay connected and organized*
**Triggers:** `new_contact_only` `new_group` `new_or_updated_contact`
**Actions:** `create_contact` `update_contact` `search_contact` `add_contact_to_group` `remove_contact_from_group` `create_group` `upload_contact_photo` `custom_api_call`
`create_contact` props:
  firstName★(SHORT_TEXT) //The first name of the contact
  middleName(SHORT_TEXT) //The middle name of the contact
  lastName★(SHORT_TEXT) //The last name of the contact
  jobTitle(SHORT_TEXT) //The job title of the contact
  company(SHORT_TEXT) //The company of the contact
  email(SHORT_TEXT) //The email address of the contact
  phoneNumber(SHORT_TEXT) //The phone number of the contact
`update_contact` props:
  resourceName★(SHORT_TEXT) //The resource name for the person, assigned by the server. An
  etag★(SHORT_TEXT) //The `etag` ensures contact updates only apply if the contact
  updatePersonFields★(STATIC_MULTI_SELECT_DROPDOWN) ["Names"|"Email"|"Phone Number"|"Job Title / Company"] //A field mask to restrict which fields on the person are upda
  firstName(SHORT_TEXT) //The first name of the contact
  middleName(SHORT_TEXT) //The middle name of the contact
  lastName(SHORT_TEXT) //The last name of the contact
  jobTitle(SHORT_TEXT) //The job title of the contact
  company(SHORT_TEXT) //The company of the contact
  email(SHORT_TEXT) //The email address of the contact
  phoneNumber(SHORT_TEXT) //The phone number of the contact
`search_contact` props:
  query★(SHORT_TEXT) //The plain-text query for the request.The query is used to ma
  readMask★(STATIC_MULTI_SELECT_DROPDOWN) //A field mask to restrict which fields on each person are ret
  pageSize(NUMBER) //The number of results to return. Maximum 30.
`add_contact_to_group` props:
  contactResourceName★(SHORT_TEXT) //The resource name of the contact (e.g., people/c123456789)
  groupResourceName★(SHORT_TEXT) //The resource name of the group (e.g., contactGroups/g1234567
`remove_contact_from_group` props:
  contactResourceName★(SHORT_TEXT) //The resource name of the contact (e.g., people/c123456789)
  groupResourceName★(SHORT_TEXT) //The resource name of the group (e.g., contactGroups/g1234567
`create_group` props:
  groupName★(SHORT_TEXT) //The name of the contact group to create
  description(LONG_TEXT) //Optional description for the contact group
`upload_contact_photo` props:
  contactResourceName★(SHORT_TEXT) //The resource name of the contact (e.g., people/c123456789)
  photoUrl(SHORT_TEXT) //URL of the photo to upload (must be a complete HTTP/HTTPS UR
  photoFile(FILE) //Photo file to upload (preferred method for reliability)
  photoDataUrl(SHORT_TEXT) //Base64 encoded photo data URL (e.g., data:image/jpeg;base64,
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### google-forms  v2.0.1 | OAuth2
*Receive form responses from Google Forms*
**Triggers:** `new_response` `new_or_updated_response`
**Actions:** `list_forms` `get_form` `get_form_responses` `get_form_response` `custom_api_call`
`new_response` props:
  form_id★(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if forms from Team Drives should be included in t
`new_or_updated_response` props:
  form_id★(DROPDOWN)
  include_team_drives(CHECKBOX)=false //Determines if forms from Team Drives should be included in t
  trigger_question(DROPDOWN) //Only trigger when a specific question has a certain answer. 
  include_response_content(CHECKBOX)=false //Include the full response content in the output. This will i
`list_forms` props:
  include_team_drives(CHECKBOX)=false //Include forms from shared Team Drives in the results.
  search_query(SHORT_TEXT) //Filter forms by name. Leave empty to list all forms.
  max_results(NUMBER)=20 //Maximum number of forms to return. Defaults to 20.
`get_form` props:
  include_team_drives(CHECKBOX)=false //Determines if forms from Team Drives should be included in t
  form_id★(DROPDOWN)
`get_form_responses` props:
  include_team_drives(CHECKBOX)=false //Determines if forms from Team Drives should be included in t
  form_id★(DROPDOWN)
  after_date(SHORT_TEXT) //Only return responses submitted after this date/time. Use IS
  max_results(NUMBER)=50 //Maximum number of responses to return. Defaults to 50.
`get_form_response` props:
  include_team_drives(CHECKBOX)=false //Determines if forms from Team Drives should be included in t
  form_id★(DROPDOWN)
  response_id★(SHORT_TEXT) //The unique ID of the response to retrieve. This is returned 
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### google-slides  v2.0.4 | OAuth2
*Create and manage Google Slides presentations. Search and find presentations, generate presentations*
**Actions:** `search_presentations` `get_presentation` `create_presentation` `generate_from_template` `add_slide` `update_text_in_presentation` `refresh_sheets_charts` `custom_api_call`
`search_presentations` props:
  query(SHORT_TEXT) //Search by presentation name or keyword. Partial matches are 
  limit(NUMBER)=10 //Maximum number of presentations to return (default: 10).
`get_presentation` props:
  presentation_id(SHORT_TEXT) //The unique ID of the presentation (found in the URL: docs.go
  presentation_name(SHORT_TEXT) //Search for the presentation by name or partial name (e.g., "
`create_presentation` props:
  title(SHORT_TEXT)='Untitled Presentation' //Title for the new presentation (e.g., "Q4 Sales Report 2024"
`generate_from_template` props:
  template_presentation_id(SHORT_TEXT) //The unique ID of the template (from URL: docs.google.com/pre
  template_name(SHORT_TEXT) //Search for the template presentation by name (e.g., "Sales T
  new_title(SHORT_TEXT) //The title for the newly created presentation (e.g., "Q4 Sale
  placeholder_format★(STATIC_DROPDOWN)='{{}}' ["Curly Braces {{}}"|"Square Brackets [[]]"] //The format of placeholders used in the template. Use {{}} fo
  replacements(LONG_TEXT) //A JSON object mapping placeholder names to their replacement
  table_data(DYNAMIC)
`add_slide` props:
  presentation_id(SHORT_TEXT) //The unique ID of the presentation (from URL: docs.google.com
  presentation_name(SHORT_TEXT) //Search for the presentation by name. Used when Presentation 
  layout(STATIC_DROPDOWN)='BLANK' //The layout template for the new slide (default: Blank).
  insertion_index(NUMBER) //Position to insert the slide (0-based index). Leave empty to
  slide_title(SHORT_TEXT) //Optional title text to set on the slide (only works with lay
  slide_body(LONG_TEXT) //Optional body text to set on the slide (only works with layo
`update_text_in_presentation` props:
  presentation_id(SHORT_TEXT) //The unique ID of the presentation (from URL: docs.google.com
  presentation_name(SHORT_TEXT) //Name of the presentation to search for. Used when Presentati
  find_text★(SHORT_TEXT) //The exact text string to find and replace. Examples: "{{comp
  replace_text★(SHORT_TEXT) //The new text to put in place of the found text. Examples: "A
  match_case(CHECKBOX)=false //When enabled, only replaces exact case matches. Default: fal
`refresh_sheets_charts` props:
  presentation_id(SHORT_TEXT) //The unique ID of the presentation (found in the URL: docs.go
  presentation_name(SHORT_TEXT) //Search for the presentation by name or partial name. Used wh
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### google-meet  v2.0.1 | OAuth2
*Schedule and manage Google Meet video meetings*
**Actions:** `schedule_google_meet_meeting` `custom_api_call`
`schedule_google_meet_meeting` props:
  calendar_id★(DROPDOWN)
  title★(SHORT_TEXT) //The title/summary of the meeting
  description(LONG_TEXT) //Description of the meeting. You can use HTML tags here.
  start_date★(SHORT_TEXT) //Start date of the meeting. Accepts: MM/DD/YYYY (e.g. 03/03/2
  start_time(SHORT_TEXT) //Start time of the meeting (e.g. "2:00 PM", "14:00"). Leave e
  end_date(SHORT_TEXT) //End date of the meeting. Accepts: MM/DD/YYYY, YYYY-MM-DD, or
  end_time(SHORT_TEXT) //End time of the meeting (e.g. "3:00 PM", "15:00"). If empty,
  timezone(SHORT_TEXT)='UTC' //Timezone for the meeting (e.g., "America/New_York", "Europe/
  attendees(ARRAY) //Email addresses of meeting attendees
  send_notifications★(STATIC_DROPDOWN)='all' ["Yes, to everyone"|"To non-Google Calendar guests only"|"To no one"] //Who should receive notifications about this meeting
  guests_can_modify(CHECKBOX)=false //Whether guests can modify the event
  guests_can_invite_others(CHECKBOX)=false //Whether guests can invite other people
  guests_can_see_other_guests(CHECKBOX)=true //Whether guests can see other guests
  reminders_use_default(CHECKBOX)=true //Whether to use the calendar's default reminders
  reminder_minutes(NUMBER)=10 //Minutes before meeting to show popup reminder (only when def
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### google-tasks  v2.0.0 | OAuth2
*Task list management application*
**Triggers:** `new_task`
**Actions:** `add_task` `custom_api_call`
`new_task` props:
  tasks_list★(DROPDOWN)
`add_task` props:
  tasks_list★(DROPDOWN)
  title★(SHORT_TEXT)
  notes(LONG_TEXT)
  due(DATE_TIME) //Due date of the task (YYYY-MM-DD)
  completed(CHECKBOX) //Mark task as completed
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### google-my-business  v2.0.0 | OAuth2
*Manage your business on Google*
**Triggers:** `new_review`
**Actions:** `create-reply` `custom_api_call`
`new_review` props:
  account★(DROPDOWN)
  location★(DROPDOWN)
`create-reply` props:
  reviewName★(SHORT_TEXT) //You can find the review name from new review trigger
  comment★(LONG_TEXT) //Comment to be added to the review
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### google-search-console  v2.0.1 | OAuth2
*Monitor and optimize your website's presence in Google Search results. Analyze search analytics, man*
**Actions:** `search_analytics` `list_sitemaps` `submit_sitemap` `list_sites` `add_site` `delete_site` `urlInspection` `custom_api_call`
`search_analytics` props:
  siteUrl★(DROPDOWN)
  startDate★(DATE_TIME)='2026-03-03' //The start date of the date range to query (in YYYY-MM-DD for
  endDate★(DATE_TIME)='2026-03-03' //The end date of the date range to query (in YYYY-MM-DD forma
  dimensions(ARRAY) //The dimensions to group results by. For example: ["query", "
  filters(ARRAY) //Optional filters to apply to the data. Filters can be used t
  aggregationType(SHORT_TEXT) //How data is aggregated. Options include "auto", "byPage", "b
  rowLimit(NUMBER) //The maximum number of rows to return.
  startRow(NUMBER) //The first row to return. Use this parameter to paginate resu
`list_sitemaps` props:
  siteUrl★(DROPDOWN)
`submit_sitemap` props:
  siteUrl★(DROPDOWN)
  feedpath★(SHORT_TEXT)
`add_site` props:
  siteUrl★(SHORT_TEXT)
`delete_site` props:
  siteUrl★(DROPDOWN)
`urlInspection` props:
  siteUrl★(DROPDOWN)
  url★(SHORT_TEXT)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### googlechat  v2.0.0 | OAuth2
*Google Chat is a messaging app that allows you to send and receive messages, create spaces, and more*
**Triggers:** `newMessage` `newMention`
**Actions:** `sendAMessage` `getDirectMessageDetails` `addASpaceMember` `getMessageDetails` `searchMessages` `findMember`
`newMessage` props:
  projectId★(DROPDOWN) //Select a Google Cloud Project
  spaceId(DROPDOWN) //Select a Space, leave empty for all spaces
`newMention` props:
  projectId★(DROPDOWN) //Select a Google Cloud Project
  spaceId(DROPDOWN) //Select a Space, leave empty for all spaces
  spaceMemberId(DROPDOWN) //Select a space member, leave empty for all members
`sendAMessage` props:
  spaceId★(DROPDOWN) //Select a Space
  text★(LONG_TEXT) //The message content to send. Supports basic formatting like 
  thread(DROPDOWN) //Select a thread to reply to, leave empty for new thread
  messageReplyOption(STATIC_DROPDOWN) ["Reply or start new thread"|"Reply only (fail if thread not found)"] //How to handle replies when thread ID is provided.
  customMessageId(SHORT_TEXT) //Optional unique ID for this message (auto-generated if empty
  isPrivate(CHECKBOX) //Send this message privately to a specific user. Requires app
  privateMessageViewer(DROPDOWN) //Select the user who can view this private message.
`getDirectMessageDetails` props:
  directMessageId★(DROPDOWN) //Select a Direct Message
`addASpaceMember` props:
  spaceId★(DROPDOWN) //Select a Space
  personId★(DROPDOWN) //Select a person
`getMessageDetails` props:
  name★(SHORT_TEXT) //The full resource name of the message. Format: spaces/{space
`searchMessages` props:
  spaceId★(DROPDOWN) //Select a Space
  keyword★(SHORT_TEXT) //Search for messages containing this text
  limit(NUMBER)=50 //Maximum number of messages to return
`findMember` props:
  spaceId★(DROPDOWN) //Select a Space
  email★(SHORT_TEXT) //The email address of the member to find


## ★ MICROSOFT 365

### microsoft-teams  v2.0.0 | OAuth2
*Communicate and collaborate with your team using Microsoft Teams. Send messages to channels and chat*
**Triggers:** `new-channel-message` `new-channel` `new-chat` `new-chat-message`
**Actions:** `microsoft_teams_create_channel` `microsoft_teams_send_channel_message` `microsoft_teams_send_chat_message` `microsoft_teams_reply_to_channel_message` `microsoft_teams_create_chat_and_send_message` `microsoft_teams_create_private_channel` `microsoft_teams_get_chat_message` `microsoft_teams_get_channel_message` `microsoft_teams_find_channel` `microsoft_teams_find_team_member` `custom_api_call`
`new-channel-message` props:
  teamId★(DROPDOWN)
  channelId★(DROPDOWN)
`new-channel` props:
  teamId★(DROPDOWN)
`new-chat-message` props:
  chatId★(DROPDOWN)
`microsoft_teams_create_channel` props:
  teamId★(DROPDOWN)
  channelDisplayName★(SHORT_TEXT)
  channelDescription(LONG_TEXT)
`microsoft_teams_send_channel_message` props:
  teamId★(DROPDOWN)
  channelId★(DROPDOWN)
  contentType★(STATIC_DROPDOWN)='text' ["Text"|"HTML"]
  content★(LONG_TEXT)
`microsoft_teams_send_chat_message` props:
  chatId★(DROPDOWN)
  contentType★(STATIC_DROPDOWN)='text' ["Text"|"HTML"]
  content★(LONG_TEXT)
`microsoft_teams_reply_to_channel_message` props:
  teamId★(DROPDOWN)
  channelId★(DROPDOWN)
  messageId★(SHORT_TEXT) //ID of the parent message to reply to.
  contentType★(STATIC_DROPDOWN)='text' ["Text"|"HTML"]
  content★(LONG_TEXT)
`microsoft_teams_create_chat_and_send_message` props:
  teamId★(DROPDOWN)
  members★(MULTI_SELECT_DROPDOWN)
  contentType★(STATIC_DROPDOWN)='text' ["Text"|"HTML"]
  content★(LONG_TEXT)
`microsoft_teams_create_private_channel` props:
  teamId★(DROPDOWN)
  channelDisplayName★(SHORT_TEXT)
  channelDescription(LONG_TEXT)
`microsoft_teams_get_chat_message` props:
  chatId★(DROPDOWN)
  messageId★(SHORT_TEXT) //The ID of the message to retrieve.
`microsoft_teams_get_channel_message` props:
  teamId★(DROPDOWN)
  channelId★(DROPDOWN)
  messageId★(SHORT_TEXT) //The ID of the channel message to retrieve.
  replyId(SHORT_TEXT) //Provide to fetch a specific reply under the message.
`microsoft_teams_find_channel` props:
  teamId★(DROPDOWN)
  channelName★(SHORT_TEXT)
`microsoft_teams_find_team_member` props:
  teamId★(DROPDOWN)
  searchBy★(STATIC_DROPDOWN)='email' ["Email"|"Name"]
  searchValue★(SHORT_TEXT) //Email address or name to search for.
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### microsoft-outlook  v2.0.2 | OAuth2
*Manage your emails and attachments with Microsoft Outlook. Send emails, reply to messages, manage fo*
**Triggers:** `newEmail` `newEmailInFolder` `newAttachment` `newEmailMatchingSearch` `newEmailInSharedMailbox` `newFlaggedEmail`
**Actions:** `send-email` `downloadAttachment` `reply-email` `createDraftEmail` `addLabelToEmail` `removeLabelFromEmail` `moveEmailToFolder` `sendDraftEmail` `forwardEmail` `findEmail` `delete_email` `copy_email` `flag_email` `mark_email_read_unread` `set_email_importance` `create_folder` `custom_api_call`
`newEmailInFolder` props:
  folderId★(DROPDOWN)
`newAttachment` props:
  folderId(DROPDOWN) //Monitor attachments in a specific folder. Leave empty to mon
`newEmailMatchingSearch` props:
  searchQuery★(SHORT_TEXT) //Search text to match in subject, body, or sender (same synta
`newEmailInSharedMailbox` props:
  mailboxUserPrincipalName★(SHORT_TEXT) //User principal name (email address) of the shared mailbox (f
`send-email` props:
  recipients★(ARRAY)
  ccRecipients(ARRAY)
  bccRecipients(ARRAY)
  subject★(SHORT_TEXT)
  bodyFormat★(STATIC_DROPDOWN)='text' ["HTML"|"Text"]
  body★(LONG_TEXT)
  attachments(ARRAY)
`downloadAttachment` props:
  messageId★(SHORT_TEXT) //The ID of the email message containing the attachment.
`reply-email` props:
  messageId★(DROPDOWN) //Select the email message to reply to.
  bodyFormat★(STATIC_DROPDOWN)='text' ["HTML"|"Text"]
  replyBody★(LONG_TEXT)
  ccRecipients(ARRAY)
  bccRecipients(ARRAY)
  attachments(ARRAY)
  draft★(CHECKBOX)=false //If enabled, creates draft without sending.
`createDraftEmail` props:
  recipients★(ARRAY)
  ccRecipients(ARRAY)
  bccRecipients(ARRAY)
  subject★(SHORT_TEXT)
  bodyFormat★(STATIC_DROPDOWN)='text' ["HTML"|"Text"]
  body★(LONG_TEXT)
  attachments(ARRAY)
`addLabelToEmail` props:
  messageId★(DROPDOWN) //Select the email message to add the label to.
  categories★(ARRAY) //Categories to add to the email.
`removeLabelFromEmail` props:
  messageId★(DROPDOWN) //Select the email message to remove the label from.
  categories★(ARRAY) //Categories to remove from the email.
`moveEmailToFolder` props:
  messageId★(DROPDOWN) //Select the email message to move.
  destinationFolderId★(DROPDOWN) //The folder to move the email to.
`sendDraftEmail` props:
  messageId★(DROPDOWN) //Select the draft email message to send.
`forwardEmail` props:
  messageId★(DROPDOWN) //Select the email message to forward.
  recipients★(ARRAY)
  comment(LONG_TEXT) //Optional comment to include with the forwarded message.
`findEmail` props:
  searchQuery★(SHORT_TEXT) //Search terms to find emails (e.g., "from:john@example.com", 
  folderId(DROPDOWN) //Search in a specific folder. Leave empty to search all folde
  top(NUMBER)=25 //Maximum number of results to return (1-1000).
`delete_email` props:
  messageId★(DROPDOWN) //Select the email message to delete.
`copy_email` props:
  messageId★(DROPDOWN) //Select the email message to copy.
  destinationFolderId★(DROPDOWN) //Folder where the copied email will be placed.
`flag_email` props:
  messageId★(DROPDOWN) //Select the email message to flag or unflag.
  flagStatus★(STATIC_DROPDOWN)='flagged' ["Flagged"|"Completed"|"Not Flagged"] //Choose whether to flag, complete, or clear the flag.
`mark_email_read_unread` props:
  messageId★(DROPDOWN) //Select the email message to update.
  isRead★(STATIC_DROPDOWN)='true' ["Read"|"Unread"]
`set_email_importance` props:
  messageId★(DROPDOWN) //Select the email message to update.
  importance★(STATIC_DROPDOWN)='normal' ["Low"|"Normal"|"High"]
`create_folder` props:
  displayName★(SHORT_TEXT)
  parentFolderId(SHORT_TEXT) //Optional. ID of the parent folder. Leave empty to create in 
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### microsoft-outlook-calendar  v2.0.2 | OAuth2
*Calendar software by Microsoft*
**Triggers:** `outlook_new_calendar_event` `outlook_updated_calendar_event`
**Actions:** `create_event` `delete_event` `list_events` `custom_api_call`
`create_event` props:
  calendarId★(DROPDOWN)
  title★(SHORT_TEXT)
  start★(DATE_TIME)
  end(DATE_TIME) //By default it'll be 30 min post start time
  timezone★(DROPDOWN)
  location(SHORT_TEXT)
`delete_event` props:
  calendarId★(DROPDOWN)
  eventId★(SHORT_TEXT)
`list_events` props:
  calendarId★(DROPDOWN)
  filter(LONG_TEXT) //Search query filter, see: https://learn.microsoft.com/en-us/
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### microsoft-onedrive  v2.0.2 | OAuth2
*Cloud storage by Microsoft*
**Triggers:** `new_file` `new_folder` `new_activity_trigger`
**Actions:** `create_root_folder` `create_child_folder` `create_text_file` `get_file_by_id` `find_file` `find_folder` `download_file` `list_files` `list_folders` `create_sharing_link` `new_activity` `delete_file` `delete_folder` `export_file` `move_file` `move_folder` `rename_file` `rename_folder` `remove_item_permission` `custom_api_call`
`new_file` props:
  parentFolder(DROPDOWN)
`new_folder` props:
  parentFolder(DROPDOWN)
`new_activity_trigger` props:
  itemId(SHORT_TEXT) //The ID of a specific file or folder to monitor. Leave empty 
`create_root_folder` props:
  folderName★(SHORT_TEXT) //The name of the folder to create
`create_child_folder` props:
  parentFolder(DROPDOWN)
  folderName★(SHORT_TEXT) //The name of the child folder to create
`create_text_file` props:
  fileName★(SHORT_TEXT) //The name of the file to create (e.g. notes.txt)
  content★(LONG_TEXT) //The text content of the file
  parentId(DROPDOWN)
`get_file_by_id` props:
  fileId★(SHORT_TEXT) //The ID of the file to retrieve
`find_file` props:
  fileName★(SHORT_TEXT) //The name (or part of the name) of the file to search for (e.
`find_folder` props:
  folderName★(SHORT_TEXT) //The name of the folder to search for
`download_file` props:
  fileId★(SHORT_TEXT) //The ID of the file to download
`list_files` props:
  parentFolder(DROPDOWN)
`list_folders` props:
  parentFolder(DROPDOWN)
`create_sharing_link` props:
  itemId★(SHORT_TEXT) //The ID of the file or folder to share
  type★(STATIC_DROPDOWN) ["View"|"Edit"|"Embed"] //The type of sharing link to create
  scope(STATIC_DROPDOWN) ["Anyone with the link"|"People in your organization"] //The scope of the sharing link
`new_activity` props:
  itemId(SHORT_TEXT) //The ID of the file or folder to get activities for. Leave em
`delete_file` props:
  fileId★(SHORT_TEXT) //The ID of the file to delete
`delete_folder` props:
  folderId(DROPDOWN)
`export_file` props:
  fileId★(SHORT_TEXT) //The ID of the Office file to export (Word, Excel, or PowerPo
  format★(STATIC_DROPDOWN) ["PDF"|"HTML"|"GLB (3D)"|"JPG"] //The format to export the file to
`move_file` props:
  fileId★(SHORT_TEXT) //The ID of the file to move
  destinationFolder(DROPDOWN)
`move_folder` props:
  folderId★(SHORT_TEXT) //The ID of the folder to move
  destinationFolder(DROPDOWN)
`rename_file` props:
  fileId★(SHORT_TEXT) //The ID of the file to rename
  newName★(SHORT_TEXT) //The new name for the file (e.g. report.pdf)
`rename_folder` props:
  folderId★(SHORT_TEXT) //The ID of the folder to rename
  newName★(SHORT_TEXT) //The new name for the folder
`remove_item_permission` props:
  itemId★(SHORT_TEXT) //The ID of the file or folder
  permissionId★(SHORT_TEXT) //The ID of the permission to remove
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### microsoft-excel-365  v2.0.1 | OAuth2
*Spreadsheet software by Microsoft*
**Triggers:** `new_row` `new_row_in_table` `new_worksheet` `updated_row`
**Actions:** `append_row` `get_worksheets` `get_worksheet_rows` `update_row` `update_table_row` `clear_worksheet` `delete_worksheet` `get_workbooks` `delete_workbook` `add_worksheet` `get_table_rows` `get_table_columns` `create_table` `delete_table` `lookup_table_column` `append_table_rows` `convert_to_range` `createWorkbook` `clear_column` `clear_range` `clear_row` `create_worksheet` `find_row` `get_range` `getRowById` `get_row_item_at` `get_worksheet` `rename_worksheet` `count_if_column` `search_files` `search_shared_files` `custom_api_call`
`new_row` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  max_rows_to_poll(NUMBER)=10 //The maximum number of rows to poll, the rest will be polled 
`new_row_in_table` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  table_id★(DROPDOWN)
  has_headers★(CHECKBOX)=true //Enable this if the first row of your table is a header row.
`new_worksheet` props:
  workbook_id★(DROPDOWN)
`updated_row` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  has_headers★(CHECKBOX)=false //Enable this if the first row of your worksheet should be tre
`append_row` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  first_row_headers★(CHECKBOX)=false //If the first row is headers
  values★(DYNAMIC) //The values to insert
`get_worksheets` props:
  workbook★(DROPDOWN)
  returnAll(CHECKBOX)=false //If checked, all worksheets will be returned
  limit(NUMBER)=10 //Limit the number of worksheets returned
`get_worksheet_rows` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  range(SHORT_TEXT) //Range of the rows to retrieve (e.g., A2:B2)
  headerRow(NUMBER) //Row number of the header
  firstDataRow(NUMBER) //Row number of the first data row
`update_row` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  row_number★(NUMBER) //The row number to update
  first_row_headers★(CHECKBOX)=false //If the first row is headers
  values★(DYNAMIC) //The values to insert
`update_table_row` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  table_id★(DROPDOWN)
  row_index★(NUMBER) //The zero-based index of the row to update (0 = first data ro
  values★(DYNAMIC) //The values to insert
`clear_worksheet` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  range(SHORT_TEXT) //The range in A1 notation (e.g., A2:B2) to clear in the works
`delete_worksheet` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
`get_workbooks` props:
  limit(NUMBER) //Limits the number of workbooks returned, returns all workboo
`delete_workbook` props:
  workbook_id★(DROPDOWN)
`add_worksheet` props:
  workbook_id★(DROPDOWN)
  worksheet_name(SHORT_TEXT)='Sheet' //The name of the new worksheet
`get_table_rows` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  table★(DROPDOWN)
  skip(NUMBER) //Number of rows to skip from the start (for pagination).
  limit(NUMBER) //Limit the number of rows retrieved.
`get_table_columns` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  table★(DROPDOWN)
  limit(NUMBER) //Limit the number of columns retrieved
`create_table` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  selectRange★(DROPDOWN) //How to select the range for the table
  range(SHORT_TEXT)='A1:B2' //The range of cells in A1 notation (e.g., A2:B2) that will be
  hasHeaders★(CHECKBOX)=true //Whether the range has column labels
`delete_table` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  table_id★(DROPDOWN)
`lookup_table_column` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  table_id★(DROPDOWN)
  lookup_column★(SHORT_TEXT) //The column name to lookup the value in
  lookup_value★(SHORT_TEXT) //The value to lookup
  return_all_matches(CHECKBOX)=false //If checked, all matching rows will be returned
`append_table_rows` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  table_id★(DROPDOWN)
  values★(DYNAMIC) //The values to insert
`convert_to_range` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  table_id★(DROPDOWN)
`createWorkbook` props:
  name★(SHORT_TEXT) //The name of the new workbook
  parentFolder★(DROPDOWN) //The parent folder to use
`clear_column` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  column_index★(NUMBER) //The 1-based index of the column to be cleared (e.g., 1 for c
  applyTo★(STATIC_DROPDOWN)='All' ["All (Contents and Formatting)"|"Contents Only"|"Formats Only"] //Specify what to clear from the column.
`clear_range` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  range★(SHORT_TEXT) //The range of cells to clear, in A1 notation (e.g., "A1:C5").
  applyTo★(STATIC_DROPDOWN)='All' ["All (Contents and Formatting)"|"Contents Only"|"Formats Only"] //Specify what to clear from the range.
`clear_row` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  row_id★(NUMBER) //The number of the row to be cleared (e.g., 5 for the 5th row
  applyTo★(STATIC_DROPDOWN)='All' ["All (Contents and Formatting)"|"Contents Only"|"Formats Only"] //Specify what to clear from the row.
`create_worksheet` props:
  workbook_id★(DROPDOWN)
  name(SHORT_TEXT) //The name for the new worksheet. If not provided, a default n
  headers(ARRAY) //Optional: A list of headers to add to the first row. A table
`find_row` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  table_id★(DROPDOWN)
  lookup_column★(DROPDOWN) //The column to search in.
  lookup_value★(SHORT_TEXT) //The value to find in the lookup column.
`get_range` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  range★(SHORT_TEXT) //The range of cells to retrieve, in A1 notation (e.g., "A1:C1
`getRowById` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  table_id★(DROPDOWN)
  row_id★(NUMBER) //The zero-based index of the row to retrieve (e.g., 0 for the
`get_row_item_at` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  table_id★(DROPDOWN)
  row_index★(NUMBER) //The zero-based index of the row (0 = first data row, 1 = sec
  column_identifier★(STATIC_DROPDOWN) ["Column Name"|"Column Index"] //Identify the column by name or by index (0-based).
  column_name(DROPDOWN) //The column name (header) to get the value from.
  column_index(NUMBER) //The zero-based index of the column (0 = first column).
`get_worksheet` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
`rename_worksheet` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  new_name★(SHORT_TEXT) //The new name for the worksheet. The name must adhere to the 
`count_if_column` props:
  workbook_id★(DROPDOWN)
  worksheet_id★(DROPDOWN)
  range★(SHORT_TEXT) //The cell range to count in, in A1 notation (e.g., "A2:A100" 
  match_value★(SHORT_TEXT) //The value to count (e.g., "Yes", "100"). Cells that equal th
  match_exact(CHECKBOX)=true //If checked, only cells that exactly equal the match value ar
`search_files` props:
  query★(SHORT_TEXT) //The text to search for (matched against filename, metadata, 
  limit(NUMBER)=50 //Maximum number of results to return (1–200).
`search_shared_files` props:
  limit(NUMBER)=50 //Maximum number of items to return (1–200).
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### microsoft-365-people  v2.0.0 | OAuth2
*Manage contacts in Microsoft 365 People*
**Triggers:** `newOrUpdatedContact`
**Actions:** `createContact` `deleteContact` `updateContact` `createContactFolder` `getContactFolder` `searchContacts` `custom_api_call`
`createContact` props:
  displayName(SHORT_TEXT)
  givenName(SHORT_TEXT)
  middleName(SHORT_TEXT)
  surname(SHORT_TEXT)
  emailAddresses(ARRAY)
  mobilePhone(SHORT_TEXT)
  assistantName(SHORT_TEXT)
  birthday(DATE_TIME)
  businessStreet(SHORT_TEXT)
  businessCity(SHORT_TEXT)
  businessState(SHORT_TEXT)
  businessPostalCode(SHORT_TEXT)
  businessCountryOrRegion(SHORT_TEXT)
  children(ARRAY)
  companyName(SHORT_TEXT)
  department(SHORT_TEXT)
  homeStreet(SHORT_TEXT)
  homeCity(SHORT_TEXT)
  homeState(SHORT_TEXT)
  homePostalCode(SHORT_TEXT)
  homeCountryOrRegion(SHORT_TEXT)
  imAddresses(ARRAY)
  initials(SHORT_TEXT)
  jobTitle(SHORT_TEXT)
  manager(SHORT_TEXT)
  nickName(SHORT_TEXT)
  officeLocation(SHORT_TEXT)
  otherStreet(SHORT_TEXT)
  otherCity(SHORT_TEXT)
  otherState(SHORT_TEXT)
  otherPostalCode(SHORT_TEXT)
  otherCountryOrRegion(SHORT_TEXT)
  parentFolder(DROPDOWN) //Select a parent folder
  personalNotes(LONG_TEXT)
  profession(SHORT_TEXT)
  spouseName(SHORT_TEXT)
  title(SHORT_TEXT)
`deleteContact` props:
  contactId★(DROPDOWN) //Select a Contact
`updateContact` props:
  contactId★(DROPDOWN) //Select a Contact
  displayName(SHORT_TEXT)
  givenName(SHORT_TEXT)
  middleName(SHORT_TEXT)
  surname(SHORT_TEXT)
  emailAddresses(ARRAY)
  mobilePhone(SHORT_TEXT)
  assistantName(SHORT_TEXT)
  birthday(DATE_TIME)
  businessStreet(SHORT_TEXT)
  businessCity(SHORT_TEXT)
  businessState(SHORT_TEXT)
  businessPostalCode(SHORT_TEXT)
  businessCountryOrRegion(SHORT_TEXT)
  children(ARRAY)
  companyName(SHORT_TEXT)
  department(SHORT_TEXT)
  homeStreet(SHORT_TEXT)
  homeCity(SHORT_TEXT)
  homeState(SHORT_TEXT)
  homePostalCode(SHORT_TEXT)
  homeCountryOrRegion(SHORT_TEXT)
  imAddresses(ARRAY)
  initials(SHORT_TEXT)
  jobTitle(SHORT_TEXT)
  manager(SHORT_TEXT)
  nickName(SHORT_TEXT)
  officeLocation(SHORT_TEXT)
  otherStreet(SHORT_TEXT)
  otherCity(SHORT_TEXT)
  otherState(SHORT_TEXT)
  otherPostalCode(SHORT_TEXT)
  otherCountryOrRegion(SHORT_TEXT)
  parentFolder(DROPDOWN) //Select a parent folder
  personalNotes(LONG_TEXT)
  profession(SHORT_TEXT)
  spouseName(SHORT_TEXT)
  title(SHORT_TEXT)
`createContactFolder` props:
  displayName★(SHORT_TEXT)
  parentFolder(DROPDOWN) //Select a parent folder
`getContactFolder` props:
  contactFolder★(DROPDOWN) //Select a contact folder
`searchContacts` props:
  searchValue★(SHORT_TEXT) //Find contacts by name, email, or other properties.
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### microsoft-onenote  v2.0.0 | OAuth2
*Microsoft OneNote is a note-taking app that allows you to create, edit, and share notes with others.*
**Triggers:** `new_note_in_section`
**Actions:** `create_notebook` `create_section` `create_note_in_section` `create_page` `create_image_note` `append_note`
`new_note_in_section` props:
  notebook_id★(DROPDOWN) //The notebook to monitor for new notes.
  section_id★(DROPDOWN) //The section to monitor for new notes.
`create_notebook` props:
  displayName★(SHORT_TEXT) //The name of the notebook. Must be unique and cannot contain 
`create_section` props:
  notebook_id★(DROPDOWN) //The notebook to create the section in.
  displayName★(SHORT_TEXT) //The name of the section. Must be unique within the notebook 
`create_note_in_section` props:
  notebook_id★(DROPDOWN) //The notebook to create the note in.
  section_id★(DROPDOWN) //The section to create the note in.
  title★(SHORT_TEXT) //The title of the note.
  content(LONG_TEXT) //The content of the note. Use basic HTML tags like <p>, <h1>,
`create_page` props:
  notebook_id★(DROPDOWN) //The notebook to create the page in.
  section_id★(DROPDOWN) //The section to create the page in.
  title★(SHORT_TEXT) //The title of the page.
  content(LONG_TEXT) //The HTML content of the page. Use basic HTML tags like <p>, 
`create_image_note` props:
  notebook_id★(DROPDOWN) //The notebook to create the image note in.
  section_id★(DROPDOWN) //The section to create the image note in.
  title★(SHORT_TEXT) //The title of the image note page.
  image_url★(SHORT_TEXT) //The public URL of the image to embed (must be publicly acces
  image_width(NUMBER)=300 //The width of the image in pixels (optional).
  image_alt_text(SHORT_TEXT)='Embedded image' //Alternative text for the image (for accessibility).
  description(LONG_TEXT) //Optional description text to include with the image.
`append_note` props:
  notebook_id★(DROPDOWN) //The notebook containing the page to append to.
  section_id★(DROPDOWN) //The section containing the page to append to.
  page_id★(DROPDOWN) //The page to append content to.
  content_type★(STATIC_DROPDOWN)='paragraph' ["Paragraph"|"List Item"|"Heading"|"Custom HTML"] //The type of content to append.
  content★(LONG_TEXT) //The content to append to the page.
  heading_level(STATIC_DROPDOWN)='h2' ["H1"|"H2"|"H3"|"H4"|"H5"|"H6"] //The heading level (only for heading content type).

### microsoft-sharepoint  v2.0.0 | OAuth2
*Collaborate and manage content with Microsoft SharePoint. Automate file uploads, folder creation, an*
**Actions:** `microsoft_sharepoint_create_folder` `microsoft_sharepoint_create_list` `microsoft_sharepoint_create_list_item` `microsoft_sharepoint_update_list_item` `microsoft_sharepoint_delete_list_item` `microsoft_sharepoint_search_list_item` `microsoft_sharepoint_upload_file` `custom_api_call`

### microsoft-power-bi  v2.0.1 | OAuth2
*Manage Microsoft Power BI resources — create and refresh datasets, push data rows, list and get work*
**Triggers:** `new_dataset_refresh`
**Actions:** `list_workspaces` `list_datasets` `list_reports` `list_dashboards` `get_dashboard_tiles` `get_report_pages` `create_dataset` `push_rows_to_dataset_table` `delete_rows_from_table` `refresh_dataset` `get_refresh_history` `clone_report` `add_dashboard_in_group` `add_dashboard_in_my_workspace` `add_rows_in_my_workspace_dataset` `get_dashboard_tile_from_my_workspace` `get_dashboard_tile_from_group` `get_dashboard` `get_datasets_from_my_workspace` `get_report_from_my_workspace` `get_report_from_group` `get_specific_dataset_from_my_workspace` `get_specific_dataset_from_group` `refresh_dataset_in_my_workspace` `delete_dataset_in_my_workspace` `delete_dataset_in_group` `get_dataset_users_from_my_workspace` `get_dataset_users_from_group` `custom_api_call`

### microsoft-todo  v2.0.1 | OAuth2
*Cloud based task management application.*
**Triggers:** `new_task_created` `new_or_updated_task` `task_completed` `new_list` `task_status_changes_to` `deleted_task`
**Actions:** `create_task` `create_task_list` `update_task` `find_task_list_by_name` `find_task_by_title` `complete_task` `get_task` `create_category` `delete_category` `list_time_zones` `custom_api_call`

### microsoft-dynamics-365-business-central  v2.0.0 | OAuth2
*All-in-one business management solution by Microsoft.*
**Triggers:** `new-or-updated-record`
**Actions:** `create-record` `delete-record` `get-record` `update-record` `search-records` `custom_api_call`

### microsoft-dynamics-crm  v2.0.0 | OAuth2
*Customer relationship management software package developed by Microsoft.*
**Actions:** `dynamics_crm_create_record` `dynamics_crm_delete_record` `dynamics_crm_get_record` `dynamics_crm_update_record` `custom_api_call`


## ★ COMMUNICATION

### slack  v2.0.3 | OAuth2
*Channel-based messaging platform*
**Triggers:** `new-message` `new-message-in-channel` `new-direct-message` `new_mention` `new-mention-in-direct-message` `new_reaction_added` `channel_created` `new_command` `new-command-in-direct-message` `new-user` `new-saved-message` `new-team-custom-emoji` `new-file` `new-message-from-query` `new-message-in-private-channel` `new-pushed-message`
**Actions:** `slack-add-reaction-to-message` `send_direct_message` `send_channel_message` `request_approval_direct_message` `request_approval_message` `request_action_direct_message` `request_action_message` `uploadFile` `get-file` `searchMessages` `slack-find-user-by-email` `slack-find-user-by-handle` `find-user-by-id` `updateMessage` `slack-create-channel` `slack-update-profile` `getChannelHistory` `slack-set-user-status` `markdownToSlackFormat` `retrieveThreadMessages` `set-channel-topic` `get-message` `invite-user-to-channel` `send-private-channel-message` `delete-message` `remove-user-from-channel` `create-private-channel` `add-reminder` `find-public-channel` `edit-message` `find-user-by-name` `find-user-by-username` `find-message` `test_private_channel_access` `custom_api_call`

### whatsapp  v2.1.1 | Custom(access_token,businessAccountId)
*Manage your WhatsApp business account*
**Actions:** `sendMessage` `sendMedia` `send-template-message` `send-template-message-variable`

### telegram-bot  v2.0.0 | API Key
*Build chatbots for Telegram*
**Triggers:** `new_telegram_message`
**Actions:** `send_text_message` `send_media` `get_chat_member` `create_invite_link` `custom_api_call`
`send_text_message` props:
  instructions(MARKDOWN) //**How to obtain Chat ID:** 1. Search for the bot "@getmyid_b
  chat_id★(SHORT_TEXT)
  message_thread_id(SHORT_TEXT) //Unique identifier for the target message thread of the forum
  format(STATIC_DROPDOWN)='MarkdownV2' ["Markdown"|"HTML"] //Choose format you want
  instructions_format(MARKDOWN) //[Link example](https://core.telegram.org/bots/api#formatting
  web_page_preview(CHECKBOX)=false //Disable link previews for links in this message
  message★(LONG_TEXT) //The message to be sent
  reply_markup(JSON) //Additional interface options. A JSON-serialized object for a
`send_media` props:
  instructions(MARKDOWN) //**How to obtain Chat ID:** 1. Search for the bot "@getmyid_b
  chat_id★(SHORT_TEXT)
  message_thread_id(SHORT_TEXT) //Unique identifier for the target message thread of the forum
  media_type(STATIC_DROPDOWN) ["Image"|"Video"|"Sticker"|"GIF"]
  media(DYNAMIC)
  format(STATIC_DROPDOWN)='MarkdownV2' ["Markdown"|"HTML"] //Choose format you want
  instructions_format(MARKDOWN) //[Link example](https://core.telegram.org/bots/api#formatting
  message★(LONG_TEXT) //The message to be sent
  reply_markup(JSON) //Additional interface options. A JSON-serialized object for a
`get_chat_member` props:
  instructions(MARKDOWN) //**How to obtain Chat ID:** 1. Search for the bot "@getmyid_b
  chat_id★(SHORT_TEXT)
  user_id★(SHORT_TEXT) //Unique identifier for the user
`create_invite_link` props:
  instructions(MARKDOWN) //**How to obtain Chat ID:** 1. Search for the bot "@getmyid_b
  chat_id★(SHORT_TEXT)
  name(SHORT_TEXT) //Name of the invite link (max 32 chars)
  expire_date(DATE_TIME) //Point in time when the link will expire
  member_limit(NUMBER) //Maximum number of users that can be members of the chat simu
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### discord  v2.0.0 | API Key
*Instant messaging and VoIP social platform*
**Triggers:** `new_message` `new_member`
**Actions:** `sendMessageWithBot` `send_message_webhook` `request_approval_message` `add_role_to_member` `remove_role_from_member` `remove_member_from_guild` `list_guild_members` `rename_channel` `create_channel` `delete_channel` `find_channel` `remove_ban_from_user` `createGuildRole` `deleteGuildRole` `ban_guild_member` `custom_api_call`
`new_message` props:
  limit(NUMBER)=50 //The number of messages to fetch
  channel★(DROPDOWN) //List of channels
`new_member` props:
  limit(NUMBER)=50 //The number of members to fetch (max 1000)
  guildId★(SHORT_TEXT) //The ID of the Discord guild (server)
`sendMessageWithBot` props:
  channel_id★(DROPDOWN) //List of channels
  message(LONG_TEXT) //Message content to send.
  files(ARRAY)
`send_message_webhook` props:
  webhook_url★(SHORT_TEXT)
  username(SHORT_TEXT)
  content★(LONG_TEXT)
  avatar_url(SHORT_TEXT) //The avatar url for webhook
  embeds(JSON) //Embeds to send along with the message
  tts(CHECKBOX) //Robot reads the message
`request_approval_message` props:
  content★(LONG_TEXT) //The message you want to send
  channel★(DROPDOWN) //List of channels
`add_role_to_member` props:
  guild_id★(DROPDOWN) //List of guilds
  user_id★(SHORT_TEXT) //The user id of the member
  role_id★(DROPDOWN) //List of roles
`remove_role_from_member` props:
  guild_id★(DROPDOWN) //List of guilds
  user_id★(SHORT_TEXT) //The user id of the member
  role_id★(DROPDOWN) //List of roles
`remove_member_from_guild` props:
  guild_id★(DROPDOWN) //List of guilds
  user_id★(SHORT_TEXT) //The user id of the member
`list_guild_members` props:
  guild_id★(DROPDOWN) //List of guilds
  shortText★(SHORT_TEXT) //Search for a member
`rename_channel` props:
  channel_id★(DROPDOWN) //List of channels
  name★(SHORT_TEXT) //The new name of the channel
`create_channel` props:
  guild_id★(DROPDOWN) //List of guilds
  name★(SHORT_TEXT) //The name of the new channel
`delete_channel` props:
  channel_id★(DROPDOWN) //List of channels
`find_channel` props:
  guild_id★(DROPDOWN) //List of guilds
  name★(SHORT_TEXT) //The name of the channel
`remove_ban_from_user` props:
  guild_id★(DROPDOWN) //List of guilds
  user_id★(SHORT_TEXT) //The ID of the user
  unban_reason(SHORT_TEXT) //The reason for unbanning the user
`createGuildRole` props:
  guild_id★(DROPDOWN) //List of guilds
  role_name★(SHORT_TEXT) //The name of the role
  role_color(SHORT_TEXT) //The RGB color of the role (may be better to set manually on 
  display_separated(CHECKBOX) //Whether the role should be displayed separately in the sideb
  role_mentionable(CHECKBOX) //Whether the role can be mentioned by other users
  creation_reason(SHORT_TEXT) //The reason for creating the role
`deleteGuildRole` props:
  guild_id★(DROPDOWN) //List of guilds
  role_id★(DROPDOWN) //List of roles
  deletion_reason(SHORT_TEXT) //The reason for deleting the role
`ban_guild_member` props:
  guild_id★(DROPDOWN) //List of guilds
  user_id★(SHORT_TEXT) //The user id of the member
  ban_reason(SHORT_TEXT) //The reason for banning the member
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### twilio  v2.0.0 | Basic Auth
*Cloud communications platform for building SMS, Voice & Messaging applications*
**Triggers:** `new_incoming_sms`
**Actions:** `send_sms` `call_phone` `custom_api_call`
`new_incoming_sms` props:
  phone_number★(DROPDOWN) //The phone number to send the message from
`send_sms` props:
  from★(DROPDOWN) //The phone number to send the message from
  body★(SHORT_TEXT) //The body of the message to send
  to★(SHORT_TEXT) //The phone number to send the message to
`call_phone` props:
  from★(DROPDOWN) //The phone number to send the message from
  to★(SHORT_TEXT) //The phone number to call
  message★(LONG_TEXT) //The message to say during the call
  voice(DROPDOWN)='alice' //Select the voice for the call
  language(DROPDOWN)='en-US' //Select the language for the call
  send_digits(SHORT_TEXT) //DTMF tones to send during the call (e.g., 1234 for keypad pr
  status_callback(SHORT_TEXT) //URL to send status callbacks to (optional)
  status_callback_method(DROPDOWN) //HTTP method for status callbacks
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### smtp  v2.0.0 | Custom(host,email,password,port,TLS)
*Send emails using Simple Mail Transfer Protocol*
**Actions:** `send-email`
`send-email` props:
  from★(SHORT_TEXT)
  senderName(SHORT_TEXT)
  to★(ARRAY)
  cc(ARRAY)
  replyTo(SHORT_TEXT)
  bcc(ARRAY)
  subject★(SHORT_TEXT)
  body_type★(STATIC_DROPDOWN)='plain_text' ["plain text"|"html"]
  body★(LONG_TEXT)
  customHeaders(OBJECT)
  attachments(ARRAY)

### sendgrid  v2.0.0 | API Key
*Email delivery service for sending transactional and marketing emails*
**Actions:** `send_email` `send_dynamic_template` `custom_api_call`
`send_email` props:
  to★(ARRAY) //Emails of the recipients
  from★(SHORT_TEXT) //Sender email, must be on your SendGrid
  from_name(SHORT_TEXT) //Sender name
  reply_to(SHORT_TEXT) //Email to receive replies on (defaults to sender)
  subject★(SHORT_TEXT)
  content_type★(DROPDOWN)
  content★(SHORT_TEXT) //HTML is only allowed if you selected HTML as type
`send_dynamic_template` props:
  to★(ARRAY) //Emails of the recipients
  from_name(SHORT_TEXT) //Sender name
  from★(SHORT_TEXT) //Sender email, must be on your SendGrid
  template_id★(SHORT_TEXT) //Dynamic template id
  template_data★(JSON) //Dynamic template data
  reply_to(SHORT_TEXT) //Email to receive replies on (defaults to sender)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### imap  v2.0.0 | Custom(host,username,password,port,tls)
*Receive new email trigger*
**Triggers:** `new_email`
`new_email` props:
  mailbox★(DROPDOWN) //Select the mailbox to search
  filterInstructions(MARKDOWN) //**Filter Emails:** You can add Branch Piece to filter emails

### ntfy  v2.0.0 | Custom(base_url,access_token)
*Notification management made easy*
**Actions:** `send_notification` `custom_api_call`
`send_notification` props:
  topic★(SHORT_TEXT) //The topic/channel to send the notification to, e.g. test1
  title(SHORT_TEXT) //The title of the notification
  message★(LONG_TEXT) //The message to send
  priority(SHORT_TEXT) //The priority of the notification (1-5). 1 is lowest priority
  tags(ARRAY) //The tags for the notification.
  icon(SHORT_TEXT) //The absolute URL to your icon, e.g. https://example.com/comm
  actions(LONG_TEXT) //Add Action buttons to notifications, see https://docs.ntfy.s
  click(SHORT_TEXT) //You can define which URL to open when a notification is clic
  delay(SHORT_TEXT) //Let ntfy send messages at a later date, e.g. 'tomorrow, 10am
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### pushover  v2.0.0 | Custom(api_token,user_key)
*Simple push notification service*
**Actions:** `send_notification`
`send_notification` props:
  title(SHORT_TEXT) //The title of the notification
  message★(LONG_TEXT) //The message to send
  html(CHECKBOX) //To enable HTML parsing
  priority(NUMBER) //The priority of the notification (-2 to 2). -2 is lowest pri
  retry(NUMBER) //Works only if priority is set to 2. Specifies how often (in 
  expire(NUMBER) //Works only if priority is set to 2. Specifies how many secon
  url(SHORT_TEXT) //A supplementary URL to show with your message.
  url_title(SHORT_TEXT) //A title for the URL specified as the url input parameter, ot
  timestamp(SHORT_TEXT) //a Unix timestamp of a time to display instead of when our AP
  device(SHORT_TEXT) //The name of one of your devices to send just to that device 

### line  v2.0.0 | API Key
*Build chatbots for LINE*
**Triggers:** `new-message`
**Actions:** `push_message` `custom_api_call`
`new-message` props:
  md(MARKDOWN) //- Create Line bot account from Developer Console - Go to the
`push_message` props:
  userId★(SHORT_TEXT) //The user id can be obtained from the webhook payload
  text★(SHORT_TEXT)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### messagebird  v2.0.0 | Custom(apiKey,workspaceId,channelId)
*Unified CRM for Marketing, Service & Payments*
**Actions:** `send-sms` `listMessages` `custom_api_call`
`send-sms` props:
  recipient★(SHORT_TEXT) //The phone number to send the message to (with country code)
  message★(LONG_TEXT) //The body of the SMS message
  reference(SHORT_TEXT) //Your own identifier for the message (optional)
  scheduledFor(DATE_TIME) //Message to be sent at a specific datetime eg. 2025-04-27T15:
`listMessages` props:
  status★(STATIC_DROPDOWN) //The status of the messages to filter by (select "All" for al
  startAt★(DATE_TIME)='2026-02-15T04:21:39Z' //The start date and time (in UTC) to filter messages
  endAt★(DATE_TIME)='2026-02-16T04:21:39Z' //The end date and time (in UTC) to filter messages, should no
  pageToken(SHORT_TEXT) //Token for pagination to fetch next set of results after 1000
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### clicksend  v2.0.0 | Basic Auth
*Cloud-based messaging platform for sending SMS, MMS, voice, email, and more.*
**Triggers:** `new_incoming_sms`
**Actions:** `send_sms` `send_mms` `create_contact` `update_contact` `delete_contact` `create_contact_list` `find_contact_by_email` `find_contact_by_phone` `find_contact_lists` `custom_api_call`

### mattermost  v2.0.1 | Custom(workspace_url,token)
*Open-source, self-hosted Slack alternative*
**Actions:** `send_message` `custom_api_call`

### bluesky  v2.0.0 | Custom(pdsHost,identifier,password)
*Post updates, interact with content, and monitor your Bluesky timeline and followers.*
**Triggers:** `newPostsByAuthor` `newFollowerOnAccount` `newTimelinePosts` `newPost`
**Actions:** `createPost` `likePost` `repostPost` `findPost` `findThread`

### twitter  v2.0.0 | Custom(consumerKey,consumerSecret,accessToken,accessTokenSecret)
*Social media platform with over 500 million user*
**Actions:** `create-tweet` `create-reply`
`create-tweet` props:
  text★(LONG_TEXT) //The text of the tweet
  image_1(FILE) //An image, video or GIF url or base64 to attach to the tweet
  image_2(FILE) //An image, video or GIF url or base64 to attach to the tweet
  image_3(FILE) //An image, video or GIF url or base64 to attach to the tweet
`create-reply` props:
  tweet_id★(LONG_TEXT) //The ID of the tweet to reply too.
  text★(LONG_TEXT) //The text of the tweet
  image_1(FILE) //An image, video or GIF url or base64 to attach to the tweet
  image_2(FILE) //An image, video or GIF url or base64 to attach to the tweet
  image_3(FILE) //An image, video or GIF url or base64 to attach to the tweet

### linkedin  v2.0.2 | OAuth2
*Connect and network with professionals*
**Actions:** `create_share_update` `create_company_update` `custom_api_call`

### facebook-pages  v2.0.0 | OAuth2
*Manage your Facebook pages to grow your business*
**Actions:** `create_post` `create_photo_post` `create_video_post`

### facebook-leads  v2.0.0 | OAuth2
*Capture leads from Facebook*
**Triggers:** `new_lead`

### instagram-business  v2.0.0 | OAuth2
*Grow your business on Instagram*
**Actions:** `upload_photo` `upload_reel`

### zoom  v2.0.0 | OAuth2
*Video conferencing, web conferencing, webinars, screen sharing*
**Actions:** `zoom_create_meeting` `zoom_create_meeting_registrant` `custom_api_call`

### azure-communication-services  v2.0.0 | API Key
*Communication services from Microsoft Azure*
**Actions:** `send_email`

### instasent  v2.0.0 | Custom(projectId,datasourceId,apiKey)
*Manage your SMS and messaging workflows with Instasent. Automate contact management and track messag*
**Actions:** `add_or_update_contact` `delete_contact` `add_event`
`add_or_update_contact` props:
  contact★(DYNAMIC) //Enter the contact properties, the User ID is mandatory
  instant(CHECKBOX)=false //Process contact immediately instead of queuing. Only enable 
`delete_contact` props:
  userId★(SHORT_TEXT) //Unique identifier of the contact to delete
`add_event` props:
  user_id★(SHORT_TEXT) //Unique identifier of the user
  event_id★(SHORT_TEXT) //Unique identifier for this event. Used for deduplication.
  event_date(SHORT_TEXT) //Date and time when the event occurred, will default to now (
  event_type★(DROPDOWN) //Select the type of event to create
  event_parameters★(DYNAMIC) //Parameters for the selected event type

### heartbeat  v2.0.0 | API Key
*Monitoring and alerting made easy*
**Actions:** `heartbeat_create_user` `custom_api_call`

### contiguity  v2.0.0 | API Key
*Communications for what you're building*
**Actions:** `send_text` `send_imessage` `custom_api_call`

### seven  v2.0.0 | API Key
*Business Messaging Gateway*
**Triggers:** `new_incoming_sms`
**Actions:** `send-sms` `send-voice-call` `lookup`

### gotify  v2.0.0 | Custom(base_url,app_token)
*Self-hosted push notification service*
**Actions:** `send_notification`

### mastodon  v2.0.0 | Custom(base_url,access_token)
*Open-source decentralized social network*
**Actions:** `post_status` `custom_api_call`

### matrix  v2.0.0 | Custom(base_url,access_token)
*Open standard for interoperable, decentralized, real-time communication*
**Actions:** `send_message` `custom_api_call`

### missive  v2.0.0 | API Key
*Streamline your team communication and customer support with Missive. Manage shared inboxes, collabo*
**Triggers:** `new_message` `new_comment` `new_contact` `new_contact_book` `new_contact_group`
**Actions:** `create_contact` `update_contact` `create_draft_post` `create_task` `find_contact` `custom_api_call`

### manychat  v2.0.0 | API Key
*Automations for Instagram, WhatsApp, TikTok, and Messenger marketing.*
**Actions:** `addTagToUser` `createSubscriber` `findUserByCustomField` `findUserByName` `removeTagFromUser` `sendContentToUser` `setCustomField`

### bonjoro  v2.0.0 | Custom(apiKey)
*Send personal video messages to delight customers*
**Actions:** `add_greet` `custom_api_call`

### respond-io  v2.0.0 | Custom(token)
*Manage your customer conversations across multiple channels with Respond.io. Automate contact manage*
**Triggers:** `contact_tag_updated` `contact_updated` `conversation_closed` `conversation_opened` `new_contact` `new_incoming_message` `new_outgoing_message`
**Actions:** `add_comment_to_conversation` `add_tag_to_contact` `assign_or_unassign_conversation` `create_contact` `create_or_update_contact` `delete_contact` `find_contact` `open_conversation` `custom_api_call`

### zoho-cliq  v2.0.0 | OAuth2
*Team messaging and collaboration platform by Zoho*
**Actions:** `send_channel_message` `send_direct_message` `send_card_to_channel` `send_card_to_chat` `send_card_to_user` `send_message_to_chat` `send_thread_message` `get_channel` `custom_api_call`


## ★ CRM & SALES

### hubspot  v2.0.0 | OAuth2
*Powerful CRM that offers tools for sales, customer service, and marketing automation.*
**Triggers:** `new-or-updated-company` `new-or-updated-contact` `new-deal-property-change` `new-email-subscriptions-timeline` `new-or-updated-line-item` `new-company` `new-company-property-change` `new-contact` `new-contact-in-list` `new-contact-property-change` `new-blog-article` `new-custom-object` `new-custom-object-property-change` `new-deal` `new-email-event` `new-engagement` `new-form-submission` `new-line-item` `new-product` `new-ticket` `new-ticket-property-change` `new-or-updated-product` `new-task` `deal-stage-updated`
**Actions:** `add_contact_to_list` `add-contact-to-workflow` `create-associations` `create-company` `create-contact` `create-blog-post` `create-custome-object` `create-deal` `create-line-item` `create-page` `create-or-update-contact` `create-product` `create-ticket` `get-company` `get-contact` `get-custom-object` `get-deal` `get-line-item` `get-product` `get-page` `get-ticket` `delete-page` `remove-associations` `remove-contact-from-list` `remove-email-subscription` `update-company` `update-contact` `update-custome-object` `update-deal` `update-line-item` `update-product` `update-ticket` `upload-file` `find-associations` `find-company` `find-contact` `find-custom-object` `find-deal` `find-line-item` `find-product` `find-ticket` `get-owner-by-email` `get-owner-by-id` `get-pipeline-stage-details` `custom_api_call`

### pipedrive  v2.0.0 | OAuth2
*Sales CRM and pipeline management software*
**Triggers:** `new_person` `new_deal` `new_activity` `new-note` `updated_person` `updated_deal` `updated-deal-stage` `new-lead` `new-organization` `updated-organization` `activity-matching-filter` `deal-matching-filter` `person-matching-filter` `organization-matching-filter`
**Actions:** `add-follower` `get-note` `create-note` `add-labels-to-person` `add-product-to-deal` `attach-file` `create-activity` `update-activity` `create-deal` `update-deal` `create-lead` `update-lead` `create-organization` `update-organization` `create-person` `update-person` `create-product` `find-deals-associated-with-person` `find-product` `find-products` `find-notes` `get-product` `find-organization` `find-person` `find-deal` `find-activity` `find-user` `custom_api_call`

### zoho-crm  v2.0.0 | OAuth2
*Customer relationship management software*
**Triggers:** `new_contact` `new_lead` `new_module_entry` `new_or_updated_contact` `new_or_updated_lead` `new_or_updated_module_entry` `new_user` `updated_module_entry`
**Actions:** `read-file` `add_attachment` `add_tag` `convert_lead` `create_module_entry` `update_module_entry` `update_related_module_entry` `create_update_module_entry` `find_module_entry` `find_module_entries` `custom_api_call`
`new_contact` props:
  triggerConfig(STATIC_DROPDOWN)='all_contacts' ["All New Contacts"] //Configuration for the trigger
  lookbackHours(NUMBER)=72 //How many hours back to check for new contacts (default: 72 f
  debugMode(CHECKBOX)=true //Enable detailed logging for troubleshooting
`new_lead` props:
  triggerConfig(STATIC_DROPDOWN)='all_leads' ["All New Leads"] //Configuration for the trigger
  lookbackHours(NUMBER)=72 //How many hours back to check for new leads (default: 72 for 
  debugMode(CHECKBOX)=true //Enable detailed logging for troubleshooting
`new_module_entry` props:
  module★(STATIC_DROPDOWN) //Select the Zoho CRM module to monitor
  lookbackHours(NUMBER)=72 //How many hours back to check for new entries (default: 72 fo
  debugMode(CHECKBOX)=true //Enable detailed logging for troubleshooting
`new_or_updated_contact` props:
  triggerConfig(STATIC_DROPDOWN)='all_changes' ["All New or Updated Contacts"] //Configuration for the trigger
  lookbackHours(NUMBER)=72 //How many hours back to check for new or updated contacts (de
  debugMode(CHECKBOX)=true //Enable detailed logging for troubleshooting
`new_or_updated_lead` props:
  triggerConfig(STATIC_DROPDOWN)='all_changes' ["All New or Updated Leads"] //Configuration for the trigger
  lookbackHours(NUMBER)=72 //How many hours back to check for new or updated leads (defau
  debugMode(CHECKBOX)=true //Enable detailed logging for troubleshooting
`new_or_updated_module_entry` props:
  module★(STATIC_DROPDOWN) //Select the Zoho CRM module to monitor
`new_user` props:
  triggerConfig(STATIC_DROPDOWN)='all_users' ["All New Users"] //Configuration for the trigger
  lookbackHours(NUMBER)=72 //How many hours back to check for new users (default: 72 for 
  debugMode(CHECKBOX)=true //Enable detailed logging for troubleshooting
`updated_module_entry` props:
  module★(STATIC_DROPDOWN) //Select the Zoho CRM module to monitor
`read-file` props:
  url★(SHORT_TEXT) //The full URL to use, including the base URL
`add_attachment` props:
  module★(STATIC_DROPDOWN) //Select the Zoho CRM module
  recordId★(DROPDOWN) //Select the record to attach the file to
  file★(FILE) //The file to attach
  attachmentName(SHORT_TEXT) //Name for the attachment (optional, defaults to file name)
`add_tag` props:
  module★(STATIC_DROPDOWN) //Select the Zoho CRM module
  recordId★(DROPDOWN) //Select the record to add the tag to
  tagName★(SHORT_TEXT) //The name of the tag to add
`convert_lead` props:
  leadId★(DROPDOWN) //Select the lead to convert
  createContact(CHECKBOX)=true //Whether to create a contact from the lead
  contactData(JSON) //Additional contact data as JSON (optional). Example: {"Depar
  createAccount(CHECKBOX)=true //Whether to create an account from the lead
  accountData(JSON) //Additional account data as JSON (optional). Example: {"Indus
  createDeal(CHECKBOX)=false //Whether to create a deal from the lead
  dealData(JSON) //Additional deal data as JSON (optional). Example: {"Deal_Nam
  assignToOwner(CHECKBOX)=true //Assign the new records to the original lead owner
  skipAccountOnError(CHECKBOX)=false //If account creation fails, continue with contact/deal creati
`create_module_entry` props:
  module★(STATIC_DROPDOWN) //Select the Zoho CRM module to create an entry in
  data★(JSON) //The data for the entry as JSON. Example: {"First_Name": "Joh
  triggerWorkflow(CHECKBOX)=true //Whether to trigger workflow rules after creating the entry
  triggerApproval(CHECKBOX)=false //Whether to trigger approval process after creating the entry
  triggerBlueprint(CHECKBOX)=false //Whether to trigger blueprint after creating the entry
`update_module_entry` props:
  module★(STATIC_DROPDOWN) //Select the Zoho CRM module to update an entry in
  recordId★(DROPDOWN) //Select the record to update
  data★(JSON) //The data to update the entry with as JSON. Only include fiel
  triggerWorkflow(CHECKBOX)=true //Whether to trigger workflow rules after updating the entry
  triggerApproval(CHECKBOX)=false //Whether to trigger approval process after updating the entry
  triggerBlueprint(CHECKBOX)=false //Whether to trigger blueprint after updating the entry
  overwrite(CHECKBOX)=false //Whether to overwrite existing fields with empty values from 
`update_related_module_entry` props:
  sourceModule★(STATIC_DROPDOWN) //The module containing the source record
  sourceRecordId★(DROPDOWN) //Select the source record
  relatedModule★(STATIC_DROPDOWN) //The module containing the related record to update
  relationshipType★(STATIC_DROPDOWN) //Choose the type of relationship to find the related record
  relationshipField(SHORT_TEXT) //The field name that links the source record to the related r
  updateData★(JSON) //The data to update the related entry with as JSON. Example: 
  triggerWorkflow(CHECKBOX)=true //Whether to trigger workflow rules after updating the related
  triggerApproval(CHECKBOX)=false //Whether to trigger approval process after updating the relat
  triggerBlueprint(CHECKBOX)=false //Whether to trigger blueprint after updating the related entr
`create_update_module_entry` props:
  operation★(STATIC_DROPDOWN)='create' ["Create New Record"|"Update Existing Record"] //Choose whether to create a new record or update an existing 
  module★(STATIC_DROPDOWN) //Select the Zoho CRM module to create or update an entry in
  recordId(DROPDOWN) //Select the record to update
  data★(JSON) //The data for the entry as JSON. Example: {"First_Name": "Joh
  triggerWorkflow(CHECKBOX)=true //Whether to trigger workflow rules after creating/updating th
  triggerApproval(CHECKBOX)=false //Whether to trigger approval process after creating/updating 
  triggerBlueprint(CHECKBOX)=false //Whether to trigger blueprint after creating/updating the ent
`find_module_entry` props:
  module★(STATIC_DROPDOWN) //Select the Zoho CRM module to search in
  searchType★(STATIC_DROPDOWN) //Choose how to search for the entry
  searchValue★(SHORT_TEXT) //The value to search for (ID, email, phone, name, company, et
  searchField(SHORT_TEXT) //The field name to search in (only required for custom field 
  searchOperator(STATIC_DROPDOWN)='equals' ["Equals (exact match)"|"Contains (partial match)"|"Starts with"|"Ends with"|"Greater than"|"Less than"|"Not equal"] //How to match the custom field value
  fields(LONG_TEXT) //Comma-separated list of fields to return. Leave empty for al
  limit(NUMBER)=20 //Maximum number of results to return (default: 20, max: 200)
  returnFirst(CHECKBOX)=false //If multiple results found, return only the first one as a si
`find_module_entries` props:
  module★(STATIC_DROPDOWN) //Select the Zoho CRM module to search in
  searchType(STATIC_DROPDOWN)='all' //Choose the type of search to perform
  searchValue(SHORT_TEXT) //The value to search for (used with Simple Text Search, Email
  searchCriteria(LONG_TEXT) //Advanced search criteria in Zoho CRM format. Examples: - (Em
  recentDays(NUMBER)=7 //Number of days to look back for recent records (used with Re
  dateFrom(DATE_TIME) //Start date for date range filter (used with Date Range Filte
  dateTo(DATE_TIME) //End date for date range filter (used with Date Range Filter)
  dateField(STATIC_DROPDOWN)='Modified_Time' ["Modified Time"|"Created Time"|"Last Activity Time"] //Which date field to filter by (used with Date Range Filter)
  fields(LONG_TEXT) //Comma-separated list of fields to return. Leave empty for al
  sortBy(SHORT_TEXT)='Modified_Time' //Field name to sort by (e.g., "Created_Time", "Modified_Time"
  sortOrder(STATIC_DROPDOWN)='desc' ["Ascending (A-Z, Oldest first)"|"Descending (Z-A, Newest first)"] //Sort order for the results
  page(NUMBER)=1 //Page number for pagination (default: 1)
  perPage(NUMBER)=50 //Number of records per page (default: 50, max: 200)
  modifiedSince(DATE_TIME) //Only return records modified since this date/time
  createdSince(DATE_TIME) //Only return records created since this date/time
  includeChild(CHECKBOX)=false //Include child records in the response
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### attio  v2.0.0 | API Key
*Modern, collaborative CRM platform built to be fully customizable and real-time.*
**Triggers:** `record_created` `record_updated` `list_entry_created` `list_entry_updated`
**Actions:** `create_record` `update_record` `find_record` `create_entry` `update_entry` `find_list_entry` `custom_api_call`
`record_created` props:
  objectTypeId★(DROPDOWN)
`record_updated` props:
  objectTypeId★(DROPDOWN)
`list_entry_created` props:
  listId★(DROPDOWN)
`list_entry_updated` props:
  listId★(DROPDOWN)
`create_record` props:
  objectTypeId★(DROPDOWN)
  attributes(DYNAMIC)
`update_record` props:
  objectTypeId★(DROPDOWN)
  recordId★(SHORT_TEXT) //The unique identifier of the record to update.
  attributes(DYNAMIC)
`find_record` props:
  objectTypeId★(DROPDOWN)
  attributes(DYNAMIC)
`create_entry` props:
  listId★(DROPDOWN)
  parentObjectId★(DROPDOWN)
  parentRecordId★(SHORT_TEXT)
  attributes(DYNAMIC)
`update_entry` props:
  listId★(DROPDOWN)
  entryId★(SHORT_TEXT) //The unique identifier of the entry to update.
  attributes(DYNAMIC)
`find_list_entry` props:
  listId★(DROPDOWN)
  attributes(DYNAMIC)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### intercom  v2.0.0 | OAuth2
*Customer messaging platform for sales, marketing, and support*
**Triggers:** `contactReplied` `lead-added-email` `lead-converted-to-user` `conversationClosed` `conversationAssigned` `conversationSnoozed` `conversationUnsnoozed` `new-company` `newConversationFromUser` `conversationRated` `new-lead` `new-ticket` `new-user` `conversationPartTagged` `tag-added-to-lead` `tag-added-to-user` `contact-updated` `replyFromUser` `replyFromAdmin` `noteAddedToConversation`
**Actions:** `add-note-to-user` `addNoteToConversation` `add-or-remove-tag-on-contact` `add-or-remove-tag-on-company` `add-or-remove-tag-on-conversation` `create-article` `create-conversation` `create-ticket` `create-user` `create-or-update-lead` `create-or-update-user` `replyToConversation` `send_message` `update-ticket` `find-company` `find-conversation` `find-lead` `find-user` `list-all-tags` `get-conversation` `custom_api_call`
`conversationPartTagged` props:
  tagId(DROPDOWN)
`tag-added-to-lead` props:
  tagId(DROPDOWN)
`tag-added-to-user` props:
  tagId(DROPDOWN)
`contact-updated` props:
  type★(STATIC_DROPDOWN)='user' ["User"|"Lead"]
`noteAddedToConversation` props:
  keyword(SHORT_TEXT)
`add-note-to-user` props:
  email★(SHORT_TEXT)
  body★(LONG_TEXT)
`addNoteToConversation` props:
  from★(DROPDOWN)
  conversationId★(DROPDOWN)
  body★(SHORT_TEXT)
`add-or-remove-tag-on-contact` props:
  contactId★(DROPDOWN)
  tagId★(DROPDOWN)
  untag(CHECKBOX)=false
`add-or-remove-tag-on-company` props:
  companyId★(DROPDOWN)
  tagName★(SHORT_TEXT)
  untag(CHECKBOX)=false
`add-or-remove-tag-on-conversation` props:
  conversationId★(DROPDOWN)
  tagId★(DROPDOWN)
  untag(CHECKBOX)=false
`create-article` props:
  title★(LONG_TEXT)
  description(SHORT_TEXT)
  body(LONG_TEXT)
  authorId★(DROPDOWN)
  state★(STATIC_DROPDOWN)='draft' ["Draft"|"Published"]
  collectionId(DROPDOWN)
`create-conversation` props:
  contactType★(STATIC_DROPDOWN)='user' ["User"|"Lead"]
  contactId★(DROPDOWN)
  body★(LONG_TEXT)
`create-ticket` props:
  ticketTypeId★(DROPDOWN)
  contactId★(DROPDOWN)
  companyId(DROPDOWN)
  ticketProperties★(DYNAMIC)
`create-user` props:
  email★(SHORT_TEXT)
  createdAt(DATE_TIME)
  userId(SHORT_TEXT)
  name(SHORT_TEXT)
  customAttributes(OBJECT)
`create-or-update-lead` props:
  leadId(SHORT_TEXT)
  name(SHORT_TEXT)
  email(SHORT_TEXT)
  phone(SHORT_TEXT)
  unsubscribe(CHECKBOX)
  createdAt(DATE_TIME)
  customAttributes(OBJECT)
`create-or-update-user` props:
  email★(SHORT_TEXT)
  name(SHORT_TEXT)
  userId(SHORT_TEXT)
  phone(SHORT_TEXT)
  createdAt(DATE_TIME)
  customAttributes(OBJECT)
`replyToConversation` props:
  from★(DROPDOWN)
  conversationId★(DROPDOWN)
  body★(SHORT_TEXT)
`send_message` props:
  message_type★(STATIC_DROPDOWN)='email' ["Email"|"In App Chat"]
  email_required_fields★(DYNAMIC)
  from★(DROPDOWN)
  to★(DROPDOWN)
  body★(SHORT_TEXT)
  create_conversation_without_contact_reply(CHECKBOX)=false //Whether a conversation should be opened in the inbox for the
`update-ticket` props:
  ticketTypeId★(DROPDOWN)
  ticketId★(DROPDOWN)
  ticketProperties★(DYNAMIC)
  isOpen(CHECKBOX)
  state(STATIC_DROPDOWN) ["In Progress"|"Waiting on Customer"|"Resolved"]
  snoozedTill(DATE_TIME)
  assignedAdminId(DROPDOWN)
`find-company` props:
  searchField★(STATIC_DROPDOWN) ["Name"|"Company ID"]
  searchValue★(SHORT_TEXT)
`find-conversation` props:
  searchField★(STATIC_DROPDOWN) ["Conversation ID"|"Subject"|"Message Body"|"Author Email"|"Assigned Admin"|"Team"|"Tag IDs"]
  matchType★(STATIC_DROPDOWN) ["Contains"|"Equals"|"Starts With"]
  searchTerm★(SHORT_TEXT)
  status(STATIC_DROPDOWN) ["Open"|"Closed"]
  updateAfter(DATE_TIME)
  updateBefore(DATE_TIME)
`find-lead` props:
  searchField★(STATIC_DROPDOWN) ["Email"|"ID"|"User ID"]
  searchValue★(SHORT_TEXT)
`find-user` props:
  searchField★(STATIC_DROPDOWN) ["Email"|"ID"|"User ID"]
  searchValue★(SHORT_TEXT)
`get-conversation` props:
  conversationId★(DROPDOWN)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### activecampaign  v2.0.0 | Custom(apiUrl,apiKey)
*Email marketing, marketing automation, and CRM tools you need to create incredible customer experien*
**Triggers:** `activecampaign_deal_task_completed` `activecampaign_new_contact_note` `activecampaign_new_contact_task` `activecampaign_new_deal_added_or_updated` `activecampaign_new_or_updated_account` `activecampaign_new_deal_note` `activecampaign_new_deal_task` `activecampaign_new_tag_added_or_removed_from_contact` `activecampaign_updated_contact`
**Actions:** `activecampaign_add_contact_to_account` `activecampaign_add_tag_to_contact` `activecampaign_create_account` `activecampaign_create_contact` `activecampaign_update_account` `activecampaign_update_contact` `activecampaign_subscribe_or_unsubscribe_contact_from_list`
`activecampaign_add_contact_to_account` props:
  contactId★(DROPDOWN)
  accountId★(DROPDOWN)
  jobTitle(SHORT_TEXT)
`activecampaign_add_tag_to_contact` props:
  contactId★(DROPDOWN)
  tagId★(DROPDOWN)
`activecampaign_create_account` props:
  name★(SHORT_TEXT)
  accountUrl(SHORT_TEXT)
  accountCustomFields★(DYNAMIC)
`activecampaign_create_contact` props:
  email★(SHORT_TEXT)
  firstName(SHORT_TEXT)
  lastName(SHORT_TEXT)
  phone(SHORT_TEXT)
  contactCustomFields★(DYNAMIC)
`activecampaign_update_account` props:
  accountId★(DROPDOWN)
  name(SHORT_TEXT)
  accountUrl(SHORT_TEXT)
  accountCustomFields★(DYNAMIC)
`activecampaign_update_contact` props:
  contactId★(DROPDOWN)
  email(SHORT_TEXT)
  firstName(SHORT_TEXT)
  lastName(SHORT_TEXT)
  phone(SHORT_TEXT)
  contactCustomFields★(DYNAMIC)
`activecampaign_subscribe_or_unsubscribe_contact_from_list` props:
  listId★(DROPDOWN)
  status★(STATIC_DROPDOWN) ["Subscribe"|"Unsubscribe"]
  contactId★(SHORT_TEXT)

### copper  v2.0.0 | Custom(email,apiKey)
*Manage your CRM data with Copper. Automate lead tracking, contact management, opportunities, and tas*
**Triggers:** `newActivity` `newPerson` `newLead` `newTask` `updatedLead` `updatedTask` `updatedOpportunity` `updatedOpportunityStage` `updatedOpportunityStatus` `updatedProject` `updatedLeadStatus`
**Actions:** `createPerson` `updatePerson` `createLead` `updateLead` `convertLead` `createCompany` `updateCompany` `createOpportunity` `updateOpportunity` `createProject` `updateProject` `createTask` `createActivity` `searchForAnActivity` `searchForAPerson` `searchForALead` `searchForACompany` `searchForAnOpportunity` `searchForAProject` `custom_api_call`
`createPerson` props:
  name★(SHORT_TEXT)
  emails★(ARRAY)
  phone_numbers(ARRAY)
  address_street(SHORT_TEXT)
  address_city(SHORT_TEXT)
  address_state(SHORT_TEXT)
  address_postal_code(SHORT_TEXT)
  address_country(SHORT_TEXT)
`updatePerson` props:
  personId★(DROPDOWN) //select a person
  fields(DYNAMIC)
`createLead` props:
  name★(SHORT_TEXT)
  email★(SHORT_TEXT)
  category★(SHORT_TEXT)
  phone_numbers(ARRAY)
  address_street(SHORT_TEXT)
  address_city(SHORT_TEXT)
  address_state(SHORT_TEXT)
  address_postal_code(SHORT_TEXT)
  address_country(SHORT_TEXT)
`updateLead` props:
  leadId★(DROPDOWN) //select a Lead
  fields(DYNAMIC)
`convertLead` props:
  leadId★(DROPDOWN) //select a Lead
  companyId(DROPDOWN) //select a Company
  opportunityId(DROPDOWN) //select an Opportunity
`createCompany` props:
  name★(SHORT_TEXT)
  email_domain(SHORT_TEXT) //E.g. democompany.com
  details(SHORT_TEXT)
  phone_numbers(ARRAY)
  address_street(SHORT_TEXT)
  address_city(SHORT_TEXT)
  address_state(SHORT_TEXT)
  address_postal_code(SHORT_TEXT)
  address_country(SHORT_TEXT)
  primaryContactId(DROPDOWN) //select a primary contact
`updateCompany` props:
  companyId★(DROPDOWN) //select a Company
  fields(DYNAMIC)
  primaryContactId(DROPDOWN) //select a primary contact
`createOpportunity` props:
  name★(SHORT_TEXT) //The name of the opportunity
  pipelineId(DROPDOWN) //select a Pipeline
  pipelineStageId(DROPDOWN) //Select a stage
  primaryContactId(DROPDOWN) //select a primary contact
`updateOpportunity` props:
  opportunityId★(DROPDOWN) //select an Opportunity
  updateFields(DYNAMIC)
  pipelineId(DROPDOWN) //select a Pipeline
  pipelineStageId(DROPDOWN) //Select a stage
  primaryContactId(DROPDOWN) //select a primary contact
`createProject` props:
  name★(SHORT_TEXT) //The name of the project
  details(SHORT_TEXT) //The details of the project
`updateProject` props:
  projectId★(DROPDOWN) //select a Project
  updateFields(DYNAMIC)
`createTask` props:
  name★(SHORT_TEXT)
  details(SHORT_TEXT) //Details fo this task
  custom_activity_type_id★(DROPDOWN) //Select activity Type
  assigneeId(DROPDOWN) //select a user to assign to
  entity(STATIC_DROPDOWN) ["Person"|"Company"|"Lead"|"Opportunity"|"Project"] //Choose the type of Copper record this task should be linked 
  entityItemId(DROPDOWN) //Select the specific record (from the chosen type above) that
  due_date(DATE_TIME) //Enter date and time in 24-hour format, e.g. `2025-09-09 11:4
  reminder_date(DATE_TIME) //Enter date and time in 24-hour format, e.g. `2025-09-09 11:4
  priority(STATIC_DROPDOWN) ["None"|"Low"|"Medium"|"High"]
  tags(ARRAY)
`createActivity` props:
  entity★(STATIC_DROPDOWN) ["Person"|"Company"|"Lead"|"Opportunity"|"Project"|"Task"] //Select parent entity
  entityItemId★(DROPDOWN) //Select Resource
  details(SHORT_TEXT) //The details of the project
  type★(DROPDOWN) //Select activity Type
`searchForAnActivity` props:
  entity(STATIC_DROPDOWN) ["Person"|"Company"|"Lead"|"Opportunity"|"Project"|"Task"] //Select parent entity
  entityItemId(DROPDOWN) //Select Resource
  activity_types(MULTI_SELECT_DROPDOWN) //Select activity Type
  page_size(NUMBER)=50 //Default 50. Max 200.
  page_number(NUMBER)=1
  minimum_activity_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 11:40. The timestamp of the 
  maximum_activity_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  full_result(CHECKBOX)=false //(Optional) If set, search performance improves but duplicate
`searchForAPerson` props:
  name(SHORT_TEXT) //Full name of the People to search for.
  phone_number(SHORT_TEXT) //Phone Number of the People to search for.
  emails(ARRAY) //Emails of the People to search for.
  contact_type_ids(MULTI_SELECT_DROPDOWN) //Select contact Type
  assignee_ids(MULTI_SELECT_DROPDOWN) //select assignees
  company_ids(MULTI_SELECT_DROPDOWN) //select Companies
  opportunity_ids(MULTI_SELECT_DROPDOWN) //select Opportunities
  city(SHORT_TEXT) //The city in which People must be located.
  state(SHORT_TEXT) //The state or province in which People must be located.
  postal_code(SHORT_TEXT) //The postal code in which People must be located.
  country(SHORT_TEXT) //The two character country code where People must be located.
  tags(ARRAY) //Filter People to those that match at least one of the tags s
  socials(ARRAY) //Filter People to those that match at least one of the social
  followed(STATIC_DROPDOWN) ["followed"|"not followed"] //Filter by followed state
  age(NUMBER) //The maximum age in seconds that People must be.
  page_size(NUMBER)=50 //Default 50. Max 200.
  page_number(NUMBER)=1
  sort_by(STATIC_DROPDOWN) //The field on which to sort the results
  sort_direction(STATIC_DROPDOWN) ["Ascending"|"Descending"] //The direction in which to sort the result
  minimum_interaction_count(NUMBER) //The minimum number of interactions People must have had.
  maximum_interaction_count(NUMBER) //The maximum number of interactions People must have had.
  minimum_interaction_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_interaction_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  minimum_created_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_created_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
`searchForALead` props:
  name(SHORT_TEXT) //Full name of the Lead to search for.
  phone_number(SHORT_TEXT) //Phone Number of the Lead to search for.
  emails(SHORT_TEXT) //Emails of the Lead to search for.
  assignee_ids(MULTI_SELECT_DROPDOWN) //select assignees
  status_ids(MULTI_SELECT_DROPDOWN) //Select lead status
  customer_source_ids(MULTI_SELECT_DROPDOWN) //Select customer source.
  city(SHORT_TEXT) //The city in which Lead must be located.
  state(SHORT_TEXT) //The state or province in which Lead must be located.
  postal_code(SHORT_TEXT) //The postal code in which Lead must be located.
  country(SHORT_TEXT) //The two character country code where Lead must be located.
  tags(ARRAY) //Filter Lead to those that match at least one of the tags spe
  socials(ARRAY) //Filter Lead to those that match at least one of the social a
  followed(STATIC_DROPDOWN) ["followed"|"not followed"] //Filter by followed state
  age(NUMBER) //The maximum age in seconds that Lead must be.
  page_size(NUMBER)=50 //Default 50. Max 200.
  page_number(NUMBER)=1
  sort_by(STATIC_DROPDOWN) //The field on which to sort the results
  sort_direction(STATIC_DROPDOWN) ["Ascending"|"Descending"] //The direction in which to sort the result
  include_converted_leads(CHECKBOX)=false //Specify if response should contain converted leads.
  minimum_monetary_value(NUMBER) //The minimum monetary value Leads must have.
  maximum_monetary_value(NUMBER) //The maximum monetary value Leads must have.
  minimum_interaction_count(NUMBER) //The minimum number of interactions Lead must have had.
  maximum_interaction_count(NUMBER) //The maximum number of interactions Lead must have had.
  minimum_interaction_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_interaction_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  minimum_created_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_created_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  minimum_modified_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_modified_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
`searchForACompany` props:
  name(SHORT_TEXT) //Full name of the Company to search for.
  phone_number(SHORT_TEXT) //Phone Number of the Company to search for.
  email_domains(SHORT_TEXT) //Email Domain of the Company to search for.
  contact_type_ids(MULTI_SELECT_DROPDOWN) //Select contact Type
  assignee_ids(MULTI_SELECT_DROPDOWN) //select assignees
  city(SHORT_TEXT) //The city in which Company must be located.
  state(SHORT_TEXT) //The state or province in which Company must be located.
  postal_code(SHORT_TEXT) //The postal code in which Company must be located.
  country(SHORT_TEXT) //The two character country code where Company must be located
  tags(ARRAY) //Filter Company to those that match at least one of the tags 
  socials(ARRAY) //Filter Company to those that match at least one of the socia
  followed(STATIC_DROPDOWN) ["followed"|"not followed"] //Filter by followed state
  age(NUMBER) //The maximum age in seconds that Company must be.
  page_size(NUMBER)=50 //Default 50. Max 200.
  page_number(NUMBER)=1
  sort_by(STATIC_DROPDOWN) //The field on which to sort the results
  sort_direction(STATIC_DROPDOWN) ["Ascending"|"Descending"] //The direction in which to sort the result
  minimum_interaction_count(NUMBER) //The minimum number of interactions Company must have had.
  maximum_interaction_count(NUMBER) //The maximum number of interactions Company must have had.
  minimum_interaction_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_interaction_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  minimum_created_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_created_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
`searchForAnOpportunity` props:
  name(SHORT_TEXT) //Full name of the Opportunity to search for.
  assignee_ids(MULTI_SELECT_DROPDOWN) //select assignees
  company_ids(MULTI_SELECT_DROPDOWN) //select Companies
  status_ids(STATIC_MULTI_SELECT_DROPDOWN) ["Open"|"Won"|"Lost"|"Abandoned"] //Filter by Opportunity status
  priorities(STATIC_MULTI_SELECT_DROPDOWN) ["None"|"Low"|"Medium"|"High"]
  pipeline_ids(MULTI_SELECT_DROPDOWN) //select a Pipeline
  pipeline_stage_ids(MULTI_SELECT_DROPDOWN) //Select a stage
  primary_contact_ids(MULTI_SELECT_DROPDOWN) //select primary contacts
  customer_source_ids(MULTI_SELECT_DROPDOWN) //Select customer source.
  loss_reason_ids(MULTI_SELECT_DROPDOWN) //Select loss reason.
  tags(ARRAY) //Filter People to those that match at least one of the tags s
  followed(STATIC_DROPDOWN) ["followed"|"not followed"] //Filter by followed state
  page_size(NUMBER)=50 //Default 50. Max 200.
  page_number(NUMBER)=1
  sort_by(STATIC_DROPDOWN) //The field on which to sort the results
  sort_direction(STATIC_DROPDOWN) ["Ascending"|"Descending"] //The direction in which to sort the result
  minimum_monetary_value(NUMBER) //The minimum monetary value Opportunities must have.
  maximum_monetary_value(NUMBER) //The maximum monetary value Opportunities must have.
  minimum_interaction_count(NUMBER) //The minimum number of interactions Opportunity must have had
  maximum_interaction_count(NUMBER) //The maximum number of interactions Opportunity must have had
  minimum_close_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_close_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  minimum_interaction_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_interaction_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  minimum_stage_change_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_stage_change_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  minimum_created_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_created_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  minimum_modified_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_modified_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
`searchForAProject` props:
  name(SHORT_TEXT) //Full name of the Opportunity to search for.
  assignee_ids(MULTI_SELECT_DROPDOWN) //select assignees
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["Open"|"Completed"] //Filter by Opportunity status
  tags(ARRAY) //Filter People to those that match at least one of the tags s
  followed(STATIC_DROPDOWN) ["followed"|"not followed"] //Filter by followed state
  page_size(NUMBER)=50 //Default 50. Max 200.
  page_number(NUMBER)=1
  sort_by(STATIC_DROPDOWN) ["Name"|"Assigned To"|"Related To"|"Status"|"Date Modified"|"Date Created"] //The field on which to sort the results
  sort_direction(STATIC_DROPDOWN) ["Ascending"|"Descending"] //The direction in which to sort the result
  minimum_created_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_created_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  minimum_modified_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
  maximum_modified_date(DATE_TIME) //24-hour format, e.g. 2025-09-10 13:00. The timestamp of the 
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### freshsales  v2.0.0 | Basic Auth
*Sales CRM software*
**Actions:** `freshsales_create_contact` `custom_api_call`
`freshsales_create_contact` props:
  first_name(SHORT_TEXT) //First name of the contact
  last_name(SHORT_TEXT) //Last name of the contact
  job_title(SHORT_TEXT) //Designation of the contact in the account they belong to
  email★(SHORT_TEXT) //Primary email address of the contact
  work_number(SHORT_TEXT) //Work phone number of the contact
  mobile_number(SHORT_TEXT) //Mobile phone number of the contact
  address(SHORT_TEXT) //Address of the contact
  city(SHORT_TEXT) //City that the contact belongs to
  state(SHORT_TEXT) //State that the contact belongs to
  zipcode(SHORT_TEXT) //Zipcode of the region that the contact belongs to
  country(SHORT_TEXT) //Country that the contact belongs to
  territory_id(SHORT_TEXT) //ID of the territory that the contact belongs to
  owner_id(SHORT_TEXT) //ID of the user to whom the contact has been assigned
  subscription_status(SHORT_TEXT) //Status of subscription that the contact is in.
  medium(SHORT_TEXT) //The medium that led your contact to your website/web app
  campaign_id(SHORT_TEXT) //The campaign that led your contact to your web app.
  keyword(SHORT_TEXT) //The keywords that the contact used to reach your website/web
  time_zone(SHORT_TEXT) //Timezone that the contact belongs to
  facebook(SHORT_TEXT) //Facebook username of the contact
  twitter(SHORT_TEXT) //Twitter username of the contact
  linkedin(SHORT_TEXT) //LinkedIn account of the contact
  contact_status_id(SHORT_TEXT) //ID of the contact status that the contact belongs to
  sales_account_id(SHORT_TEXT) //ID of the primary account that the contact belongs to
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### lead-connector  v2.0.0 | OAuth2
*Lead Connector - Go High Level*
**Triggers:** `new_contact` `contact_updated` `new_form_submission` `new_opportunity`
**Actions:** `create_contact` `update_contact` `add_contact_to_campaign` `add_contact_to_workflow` `add_note_to_contact` `search_contacts` `create_opportunity` `update_opportunity` `create_task` `update_task` `custom_api_call`

### bigin-by-zoho  v2.0.0 | OAuth2
*Bigin by Zoho CRM is a lightweight CRM designed for small businesses to manage contacts, companies, *
**Triggers:** `newContactCreated` `contactUpdated` `newCompanyCreated` `companyUpdated` `newCallCreated` `newTaskCreated` `newEventCreated` `newPipelineRecordCreated` `pipelineRecordUpdated`
**Actions:** `createCompany` `updateCompany` `createContact` `updateContact` `createTask` `updateTask` `createCall` `createEvent` `updateEvent` `createPipeline` `updatePipeline` `searchPipelineRecord` `searchCompanyRecord` `searchContactRecord` `searchProductRecord` `searchUser`
`createCompany` props:
  accountName★(SHORT_TEXT) //Provide the name of the company
  phone(SHORT_TEXT) //Provide a phone number for the company
  website(SHORT_TEXT) //Provide a website URL for the company
  tag(MULTI_SELECT_DROPDOWN) //Select tags to associate with this module, "Accounts".
  description(LONG_TEXT) //Provide additional descriptions or notes related to the comp
  owner(DROPDOWN) //Select the owner to which the record will be assigned.
  billingStreet(SHORT_TEXT) //The street address of the company
  billingCity(SHORT_TEXT) //The city where the company is located
  billingState(SHORT_TEXT) //The state or province where the company is located
  billingCountry(SHORT_TEXT) //The country of the company
  billingCode(SHORT_TEXT) //The ZIP or postal code of the company
`updateCompany` props:
  companyId★(DROPDOWN) //Choose a company to update
  owner(DROPDOWN) //Select the owner to which the record will be assigned.
  companyDetails★(DYNAMIC) //These fields will be prepopulated with company data
  tag(MULTI_SELECT_DROPDOWN) //Select tags to associate with this module, "Accounts".
`createContact` props:
  firstName(SHORT_TEXT) //First name of the contact
  lastName★(SHORT_TEXT) //Last name of the contact
  title(SHORT_TEXT) //Job title of the contact
  email(SHORT_TEXT) //Email address of the contact
  mobile(SHORT_TEXT) //Mobile phone number
  emailOptOut(CHECKBOX)=false //Whether the contact has opted out of emails
  owner(DROPDOWN) //Select the owner to which the record will be assigned.
  accountName(DROPDOWN) //The ID of the company to which the record will be associated
  tag(MULTI_SELECT_DROPDOWN) //Select tags to associate with this module, "Contacts".
  description(LONG_TEXT) //Provide additional descriptions or notes related to the cont
  mailingStreet(SHORT_TEXT) //Street address for mailing
  mailingCity(SHORT_TEXT) //City for mailing address
  mailingState(SHORT_TEXT) //State for mailing address
  mailingCountry(SHORT_TEXT) //Country for mailing address
  mailingZip(SHORT_TEXT) //ZIP/postal code
`updateContact` props:
  contactId★(DROPDOWN) //Choose a contact to update
  contactDetails★(DYNAMIC) //Edit any of these fields
  accountName(DROPDOWN) //The ID of the company to which the record will be associated
  tag(MULTI_SELECT_DROPDOWN) //Select tags to associate with this module, "Contacts".
`createTask` props:
  subject★(SHORT_TEXT) //Provide the subject or title of the task
  owner(DROPDOWN) //Select the owner to which the record will be assigned.
  dueDate(DATE_TIME) //Provide the due date of the task (YYYY-MM-DD format)
  enableRecurring(CHECKBOX) //make this task recurring
  recurringInfo(DYNAMIC) //Please note: Due Date must be set above for recurring tasks
  enableReminder(CHECKBOX) //Enable reminder for this task
  reminderInfo(DYNAMIC)
  relatedModule(STATIC_DROPDOWN)='Contacts' ["Contacts"|"Pipelines"|"Companies"] //Select the type of entity the task is related to. Options: C
  relatedTo(DROPDOWN) //Select the specific record the task is related to.
  description(LONG_TEXT) //Provide additional descriptions or notes related to the task
  priority(STATIC_DROPDOWN) ["High"|"Normal"|"Low"|"Lowest"|"Highest"] //Provide the priority level of the task
  status(STATIC_DROPDOWN) ["In Progress"|"Completed"|"Deferred"|"Waiting for input"|"Not Started"] //Provide the current status of the task.
  tag(MULTI_SELECT_DROPDOWN) //Select tags to associate with this module, "Tasks".
`updateTask` props:
  taskId★(DROPDOWN) //Choose a task to update
  owner(DROPDOWN) //Select the owner to which the record will be assigned.
  taskDetails★(DYNAMIC) //These fields will be prepopulated with task data
  enableRecurring(CHECKBOX) //make this task recurring
  recurringInfo(DYNAMIC) //Please note: Due Date must be set above for recurring tasks
  enableReminder(CHECKBOX) //Enable reminder for this task
  reminderInfo(DYNAMIC)
  relatedModule(DROPDOWN)='Contacts' //Select the type of entity the task is related to. Options: C
  relatedTo(DROPDOWN) //Select the specific record the task is related to.
  tag(MULTI_SELECT_DROPDOWN) //Select tags to associate with this module, "Tasks".
`createCall` props:
  callStartTime★(DATE_TIME) //Provide the start time of the call in ISO8601 format.
  callDuration★(NUMBER) //Provide the duration of the call in minutes (numeric). For e
  callType★(STATIC_DROPDOWN) ["Outbound"|"Inbound"|"Missed"] //Type of call
  owner(DROPDOWN) //Select the owner to which the record will be assigned.
  contactName(DROPDOWN) //The ID of the contact to which the record will be associated
  subject(SHORT_TEXT) //Subject of the call
  description(LONG_TEXT) //Description or notes about the call
  callAgenda(LONG_TEXT) //Agenda or purpose of the call
  reminder(DATE_TIME) //Reminder date and time for the call
  dialledNumber(SHORT_TEXT) //Provide the number dialed for the call.
  relatedModule(STATIC_DROPDOWN)='Pipelines' ["Pipelines"|"Companies"] //Select the type of entity the call is related to.
  relatedTo(DROPDOWN) //Select the specific record the call is related to.
  tag(MULTI_SELECT_DROPDOWN) //Select tags to associate with this module, "Calls".
`createEvent` props:
  eventTitle★(SHORT_TEXT) //Provide the title or name of the event
  owner(DROPDOWN) //Select the owner to which the record will be assigned.
  startDateTime★(DATE_TIME) //Start date and time of the event
  endDateTime★(DATE_TIME) //End date and time of the event
  allDay(CHECKBOX) //Mark this as an all-day event
  enableRecurring(CHECKBOX) //Make this event recurring
  recurringInfo(DYNAMIC)
  enableReminder(CHECKBOX) //Enable reminder for this event
  reminderInfo(DYNAMIC)
  venue(SHORT_TEXT) //Location or venue of the event
  relatedModule(STATIC_DROPDOWN)='Contacts' ["Contacts"|"Pipelines"|"Companies"] //Select the type of entity the event is related to
  relatedTo(DROPDOWN) //Select the specific record the event is related to
  participants(ARRAY) //Add participants to the event
  description(LONG_TEXT) //Additional descriptions or notes related to the event
  tag(MULTI_SELECT_DROPDOWN) //Select tags to associate with this module, "Events".
`updateEvent` props:
  eventId★(DROPDOWN) //Choose the event to update
  eventFields(DYNAMIC)
  enableRecurring(CHECKBOX) //Make this event recurring
  recurringInfo(DYNAMIC)
  enableReminder(CHECKBOX) //Enable reminder for this event
  reminderInfo(DYNAMIC)
  owner(DROPDOWN) //Select the owner to which the record will be assigned.
  relatedModule(DROPDOWN) //Select the type of entity the event is related to
  relatedTo(DROPDOWN) //Select the specific record the event is related to
  tag(MULTI_SELECT_DROPDOWN) //Select tags to associate with this module, "Events".
`createPipeline` props:
  dealName★(SHORT_TEXT) //Provide the name for the pipeline record (deal)
  pipeline(DROPDOWN) //Provide the Team Pipeline to which the pipeline record (deal
  subPipeline★(DROPDOWN) //Pick one of the configured sub-pipelines
  stage★(DROPDOWN) //Provide the current stage of the pipeline record (deal) with
  amount(NUMBER) //The amount of the pipeline record (deal)
  secondaryContacts(MULTI_SELECT_DROPDOWN) //Provide a list of additional contacts associated with the re
  closingDate★(DATE_TIME) //Provide the expected or actual closing date of the pipeline 
  owner(DROPDOWN) //Select the owner to which the record will be assigned.
  accountName(DROPDOWN) //The ID of the company to which the record will be associated
  contactName(DROPDOWN) //The ID of the contact to which the record will be associated
  associatedProducts(MULTI_SELECT_DROPDOWN) //Provide a list of products associated with the record
  tag(MULTI_SELECT_DROPDOWN) //Select tags to associate with this module, "Pipelines".
  additionalFields(DYNAMIC) //Optional fields from the Pipelines module
`updatePipeline` props:
  pipelineRecordId(DROPDOWN) //Select a pipeline record
  pipelineDetails★(DYNAMIC) //These fields will be prepopulated with pipeline data
  pipeline(DROPDOWN) //Provide the Team Pipeline to which the pipeline record (deal
  subPipeline★(DROPDOWN) //Pick one of the configured sub-pipelines
  stage★(DROPDOWN) //Provide the current stage of the pipeline record (deal) with
  owner(DROPDOWN) //Select the owner to which the record will be assigned.
  accountName(DROPDOWN) //The ID of the company to which the record will be associated
  contactName(DROPDOWN) //The ID of the contact to which the record will be associated
  secondaryContacts(MULTI_SELECT_DROPDOWN) //Provide a list of additional contacts associated with the re
  associatedProducts(MULTI_SELECT_DROPDOWN) //Provide a list of products associated with the record
  tag(MULTI_SELECT_DROPDOWN) //Select tags to associate with this module, "Pipelines".
`searchPipelineRecord` props:
  mode★(STATIC_DROPDOWN)='criteria' ["Criteria (Deal Name)"|"Word"]
  dealName★(SHORT_TEXT) //Deal Name (criteria) or word
`searchCompanyRecord` props:
  mode★(STATIC_DROPDOWN)='criteria' ["Criteria (full name)"|"Word"]
  companyName★(SHORT_TEXT) //Company full name (criteria) or word
`searchContactRecord` props:
  mode★(STATIC_DROPDOWN)='criteria' ["Criteria (name/email/mobile)"|"Email"|"Phone"|"Word"] //Choose how to search Contacts
  searchTerm★(SHORT_TEXT) //Text, email, phone, or word based on the selected mode
`searchProductRecord` props:
  mode★(STATIC_DROPDOWN)='criteria' ["Criteria (name/code)"|"Word"]
  searchTerm★(SHORT_TEXT) //Product name/code (criteria) or word
`searchUser` props:
  email★(SHORT_TEXT) //User email address (full or partial, case-insensitive match)
  type(STATIC_DROPDOWN)
  page(NUMBER) //Page index (default 1)
  per_page(NUMBER) //Records per page (max 200, default 200)

### capsule-crm  v2.0.1 | OAuth2
*Manage contacts, projects, and sales opportunities with Capsule CRM.*
**Triggers:** `new_case` `new_opportunity` `new_task` `new_project`
**Actions:** `create_contact` `update_contact` `create_opportunity` `create_project` `create_task` `update_opportunity` `add_note_to_entity` `find_contact` `find_project` `find_opportunity`
`create_contact` props:
  type★(STATIC_DROPDOWN) ["Person"|"Organisation"] //The type of contact to create.
  contactFields★(DYNAMIC)
  about(LONG_TEXT)
  ownerId(DROPDOWN)
  teamId(DROPDOWN)
  tags(MULTI_SELECT_DROPDOWN)
  customFields★(DYNAMIC)
  emailAddresses(ARRAY)
  phoneNumbers(ARRAY)
  addresses(ARRAY)
  websites(ARRAY)
`update_contact` props:
  contact_id★(DROPDOWN) //The contact (Person or Organisation) to select.
  contactFields★(DYNAMIC)
  ownerId(DROPDOWN) //The user to assign the task to.
  teamId(DROPDOWN) //The team to assign the contact to.
  about(LONG_TEXT) //Update the biography or description for the contact.
  addresses(DYNAMIC)
  websites(DYNAMIC)
  emailAddresses(DYNAMIC)
  phoneNumbers(DYNAMIC)
`create_opportunity` props:
  partyId★(DROPDOWN)
  name★(SHORT_TEXT) //A short description of the opportunity.
  description(LONG_TEXT) //More details about the opportunity.
  milestoneId★(DROPDOWN)
  currency(SHORT_TEXT) //The currency for the opportunity value (e.g., USD, GBP).
  amount(NUMBER) //The numerical value of the opportunity.
  expectedCloseOn(DATE_TIME) //The expected closing date for the opportunity.
  probability(NUMBER) //The probability of winning the opportunity.
  durationBasis(STATIC_DROPDOWN) ["Fixed"|"Hour"|"Day"|"Week"|"Month"|"Quarter"|"Year"] //The basis of the duration of the opportunity.
  duration(NUMBER) //The duration of the opportunity.
  ownerId(DROPDOWN) //The user the opportunity is assigned to.
  teamId(DROPDOWN) //The team the opportunity is assigned to.
  tags(MULTI_SELECT_DROPDOWN)
  customFields★(DYNAMIC)
`create_project` props:
  partyId★(DROPDOWN) //The main contact for this project.
  name★(SHORT_TEXT) //The name of this project.
  description(LONG_TEXT) //The description of this project.
  opportunityId(DROPDOWN) //An optional link to the opportunity that this project was cr
  stageId(DROPDOWN) //The stage that this project is on.
  status(STATIC_DROPDOWN) ["Open"|"Closed"] //The status of the project.
  expectedCloseOn(DATE_TIME) //The expected close date of this project.
  ownerId(DROPDOWN) //The user this project is assigned to.
  teamId(DROPDOWN) //The team this project is assigned to.
  tags(MULTI_SELECT_DROPDOWN) //An array of tags that are added to this project.
  customFields(DYNAMIC) //An array of custom fields that are defined for this project.
`create_task` props:
  description★(SHORT_TEXT) //A short description of the task.
  dueOn★(DATE_TIME) //The date when this task is due.
  detail(LONG_TEXT) //More details about the task.
  dueTime(SHORT_TEXT) //The time when this task is due (e.g., 18:00:00). Note: The t
  linkTo(STATIC_DROPDOWN) ["Party (Contact)"|"Opportunity"|"Project"] //The entity this task is linked to. Only one can be selected.
  linkedEntityId(DYNAMIC)
  categoryId(DROPDOWN) //The category of this task.
  ownerId(DROPDOWN) //The user this task is assigned to.
`update_opportunity` props:
  opportunityId★(DROPDOWN)
  name(SHORT_TEXT)
  description(LONG_TEXT)
  milestoneId(DROPDOWN)
  currency(SHORT_TEXT)
  amount(NUMBER)
  expectedCloseOn(DATE_TIME)
  probability(NUMBER)
  durationBasis(STATIC_DROPDOWN) ["Fixed"|"Hour"|"Day"|"Week"|"Month"|"Quarter"|"Year"]
  duration(NUMBER)
  ownerId(DROPDOWN)
  teamId(DROPDOWN)
  tags(DYNAMIC)
  customFields(DYNAMIC)
`add_note_to_entity` props:
  content★(LONG_TEXT) //The body of the note.
  entityType★(STATIC_DROPDOWN) ["Party (Contact)"|"Opportunity"|"Project"] //The type of entity to add the note to.
  entityId★(DYNAMIC)
  activityTypeId(DROPDOWN) //The activity type for this entry. Defaults to "Note".
`find_contact` props:
  term★(SHORT_TEXT) //The value to search for (e.g., a name or email).
`find_project` props:
  filter★(JSON) //The structured filter query. See the [documentation](https:/
`find_opportunity` props:
  filter★(JSON) //The structured filter query. See the [documentation](https:/

### close  v2.0.0 | API Key
*Sales automation and CRM integration for Close*
**Triggers:** `new_lead_created` `new_contact_added` `new_opportunity_added`
**Actions:** `create_lead` `create_contact` `find_lead` `create_opportunity` `find_contact` `custom_api_call`

### kommo  v2.0.0 | Custom(subdomain,apiToken)
*Automate your sales pipeline and customer communications with Kommo. Manage leads, contacts, and com*
**Triggers:** `lead_status_changed` `new_contact_added` `new_lead_created` `new_task_created`
**Actions:** `find_lead` `update_contact` `create_lead` `update_lead` `create_contact` `find_contact` `find_company` `custom_api_call`

### fireberry  v2.0.0 | API Key
*Manage records and automate CRM workflows with Fireberry. Create, update, delete, and search for rec*
**Triggers:** `record_created_or_updated`
**Actions:** `create_record` `update_record` `delete_record` `find_record`

### instantly-ai  v2.0.0 | API Key
*Powerful cold email outreach and lead engagement platform.*
**Triggers:** `campaign_status_changed` `new_lead_added`
**Actions:** `create_campaign` `create_lead_list` `add_lead_to_campaign` `search_campaigns` `search_leads` `custom_api_call`

### hunter  v2.0.0 | API Key
*Find, verify and manage professional email addresses at scale. Automate email discovery, validation,*
**Triggers:** `new-lead`
**Actions:** `add-recipients` `count-emails` `create-lead` `delete-lead` `find-email` `get-lead` `search-leads` `update-lead` `verify-email`

### apollo  v2.0.0 | API Key
*Enrich contact and company data with Apollo.io.*
**Actions:** `matchPerson` `enrichCompany`

### freshdesk  v2.0.0 | Custom(base_url,access_token)
*Customer support software*
**Actions:** `get_tickets` `get_contact_from_id` `get_ticket_status` `get_contacts` `get_all_tickets_by_status` `custom_api_call`

### crisp  v2.0.0 | Custom(identifier,token)
*Improve customer support with Crisp. Manage conversations, update contacts, add notes, and track new*
**Triggers:** `new_contact` `new_conversation`
**Actions:** `add_note` `create_conversation` `create_update_contact` `change_state` `find_conversation` `find_user_profile` `custom_api_call`

### help-scout  v2.0.0 | OAuth2
*Provide customer support with Help Scout. Manage conversations, reply to customers, add notes, and k*
**Triggers:** `conversation_created` `conversation_assigned` `new_customer` `tags_updated`
**Actions:** `create_conversation` `send_reply` `add_note` `create_customer` `update_customer_properties` `find_conversation` `find_customer` `find_user` `custom_api_call`
`conversation_created` props:
  mailboxId★(DROPDOWN)
  assignedTo(DROPDOWN)
`conversation_assigned` props:
  mailboxId★(DROPDOWN)
  assignedTo(DROPDOWN)
`tags_updated` props:
  mailboxId★(DROPDOWN)
  assignedTo(DROPDOWN)
`create_conversation` props:
  mailboxId★(DROPDOWN)
  subject★(SHORT_TEXT)
  customerEmail★(SHORT_TEXT)
  fromUser(DROPDOWN)
  threadType★(STATIC_DROPDOWN) ["Chat"|"Phone"|"Reply"|"Customer"]
  status★(STATIC_DROPDOWN) ["Active"|"Closed"|"Pending"]
  body★(LONG_TEXT)
  assignTo(DROPDOWN)
  tags(ARRAY)
  cc(ARRAY)
  bcc(ARRAY)
  imported(CHECKBOX)
`send_reply` props:
  conversationId(DROPDOWN)
  text★(LONG_TEXT)
  customerEmail★(SHORT_TEXT)
  draft(CHECKBOX)
  status(STATIC_DROPDOWN) ["Active"|"Pending"|"Closed"|"Spam"]
  userId(DROPDOWN)
  cc(ARRAY)
  bcc(ARRAY)
`add_note` props:
  conversationId(DROPDOWN)
  text★(LONG_TEXT)
  userId(DROPDOWN)
`create_customer` props:
  email★(SHORT_TEXT)
  firstName(SHORT_TEXT)
  lastName(SHORT_TEXT)
  phone(SHORT_TEXT)
  photoUrl(SHORT_TEXT)
  jobTitle(SHORT_TEXT)
  location(SHORT_TEXT)
  background(LONG_TEXT)
  age(SHORT_TEXT) //Customer’s age (string, e.g. "30-35")
  gender(STATIC_DROPDOWN) ["Male"|"Female"|"Unknown"]
  organization(SHORT_TEXT)
  socialProfiles(ARRAY) //URLs for social profiles (type will be set to "other")
`update_customer_properties` props:
  customerId★(DROPDOWN)
  fields★(DYNAMIC)
`find_conversation` props:
  subject(SHORT_TEXT)
  mailboxId(DROPDOWN)
  status(STATIC_DROPDOWN) ["Active"|"Open"|"Closed"|"Pending"|"Spam"|"All"]
  assignTo(DROPDOWN)
  email(SHORT_TEXT)
  tags(ARRAY)
  query(SHORT_TEXT)
`find_customer` props:
  email★(SHORT_TEXT)
`find_user` props:
  email★(SHORT_TEXT)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### zendesk  v2.0.1 | Custom(email,token,subdomain)
*Customer service software and support ticket system*
**Triggers:** `new_ticket_in_view` `new_ticket` `updated_ticket` `tag_added_to_ticket` `new_organization` `new_user` `new_suspended_ticket` `new_action_on_ticket`
**Actions:** `create-ticket` `update-ticket` `add-tag-to-ticket` `add-comment-to-ticket` `create-organization` `update-organization` `create-user` `delete-user` `find-organization` `find-tickets` `find-user` `custom_api_call`

### front  v2.0.0 | API Key
*Manage customer communications with Front. Automate messaging, contact management, conversation assi*
**Triggers:** `newComment` `newInboundMessage` `newOutboundMessage` `newTagAddedToMessage` `newConversationStateChange`
**Actions:** `addComment` `addContactHandle` `addConversationLinks` `addConversationTags` `assignUnassignConversation` `createAccount` `createContact` `createDraft` `createDraftReply` `createLink` `findAccount` `findContact` `findConversation` `removeContactHandle` `removeConversationLinks` `sendMessage` `sendReply` `updateAccount` `updateContact` `updateConversation` `updateLink`

### zoho-desk  v2.0.1 | OAuth2
*Helpdesk management software*
**Triggers:** `new_account` `new_agent` `new_article` `new_attachment` `new_comment` `new_contact` `new_message` `new_status_change` `new_ticket` `updated_ticket`
**Actions:** `add_attachment` `add_comment` `create_account` `create_article` `create_contact` `create_ticket` `custom_api_request_beta` `draft_email_reply` `find_contact` `get_ticket` `list_all_threads` `list_tickets` `move_ticket` `search_ticket` `send_email_reply` `update_contact` `update_ticket` `custom_api_call`
`new_account` props:
  orgId★(DROPDOWN)
`new_agent` props:
  orgId★(DROPDOWN)
`new_article` props:
  orgId★(DROPDOWN)
`new_attachment` props:
  orgId★(DROPDOWN)
  ticketId(SHORT_TEXT) //If provided, only this ticket will be monitored.
  maxTickets(NUMBER)=20 //Only used when Ticket ID is not provided. Limits API calls p
`new_comment` props:
  orgId★(DROPDOWN)
  ticketId(SHORT_TEXT) //If provided, only this ticket will be monitored.
  maxTickets(NUMBER)=20 //Only used when Ticket ID is not provided. Limits API calls p
`new_contact` props:
  orgId★(DROPDOWN)
`new_message` props:
  orgId★(DROPDOWN)
  ticketId(SHORT_TEXT) //If provided, only this ticket will be monitored.
  maxTickets(NUMBER)=20 //Only used when Ticket ID is not provided. Limits API calls p
`new_status_change` props:
  orgId★(DROPDOWN)
`new_ticket` props:
  orgId★(DROPDOWN)
`updated_ticket` props:
  orgId★(DROPDOWN)
`add_attachment` props:
  orgId★(DROPDOWN)
  ticketId★(DROPDOWN) //Select the ticket to attach this file to.
  file(FILE) //Local file to upload. Leave empty when using File URL.
  fileUrl(SHORT_TEXT) //Public HTTPS URL of the file to upload. Leave empty when usi
  fileName(SHORT_TEXT) //Optional override for the uploaded file name.
  isPublic(CHECKBOX) //If checked, the attachment will be visible to end users (whe
`add_comment` props:
  orgId★(DROPDOWN)
  ticketId★(SHORT_TEXT)
  isPublic(CHECKBOX)=false //If enabled, comment is visible in the customer portal.
  contentType(STATIC_DROPDOWN)='html' ["HTML"|"Plain Text"]
  content★(LONG_TEXT) //To mention an agent: zsu[@user:{zuid}]zsu. To mention a team
  attachmentIds(ARRAY) //Optional list of attachment IDs (from "Add Attachment" actio
`create_account` props:
  orgId★(DROPDOWN)
  accountName★(SHORT_TEXT) //Name of the account.
  email(SHORT_TEXT)
  phone(SHORT_TEXT)
  website(SHORT_TEXT)
  fax(SHORT_TEXT)
  ownerId(SHORT_TEXT) //ID of the account owner.
  associatedSLAIds(ARRAY) //IDs of the SLAs associated with the account. Only one SLA pe
  industry(SHORT_TEXT)
  city(SHORT_TEXT)
  country(SHORT_TEXT)
  state(SHORT_TEXT)
  street(SHORT_TEXT)
  code(SHORT_TEXT)
  description(LONG_TEXT)
  annualrevenue(NUMBER)
  cf(OBJECT) //Custom fields JSON (mapped to `cf`).
`create_article` props:
  orgId★(DROPDOWN)
  templateId(SHORT_TEXT) //Optional template ID to apply while creating the article.
  categoryId★(SHORT_TEXT) //ID of the knowledge base category (enter exactly as shown in
  title★(SHORT_TEXT)
  answer★(LONG_TEXT)
  permalink(SHORT_TEXT)
  authorId(SHORT_TEXT) //Owner of the article.
  status★(STATIC_DROPDOWN)='Draft' ["Draft"|"Published"|"Review"]
  permission(STATIC_DROPDOWN) ["ALL"|"REGISTEREDUSERS"|"AGENTS"]
  tags(ARRAY)
  seoTitle(SHORT_TEXT)
  seoKeywords(SHORT_TEXT)
  seoDescription(LONG_TEXT)
  isSEOEnabled(CHECKBOX)
  expiryDate(DATE_TIME) //Schedule the expiry date of the article (ISO date-time).
  isTemplate(CHECKBOX)
  extraFields(OBJECT) //Optional extra JSON fields to merge into the request body (f
`create_contact` props:
  orgId★(DROPDOWN)
  firstName(SHORT_TEXT)
  lastName★(SHORT_TEXT)
  facebook(SHORT_TEXT) //Facebook ID of the contact.
  twitter(SHORT_TEXT) //Twitter ID of the contact.
  secondaryEmail(SHORT_TEXT)
  email(SHORT_TEXT)
  phone(SHORT_TEXT)
  mobile(SHORT_TEXT)
  city(SHORT_TEXT)
  country(SHORT_TEXT)
  state(SHORT_TEXT)
  street(SHORT_TEXT)
  zip(SHORT_TEXT)
  description(LONG_TEXT)
  title(SHORT_TEXT)
  type(SHORT_TEXT) //Contact type.
  ownerId(NUMBER) //ID of the user who creates the contact.
  accountId(SHORT_TEXT)
  language(SHORT_TEXT) //Language preference to set for the contact.
  customFields(OBJECT) //Deprecated alias. Custom fields JSON (mapped to `cf`). Prefe
  cf(OBJECT) //User-defined fields related to the contact (mapped to `cf`).
`create_ticket` props:
  orgId★(DROPDOWN)
  departmentId★(DROPDOWN)
  subject★(SHORT_TEXT) //Subject of the ticket (max 255 chars).
  contactId(SHORT_TEXT) //ID of the contact who raised the ticket. If not provided, yo
  contactJson(LONG_TEXT) //Contact object used to auto-create a contact when the ticket
  description(LONG_TEXT) //Description in the ticket (max 65535 chars).
  uploads(ARRAY) //List of upload IDs from the "Add Attachment" action (Zoho ca
  email(SHORT_TEXT) //Email ID in the ticket (max 150 chars).
  phone(SHORT_TEXT) //Phone number in the ticket (max 120 chars).
  status(SHORT_TEXT) //Status of the ticket (max 120 chars). Includes custom status
  priority(SHORT_TEXT) //Priority of the ticket (max 120 chars).
  category(SHORT_TEXT) //Category of the ticket (max 300 chars).
  subCategory(SHORT_TEXT) //Subcategory of the ticket (max 300 chars).
  resolution(LONG_TEXT) //Resolution notes recorded in the ticket (max 65535 chars).
  dueDate(DATE_TIME) //Due date for resolving the ticket (timestamp).
  channel(SHORT_TEXT) //Channel through which the ticket originated (max 120 chars).
  classification(STATIC_DROPDOWN) ["Problem"|"Request"|"Question"|"Others"] //Type of ticket. Values supported are Problem, Request, Quest
  language(SHORT_TEXT) //Language preference to set for the ticket (max 255 chars).
  sharedDepartmentsJson(LONG_TEXT) //Optional JSON array of objects representing shared departmen
  webUrl(SHORT_TEXT) //URL to access the resource (max 5000 chars).
  customFields(OBJECT) //Deprecated. Use `cf` instead.
  cf(OBJECT) //Custom fields in the ticket.
  fields(OBJECT) //Optional raw JSON object to include additional fields or ove
`custom_api_request_beta` props:
  orgId★(DROPDOWN)
  method★(STATIC_DROPDOWN)='GET' ["GET"|"POST"|"PUT"|"PATCH"|"DELETE"]
  path★(SHORT_TEXT) //Relative path under /api/v1, e.g. tickets, tickets/{ticketId
  query_params_json(LONG_TEXT) //Optional JSON object of query parameters.
  body_json(LONG_TEXT) //Optional JSON body for POST/PUT/PATCH requests.
`draft_email_reply` props:
  orgId★(DROPDOWN)
  ticketId★(SHORT_TEXT)
  isPrivate(CHECKBOX)=false
  to(SHORT_TEXT)
  fromEmailAddress(SHORT_TEXT) //Must be a From Address verified in your Zoho Desk portal (Se
  cc(ARRAY) //List of emails to CC.
  bcc(ARRAY) //List of emails to BCC.
  contentType(STATIC_DROPDOWN)='plainText' ["Plain Text"|"HTML"] //Select HTML if your content contains HTML tags (e.g. <p>, <b
  content★(LONG_TEXT)
  ticketStatus(SHORT_TEXT) //Optional. Updates ticket status as part of the draft (status
  direction(STATIC_DROPDOWN) ["out"|"in"] //Optional. Defaults to outgoing for replies. Provided for com
  isForward(CHECKBOX)=false
  inReplyToThreadId(SHORT_TEXT)
  attachmentIds(ARRAY) //Optional list of attachment IDs (from "Add Attachment" actio
`find_contact` props:
  orgId★(DROPDOWN)
  from(NUMBER)=0 //The starting index for fetching results. Range: 0-4999.
  limit(NUMBER)=10 //Number of contacts to fetch. Range: 1-100.
  id(NUMBER) //ID of the contact (exact match).
  fullName(SHORT_TEXT) //Full name of the contact (wildcard search).
  firstName(SHORT_TEXT) //First name of the contact (wildcard search). Supports empty/
  lastName(SHORT_TEXT) //Last name of the contact (wildcard search).
  email(SHORT_TEXT) //Email ID of the contact (wildcard search). Supports empty/no
  phone(SHORT_TEXT) //Phone number of the contact (wildcard search). Supports empt
  mobile(SHORT_TEXT) //Mobile number of the contact (wildcard search). Supports emp
  accountName(SHORT_TEXT) //Name of the account associated with the contact (wildcard se
  _all(SHORT_TEXT) //Find throughout the contact (wildcard search).
  customField1(SHORT_TEXT) //Use format: apiName:searchValue (e.g. "cf_mappedWithAccount:
  customField2(SHORT_TEXT) //Use format: apiName:searchValue
  customField3(SHORT_TEXT) //Use format: apiName:searchValue
  customField4(SHORT_TEXT) //Use format: apiName:searchValue
  customField5(SHORT_TEXT) //Use format: apiName:searchValue
  customField6(SHORT_TEXT) //Use format: apiName:searchValue
  customField7(SHORT_TEXT) //Use format: apiName:searchValue
  customField8(SHORT_TEXT) //Use format: apiName:searchValue
  customField9(SHORT_TEXT) //Use format: apiName:searchValue
  customField10(SHORT_TEXT) //Use format: apiName:searchValue
  createdTimeRange(SHORT_TEXT) //ISO range "from,to" (e.g. "2017-11-05T00:00:00.000Z,2018-09-
  modifiedTimeRange(SHORT_TEXT) //ISO range "from,to" (e.g. "2017-11-05T00:00:00.000Z,2018-09-
  sortBy(SHORT_TEXT) //SortBy can be relevance, modifiedTime, createdTime, lastName
  advancedQueryParamsJson(LONG_TEXT) //Optional raw JSON object of query params to merge/override a
`get_ticket` props:
  orgId★(DROPDOWN)
  ticketId★(SHORT_TEXT)
  include(STATIC_MULTI_SELECT_DROPDOWN) ["contacts"|"products"|"assignee"|"departments"|"contract"|"isRead"|"team"|"skills"] //Fetch secondary information related to the ticket. Multiple 
`list_all_threads` props:
  orgId★(DROPDOWN)
  ticketId★(SHORT_TEXT)
  from(NUMBER) //Index number starting from which the threads must be fetched
  limit★(NUMBER)=100 //Number of threads to fetch (1-200). Default is 100.
  sortBy(STATIC_DROPDOWN)='-sendDateTime' ["sendDateTime (ascending)"|"sendDateTime (descending)"]
  includePlainText(CHECKBOX)=false //If enabled, includes plainText when available.
`list_tickets` props:
  orgId★(DROPDOWN)
  from(NUMBER)=0 //Index number, starting from which the tickets must be fetche
  limit(NUMBER)=100 //Number of tickets to fetch. Range: 1-100.
  departmentIds(SHORT_TEXT) //Comma-separated department IDs to fetch tickets from (e.g. "
  teamIds(SHORT_TEXT) //Comma-separated team IDs to filter by team. You can also use
  viewId(NUMBER) //ID of the view to apply while fetching tickets.
  assignee(SHORT_TEXT) //Comma-separated assignee IDs to filter by assignee. You can 
  channel(SHORT_TEXT) //Filter by channel through which the tickets originated. You 
  status(SHORT_TEXT) //Filter by resolution status of the ticket. You can include m
  priority(SHORT_TEXT) //Filter by priority. You can include multiple values by separ
  sortByField(STATIC_DROPDOWN) ["Response due date"|"Customer response time"|"Created time"] //Sort by a specific attribute. Default order is ascending. Us
  sortDescending(CHECKBOX)=true //If enabled and Sort By is set, "-" will be prefixed to sort 
  receivedInDays(STATIC_DROPDOWN) ["15"|"30"|"90"] //Fetches recent tickets, based on customer response time. Val
  include(STATIC_MULTI_SELECT_DROPDOWN) ["contacts"|"products"|"departments"|"team"|"isRead"|"assignee"] //Additional information related to the tickets.
  fields(SHORT_TEXT) //Comma-separated list of fields (pre-defined and custom) to r
`move_ticket` props:
  orgId★(DROPDOWN)
  ticketId★(SHORT_TEXT)
  departmentId★(SHORT_TEXT) //ID of the department to which you want to move the ticket.
  forumId(SHORT_TEXT) //Optional. Community sub-category ID to move forum-converted 
`search_ticket` props:
  orgId★(DROPDOWN)
  from(NUMBER)=0 //Starting index for fetching results (0-4999). Default: 0.
  limit(NUMBER)=10 //Number of tickets to fetch (1-100). Default: 10.
  departmentId(NUMBER) //ID of the department to search in. If not set, searches acro
  id(NUMBER) //Exact match. Using unique ID may cost 1 credit.
  ticketNumber(SHORT_TEXT) //Exact match.
  subject(SHORT_TEXT) //Wildcard search. Example: analysis*
  description(SHORT_TEXT) //Wildcard search.
  status(SHORT_TEXT) //Exact match. Can include multiple values separated by commas
  priority(SHORT_TEXT) //Exact match.
  email(SHORT_TEXT) //Wildcard search. Examples: jack* , ${empty} , ${notempty}
  phone(SHORT_TEXT) //Wildcard search. Supports ${empty}/${notempty}.
  channel(SHORT_TEXT) //Exact match. Supports ${empty}/${notempty}.
  category(SHORT_TEXT) //Wildcard search. Supports ${empty}/${notempty}.
  assigneeId(NUMBER) //Exact match.
  contactId(NUMBER) //Exact match.
  accountId(NUMBER) //Exact match.
  productId(NUMBER) //Exact match.
  contactName(SHORT_TEXT) //Wildcard search.
  accountName(SHORT_TEXT) //Wildcard search. Supports ${empty}/${notempty}.
  productName(SHORT_TEXT) //Wildcard search. Supports ${empty}/${notempty}.
  tag(SHORT_TEXT) //Wildcard search. Supports ${empty}/${notempty}.
  _all(SHORT_TEXT) //Wildcard search across all columns in tickets module.
  customField1(SHORT_TEXT) //Format: FieldApiName:value
  customField2(SHORT_TEXT) //Format: FieldApiName:value
  customField3(SHORT_TEXT) //Format: FieldApiName:value
  customField4(SHORT_TEXT) //Format: FieldApiName:value
  customField5(SHORT_TEXT) //Format: FieldApiName:value
  customField6(SHORT_TEXT) //Format: FieldApiName:value
  customField7(SHORT_TEXT) //Format: FieldApiName:value
  customField8(SHORT_TEXT) //Format: FieldApiName:value
  customField9(SHORT_TEXT) //Format: FieldApiName:value
  customField10(SHORT_TEXT) //Format: FieldApiName:value
  customerResponseTimeRange(SHORT_TEXT) //ISO range: yyyy-MM-ddThh:mm:ss.SSSZ,yyyy-MM-ddThh:mm:ss.SSSZ
  createdTimeRange(SHORT_TEXT) //ISO range: yyyy-MM-ddThh:mm:ss.SSSZ,yyyy-MM-ddThh:mm:ss.SSSZ
  modifiedTimeRange(SHORT_TEXT) //ISO range: yyyy-MM-ddThh:mm:ss.SSSZ,yyyy-MM-ddThh:mm:ss.SSSZ
  dueDateRange(SHORT_TEXT) //ISO range: yyyy-MM-ddThh:mm:ss.SSSZ,yyyy-MM-ddThh:mm:ss.SSSZ
  sortBy(STATIC_DROPDOWN) //Sort by relevance, modifiedTime, createdTime, or customerRes
  queryParamsJson(LONG_TEXT) //Optional JSON object of query params. Useful for fields not 
`send_email_reply` props:
  orgId★(DROPDOWN)
  ticketId★(SHORT_TEXT)
  isPrivate(CHECKBOX)=false
  sendImmediately(CHECKBOX)=false //Specify whether the reply has to be sent immediately.
  to(SHORT_TEXT)
  fromEmailAddress(SHORT_TEXT) //Must be a From Address verified in your Zoho Desk portal (Se
  cc(ARRAY) //List of emails to CC.
  bcc(ARRAY) //List of emails to BCC.
  contentType(STATIC_DROPDOWN)='plainText' ["Plain Text"|"HTML"]
  content★(LONG_TEXT)
  ticketStatus(SHORT_TEXT) //Optional. Updates ticket status as part of the reply (status
  direction(STATIC_DROPDOWN) ["out"|"in"] //Optional. Defaults to outgoing for replies. Provided for com
  isForward(CHECKBOX)=false
  inReplyToThreadId(SHORT_TEXT)
  attachmentIds(ARRAY) //Optional list of attachment IDs (from "Add Attachment" actio
`update_contact` props:
  orgId★(DROPDOWN)
  contactId★(SHORT_TEXT)
  firstName(SHORT_TEXT)
  lastName(SHORT_TEXT)
  facebook(SHORT_TEXT)
  twitter(SHORT_TEXT)
  secondaryEmail(SHORT_TEXT)
  email(SHORT_TEXT)
  phone(SHORT_TEXT)
  mobile(SHORT_TEXT)
  city(SHORT_TEXT)
  country(SHORT_TEXT)
  state(SHORT_TEXT)
  street(SHORT_TEXT)
  zip(SHORT_TEXT)
  description(LONG_TEXT)
  title(SHORT_TEXT)
  type(SHORT_TEXT)
  ownerId(NUMBER)
  accountId(NUMBER)
  language(SHORT_TEXT)
  customFields(OBJECT) //Deprecated alias. Custom fields JSON (mapped to `cf`). Prefe
  cf(OBJECT) //User-defined fields related to the contact (mapped to `cf`).
  fields(OBJECT) //Optional raw JSON object of fields to update. When provided,
`update_ticket` props:
  orgId★(DROPDOWN)
  ticketId★(SHORT_TEXT)
  disableClosureNotification(CHECKBOX) //If enabled, Zoho Desk will not send closure notifications to
  subject(SHORT_TEXT)
  departmentId(NUMBER)
  contactId(NUMBER)
  productId(NUMBER)
  uploads(ARRAY) //List of upload IDs from the "Add Attachment" action (Zoho ca
  email(SHORT_TEXT)
  phone(SHORT_TEXT)
  description(LONG_TEXT)
  status(SHORT_TEXT)
  assigneeId(NUMBER)
  category(SHORT_TEXT)
  subCategory(SHORT_TEXT)
  resolution(LONG_TEXT)
  dueDate(DATE_TIME)
  priority(SHORT_TEXT)
  language(SHORT_TEXT)
  channel(SHORT_TEXT)
  classification(SHORT_TEXT) //Values typically include: Problem, Request, Question, Others
  teamId(NUMBER)
  secondaryContacts(ARRAY) //Secondary contact IDs (e.g. CC'ed users).
  entitySkills(ARRAY) //Skill IDs to be mapped with a ticket (order defines priority
  sharedDepartmentsJson(LONG_TEXT) //Optional JSON array of objects like [{ "id": 123, "type": "R
  webUrl(SHORT_TEXT)
  customFields(OBJECT) //Deprecated alias. Custom fields JSON (mapped to `cf`). Prefe
  cf(OBJECT) //Custom fields JSON (mapped to `cf`).
  fields(OBJECT) //Optional raw JSON object of fields to update. When provided,
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)
  orgId(DROPDOWN) //Select organization ID to include in auth headers.

### moxie-crm  v2.0.0 | Custom(apiKey,baseUrl)
*CRM build for the freelancers.*
**Triggers:** `moxie_trigger_client_created` `moxie_trigger_client_updated` `moxie_trigger_client_deleted` `moxie_trigger_project_created` `moxie_trigger_project_updated` `moxie_trigger_project_completed` `moxie_trigger_task_created` `moxie_trigger_task_updated` `moxie_trigger_task_deleted` `moxie_trigger_client_task_approval` `moxie_trigger_form_submitted` `moxie_trigger_time_entry_created` `moxie_trigger_time_entry_updated` `moxie_trigger_time_entry_deleted` `moxie_trigger_meeting_scheduled` `moxie_trigger_meeting_updated` `moxie_trigger_meeting_cancelled` `moxie_trigger_opportunity_created` `moxie_trigger_opportunity_updated` `moxie_trigger_opportunity_deleted` `moxie_trigger_invoice_sent` `moxie_trigger_payment_received`
**Actions:** `moxie_create_client` `moxie_create_task` `moxie_create_project` `custom_api_call`

### vtiger  v2.0.0 | Custom(instance_url,username,password)
*CRM software for sales, marketing, and support teams*
**Triggers:** `new_or_updated_record`
**Actions:** `create_record` `get_record` `update_record` `delete_record` `query_records` `search_records` `make_api_call` `custom_api_call`

### wealthbox  v2.0.0 | API Key
*Manage your financial advisory practice with Wealthbox. Automate contact management, note-taking, pr*
**Triggers:** `new_task` `new_contact` `new_event` `new_opportunity`
**Actions:** `create_contact` `create_note` `create_project` `add_household_member` `create_household` `create_event` `create_opportunity` `create_task` `start_workflow` `find_contact` `find_task`

### flowlu  v2.0.0 | Custom(domain,apiKey)
*Business management software*
**Actions:** `flowlu_create_contact` `flowlu_update_contact` `flowlu_delete_contact` `flowlu_create_organization` `flowlu_create_opportunity` `flowlu_update_opportunity` `flowlu_delete_opportunity` `flowlu_create_task` `flowlu_update_task` `flowlu_get_task` `flowlu_delete_task`

### linka  v2.0.0 | Custom(base_url,api_key)
*Linka white-label B2B marketplace platform powers communities and digital storefronts*
**Triggers:** `newLead` `newPayment` `newSubscription`
**Actions:** `addOrUpdateContact` `addOrUpdateContactExtended` `addOrUpdateSubscription` `createInvoice` `createProduct` `getContactDetails`

### lemlist  v2.0.0 | API Key
*Automate your cold email outreach with Lemlist. Manage leads, track activities, and update campaign *
**Triggers:** `newActivity` `unsubscribedRecipient`
**Actions:** `markLeadFromOneCampaignAsInterested` `markLeadFromOneCampaignAsNotInterested` `markLeadFromAllCampaignAsInterested` `markLeadFromAllCampaignsAsNotInterested` `pauseLeadFromAllOrSpecificCampaigns` `resumeLeadFromAllOrSpecificCampaigns` `removeLeadFromUnsubscribeList` `removeLeadFromACampaign` `unsubscribeALead` `addLeadToACampaign` `updateLeadFromCampaign` `searchLead`

### reachinbox  v2.0.0 | API Key
*Supercharge your cold email outreach with Reachinbox. Automate lead management, campaign execution, *
**Triggers:** `campaignCompleted` `emailBounced` `emailOpened` `emailSent` `leadInterested` `leadNotInterested` `replyReceived`
**Actions:** `addLeads` `addBlocklist` `addEmail` `enableWarmup` `getCampaignAnalytics` `getSummary` `pauseCampaign` `pauseWarmup` `removeEmail` `setSchedule` `startCampaign` `updateLead` `custom_api_call`

### teamleader  v2.0.1 | OAuth2
*Manage your CRM activities with Teamleader. Automate contact and company management, track deals and*
**Triggers:** `new_contact` `new_company` `new_deal` `deal_accepted` `new_invoice`
**Actions:** `create_contact` `update_contact` `create_company` `update_company` `link_contact_to_company` `unlink_contact_from_company` `create_deal` `update_deal` `search_companies` `search_contacts` `search_deals` `search_invoices` `custom_api_call`

### quickzu  v2.0.0 | API Key
*Streamline ordering from whatsapp*
**Triggers:** `quickzu_order_created_trigger`
**Actions:** `quickzu_add_product` `quickzu_update_product` `quickzu_delete_product` `quickzu_list_products` `quickzu_create_category` `quickzu_update_category` `quickzu_delete_category` `quickzu_list_categories` `quickzu_get_order_details` `quickzu_list_orders` `quickzu_list_live_orders` `quickzu_update_order_status` `quickzu_create_product_discount` `quickzu_create_promo_code` `quickzu_update_business_time`

### sperse  v2.0.0 | Custom(base_url,api_key)
*Sperse CRM enables secure payment processing and affiliate marketing for online businesses*
**Triggers:** `new_lead` `new_payment` `new_subscription`
**Actions:** `addOrUpdateContact` `addOrUpdateContactExtended` `addOrUpdateSubscription` `createInvoice` `createProduct` `getContactDetails`

### village  v2.0.0 | API Key
*The Social Capital API*
**Actions:** `getPersonPaths` `sortPeople` `enrichEmail` `enrichPersonBasic` `enrichPersonBasicBulk` `enrichEmailsBulk` `getCompanyPaths` `sortCompanies` `enrichCompanyBasic` `enrichCompanyBasicBulk`

### clearout  v2.0.0 | Custom(apiKey)
*Bulk email validation and verification*
**Actions:** `instant_verify` `custom_api_call`

### reoon-verifier  v2.0.0 | API Key
*Email validation service that cleans invalid, temporary & unsafe email addresses.*
**Actions:** `verifyEmail` `bulkEmailVerificationTask` `bulkVerificationResult`

### zerobounce  v2.0.0 | API Key
*ZeroBounce is an email validation service that helps you reduce bounces, improve email deliverabilit*
**Actions:** `validateEmail`

### lusha  v2.0.0 | API Key
*Find and enrich company data with Lusha. Search for companies and retrieve detailed business informa*
**Actions:** `search_companies` `enrich_companies` `custom_api_call`

### magical-api  v2.0.0 | API Key
*Automate resume parsing, review, scoring, and LinkedIn profile/company data retrieval with Magical A*
**Actions:** `parse_resume` `review_resume` `get_profile_data` `get_company_data` `score_resume` `custom_api_call`

### predict-leads  v2.0.0 | Custom(apiKey,apiToken)
*Company Intelligence Data Source*
**Actions:** `predict-leads_find_companies` `predict-leads_find_company_by_domain` `predict-leads_find_job_openings` `predict-leads_find_company_job_openings` `predict-leads_get_a_job_opening_by_id` `predict-leads_find_technologies_by_domain` `predict-leads_find_companies_by_technology_id` `predict-leads_find_news_by_domain` `predict-leads_find_news_event_by_id` `predict-leads_find_connections` `predict-leads_find_connections_by_domain` `custom_api_call`

### captain-data  v2.0.0 | Custom(apiKey,projectId)
*Automate data extraction and lead generation by launching workflows and retrieving job results with *
**Actions:** `launchWorkflow` `getJobResults` `custom_api_call`

### saastic  v2.0.0 | API Key
*Revenue and churn analytics for Stripe*
**Actions:** `create_customer` `create_charge` `custom_api_call`

### returning-ai  v2.0.0 | API Key
*Enhance your customer interactions with Returning AI. Automate sending, replying to, and reacting to*
**Actions:** `sendMessage` `replyMessage` `reactMessage`

### wootric  v2.0.0 | OAuth2
*Measure and boost customer happiness*
**Actions:** `trigger_wootric_survey`

### pylon  v2.0.0 | API Key
*Scale your customer support with Pylon. Use the custom API call action to interact with the Pylon AP*
**Actions:** `custom_api_call`

### talkable  v2.0.0 | Custom(site,api_key)
*Referral marketing programs that drive revenue*
**Actions:** `find_person` `find_coupon` `update_person` `anonymize_person` `unsubscribe_person` `create_purchase` `create_purchases_batch` `create_event` `create_events_batch` `refund` `get_loyalty_redeem_actions` `update-referral-status` `claim-offer` `custom_api_call`

### gameball  v2.0.0 | API Key
*Engage and retain customers with Gameball. Automate event tracking and customer loyalty interactions*
**Actions:** `sendEvent`

### upgradechat  v2.0.0 | Custom(base_url,api_key)
*Supercharge your Discord or Telegram communities with subscription payments and membership tools.*
**Triggers:** `newLead` `newPayment` `newSubscription`
**Actions:** `addOrUpdateContact` `addOrUpdateContactExtended` `addOrUpdateSubscription` `createInvoice` `createProduct` `getContactDetails`


## ★ PROJECT MANAGEMENT

### clickup  v2.0.0 | OAuth2
*All-in-one productivity platform*
**Triggers:** `clickup_trigger_task_created` `clickup_trigger_task_updated` `clickup_trigger_task_deleted` `clickup_trigger_task_priority_updated` `clickup_trigger_task_status_updated` `clickup_trigger_task_assignee_updated` `clickup_trigger_task_due_date_updated` `clickup_trigger_task_tag_updated` `clickup_trigger_task_moved` `clickup_trigger_task_comment_posted` `clickup_trigger_task_comment_updated` `clickup_trigger_task_time_estimate_updated` `clickup_trigger_task_time_tracked_updated` `clickup_trigger_list_created` `clickup_trigger_list_updated` `clickup_trigger_list_deleted` `clickup_trigger_folder_created` `clickup_trigger_folder_updated` `clickup_trigger_folder_deleted` `clickup_trigger_space_created` `clickup_trigger_space_updated` `clickup_trigger_space_deleted` `clickup_trigger_automation_created` `clickup_trigger_goal_created` `clickup_trigger_goal_updated` `clickup_trigger_goal_deleted` `clickup_trigger_key_result_created` `clickup_trigger_key_result_updated` `clickup_trigger_key_result_deleted` `task_tag_updated`
**Actions:** `create_task` `create_task_from_template` `create_folderless_list` `create_task_comments` `create_subtask` `create_channel` `create_channel_in_space_folder_list` `create_message` `create_message_reaction` `create_message_reply` `get_list` `get_list_task` `get_task_by_name` `get_space` `get_spaces` `get_task_comments` `get_channel` `get_channels` `get_channel_messages` `get_message_reactions` `get_message_replies` `list_workspace_tasks` `list_workspace_time_entries` `update_task` `update_message` `delete_message` `delete_message_reaction` `delete_task` `get_accessible_custom_fields` `set_custom_fields_value` `custom_api_call`

### asana  v2.0.0 | OAuth2
*Work management platform designed to help teams organize, track, and manage their work.*
**Actions:** `create_task` `custom_api_call`

### jira-cloud  v2.0.0 | Custom(instanceUrl,email,apiToken)
*Issue tracking and project management*
**Triggers:** `new_issue` `updated_issue` `updated_issue_status`
**Actions:** `create_issue` `update_issue` `find-user` `search_issues` `assign_issue` `add_issue_attachment` `get-issue-attachment` `add-watcher-to-issue` `add_issue_comment` `update_issue_comment` `link-issues` `list_issue_comments` `delete_issue_comment` `markdownToJiraFormat` `custom_api_call`
`new_issue` props:
  jql(LONG_TEXT) //Use to filter issues watched
  sanitizeJql(CHECKBOX)=true
`updated_issue` props:
  jql(LONG_TEXT) //Use to filter issues watched
  sanitizeJql(CHECKBOX)=false
`updated_issue_status` props:
  jql(LONG_TEXT) //Use to filter issues watched
  sanitizeJql(CHECKBOX)=true
`create_issue` props:
  projectId★(DROPDOWN)
  issueTypeId★(DROPDOWN)
  issueFields★(DYNAMIC)
`update_issue` props:
  issueId★(DROPDOWN)
  statusId(DROPDOWN)
  issueFields★(DYNAMIC)
`find-user` props:
  keyword★(SHORT_TEXT)
`search_issues` props:
  jql★(LONG_TEXT) //The JQL query to use in the search
  maxResults★(NUMBER)=50
  sanitizeJql★(CHECKBOX)=true
`assign_issue` props:
  projectId★(DROPDOWN)
  issueId★(DROPDOWN)
  assignee★(DROPDOWN)
`add_issue_attachment` props:
  projectId★(DROPDOWN)
  issueId★(DROPDOWN)
  attachment★(FILE)
`get-issue-attachment` props:
  attachmentId★(SHORT_TEXT)
`add-watcher-to-issue` props:
  issueId★(DROPDOWN)
  userId★(DROPDOWN)
`add_issue_comment` props:
  projectId★(DROPDOWN)
  issueId★(DROPDOWN)
  comment★(LONG_TEXT)
  isADF(CHECKBOX)=false //https://developer.atlassian.com/cloud/jira/platform/apis/doc
`update_issue_comment` props:
  projectId★(DROPDOWN)
  issueId★(DROPDOWN)
  commentId★(DROPDOWN)
  comment★(LONG_TEXT)
`link-issues` props:
  firstIssueId★(DROPDOWN)
  issueLinkTypeId★(DROPDOWN)
  secondIssueId★(DROPDOWN)
`list_issue_comments` props:
  projectId★(DROPDOWN)
  issueId★(DROPDOWN)
  orderBy★(STATIC_DROPDOWN)='-created' ["Created (Descending)"|"Created (Ascending)"]
  limit★(NUMBER)=10 //Maximum number of results
`delete_issue_comment` props:
  projectId★(DROPDOWN)
  issueId★(DROPDOWN)
  commentId★(DROPDOWN)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### monday  v2.0.0 | API Key
*Work operating system for businesses*
**Triggers:** `monday_new_item_in_board` `monday_specific_column_updated`
**Actions:** `monday_create_column` `monday_create_group` `monday_create_item` `monday_create_update` `monday_get_board_values` `monday_get_item_column_values` `monday_update_column_values_of_item` `monday_update_item_name` `monday_upload_file_to_column`
`monday_new_item_in_board` props:
  workspace_id★(DROPDOWN)
  board_id★(DROPDOWN)
`monday_specific_column_updated` props:
  workspace_id★(DROPDOWN)
  board_id★(DROPDOWN)
  column_id★(DROPDOWN)
`monday_create_column` props:
  workspace_id★(DROPDOWN)
  board_id★(DROPDOWN)
  column_title★(SHORT_TEXT)
  column_type★(STATIC_DROPDOWN)
`monday_create_group` props:
  workspace_id★(DROPDOWN)
  board_id★(DROPDOWN)
  group_name★(SHORT_TEXT)
`monday_create_item` props:
  workspace_id★(DROPDOWN)
  board_id★(DROPDOWN)
  group_id(DROPDOWN)
  item_name★(SHORT_TEXT) //Item Name
  column_values★(DYNAMIC)
  create_labels_if_missing(CHECKBOX)=false //Creates status/dropdown labels if they are missing. This req
`monday_create_update` props:
  item_id★(SHORT_TEXT)
  body★(LONG_TEXT)
`monday_get_board_values` props:
  workspace_id★(DROPDOWN)
  board_id★(DROPDOWN)
  column_ids(MULTI_SELECT_DROPDOWN) //Limit data output by specifying column IDs; leave empty to d
`monday_get_item_column_values` props:
  workspace_id★(DROPDOWN)
  board_id★(DROPDOWN)
  item_id★(DROPDOWN)
  column_ids(MULTI_SELECT_DROPDOWN) //Limit data output by specifying column IDs; leave empty to d
`monday_update_column_values_of_item` props:
  workspace_id★(DROPDOWN)
  board_id★(DROPDOWN)
  item_id★(DROPDOWN)
  column_values★(DYNAMIC)
`monday_update_item_name` props:
  workspace_id★(DROPDOWN)
  board_id★(DROPDOWN)
  item_id★(DROPDOWN)
  name★(SHORT_TEXT)
`monday_upload_file_to_column` props:
  workspace_id★(DROPDOWN)
  board_id★(DROPDOWN)
  item_id★(DROPDOWN)
  file_column_id★(DROPDOWN)
  file★(FILE) //The file URL or base64 to upload.
  file_name★(SHORT_TEXT)

### trello  v2.0.0 | Basic Auth
*Project management tool for teams*
**Triggers:** `card_moved_to_list` `new_card` `deadline`
**Actions:** `create_card` `get_card`
`card_moved_to_list` props:
  board_id★(DROPDOWN) //List of boards
  list_id★(DROPDOWN) //Get lists from a board
`new_card` props:
  board_id★(DROPDOWN) //List of boards
  list_id_opt(DROPDOWN) //Get lists from a board
`deadline` props:
  board_id★(DROPDOWN) //List of boards
  list_id_opt(DROPDOWN) //Get lists from a board
  time_unit★(STATIC_DROPDOWN)='hours' ["Minutes"|"Hours"] //Select unit for time before due
  time_before_due★(NUMBER)=24 //How long before the due date the trigger should run (use wit
`create_card` props:
  board_id★(DROPDOWN) //List of boards
  list_id★(DROPDOWN) //Get lists from a board
  name★(SHORT_TEXT) //The name of the card to create
  description(LONG_TEXT) //The description of the card to create
  position(STATIC_DROPDOWN) ["Top"|"Bottom"] //Place the card on top or bottom of the list
  labels(MULTI_SELECT_DROPDOWN) //Assign labels to the card
`get_card` props:
  cardId★(SHORT_TEXT) //The card ID

### linear  v2.0.0 | API Key
*Issue tracking for modern software teams*
**Triggers:** `new_issue` `updated_issue` `removed_issue`
**Actions:** `linear_create_issue` `linear_update_issue` `linear_create_project` `linear_update_project` `linear_create_comment` `rawGraphqlQuery`
`new_issue` props:
  team_id★(DROPDOWN) //The team for which the issue, project or comment will be cre
`updated_issue` props:
  team_id(DROPDOWN) //The team for which the issue, project or comment will be cre
`removed_issue` props:
  team_id★(DROPDOWN) //The team for which the issue, project or comment will be cre
`linear_create_issue` props:
  team_id★(DROPDOWN) //The team for which the issue, project or comment will be cre
  title★(SHORT_TEXT)
  description(LONG_TEXT)
  state_id(DROPDOWN) //Status of the Issue
  labels(MULTI_SELECT_DROPDOWN) //Labels for the Issue
  assignee_id(DROPDOWN) //Assignee of the Issue / Comment
  priority_id(DROPDOWN) //Priority of the Issue
  template_id(DROPDOWN) //ID of Template
`linear_update_issue` props:
  team_id★(DROPDOWN) //The team for which the issue, project or comment will be cre
  issue_id★(DROPDOWN) //ID of Linear Issue
  title(SHORT_TEXT)
  description(LONG_TEXT)
  state_id(DROPDOWN) //Status of the Issue
  labels(MULTI_SELECT_DROPDOWN) //Labels for the Issue
  assignee_id(DROPDOWN) //Assignee of the Issue / Comment
  priority_id(DROPDOWN) //Priority of the Issue
`linear_create_project` props:
  team_id★(DROPDOWN) //The team for which the issue, project or comment will be cre
  name★(SHORT_TEXT)
  description(LONG_TEXT)
  icon(SHORT_TEXT)
  color(SHORT_TEXT)
  startDate(DATE_TIME)
  targetDate(DATE_TIME)
`linear_update_project` props:
  team_id★(DROPDOWN) //The team for which the issue, project or comment will be cre
  project_id★(DROPDOWN) //ID of Linear Project
  name★(SHORT_TEXT)
  description(LONG_TEXT)
  icon(SHORT_TEXT)
  color(SHORT_TEXT)
  startDate(DATE_TIME)
  targetDate(DATE_TIME)
`linear_create_comment` props:
  team_id★(DROPDOWN) //The team for which the issue, project or comment will be cre
  user_id(DROPDOWN) //Assignee of the Issue / Comment
  issue_id★(DROPDOWN) //ID of Linear Issue
  body★(LONG_TEXT) //The content of the comment
`rawGraphqlQuery` props:
  query★(LONG_TEXT)
  variables(OBJECT)

### todoist  v2.0.0 | OAuth2
*To-do list and task manager*
**Triggers:** `task_completed`
**Actions:** `create_task` `update_task` `find_task` `mark_task_completed` `custom_api_call`
`task_completed` props:
  project_id(DROPDOWN) //Leave it blank if you want to get completed tasks from all y
`create_task` props:
  project_id(DROPDOWN) //Task project ID. If not set, task is put to user's Inbox.
  content★(LONG_TEXT) //The task's content. It may contain some markdown-formatted t
  description(LONG_TEXT) //A description for the task. This value may contain some mark
  labels(ARRAY) //The task's labels (a list of names that may represent either
  priority(NUMBER) //Task priority from 1 (normal) to 4 (urgent)
  due_date(SHORT_TEXT) //Can be either a specific date in YYYY-MM-DD format relative 
  section_id(DROPDOWN)
`update_task` props:
  task_id★(SHORT_TEXT)
  content(LONG_TEXT) //The task's content. It may contain some markdown-formatted t
  description(LONG_TEXT) //A description for the task. This value may contain some mark
  labels(ARRAY) //The task's labels (a list of names that may represent either
  priority(NUMBER) //Task priority from 1 (normal) to 4 (urgent)
  due_date(SHORT_TEXT) //Can be either a specific date in YYYY-MM-DD format relative 
`find_task` props:
  name★(SHORT_TEXT) //The name of the task to search for.
  project_id(DROPDOWN) //Search for tasks within the selected project. If left blank,
`mark_task_completed` props:
  task_id★(SHORT_TEXT)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### github  v2.0.0 | OAuth2
*Developer platform that allows developers to create, store, manage and share their code*
**Triggers:** `trigger_pull_request` `trigger_star` `trigger_issues` `trigger_push` `trigger_discussion` `trigger_discussion_comment` `new_branch` `new_collaborator` `new_label` `new_milestone` `new_release`
**Actions:** `github_create_issue` `getIssueInformation` `createCommentOnAIssue` `lockIssue` `unlockIssue` `rawGraphqlQuery` `github_create_pull_request_review_comment` `github_create_commit_comment` `github_create_discussion_comment` `add_labels_to_issue` `create_branch` `delete_branch` `update_issue` `find_branch` `find_issue` `find_user` `custom_api_call`
`trigger_pull_request` props:
  repository★(DROPDOWN)
`trigger_star` props:
  repository★(DROPDOWN)
`trigger_issues` props:
  repository★(DROPDOWN)
`trigger_push` props:
  repository★(DROPDOWN)
`trigger_discussion` props:
  repository★(DROPDOWN)
`trigger_discussion_comment` props:
  repository★(DROPDOWN)
`new_branch` props:
  repository★(DROPDOWN)
`new_collaborator` props:
  repository★(DROPDOWN)
`new_label` props:
  repository★(DROPDOWN)
`new_milestone` props:
  repository★(DROPDOWN)
`new_release` props:
  repository★(DROPDOWN)
`github_create_issue` props:
  repository★(DROPDOWN)
  title★(SHORT_TEXT) //The title of the issue
  description(LONG_TEXT) //The description of the issue
  labels(MULTI_SELECT_DROPDOWN) //Labels for the Issue
  assignees(MULTI_SELECT_DROPDOWN) //Assignees for the Issue
`getIssueInformation` props:
  repository★(DROPDOWN)
  issue_number★(NUMBER) //The number of the issue you want to get information from
`createCommentOnAIssue` props:
  repository★(DROPDOWN)
  issue_number★(NUMBER) //The number of the issue to comment on
  comment★(LONG_TEXT) //The comment to add to the issue
`lockIssue` props:
  repository★(DROPDOWN)
  issue_number★(NUMBER) //The number of the issue to be locked
  lock_reason(DROPDOWN) //The reason for locking the issue
`unlockIssue` props:
  repository★(DROPDOWN)
  issue_number★(NUMBER) //The number of the issue to be unlocked
`rawGraphqlQuery` props:
  query★(LONG_TEXT)
  variables(OBJECT)
`github_create_pull_request_review_comment` props:
  repository★(DROPDOWN)
  pull_number★(NUMBER) //The number of the pull request
  commit_id★(SHORT_TEXT) //The SHA of the commit to comment on
  path★(SHORT_TEXT) //The relative path to the file to comment on
  body★(LONG_TEXT) //The content of the review comment
  position★(NUMBER) //The position in the diff where the comment should be placed
`github_create_commit_comment` props:
  repository★(DROPDOWN)
  sha★(SHORT_TEXT) //The SHA of the commit to comment on
  body★(LONG_TEXT) //The content of the comment
  path(SHORT_TEXT) //The relative path to the file to comment on (optional)
  position(NUMBER) //The line index in the diff to comment on (optional)
`github_create_discussion_comment` props:
  repository★(DROPDOWN)
  discussion_number★(NUMBER) //The number of the discussion to comment on
  body★(LONG_TEXT) //The content of the comment (supports markdown)
`add_labels_to_issue` props:
  repository★(DROPDOWN)
  issue_number★(DROPDOWN) //The issue to select.
  labels★(MULTI_SELECT_DROPDOWN) //Labels for the Issue
`create_branch` props:
  repository★(DROPDOWN)
  source_branch★(DROPDOWN) //The source branch that will be used to create the new branch
  new_branch_name★(SHORT_TEXT) //The name for the new branch (e.g., 'feature/new-design').
`delete_branch` props:
  repository★(DROPDOWN)
  branch★(DROPDOWN)
`update_issue` props:
  repository★(DROPDOWN)
  issue_number★(DROPDOWN) //The issue to select.
  title(SHORT_TEXT)
  body(LONG_TEXT)
  state(STATIC_DROPDOWN) ["Open"|"Closed"] //The new state of the issue.
  state_reason(STATIC_DROPDOWN) ["Completed"|"Not Planned"|"Reopened"|"Duplicate"] //The reason for the state change. (Only used if State is chan
  milestone(DROPDOWN) //The milestone to associate this issue with.
  labels(MULTI_SELECT_DROPDOWN) //Labels for the Issue
  assignees(MULTI_SELECT_DROPDOWN) //Assignees for the Issue
`find_branch` props:
  repository★(DROPDOWN)
  branch★(SHORT_TEXT)
`find_issue` props:
  repository★(DROPDOWN)
  title★(SHORT_TEXT)
  state★(STATIC_DROPDOWN) ["Open"|"Closed"|"All"] //Filter issues by their state.
`find_user` props:
  username★(SHORT_TEXT) //The GitHub username (login) to look up.
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### gitlab  v2.0.0 | OAuth2
*Collaboration tool for developers*
**Triggers:** `project_issue_event`
**Actions:** `create_issue` `custom_api_call`
`project_issue_event` props:
  projectId★(DROPDOWN)
  actiontype★(STATIC_DROPDOWN)='all' ["All"|"Opened"|"Closed"|"Updated"] //Issue Event type for trigger
`create_issue` props:
  projectId★(DROPDOWN)
  title★(SHORT_TEXT)
  description(LONG_TEXT)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### teamwork  v2.0.0 | Custom(username,password,subdomain)
*Teamwork is a work and project management tool that helps teams improve collaboration, visibility, a*
**Triggers:** `new_task` `new_person` `new_comment` `new_message` `new_file` `new_expense` `new_invoice`
**Actions:** `create_project` `create_task_list` `create_task` `mark_task_complete` `create_company` `create_person` `update_task` `create_task_comment` `create_time_entry_on_task` `create_expense` `upload_file_to_project` `create_message_reply` `create_milestone` `add_people_to_project` `find_task` `find_company` `find_milestone` `find_notebook_or_comment`
`new_task` props:
  projectId(DROPDOWN) //The project to watch for new tasks. If not specified, all pr
`new_comment` props:
  projectId(DROPDOWN) //The project to watch for new comments. If not specified, all
`new_message` props:
  projectId(DROPDOWN) //The project to watch for new messages. If not specified, all
`new_file` props:
  projectId(DROPDOWN) //The project to watch for new files. If not specified, all pr
`new_expense` props:
  projectId(DROPDOWN) //The project to watch for new expenses. If not specified, all
`new_invoice` props:
  projectId(DROPDOWN) //The project to watch for new invoices. If not specified, all
`create_project` props:
  name★(SHORT_TEXT) //The name of the project.
  description(LONG_TEXT) //A description for the project.
  companyId★(DROPDOWN) //The company to associate the project with.
  category-id(DROPDOWN) //The category to assign the project to.
  tagIds(MULTI_SELECT_DROPDOWN) //Tags to associate with the project.
  start-date(DATE_TIME) //The start date of the project.
  end-date(DATE_TIME) //The end date of the project.
  projectOwnerId(DROPDOWN) //The user to assign as the project owner.
  customFields(DYNAMIC) //Custom fields for this project.
`create_task_list` props:
  projectId★(DROPDOWN) //The project to create the task list in.
  name★(SHORT_TEXT) //The name of the task list.
  description(LONG_TEXT) //A description for the task list.
  private(CHECKBOX) //Set to true to make the task list private.
  priority(STATIC_DROPDOWN) ["None"|"Low"|"Medium"|"High"] //The default priority for new tasks in this list.
  tags(MULTI_SELECT_DROPDOWN) //Default tags for new tasks in this list.
`create_task` props:
  projectId★(DROPDOWN) //The project to create the task in.
  tasklistId★(DROPDOWN) //The task list to add the task to.
  content★(SHORT_TEXT) //The content of the task.
  responsible-party-id(MULTI_SELECT_DROPDOWN) //The users responsible for the task.
  start-date(DATE_TIME) //The start date of the task.
  due-date(DATE_TIME) //The due date of the task.
  description(LONG_TEXT) //A description for the task.
  priority(STATIC_DROPDOWN) ["None"|"Low"|"Medium"|"High"] //The priority of the task.
  tagIds(MULTI_SELECT_DROPDOWN) //Tags to associate with the task.
  attachment(FILE) //A file to attach to the task.
  customFields(DYNAMIC) //Custom fields for this task.
`mark_task_complete` props:
  taskId★(DROPDOWN) //The task to mark as complete.
`create_company` props:
  name★(SHORT_TEXT) //Name of the company.
  website(SHORT_TEXT) //Company's website address.
  addressOne(SHORT_TEXT) //Primary address line.
  addressTwo(SHORT_TEXT) //Secondary address line.
  city(SHORT_TEXT) //City name.
  state(SHORT_TEXT) //State or province.
  zip(SHORT_TEXT) //Postal or zip code.
  countrycode(SHORT_TEXT) //2-letter ISO country code (e.g., US, GB).
  phone(SHORT_TEXT) //Primary phone number.
  fax(SHORT_TEXT) //Fax number.
  emailOne(SHORT_TEXT) //Primary email address.
  emailTwo(SHORT_TEXT) //Secondary email address.
  emailThree(SHORT_TEXT) //Tertiary email address.
  profile(LONG_TEXT) //Public company profile or 'About Us' text.
  privateNotes(LONG_TEXT) //Notes visible only to internal users.
  customFields(DYNAMIC) //Custom fields for this company.
`create_person` props:
  first-name★(SHORT_TEXT) //The user's first name.
  last-name★(SHORT_TEXT) //The user's last name.
  email-address★(SHORT_TEXT) //The user's email address.
  user-type★(STATIC_DROPDOWN) ["Standard User"|"Collaborator"|"Contact"] //The type of user to create.
  company-id(DROPDOWN) //The company to associate the user with.
  sendInvite(CHECKBOX) //Send an invitation email to the new user.
  title(SHORT_TEXT) //The user's job title.
`update_task` props:
  taskId★(DROPDOWN) //The task to update.
  content(SHORT_TEXT) //The new content of the task.
  description(LONG_TEXT) //The new description for the task.
  responsible-party-id(MULTI_SELECT_DROPDOWN) //The new users responsible for the task.
  start-date(DATE_TIME) //The new start date of the task.
  due-date(DATE_TIME) //The new due date of the task.
  priority(STATIC_DROPDOWN) ["None"|"Low"|"Medium"|"High"] //The new priority of the task.
  tagIds(MULTI_SELECT_DROPDOWN) //New tags to associate with the task.
`create_task_comment` props:
  taskId★(DROPDOWN) //The task to add a comment to.
  body★(LONG_TEXT) //The content of the comment.
  attachment(FILE) //A file to attach to the comment.
  notify(STATIC_DROPDOWN) ["Nobody"|"Followers"|"All Project Users"] //Who to notify about this comment.
  isprivate(CHECKBOX) //Set to true to make the comment private.
`create_time_entry_on_task` props:
  taskId★(DROPDOWN)
  date★(DATE_TIME) //Date of the time entry (yyyy-mm-dd)
  time(SHORT_TEXT) //Time of the entry (hh:mm:ss)
  hours★(NUMBER)
  minutes★(NUMBER) //Duration in minutes
  description(LONG_TEXT)
  isBillable(CHECKBOX)
`create_expense` props:
  project-id★(DROPDOWN) //The project to log the expense against.
  name★(SHORT_TEXT) //The name of the expense.
  cost★(NUMBER) //The cost of the expense.
  date★(DATE_TIME) //The date of the expense.
  description(LONG_TEXT) //A description for the expense.
`upload_file_to_project` props:
  projectId★(DROPDOWN) //The project to upload the file to.
  file★(FILE) //The file to upload.
  description(LONG_TEXT) //A description for the file.
  categoryId(DROPDOWN) //The category to assign the file to.
  private(CHECKBOX) //Set to true to make the file private.
`create_message_reply` props:
  messageId★(DROPDOWN) //The message to reply to.
  body★(LONG_TEXT) //The content of the reply.
  notify(CHECKBOX) //Notify all project users of this reply.
`create_milestone` props:
  projectId★(DROPDOWN) //The project to create the milestone in.
  title★(SHORT_TEXT) //The title of the milestone.
  deadline★(DATE_TIME) //The due date of the milestone.
  responsible-party-ids★(MULTI_SELECT_DROPDOWN) //The users responsible for the milestone.
  description(LONG_TEXT) //A description for the milestone.
  notify(CHECKBOX) //Notify responsible parties about the milestone.
  private(CHECKBOX) //Set to true to make the milestone private.
`add_people_to_project` props:
  projectId★(DROPDOWN) //The project to add people to.
  userIdList★(MULTI_SELECT_DROPDOWN) //The users to add to the project.
`find_task` props:
  searchTerm★(SHORT_TEXT) //The keyword to search for.
  projectId(DROPDOWN) //Limit the search to a specific project.
`find_company` props:
  searchTerm★(SHORT_TEXT) //The name or domain to search for.
  projectId(DROPDOWN) //Limit the search to a specific project.
`find_milestone` props:
  searchTerm★(SHORT_TEXT) //The name or due date to search for.
  projectId(DROPDOWN) //Limit the search to a specific project.
`find_notebook_or_comment` props:
  searchFor★(STATIC_DROPDOWN) ["Notebook"|"Notebook Comment"] //The type of item to search for.
  searchTerm★(SHORT_TEXT) //The keyword to search for.
  projectId(DROPDOWN) //Limit the search to a specific project.

### nifty  v2.0.0 | OAuth2
*Project management made simple*
**Actions:** `create_task` `custom_api_call`

### motion  v2.0.0 | API Key
*Optimize your schedule and manage tasks with Motion. Automate task creation, updates, and project ma*
**Triggers:** `task-created`
**Actions:** `create-task` `update-task` `create-project` `get-task` `moveTask` `find-task` `custom_api_call`

### podio  v2.0.0 | OAuth2
*Automate your workflows and workspace management with Podio. Create and update items, tasks, and com*
**Triggers:** `new_item` `new_task` `new_activity` `item_updated` `new_app` `member_added`
**Actions:** `create_item` `update_item` `create_task` `update_task` `attach_file` `create_comment` `create_status` `find_item` `find_task` `custom_api_call`

### smartsheet  v2.0.1 | API Key
*Dynamic work execution platform for teams to plan, capture, manage, automate, and report on work at *
**Triggers:** `new_row_added` `updated_row` `new_attachment_` `new_comment_webhook`
**Actions:** `add_row_to_sheet` `update_row` `attach_file_to_row` `find_rows_by_query` `find_attachment_by_row_id` `find_sheet_by_name`

### smartsuite  v2.0.0 | Custom(apiKey,accountId)
*Collaborative work management platform combining databases with spreadsheets.*
**Triggers:** `new_record` `updated_record`
**Actions:** `create_record` `update_record` `delete_record` `upload_file` `find_records` `get_record` `custom_api_call`

### notion  v2.0.1 | OAuth2
*The all-in-one workspace*
**Triggers:** `new_database_item` `updated_database_item` `new_comment` `updated_page` `new_page_created` `page_locked` `page_unlocked` `page_deleted` `updated_comment` `deleted_comment` `database_deleted` `database_schema_updated` `new_database` `database_moved`
**Actions:** `create_database_item` `update_database_item` `notion-find-database-item` `createPage` `append_to_page` `getPageOrBlockChildren` `archive_database_item` `restore_database_item` `add_comment` `retrieve_database` `get_page_comments` `find_page` `retrieve_block_children` `find_or_create_comment` `custom_api_call`

### coda  v2.0.0 | API Key
*Automate Coda docs by creating, updating, and fetching rows, managing tables, and tracking new entri*
**Triggers:** `new-row-created`
**Actions:** `create-row` `update-row` `upsert-row` `find-row` `get-row` `list-tables` `get-table` `custom_api_call`

### confluence  v2.0.0 | Custom(username,password,confluenceDomain)
*Manage Confluence pages and content. Retrieve page content, create pages from templates, and track n*
**Triggers:** `new-page`
**Actions:** `getPageContent` `create-page-from-template` `custom_api_call`
`new-page` props:
  spaceId★(DROPDOWN)
`getPageContent` props:
  pageId★(SHORT_TEXT) //Get this from the page URL of your Confluence Cloud
  includeDescendants(CHECKBOX)=false //If checked, will fetch all child pages recursively.
  dynamic★(DYNAMIC)
`create-page-from-template` props:
  spaceId★(DROPDOWN)
  templateId★(DROPDOWN)
  folderId(DROPDOWN)
  title★(SHORT_TEXT)
  status★(STATIC_DROPDOWN)='draft' ["Published "|"Draft"]
  templateVariables★(DYNAMIC)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### mem  v2.0.0 | API Key
*Capture and organize your thoughts using Mem.ai*
**Actions:** `create_mem` `create_note` `delete_note` `custom_api_call`

### taskade  v2.0.0 | API Key
*collaboration platform for remote teams to organize and manage projects*
**Actions:** `taskade-create-task` `taskade-complete-task` `taskade-delete-task` `custom_api_call`

### ticktick  v2.0.0 | OAuth2
*Stay organized and manage your tasks with TickTick. Create, update, and complete tasks, manage proje*
**Triggers:** `new_task_created`
**Actions:** `create_task` `update_task` `get_task` `delete_task` `complete_task` `find_task` `get_project` `custom_api_call`

### toggl-track  v2.0.0 | API Key
*Toggl Track is a time tracking application that allows users to track their daily activities across *
**Triggers:** `new_client` `new_workspace` `new_project` `new_task` `new_time_entry` `new_time_entry_started` `new_tag`
**Actions:** `create_client` `create_project` `create_task` `create_tag` `create_time_entry` `start_time_entry` `stop_time_entry` `find_user` `find_project` `find_task` `find_client` `find_tag` `find_time_entry`

### harvest  v2.0.0 | OAuth2
*Time Tracking Software with Invoicing*
**Actions:** `get_clients` `get_estimates` `get_expenses` `get_invoices` `get_projects` `get_roles` `get_tasks` `get_time_entries` `get_users` `reports-uninvoiced` `custom_api_call`

### clockify  v2.0.0 | API Key
**Triggers:** `new-task` `new-time-entry` `new-timer-started`
**Actions:** `create-task` `create-time-entry` `start-timer` `stop-timer` `find-task` `find-time-entry` `find-running-timer` `custom_api_call`

### clockodo  v2.0.0 | Custom(email,token,company_name,company_email)
*Time tracking made easy*
**Triggers:** `new_entry` `new_absence_enquiry`
**Actions:** `create_entry` `get_entry` `list_entries` `update_entry` `delete_entry` `create_customer` `get_customer` `update_customer` `list_customers` `delete_customer` `create_project` `get_project` `list_projects` `update_project` `delete_project` `create_service` `get_service` `update_service` `list_services` `delete_service` `get_team` `list_teams` `get_user` `list_users` `create_user` `update_user` `delete_user` `create_absence` `get_absence` `update_absence` `list_absences` `delete_absence` `custom_api_call`

### kimai  v2.0.0 | Custom(base_url,user,api_password)
*Open-source time tracking software*
**Actions:** `create_timesheet` `custom_api_call`

### assembled  v2.0.0 | API Key
*Workforce management platform for scheduling and forecasting*
**Triggers:** `new_OOO_request` `OOO_status_changed` `schedule_updated`
**Actions:** `custom_api_call` `custom_graphql` `OOO` `add_shift` `update_OOO` `delete_OOO`

### bamboohr  v2.0.0 | Custom(companyDomain,apiKey)
*Make custom API calls to BambooHR endpoints*
**Triggers:** `reportFieldChanged`
**Actions:** `custom_api_call`

### lever  v2.0.0 | Custom(apiKey)
*Lever is a modern, collaborative recruiting platform that powers a more human approach to hiring.*
**Actions:** `getOpportunity` `updateOpportunityStage` `listOpportunityForms` `listOpportunityFeedback` `addFeedbackToOpportunity` `custom_api_call`

### netlify  v2.0.1 | OAuth2
*Netlify is a platform for building and deploying websites and apps.*
**Triggers:** `new_deploy_started` `new_deploy_succeeded` `new_deploy_failed` `new_form_submission`
**Actions:** `start_deploy` `get_site` `list_site_deploys` `list_files`

### medullar  v2.0.0 | API Key
*AI-powered discovery & insight platform that acts as your extended digital mind*
**Actions:** `createSpace` `listSpaces` `addSpaceRecord` `askSpace` `deleteSpace` `renameSpace`

### beamer  v2.0.0 | API Key
*Engage users with targeted announcements*
**Triggers:** `new_post_on_beamer`
**Actions:** `create_beamer_post` `create_new_feature_request` `create_new_comment` `create_vote` `custom_api_call`


## ★ E-COMMERCE & PAYMENTS

### shopify  v2.0.1 | Custom(shopName,adminToken)
*Ecommerce platform for online stores*
**Triggers:** `new_abandoned_checkout` `new_cancelled_order` `new_customer` `new_order` `new_cart` `new_checkout` `new_collection` `new_draft_order` `new_inventory_item` `new_product` `new_refund` `order_fulfillment` `order_payment` `checkout_creation` `updated_product` `new_paid_order`
**Actions:** `adjust_inventory_level` `cancel_order` `close_order` `create_collect` `create_customer` `create_draft_order` `create_fulfillment_event` `create_order` `create_product` `create_transaction` `get_asset` `get_customer` `get_customers` `get_customer_orders` `get_fulfillment` `get_fulfillments` `get_locations` `get_product` `get_product_variant` `get_products` `get_transaction` `get_transactions` `update_customer` `update_order` `update_product` `upload_product_image` `custom_api_call`

### woocommerce  v2.0.0 | Custom(baseUrl,consumerKey,consumerSecret)
*E-commerce platform built on WordPress*
**Triggers:** `$woocommerce_trigger_product_created` `$woocommerce_trigger_product_updated` `$woocommerce_trigger_product_deleted` `$woocommerce_trigger_order_created` `$woocommerce_trigger_order_updated` `$woocommerce_trigger_order_deleted` `$woocommerce_trigger_coupon_created` `$woocommerce_trigger_coupon_updated` `$woocommerce_trigger_coupon_deleted` `$woocommerce_trigger_customer_created` `$woocommerce_trigger_customer_updated` `$woocommerce_trigger_customer_deleted`
**Actions:** `Create Customer` `Create Coupon` `Create Product` `Find Customer` `Find Product` `custom_api_call`

### stripe  v2.0.0 | API Key
*Online payment processing for internet businesses*
**Triggers:** `new_payment` `new_customer` `payment_failed` `new_subscription` `new_charge` `new_invoice` `invoice_payment_failed` `canceled_subscription` `new_refund` `new_dispute` `new_payment_link` `updated_subscription` `checkout_session_completed`
**Actions:** `create_customer` `create_invoice` `search_customer` `search_subscriptions` `retrieve_customer` `update_customer` `create_payment_intent` `create_product` `create_price` `create_subscription` `cancel_subscription` `retrieve_invoice` `retrieve_payout` `create_refund` `create_payment_link` `deactivate_payment_link` `retrieve_payment_intent` `find_invoice` `custom_api_call`
`new_invoice` props:
  status(STATIC_DROPDOWN) ["Draft"|"Open"|"Paid"|"Uncollectible"|"Void"] //Only trigger for invoices with this status.
  customer(SHORT_TEXT) //Only trigger for invoices belonging to this customer ID (e.g
  subscription(SHORT_TEXT) //Only trigger for invoices belonging to this subscription ID 
`invoice_payment_failed` props:
  customer(SHORT_TEXT) //Only trigger for invoices belonging to this customer ID (e.g
`canceled_subscription` props:
  customer(SHORT_TEXT) //Only trigger for subscriptions belonging to this customer ID
`new_refund` props:
  charge(SHORT_TEXT) //Only trigger for refunds related to this Charge ID (e.g., `c
  payment_intent(SHORT_TEXT) //Only trigger for refunds related to this Payment Intent ID (
`new_dispute` props:
  charge(SHORT_TEXT) //Only trigger for disputes related to this Charge ID (e.g., `
  payment_intent(SHORT_TEXT) //Only trigger for disputes related to this Payment Intent ID 
`updated_subscription` props:
  status(STATIC_DROPDOWN) ["Incomplete"|"Incomplete - Expired"|"Trialing"|"Active"|"Past Due"|"Canceled"|"Unpaid"|"Paused"] //Only trigger when the subscription is updated to this status
  customer(SHORT_TEXT) //Only trigger for subscriptions belonging to this customer ID
`checkout_session_completed` props:
  customer(SHORT_TEXT) //Only trigger for checkout sessions created by this customer 
`create_customer` props:
  email★(SHORT_TEXT)
  name★(SHORT_TEXT)
  description(LONG_TEXT)
  phone(SHORT_TEXT)
  line1(SHORT_TEXT)
  postal_code(SHORT_TEXT)
  city(SHORT_TEXT)
  state(SHORT_TEXT)
  country(SHORT_TEXT)
`create_invoice` props:
  customer_id★(SHORT_TEXT) //Stripe Customer ID
  currency★(SHORT_TEXT) //Currency for the invoice (e.g., USD)
  description(LONG_TEXT) //Description for the invoice
`search_customer` props:
  email★(SHORT_TEXT)
`search_subscriptions` props:
  price_ids(LONG_TEXT) //Comma-separated list of price IDs to filter by (e.g., price_
  status(STATIC_DROPDOWN) ["All Statuses"|"Active"|"Past Due"|"Unpaid"|"Canceled"|"Incomplete"|"Incomplete Expired"|"Trialing"|"Paused"] //Filter by subscription status
  customer_id(SHORT_TEXT) //Filter by specific customer ID (optional)
  created_after(DATE_TIME) //Filter subscriptions created after this date (YYYY-MM-DD for
  created_before(DATE_TIME) //Filter subscriptions created before this date (YYYY-MM-DD fo
  limit(NUMBER)=100 //Maximum number of subscriptions to return (default: 100, set
  fetch_all(CHECKBOX)=false //Fetch all matching subscriptions (ignores limit, may take lo
  include_customer_details(CHECKBOX)=true //Fetch detailed customer information for each subscription
`retrieve_customer` props:
  id★(SHORT_TEXT)
`update_customer` props:
  customer★(DROPDOWN)
  email(SHORT_TEXT)
  name(SHORT_TEXT)
  description(LONG_TEXT)
  phone(SHORT_TEXT)
  line1(SHORT_TEXT)
  postal_code(SHORT_TEXT)
  city(SHORT_TEXT)
  state(SHORT_TEXT)
  country(SHORT_TEXT)
`create_payment_intent` props:
  amount★(NUMBER) //The amount to charge, in a decimal format (e.g., 10.50 for $
  currency★(STATIC_DROPDOWN) //The three-letter ISO code for the currency.
  customer★(DROPDOWN)
  payment_method(SHORT_TEXT) //The ID of the Payment Method to attach (e.g., `pm_...`). Req
  confirm(CHECKBOX)=false //If true, Stripe will attempt to charge the provided payment 
  return_url(SHORT_TEXT) //The URL to redirect your customer back to after they authent
  description(LONG_TEXT)
  receipt_email(SHORT_TEXT) //The email address to send a receipt to. This will override t
`create_product` props:
  name★(SHORT_TEXT) //The product’s name, meant to be displayable to the customer.
  description(LONG_TEXT) //The product’s description, meant to be displayable to the cu
  active(CHECKBOX) //Whether the product is currently available for purchase. Def
  images(ARRAY) //A list of up to 8 URLs of images for this product.
  url(SHORT_TEXT) //A publicly-accessible online page for this product.
  metadata(JSON) //A set of key-value pairs to store additional information abo
`create_price` props:
  product★(DROPDOWN)
  unit_amount★(NUMBER) //The price amount as a decimal, for example, 25.50 for $25.50
  currency★(STATIC_DROPDOWN) //The three-letter ISO code for the currency.
  recurring_interval★(STATIC_DROPDOWN)='one_time' ["One-Time"|"Daily"|"Weekly"|"Monthly"|"Yearly"] //Specify the billing frequency. Select 'One-Time' for a singl
  recurring_interval_count(NUMBER) //The number of intervals between subscription billings (e.g.,
`create_subscription` props:
  customer★(DROPDOWN)
  items★(ARRAY) //A list of prices to subscribe the customer to.
  collection_method(STATIC_DROPDOWN) ["Charge Automatically"|"Send Invoice"] //How to collect payment. 'charge_automatically' will try to b
  days_until_due(NUMBER) //Number of days before an invoice is due. Required if Collect
  trial_period_days(NUMBER) //Integer representing the number of trial days the customer r
  default_payment_method(SHORT_TEXT) //ID of the default payment method for the subscription (e.g.,
  metadata(JSON)
`cancel_subscription` props:
  subscription★(DROPDOWN)
  cancel_at_period_end(CHECKBOX)=false //If true, the subscription remains active until the end of th
`retrieve_invoice` props:
  invoice_id★(DROPDOWN)
`retrieve_payout` props:
  payout_id★(DROPDOWN)
`create_refund` props:
  payment_intent★(DROPDOWN)
  amount(NUMBER) //The amount to refund (e.g., 12.99). If left blank, a full re
  reason(STATIC_DROPDOWN) ["Duplicate"|"Fraudulent"|"Requested by Customer"] //An optional reason for the refund.
  metadata(JSON) //A set of key-value pairs to store additional information abo
`create_payment_link` props:
  line_items★(ARRAY) //The products and quantities to include in the payment link.
  after_completion_type(STATIC_DROPDOWN) ["Show Confirmation Page"|"Redirect to URL"] //Controls the behavior after the purchase is complete. Defaul
  after_completion_redirect_url(SHORT_TEXT) //The URL to redirect the customer to after a successful purch
  allow_promotion_codes(CHECKBOX) //Enables the user to enter a promotion code on the Payment Li
  billing_address_collection(STATIC_DROPDOWN) ["Auto"|"Required"] //Describes whether Checkout should collect the customer’s bil
  metadata(JSON)
`deactivate_payment_link` props:
  payment_link_id★(DROPDOWN)
`retrieve_payment_intent` props:
  payment_intent_id★(DROPDOWN)
`find_invoice` props:
  invoice_id★(DROPDOWN)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### xero  v2.0.1 | OAuth2
*Beautiful accounting software*
**Triggers:** `xero_new_contact` `xero_contact_updated` `xero_new_sales_invoice` `xero_updated_sales_invoice` `xero_bill_created` `xero_bill_updated` `xero_invoice_created` `xero_invoice_updated` `xero_new_or_updated_contact` `xero_new_bank_transaction` `xero_new_payment` `xero_new_purchase_order` `xero_new_reconciled_payment` `xero_updated_quote` `xero_new_bill` `xero_new_credit_note` `xero_new_project` `xero_new_quote` `xero_new_employee` `xero_updated_employee` `xero_new_payslip` `xero_overdue_sales_invoice`
**Actions:** `xero_create_contact` `xero_create_invoice` `xero_allocate_credit_note_to_invoice` `xero_create_bank_transfer` `xero_create_quote_draft` `xero_send_invoice_email` `xero_create_bill` `xero_create_payment` `xero_create_purchase_order` `xero_update_purchase_order` `xero_upload_attachment` `xero_add_items_to_sales_invoice` `xero_create_credit_note` `xero_create_inventory_item` `xero_create_project` `xero_update_sales_invoice` `xero_create_repeating_sales_invoice` `xero_create_account` `xero_create_bank_transaction` `xero_create_employee` `xero_add_note_to_invoice` `xero_add_or_update_stock_items` `xero_delete_credit_note_allocation` `xero_update_contact` `xero_update_quote` `xero_update_employee` `xero_delete_invoice` `xero_void_invoice` `xero_delete_purchase_order` `xero_get_contact_by_id` `xero_get_item_by_id` `xero_get_invoices` `xero_get_invoice_url` `xero_get_tax_rates` `xero_get_tracking_categories` `xero_get_invoice_history` `xero_find_contact` `xero_find_invoice` `xero_find_invoice_by_id` `xero_find_invoice_by_contact_id` `xero_find_credit_note` `xero_find_item` `xero_find_employee` `xero_find_payment` `xero_find_purchase_order` `xero_find_quote` `xero_search_bank_transactions` `xero_search_invoice` `xero_search_contact_by_email` `custom_api_call`
`xero_new_contact` props:
  webhookInstructions(MARKDOWN) //To use this trigger, manually configure a Xero webhook for y
  tenant_id★(DROPDOWN)
  webhook_key★(SHORT_TEXT) //From Xero Developer portal > Your App > Webhooks. Used to ve
  fetch_full_contact(CHECKBOX)=true //If enabled, fetches the full contact from Xero using the Res
`xero_contact_updated` props:
  webhookInstructions(MARKDOWN) //To use this trigger, manually configure a Xero webhook for y
  tenant_id★(DROPDOWN)
  webhook_key★(SHORT_TEXT) //From Xero Developer portal > Your App > Webhooks. Used to ve
  fetch_full_contact(CHECKBOX)=true //Fetch the full contact record from Xero using the Resource U
`xero_new_sales_invoice` props:
  webhookInstructions(MARKDOWN) //To use this trigger, manually configure a Xero webhook for y
  tenant_id★(DROPDOWN)
  webhook_key★(SHORT_TEXT) //From Xero Developer portal > Your App > Webhooks. Used to ve
  fetch_full_invoice(CHECKBOX)=true //Fetch the full invoice and ensure Type is ACCREC (recommende
`xero_updated_sales_invoice` props:
  webhookInstructions(MARKDOWN) //To use this trigger, manually configure a Xero webhook for y
  tenant_id★(DROPDOWN)
  webhook_key★(SHORT_TEXT) //From Xero Developer portal > Your App > Webhooks. Used to ve
  fetch_full_invoice(CHECKBOX)=true //Fetch the full invoice and ensure Type is ACCREC (recommende
`xero_bill_created` props:
  webhookInstructions(MARKDOWN) //To use this trigger, manually configure a Xero webhook for y
  tenant_id★(DROPDOWN)
  webhook_key★(SHORT_TEXT) //From Xero Developer portal > Your App > Webhooks. Used to ve
  fetch_full_bill(CHECKBOX)=true //Fetch the full bill from Xero and verify it is a bill (Type=
`xero_bill_updated` props:
  webhookInstructions(MARKDOWN) //To use this trigger, manually configure a Xero webhook for y
  tenant_id★(DROPDOWN)
  webhook_key★(SHORT_TEXT) //From Xero Developer portal > Your App > Webhooks. Used to ve
  fetch_full_bill(CHECKBOX)=true //Fetch the full bill from Xero and verify it is a bill (Type=
`xero_invoice_created` props:
  webhookInstructions(MARKDOWN) //To use this trigger, manually configure a Xero webhook for y
  tenant_id★(DROPDOWN)
  webhook_key★(SHORT_TEXT) //From Xero Developer portal > Your App > Webhooks. Used to ve
  fetch_full_invoice(CHECKBOX)=true //Fetch the full invoice record from Xero using the Resource U
`xero_invoice_updated` props:
  webhookInstructions(MARKDOWN) //To use this trigger, manually configure a Xero webhook for y
  tenant_id★(DROPDOWN)
  webhook_key★(SHORT_TEXT) //From Xero Developer portal > Your App > Webhooks. Used to ve
  fetch_full_invoice(CHECKBOX)=true //Fetch the full invoice record from Xero using the Resource U
`xero_new_or_updated_contact` props:
  webhookInstructions(MARKDOWN) //To use this trigger, manually configure a Xero webhook for y
  tenant_id★(DROPDOWN)
  webhook_key★(SHORT_TEXT) //From Xero Developer portal > Your App > Webhooks. Used to ve
  fetch_full_contact(CHECKBOX)=true //If enabled, fetches the full contact from Xero using the Res
`xero_new_bank_transaction` props:
  tenant_id★(DROPDOWN)
  types(STATIC_MULTI_SELECT_DROPDOWN) ["RECEIVE"|"SPEND"|"RECEIVE-OVERPAYMENT"|"SPEND-OVERPAYMENT"|"RECEIVE-PREPAYMENT"|"SPEND-PREPAYMENT"|"RECEIVE-TRANSFER"|"SPEND-TRANSFER"]
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["AUTHORISED"|"DELETED"]
  contact_id(DROPDOWN) //Select a contact
  bank_account_id(DROPDOWN) //Select a bank account
  bank_account_code(SHORT_TEXT)
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  page_size(NUMBER)
`xero_new_payment` props:
  tenant_id★(DROPDOWN)
  payment_types(STATIC_MULTI_SELECT_DROPDOWN) ["ACCRECPAYMENT (Received on Sales Invoice)"|"ACCPAYPAYMENT (Paid on Bill)"]
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["AUTHORISED"|"DELETED"]
  invoice_id(DROPDOWN) //Select an invoice
  reference(SHORT_TEXT)
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  page_size(NUMBER)
`xero_new_purchase_order` props:
  tenant_id★(DROPDOWN)
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["DRAFT"|"SUBMITTED"|"AUTHORISED"|"BILLED"|"DELETED"]
  first_time_status(STATIC_DROPDOWN) ["DRAFT"|"SUBMITTED"|"AUTHORISED"|"BILLED"|"DELETED"] //Also fire when a purchase order enters this status for the f
  contact_id(DROPDOWN) //Select a contact
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  page_size(NUMBER)
`xero_new_reconciled_payment` props:
  tenant_id★(DROPDOWN)
  payment_types(STATIC_MULTI_SELECT_DROPDOWN) ["ACCRECPAYMENT (Received on Sales Invoice)"|"ACCPAYPAYMENT (Paid on Bill)"]
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["AUTHORISED"|"DELETED"]
  invoice_id(DROPDOWN) //Select an invoice
  reference(SHORT_TEXT)
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  page_size(NUMBER)
`xero_updated_quote` props:
  tenant_id★(DROPDOWN)
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["DRAFT"|"SENT"|"ACCEPTED"|"DECLINED"|"INVOICED"|"DELETED"]
  contact_id(DROPDOWN) //Select a contact
  quote_number(SHORT_TEXT)
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  expiry_date_from(SHORT_TEXT)
  expiry_date_to(SHORT_TEXT)
  page_size(NUMBER)
`xero_new_bill` props:
  tenant_id★(DROPDOWN)
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["DRAFT"|"SUBMITTED"|"AUTHORISED"|"PAID"|"VOIDED"|"DELETED"]
  contact_id(DROPDOWN) //Select a contact
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  summary_only(CHECKBOX)=true
  page_size(NUMBER)
`xero_new_credit_note` props:
  tenant_id★(DROPDOWN)
  types(STATIC_MULTI_SELECT_DROPDOWN) ["ACCRECCREDIT (Sales Credit)"|"ACCPAYCREDIT (Supplier Credit)"]
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["DRAFT"|"AUTHORISED"|"PAID"|"VOIDED"]
  contact_id(DROPDOWN) //Select a contact
  reference(SHORT_TEXT)
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  page_size(NUMBER)
`xero_new_project` props:
  tenant_id★(DROPDOWN)
  contact_id(DROPDOWN) //Select a contact
  states(STATIC_MULTI_SELECT_DROPDOWN) ["INPROGRESS"|"CLOSED"]
  page_size(NUMBER)
`xero_new_quote` props:
  tenant_id★(DROPDOWN)
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["DRAFT"|"SENT"|"ACCEPTED"|"DECLINED"|"INVOICED"|"DELETED"]
  contact_id(DROPDOWN) //Select a contact
  quote_number(SHORT_TEXT)
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  expiry_date_from(SHORT_TEXT)
  expiry_date_to(SHORT_TEXT)
  page_size(NUMBER)
`xero_new_employee` props:
  tenant_id★(DROPDOWN)
  page_size(NUMBER)
`xero_updated_employee` props:
  tenant_id★(DROPDOWN)
`xero_new_payslip` props:
  tenant_id★(DROPDOWN)
`xero_overdue_sales_invoice` props:
  tenant_id★(DROPDOWN)
  overdue_days(NUMBER)=0 //Number of days past the due date before triggering. Use 0 to
  page_size(NUMBER)
`xero_create_contact` props:
  tenant_id★(DROPDOWN)
  contact_id(DROPDOWN) //Select a contact
  name★(SHORT_TEXT) //Full name of the contact (required for create, max 500 chars
  first_name(SHORT_TEXT)
  last_name(SHORT_TEXT)
  email(SHORT_TEXT)
  account_number(SHORT_TEXT) //Unique customer or supplier account number (max 50 chars).
  phone_default(SHORT_TEXT)
  phone_mobile(SHORT_TEXT)
  phone_fax(SHORT_TEXT)
  phone_ddi(SHORT_TEXT)
  website(SHORT_TEXT)
  tax_number(SHORT_TEXT)
  bank_account_details(SHORT_TEXT) //Bank account number for the contact.
  is_supplier(CHECKBOX)=false //Mark this contact as a supplier / vendor.
  is_customer(CHECKBOX)=false //Mark this contact as a customer.
  default_currency(SHORT_TEXT) //ISO 4217 currency code, e.g. AUD, USD, GBP.
  street_address_line1(SHORT_TEXT)
  street_address_line2(SHORT_TEXT)
  street_city(SHORT_TEXT)
  street_region(SHORT_TEXT)
  street_postal_code(SHORT_TEXT)
  street_country(SHORT_TEXT)
  accounts_receivable_tax_type(SHORT_TEXT) //Default tax type for sales/receivables (e.g. OUTPUT2).
  accounts_payable_tax_type(SHORT_TEXT) //Default tax type for purchases/payables (e.g. INPUT2).
  contact_status(STATIC_DROPDOWN) ["Active"|"Archived"]
`xero_create_invoice` props:
  tenant_id★(DROPDOWN)
  invoice_id(DROPDOWN) //Select an invoice
  invoice_type★(STATIC_DROPDOWN)='ACCREC' ["Sales Invoice (ACCREC)"|"Bill / Accounts Payable (ACCPAY)"] //ACCREC = Sales Invoice (money coming in), ACCPAY = Bill (mon
  contact_id★(DROPDOWN) //Select a contact
  status★(STATIC_DROPDOWN)='DRAFT' ["Draft"|"Submitted"|"Authorised"|"Deleted"|"Voided"]
  li_description★(LONG_TEXT) //Description of the goods or service. Required for each line 
  li_quantity(NUMBER)=1
  li_unit_amount(NUMBER) //Price per unit (excluding tax). e.g. 100.00
  li_account_code(SHORT_TEXT) //The account code to post this line to (e.g. "200" for Sales)
  li_tax_type(SHORT_TEXT) //Tax type for this line (e.g. NONE, OUTPUT2, INPUT2). Leave b
  li_item_code(SHORT_TEXT) //Optional item/product code from your Xero inventory.
  li_discount_rate(NUMBER) //Percentage discount to apply to this line (0–100).
  date(SHORT_TEXT)
  due_date(SHORT_TEXT)
  invoice_number(SHORT_TEXT) //Custom invoice number. Auto-generated by Xero if left blank.
  reference(SHORT_TEXT) //Optional reference text shown on the invoice.
  line_amount_types(STATIC_DROPDOWN) ["Exclusive (tax added on top)"|"Inclusive (tax included in amount)"|"No Tax"] //How tax is applied to line amounts.
  currency_code(DROPDOWN) //Select a currency code
  branding_theme_id(DROPDOWN) //Select a branding theme
  url(SHORT_TEXT) //Link (URL) attached to this invoice.
  sent_to_contact(CHECKBOX)=false
`xero_allocate_credit_note_to_invoice` props:
  tenant_id★(DROPDOWN)
  credit_note_id★(DROPDOWN) //Select a credit note to allocate from
  invoice_id★(DROPDOWN) //Select an invoice
  amount★(NUMBER) //The amount of the credit to allocate.
  date(SHORT_TEXT) //Date of allocation. Format: YYYY-MM-DD. Optional.
`xero_create_bank_transfer` props:
  tenant_id★(DROPDOWN)
  from_bank_account_id★(DROPDOWN) //Select a bank account
  to_bank_account_id★(DROPDOWN) //Select a bank account
  amount★(NUMBER) //Amount to transfer. Currencies must match between accounts.
  date(SHORT_TEXT) //YYYY-MM-DD. Defaults to today if not provided.
  reference(SHORT_TEXT) //Reference for the transfer.
  from_is_reconciled(CHECKBOX)=false //Mark source account transaction as reconciled.
  to_is_reconciled(CHECKBOX)=false //Mark destination account transaction as reconciled.
`xero_create_quote_draft` props:
  tenant_id★(DROPDOWN)
  contact_id★(DROPDOWN) //Select a contact
  date★(SHORT_TEXT) //Date the quote was issued (YYYY-MM-DD).
  expiry_date(SHORT_TEXT) //Date the quote expires (YYYY-MM-DD).
  line_item★(OBJECT) //At minimum, provide a Description.
  line_amount_types(STATIC_DROPDOWN) ["Exclusive"|"Inclusive"|"NoTax"]
  reference(SHORT_TEXT)
  quote_number(SHORT_TEXT)
  title(SHORT_TEXT)
  summary(LONG_TEXT)
  terms(LONG_TEXT)
  status(STATIC_DROPDOWN)='DRAFT' ["Draft"]
`xero_send_invoice_email` props:
  tenant_id★(DROPDOWN)
  invoice_id★(DROPDOWN) //Select a sales invoice with a valid status for sending email
`xero_create_bill` props:
  tenant_id★(DROPDOWN)
  contact_id★(DROPDOWN) //Select a contact
  line_item★(OBJECT) //At minimum, provide a Description.
  date(SHORT_TEXT) //Date the bill was issued (YYYY-MM-DD). Optional.
  due_date(SHORT_TEXT) //Date the bill is due (YYYY-MM-DD). Optional.
  line_amount_types(STATIC_DROPDOWN) ["Exclusive"|"Inclusive"|"NoTax"]
  invoice_number(SHORT_TEXT)
  status(STATIC_DROPDOWN)='DRAFT' ["Draft"|"Submitted"|"Authorised"]
`xero_create_payment` props:
  tenant_id★(DROPDOWN)
  invoice_id★(DROPDOWN) //Select an authorised invoice (sales or bill) to apply paymen
  account_id★(DROPDOWN) //Select a bank account
  amount★(NUMBER) //Payment amount (must be <= amount due).
  date★(SHORT_TEXT) //YYYY-MM-DD.
  reference(SHORT_TEXT)
  is_reconciled(CHECKBOX)=false //Mark payment as reconciled (optional).
`xero_create_purchase_order` props:
  tenant_id★(DROPDOWN)
  contact_id★(DROPDOWN) //Select a contact
  line_item★(OBJECT) //At minimum, provide a Description.
  date(SHORT_TEXT) //Date the purchase order was issued (YYYY-MM-DD). Optional.
  delivery_date(SHORT_TEXT) //Date goods are to be delivered (YYYY-MM-DD). Optional.
  line_amount_types(STATIC_DROPDOWN) ["Exclusive"|"Inclusive"|"NoTax"]
  purchase_order_number(SHORT_TEXT)
  reference(SHORT_TEXT)
  branding_theme_id(DROPDOWN) //Select a branding theme
  status(STATIC_DROPDOWN)='DRAFT' ["Draft"|"Submitted"|"Authorised"|"Billed"|"Deleted"]
  delivery_address(LONG_TEXT)
  attention_to(SHORT_TEXT)
  telephone(SHORT_TEXT)
  delivery_instructions(LONG_TEXT)
  expected_arrival_date(SHORT_TEXT) //YYYY-MM-DD. Optional.
`xero_update_purchase_order` props:
  tenant_id★(DROPDOWN)
  purchase_order_id★(DROPDOWN) //Select a purchase order to update
  status(STATIC_DROPDOWN) ["Draft"|"Submitted"|"Authorised"|"Billed"|"Deleted"]
  sent_to_contact(CHECKBOX)=false
  delivery_address(LONG_TEXT)
  attention_to(SHORT_TEXT)
  telephone(SHORT_TEXT)
  delivery_instructions(LONG_TEXT)
  expected_arrival_date(SHORT_TEXT)
`xero_upload_attachment` props:
  tenant_id★(DROPDOWN)
  resource_type★(STATIC_DROPDOWN) //The Xero resource to attach the file to.
  resource_id★(DROPDOWN) //Select the specific resource to attach the file to.
  file★(FILE) //The file to upload. Max 10MB per Xero limits.
  file_name(SHORT_TEXT) //Optional file name to use in Xero. Avoid characters: < > : "
  content_type(SHORT_TEXT) //MIME type of the file (e.g., image/png). If not set, will be
  include_online(CHECKBOX)=false //Only applicable to ACCREC invoices and ACCREC credit notes. 
`xero_add_items_to_sales_invoice` props:
  tenant_id★(DROPDOWN)
  invoice_id★(DROPDOWN) //Select an invoice
  allow_authorised(CHECKBOX)=false //Enable adding items to AUTHORISED invoices (Xero allows limi
  new_line_items★(ARRAY)
`xero_create_credit_note` props:
  tenant_id★(DROPDOWN)
  type★(STATIC_DROPDOWN)='ACCRECCREDIT' ["Accounts Receivable Credit (ACCRECCREDIT)"|"Accounts Payable Credit (ACCPAYCREDIT)"]
  contact_id★(DROPDOWN) //Select a contact
  date(SHORT_TEXT) //YYYY-MM-DD. Defaults to today if not provided.
  status(STATIC_DROPDOWN)='DRAFT' ["Draft"|"Authorised"]
  line_amount_types(STATIC_DROPDOWN) ["Exclusive"|"Inclusive"|"NoTax"]
  credit_note_number(SHORT_TEXT)
  reference(SHORT_TEXT)
  currency_code(SHORT_TEXT)
  branding_theme_id(DROPDOWN) //Select a branding theme
  line_items(ARRAY) //Add one or more line items. At minimum, each line needs a De
`xero_create_inventory_item` props:
  tenant_id★(DROPDOWN)
  code★(SHORT_TEXT)
  name(SHORT_TEXT)
  description(LONG_TEXT)
  purchase_description(LONG_TEXT)
  is_sold(CHECKBOX)=true
  is_purchased(CHECKBOX)=true
  sales_details(OBJECT)
  sales_account_id(DROPDOWN) //Select an account
  purchase_details(OBJECT)
  purchase_account_id(DROPDOWN) //Select an account
  cogs_account_id(DROPDOWN) //Select an account
  inventory_asset_account_id(DROPDOWN) //Select an account
`xero_create_project` props:
  tenant_id★(DROPDOWN)
  contact_id★(DROPDOWN) //Select a contact
  name★(SHORT_TEXT)
  deadline_utc(SHORT_TEXT) //Example: 2017-04-23T18:25:43.511Z
  estimate_amount(NUMBER)
`xero_update_sales_invoice` props:
  tenant_id★(DROPDOWN)
  allow_authorised(CHECKBOX)=false //Enable updates for AUTHORISED invoices (Xero allows limited 
  invoice_id★(DROPDOWN) //Select a sales invoice (ACCREC) with DRAFT or SUBMITTED stat
  reference(SHORT_TEXT)
  due_date(SHORT_TEXT)
  invoice_number(SHORT_TEXT)
  branding_theme_id(DROPDOWN) //Select a branding theme
  url(SHORT_TEXT)
  contact_id(DROPDOWN) //Select a contact
  status(STATIC_DROPDOWN) ["Draft"|"Submitted"|"Authorised"|"Voided"|"Deleted"]
  sent_to_contact(CHECKBOX)=false
  replace_all_line_items(CHECKBOX)=false //If enabled, only the provided line_items will remain. If dis
  line_items(ARRAY)
`xero_create_repeating_sales_invoice` props:
  tenant_id★(DROPDOWN)
  contact_id★(DROPDOWN) //Select a contact
  schedule_period★(NUMBER) //Integer period (e.g., 1 every week, 2 every month).
  schedule_unit★(STATIC_DROPDOWN) ["Weekly"|"Monthly"]
  due_date★(NUMBER) //Day number used with due date type (e.g., 20, 31).
  due_date_type★(DROPDOWN)
  start_date★(SHORT_TEXT)
  end_date(SHORT_TEXT)
  line_amount_types★(STATIC_DROPDOWN)='Exclusive' ["Exclusive"|"Inclusive"|"NoTax"]
  currency_code★(DROPDOWN) //Select a currency code
  status★(STATIC_DROPDOWN)='DRAFT' ["Draft"|"Authorised"]
  reference(SHORT_TEXT)
  branding_theme_id(DROPDOWN) //Select a branding theme
  approved_for_sending(CHECKBOX)=false
  send_copy(CHECKBOX)=false
  mark_as_sent(CHECKBOX)=false
  include_pdf(CHECKBOX)=false
  line_items★(ARRAY)
`xero_create_account` props:
  tenant_id★(DROPDOWN)
  code★(SHORT_TEXT) //Unique account code (e.g. 200).
  name★(SHORT_TEXT)
  type★(STATIC_DROPDOWN)
  description(LONG_TEXT)
  tax_type(SHORT_TEXT) //e.g. NONE, GST, INPUT
  enable_payments(CHECKBOX)=false
`xero_create_bank_transaction` props:
  tenant_id★(DROPDOWN)
  type★(STATIC_DROPDOWN) ["Spend Money"|"Receive Money"]
  bank_account_id★(DROPDOWN) //Select a bank account
  date(SHORT_TEXT)
  reference(SHORT_TEXT)
  contact_id(SHORT_TEXT)
  line_items★(ARRAY)
  is_reconciled(CHECKBOX)=false
`xero_create_employee` props:
  tenant_id★(DROPDOWN)
  first_name★(SHORT_TEXT)
  last_name★(SHORT_TEXT)
  date_of_birth★(SHORT_TEXT)
  gender★(STATIC_DROPDOWN) ["Male"|"Female"|"Indeterminate / Intersex / Unspecified"]
  start_date★(SHORT_TEXT)
  email(SHORT_TEXT)
  job_title(SHORT_TEXT)
  employment_basis(STATIC_DROPDOWN) ["Full-Time"|"Part-Time"|"Casual"|"Labour Hire"|"Superannuation Income Stream"]
  phone(SHORT_TEXT)
  mobile(SHORT_TEXT)
`xero_add_note_to_invoice` props:
  tenant_id★(DROPDOWN)
  invoice_id★(SHORT_TEXT) //Xero InvoiceID (GUID).
  note★(LONG_TEXT) //The note text to add to the invoice history.
`xero_add_or_update_stock_items` props:
  tenant_id★(DROPDOWN)
  items★(ARRAY)
`xero_delete_credit_note_allocation` props:
  tenant_id★(DROPDOWN)
  credit_note_id★(DROPDOWN) //Select a credit note to allocate from
  allocation_id★(SHORT_TEXT) //The AllocationID (GUID) of the credit note allocation to del
`xero_update_contact` props:
  tenant_id★(DROPDOWN)
  contact_id★(DROPDOWN) //Select a contact
  name(SHORT_TEXT)
  email(SHORT_TEXT)
  first_name(SHORT_TEXT)
  last_name(SHORT_TEXT)
  account_number(SHORT_TEXT)
  phone(SHORT_TEXT)
  website(SHORT_TEXT)
  tax_number(SHORT_TEXT)
  is_supplier(CHECKBOX)
  is_customer(CHECKBOX)
  default_currency(SHORT_TEXT)
`xero_update_quote` props:
  tenant_id★(DROPDOWN)
  quote_id★(SHORT_TEXT) //The Xero QuoteID (GUID) of the quote to update.
  status(STATIC_DROPDOWN) ["Draft"|"Sent"|"Declined"|"Accepted"|"Invoiced"|"Deleted"]
  title(SHORT_TEXT)
  summary(LONG_TEXT)
  reference(SHORT_TEXT)
  expiry_date(SHORT_TEXT)
  terms(LONG_TEXT)
`xero_update_employee` props:
  tenant_id★(DROPDOWN)
  employee_id★(SHORT_TEXT) //Xero EmployeeID (GUID).
  first_name(SHORT_TEXT)
  last_name(SHORT_TEXT)
  email(SHORT_TEXT)
  job_title(SHORT_TEXT)
  termination_date(SHORT_TEXT)
  status(STATIC_DROPDOWN) ["Active"|"Terminated"]
  phone(SHORT_TEXT)
  mobile(SHORT_TEXT)
`xero_delete_invoice` props:
  tenant_id★(DROPDOWN)
  invoice_id★(SHORT_TEXT) //The Xero InvoiceID (GUID) of the invoice to delete. Only DRA
`xero_void_invoice` props:
  tenant_id★(DROPDOWN)
  invoice_id★(SHORT_TEXT) //The Xero InvoiceID (GUID) of the invoice to void. Must be AU
`xero_delete_purchase_order` props:
  tenant_id★(DROPDOWN)
  purchase_order_id★(DROPDOWN) //Select a purchase order to update
`xero_get_contact_by_id` props:
  tenant_id★(DROPDOWN)
  contact_id★(DROPDOWN) //Select a contact
`xero_get_item_by_id` props:
  tenant_id★(DROPDOWN)
  item_id★(SHORT_TEXT) //Xero ItemID (GUID).
`xero_get_invoices` props:
  tenant_id★(DROPDOWN)
  type(STATIC_DROPDOWN) ["All"|"Sales Invoice (ACCREC)"|"Bill (ACCPAY)"]
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["DRAFT"|"SUBMITTED"|"AUTHORISED"|"PAID"|"VOIDED"]
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  contact_id(SHORT_TEXT)
  page(NUMBER)
  page_size(NUMBER)
  summary_only(CHECKBOX)=true
`xero_get_invoice_url` props:
  tenant_id★(DROPDOWN)
  invoice_id★(SHORT_TEXT) //Xero InvoiceID (GUID).
`xero_get_tax_rates` props:
  tenant_id★(DROPDOWN)
  tax_type(SHORT_TEXT) //Optional filter e.g. OUTPUT, INPUT, NONE.
  status(STATIC_DROPDOWN) ["Active"|"Deleted"]
`xero_get_tracking_categories` props:
  tenant_id★(DROPDOWN)
`xero_get_invoice_history` props:
  tenant_id★(DROPDOWN)
  invoice_id★(SHORT_TEXT) //Xero InvoiceID (GUID).
`xero_find_contact` props:
  tenant_id★(DROPDOWN)
  search_by★(STATIC_DROPDOWN)='NAME' ["Name (exact match)"|"Account Number (exact match)"|"Search Term (broad search)"]
  value★(SHORT_TEXT) //Name, Account Number, or Search Term depending on Search By.
  include_archived(CHECKBOX)=false
  summary_only(CHECKBOX)=true //Recommended for broad searches (Search Term). Excludes heavy
  page(NUMBER) //Pagination page (optional).
`xero_find_invoice` props:
  tenant_id★(DROPDOWN)
  search_by★(STATIC_DROPDOWN)='INVOICE_NUMBER' ["Invoice Number (exact)"|"Reference (exact)"|"Search Term (InvoiceNumber/Reference)"]
  value★(SHORT_TEXT) //Invoice Number, Reference, or Search Term.
  type_filter(STATIC_DROPDOWN) ["Sales Invoice (ACCREC)"|"Bill (ACCPAY)"]
  summary_only(CHECKBOX)=true
  page(NUMBER)
`xero_find_invoice_by_id` props:
  tenant_id★(DROPDOWN)
  invoice_id★(SHORT_TEXT) //Xero InvoiceID (GUID).
`xero_find_invoice_by_contact_id` props:
  tenant_id★(DROPDOWN)
  contact_id★(DROPDOWN) //Select a contact
  type(STATIC_DROPDOWN) ["All"|"Sales Invoice (ACCREC)"|"Bill (ACCPAY)"]
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["DRAFT"|"AUTHORISED"|"PAID"|"VOIDED"]
  page(NUMBER)
`xero_find_credit_note` props:
  tenant_id★(DROPDOWN)
  search_by★(STATIC_DROPDOWN)='NUMBER' ["Credit Note Number"|"Reference"|"Credit Note ID"]
  value★(SHORT_TEXT)
  status(STATIC_DROPDOWN) ["DRAFT"|"SUBMITTED"|"AUTHORISED"|"PAID"|"VOIDED"]
`xero_find_item` props:
  tenant_id★(DROPDOWN)
  search_by★(STATIC_DROPDOWN)='CODE' ["Code (exact)"|"Name (exact)"]
  value★(SHORT_TEXT) //Item Code or Name (exact match).
  order(SHORT_TEXT) //e.g. Name or Name DESC
`xero_find_employee` props:
  tenant_id★(DROPDOWN)
  search_by★(STATIC_DROPDOWN)='EMAIL' ["Email"|"Employee ID"]
  value★(SHORT_TEXT)
`xero_find_payment` props:
  tenant_id★(DROPDOWN)
  search_by★(STATIC_DROPDOWN)='ID' ["Payment ID"|"Reference"]
  value★(SHORT_TEXT)
`xero_find_purchase_order` props:
  tenant_id★(DROPDOWN)
  contact_id(DROPDOWN) //Select a contact
  search_by★(STATIC_DROPDOWN)='NUMBER' ["Purchase Order Number (exact)"|"Reference (exact)"|"Purchase Order ID (GUID)"]
  value★(SHORT_TEXT) //Number, Reference or ID depending on Search By.
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["Draft"|"Submitted"|"Authorised"|"Billed"|"Deleted"]
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  order(SHORT_TEXT)
  page(NUMBER)
  page_size(NUMBER)
`xero_find_quote` props:
  tenant_id★(DROPDOWN)
  quote_number(SHORT_TEXT)
  contact_id(SHORT_TEXT)
  status(STATIC_DROPDOWN) ["DRAFT"|"SENT"|"DECLINED"|"ACCEPTED"|"INVOICED"|"DELETED"]
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  page(NUMBER)
`xero_search_bank_transactions` props:
  tenant_id★(DROPDOWN)
  bank_account_id(DROPDOWN) //Select a bank account
  type(STATIC_DROPDOWN) ["Spend Money"|"Receive Money"|"Spend Overpayment"|"Receive Overpayment"|"Spend Prepayment"|"Receive Prepayment"]
  status(STATIC_DROPDOWN) ["AUTHORISED"|"DELETED"]
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  reference(SHORT_TEXT)
  page(NUMBER)
`xero_search_invoice` props:
  tenant_id★(DROPDOWN)
  search_term(SHORT_TEXT) //Searches across InvoiceNumber, Reference, and Contact Name.
  contact_id(SHORT_TEXT)
  type(STATIC_DROPDOWN) ["All"|"Sales Invoice (ACCREC)"|"Bill (ACCPAY)"]
  statuses(STATIC_MULTI_SELECT_DROPDOWN) ["DRAFT"|"AUTHORISED"|"PAID"|"VOIDED"]
  date_from(SHORT_TEXT)
  date_to(SHORT_TEXT)
  page(NUMBER)
`xero_search_contact_by_email` props:
  tenant_id★(DROPDOWN)
  search_by★(STATIC_DROPDOWN)='EMAIL' ["Email Address"|"Account Number"]
  value★(SHORT_TEXT)
  include_archived(CHECKBOX)=false
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### quickbooks  v2.0.1 | OAuth2
*Manage your business finances with Quickbooks Online. Automate invoice creation, track expenses, fin*
**Triggers:** `new_invoice` `new_expense` `new_customer` `new_deposit` `new_transfer` `new_account` `new_bill` `new_bill_payment` `new_bank_transaction` `new_credit_memo` `new_estimate` `new_invoice_due` `new_journal_entry` `new_paid_invoice` `new_payment` `new_product` `new_purchase_order` `new_refund_receipt` `new_sales_receipt` `new_supplier_credit` `new_time_entry` `new_vendor` `new_project` `updated_bill` `updated_credit_memo` `updated_customer` `updated_estimate` `updated_invoice` `estimate_emailed` `invoice_emailed`
**Actions:** `find_invoice` `find_customer` `find_payment` `create_invoice` `create_expense` `create_customer` `create_bill_account_based` `create_bill_item_based` `create_payment` `create_sales_receipt` `create_estimate` `create_vendor` `create_purchase_order` `create_credit_memo` `create_deposit` `create_employee` `create_journal_entry` `create_refund_receipt` `create_time_activity` `create_vendor_credit` `create_account` `create_product_service` `create_class` `update_invoice` `update_customer` `update_estimate` `update_vendor` `update_bill` `update_sales_receipt` `update_product` `update_purchase_expense` `send_invoice` `send_estimate` `send_sales_receipt` `void_invoice` `delete_invoice` `find_bill` `find_class` `find_estimate` `find_employee` `find_vendor` `find_product` `find_purchase_expense` `find_sales_receipt` `find_account` `get_invoice` `get_bill` `get_sales_receipt` `get_vendor_by_id` `get_all_taxes` `get_all_sales_terms` `list_items` `list_estimates` `get_attachments` `get_access_token` `custom_api_call`
`new_invoice_due` props:
  daysUntilDue★(NUMBER)=7 //Trigger when invoice is due within this many days.
`find_invoice` props:
  invoice_number★(SHORT_TEXT) //The document number (DocNumber) of the invoice to search for
`find_customer` props:
  search_term★(SHORT_TEXT) //The display name of the customer to search for.
`find_payment` props:
  customerId★(SHORT_TEXT) //The ID of the customer to find payments for.
`create_invoice` props:
  customerRef★(DROPDOWN)
  lineItems★(ARRAY) //Line items for the invoice
  emailStatus(STATIC_DROPDOWN)='NotSet' ["Not Set (Default - No Email)"|"Needs To Be Sent"] //Specify whether the invoice should be emailed after creation
  billEmail(SHORT_TEXT) //Email address to send the invoice to. Required if Email Stat
  dueDate(DATE_TIME) //The date when the payment for the invoice is due. If not pro
  docNumber(SHORT_TEXT) //Optional reference number for the invoice. If not provided, 
  txnDate(DATE_TIME) //The date entered on the transaction. Defaults to the current
  privateNote(LONG_TEXT) //Note to self. Does not appear on the invoice sent to the cus
  customerMemo(LONG_TEXT) //Memo to be displayed on the invoice sent to the customer (ap
`create_expense` props:
  accountRef★(DROPDOWN) //The account from which the expense was paid.
  paymentType★(STATIC_DROPDOWN)='Cash' ["Cash"|"Check"|"Credit Card"]
  entityRef(DROPDOWN) //Optional - The vendor the expense was paid to.
  txnDate(DATE_TIME) //The date the expense occurred.
  lineItems★(ARRAY) //Details of the expense (e.g., categories or items purchased)
  privateNote(LONG_TEXT) //Internal note about the expense.
`create_customer` props:
  displayName★(SHORT_TEXT) //The display name of the customer. Required.
  companyName(SHORT_TEXT)
  givenName(SHORT_TEXT)
  familyName(SHORT_TEXT)
  email(SHORT_TEXT)
  phone(SHORT_TEXT)
  mobile(SHORT_TEXT)
  fax(SHORT_TEXT)
  billAddrLine1(SHORT_TEXT)
  billAddrCity(SHORT_TEXT)
  billAddrState(SHORT_TEXT)
  billAddrPostalCode(SHORT_TEXT)
  billAddrCountry(SHORT_TEXT)
  shipAddrLine1(SHORT_TEXT)
  shipAddrCity(SHORT_TEXT)
  shipAddrState(SHORT_TEXT)
  shipAddrPostalCode(SHORT_TEXT)
  shipAddrCountry(SHORT_TEXT)
  notes(LONG_TEXT)
  taxable(CHECKBOX)=false
  paymentMethodRef(SHORT_TEXT)
  salesTermRef(SHORT_TEXT)
  preferredDeliveryMethod(STATIC_DROPDOWN) ["Print"|"Email"|"None"]
  currencyCode(SHORT_TEXT) //e.g. USD, AUD, GBP
  openBalanceDate(SHORT_TEXT) //YYYY-MM-DD
  openBalance(NUMBER)
`create_bill_account_based` props:
  vendorRef★(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  dueDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
  lineItems★(ARRAY)
`create_bill_item_based` props:
  vendorRef★(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  dueDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
  lineItems★(ARRAY)
`create_payment` props:
  customerRef★(DROPDOWN)
  totalAmt★(NUMBER)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  paymentMethodRef(SHORT_TEXT)
  depositToAccountRef(SHORT_TEXT)
  memo(LONG_TEXT)
  linkedInvoiceId(SHORT_TEXT) //Leave blank to create an unlinked payment.
`create_sales_receipt` props:
  customerRef★(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
  emailStatus(STATIC_DROPDOWN)='NotSet' ["Not Set"|"Needs To Be Sent"]
  billEmail(SHORT_TEXT)
  depositToAccountRef(SHORT_TEXT)
  lineItems★(ARRAY)
`create_estimate` props:
  customerRef★(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  expirationDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
  emailStatus(STATIC_DROPDOWN)='NotSet' ["Not Set"|"Needs To Be Sent"]
  billEmail(SHORT_TEXT)
  txnStatus(STATIC_DROPDOWN) ["Accepted"|"Closed"|"Pending"|"Rejected"]
  lineItems★(ARRAY)
`create_vendor` props:
  displayName★(SHORT_TEXT)
  companyName(SHORT_TEXT)
  givenName(SHORT_TEXT)
  familyName(SHORT_TEXT)
  email(SHORT_TEXT)
  phone(SHORT_TEXT)
  mobile(SHORT_TEXT)
  fax(SHORT_TEXT)
  billAddrLine1(SHORT_TEXT)
  billAddrCity(SHORT_TEXT)
  billAddrState(SHORT_TEXT)
  billAddrPostalCode(SHORT_TEXT)
  billAddrCountry(SHORT_TEXT)
  notes(LONG_TEXT)
  taxIdentifier(SHORT_TEXT)
  vendor1099(CHECKBOX)=false //Flag this vendor for 1099 reporting.
  currencyCode(SHORT_TEXT) //e.g. USD, AUD, GBP
  termRef(SHORT_TEXT)
`create_purchase_order` props:
  vendorRef★(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
  shipTo(SHORT_TEXT)
  lineItems★(ARRAY)
`create_credit_memo` props:
  customerRef★(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
  emailStatus(STATIC_DROPDOWN)='NotSet' ["Not Set"|"Needs To Be Sent"]
  billEmail(SHORT_TEXT)
  lineItems★(ARRAY)
`create_deposit` props:
  depositToAccountRef★(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  memo(LONG_TEXT)
  totalAmt★(NUMBER)
  lineItems★(ARRAY)
`create_employee` props:
  givenName★(SHORT_TEXT)
  familyName★(SHORT_TEXT)
  displayName(SHORT_TEXT)
  email(SHORT_TEXT)
  phone(SHORT_TEXT)
  mobile(SHORT_TEXT)
  addrLine1(SHORT_TEXT)
  addrCity(SHORT_TEXT)
  addrState(SHORT_TEXT)
  addrPostalCode(SHORT_TEXT)
  addrCountry(SHORT_TEXT)
  ssn(SHORT_TEXT)
  employeeType(STATIC_DROPDOWN) ["Regular"|"Officer"|"Statutory"]
  billableTime(CHECKBOX)=false
`create_journal_entry` props:
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
  currencyCode(SHORT_TEXT) //e.g. USD, AUD
  lineItems★(ARRAY) //Journal entry lines. Debits must equal credits.
`create_refund_receipt` props:
  customerRef★(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
  depositToAccountRef(SHORT_TEXT)
  lineItems★(ARRAY)
`create_time_activity` props:
  nameof★(STATIC_DROPDOWN) ["Employee"|"Vendor"]
  employeeRef(SHORT_TEXT) //Required if Name Of is Employee.
  vendorRef(SHORT_TEXT) //Required if Name Of is Vendor.
  customerRef★(DROPDOWN)
  itemRef(SHORT_TEXT)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  hours(NUMBER)
  minutes(NUMBER)
  description(LONG_TEXT)
  billableStatus(STATIC_DROPDOWN) ["Billable"|"Not Billable"|"Has Been Billed"]
  hourlyRate(NUMBER)
`create_vendor_credit` props:
  vendorRef★(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
  lineItems★(ARRAY)
`create_account` props:
  name★(SHORT_TEXT)
  accountType★(STATIC_DROPDOWN)
  accountSubType(SHORT_TEXT) //Optional sub-type for the account.
  description(LONG_TEXT)
  taxCodeRef(SHORT_TEXT)
  currencyCode(SHORT_TEXT) //e.g. USD, AUD
  openingBalance(NUMBER)
  openingBalanceDate(SHORT_TEXT) //YYYY-MM-DD
`create_product_service` props:
  name★(SHORT_TEXT)
  type★(STATIC_DROPDOWN) ["Inventory"|"Non-Inventory"|"Service"]
  description(LONG_TEXT)
  purchaseDescription(LONG_TEXT)
  salesPrice(NUMBER)
  purchaseCost(NUMBER)
  incomeAccountRef(SHORT_TEXT)
  expenseAccountRef(SHORT_TEXT)
  assetAccountRef(SHORT_TEXT) //Required for Inventory type items.
  qtyOnHand(NUMBER) //Required for Inventory type.
  invStartDate(SHORT_TEXT) //YYYY-MM-DD. Required for Inventory type.
  active(CHECKBOX)=true
`create_class` props:
  name★(SHORT_TEXT)
  subClass(CHECKBOX)=false //Mark as sub-class of a parent class.
  parentRef(SHORT_TEXT) //Required if marking as sub-class.
`update_invoice` props:
  invoiceId★(SHORT_TEXT)
  customerRef(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  dueDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  emailStatus(STATIC_DROPDOWN) ["Not Set"|"Needs To Be Sent"]
  billEmail(SHORT_TEXT)
  memo(LONG_TEXT)
  customerMemo(LONG_TEXT)
`update_customer` props:
  customerId★(DROPDOWN)
  displayName(SHORT_TEXT)
  companyName(SHORT_TEXT)
  givenName(SHORT_TEXT)
  familyName(SHORT_TEXT)
  email(SHORT_TEXT)
  phone(SHORT_TEXT)
  notes(LONG_TEXT)
  active(CHECKBOX)=true
`update_estimate` props:
  estimateId★(SHORT_TEXT)
  customerRef(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  expirationDate(SHORT_TEXT) //YYYY-MM-DD
  txnStatus(STATIC_DROPDOWN) ["Accepted"|"Closed"|"Pending"|"Rejected"]
  emailStatus(STATIC_DROPDOWN) ["Not Set"|"Needs To Be Sent"]
  billEmail(SHORT_TEXT)
  memo(LONG_TEXT)
`update_vendor` props:
  vendorId★(DROPDOWN)
  displayName(SHORT_TEXT)
  companyName(SHORT_TEXT)
  email(SHORT_TEXT)
  phone(SHORT_TEXT)
  notes(LONG_TEXT)
  active(CHECKBOX)=true
`update_bill` props:
  billId★(SHORT_TEXT)
  vendorRef(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  dueDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
`update_sales_receipt` props:
  salesReceiptId★(SHORT_TEXT)
  customerRef(DROPDOWN)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
  emailStatus(STATIC_DROPDOWN) ["Not Set"|"Needs To Be Sent"]
  billEmail(SHORT_TEXT)
`update_product` props:
  itemId★(SHORT_TEXT)
  name(SHORT_TEXT)
  description(LONG_TEXT)
  salesPrice(NUMBER)
  purchaseCost(NUMBER)
  active(CHECKBOX)=true
`update_purchase_expense` props:
  purchaseId★(SHORT_TEXT)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  docNumber(SHORT_TEXT)
  memo(LONG_TEXT)
  totalAmt(NUMBER)
`send_invoice` props:
  invoiceId★(SHORT_TEXT)
  sendTo(SHORT_TEXT) //Email address to send to. Leave blank to use the customer de
`send_estimate` props:
  estimateId★(SHORT_TEXT)
  sendTo(SHORT_TEXT) //Email address to send to. Leave blank to use the customer de
`send_sales_receipt` props:
  salesReceiptId★(SHORT_TEXT)
  sendTo(SHORT_TEXT) //Email address to send to. Leave blank to use the customer de
`void_invoice` props:
  invoiceId★(SHORT_TEXT)
`delete_invoice` props:
  invoiceId★(SHORT_TEXT)
`find_bill` props:
  docNumber★(SHORT_TEXT)
`find_class` props:
  name★(SHORT_TEXT)
`find_estimate` props:
  docNumber★(SHORT_TEXT)
`find_employee` props:
  displayName★(SHORT_TEXT)
`find_vendor` props:
  displayName★(SHORT_TEXT)
`find_product` props:
  name★(SHORT_TEXT)
`find_purchase_expense` props:
  docNumber(SHORT_TEXT)
  vendorId(SHORT_TEXT)
  txnDate(SHORT_TEXT) //YYYY-MM-DD
  minAmount(NUMBER)
  maxAmount(NUMBER)
`find_sales_receipt` props:
  docNumber★(SHORT_TEXT)
`find_account` props:
  name★(SHORT_TEXT)
`get_invoice` props:
  invoiceId★(SHORT_TEXT)
`get_bill` props:
  billId★(SHORT_TEXT)
`get_sales_receipt` props:
  salesReceiptId★(SHORT_TEXT)
`get_vendor_by_id` props:
  vendorId★(SHORT_TEXT)
`list_items` props:
  type(STATIC_DROPDOWN)='All' ["All"|"Inventory"|"Non-Inventory"|"Service"]
  active(STATIC_DROPDOWN)='Active' ["Active"|"Inactive"|"All"]
`list_estimates` props:
  customerId(SHORT_TEXT) //Filter by customer ID. Leave blank for all customers.
  status(STATIC_DROPDOWN)='All' ["All"|"Accepted"|"Closed"|"Pending"|"Rejected"]
`get_attachments` props:
  entityType★(STATIC_DROPDOWN) ["Invoice"|"Bill"|"Estimate"|"Sales Receipt"|"Payment"|"Purchase Order"|"Expense"]
  entityId★(SHORT_TEXT)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### square  v2.0.0 | OAuth2
*Payment solutions for every business*
**Triggers:** `new_order` `order_updated` `new_customer` `customer_updated` `new_appointment` `new_payment` `new_invoice`

### invoiceninja  v2.0.0 | Custom(base_url,access_token)
*Free open-source invoicing tool*
**Actions:** `create_task` `exists_task` `getclient_task` `getinvoices_task` `getreport_task` `create_invoice` `create_client` `create_recurring_invoice` `action_recurring_invoice` `custom_api_call`

### zoho-books  v2.0.3 | OAuth2
*Comprehensive online accounting software for small businesses.*
**Triggers:** `new_customer` `new_estimate` `new_expense` `new_sales_invoice` `new_item` `new_bill` `new_vendor` `new_credit_note` `new_customer_payment` `new_project` `new_timesheet` `new_recurring_expense` `new_recurring_invoice`
**Actions:** `create_sales_customer` `create_item` `create_estimate` `create_sales_invoice` `create_contact` `create_contact_person` `create_sales_order` `create_expense` `create_employee` `create_credit_note` `create_payment` `create_bill` `create_purchase_order` `create_vendor_payment` `get_contact_by_id` `get_contact_person` `get_estimate` `get_contact_person_by_contact_id` `get_employee` `get_item_by_name` `get_invoice` `update_contact_person` `update_contact` `update_sales_invoice` `update_item` `update_sales_order` `update_purchase_order` `update_payment` `update_expense` `update_estimate` `update_bill` `update_vendor_payment` `delete_contact` `delete_invoice` `delete_item` `delete_estimate` `delete_employee` `add_attachment_to_invoice` `email_invoice` `find_invoice` `find_bill` `list_currencies` `list_active_accounts` `list_contacts` `list_bill_field_details` `list_contact_persons` `list_bill_payments` `list_all_locations` `custom_api_request_beta` `custom_api_call`

### zoho-invoice  v2.0.3 | OAuth2
*Online invoicing software for businesses*
**Triggers:** `customer_payment` `invoice_status_change` `new_contact` `new_contact_person` `new_credit_note` `new_estimate` `new_expense` `new_invoice` `new_item` `new_project` `update_invoice`
**Actions:** `create_invoice` `get_invoice` `update_invoice` `find_invoice` `mark_invoice_as_sent` `mark_invoice_as_draft` `void_invoice` `email_invoice` `create_contact` `get_contact` `update_contact` `find_contact` `find_contact_email` `create_contact_person` `get_contact_person` `update_contact_person` `create_estimate` `get_estimate` `update_estimate` `create_expense` `get_expense` `update_expense` `find_expense` `create_item` `get_item` `update_item` `get_item_by_name` `create_payment` `get_payment` `update_payment` `find_customer_payment` `create_credit_note` `get_credit_note` `update_credit_note` `find_credit_note` `email_credit_note` `create_project` `get_project` `update_project` `create_task` `get_task` `create_user` `update_user` `custom_api_call`
`customer_payment` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
`invoice_status_change` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
`new_contact` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
`new_contact_person` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
`new_credit_note` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
`new_estimate` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
`new_expense` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
`new_invoice` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
`new_item` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
`new_project` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
`update_invoice` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
`create_invoice` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  customer_id★(DROPDOWN) //Select the customer.
  invoice_number(SHORT_TEXT) //Custom invoice number. Leave empty to use Zoho's auto-genera
  date(SHORT_TEXT) //Invoice date in YYYY-MM-DD format.
  due_date(SHORT_TEXT) //Invoice due date in YYYY-MM-DD format.
  line_items★(JSON) //Array of line items with fields: item_id, name, quantity, ra
  reference_number(SHORT_TEXT) //Reference number for the invoice (e.g., PO number or any ext
  notes(LONG_TEXT) //Notes for the invoice.
  terms(LONG_TEXT) //Terms and conditions for the invoice.
`get_invoice` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  invoice_id★(DROPDOWN) //Select the invoice.
`update_invoice` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  invoice_id★(DROPDOWN) //Select the invoice.
  customer_id★(DROPDOWN) //Select the customer.
  invoice_number(SHORT_TEXT) //The invoice number.
  date(SHORT_TEXT) //Invoice date in YYYY-MM-DD format.
  due_date(SHORT_TEXT) //Invoice due date in YYYY-MM-DD format.
  line_items(JSON) //Array of line items.
  notes(LONG_TEXT) //Notes for the invoice.
  terms(LONG_TEXT) //Terms and conditions for the invoice.
`find_invoice` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  search_text(SHORT_TEXT) //Search by invoice number or customer name.
  customer_id★(DROPDOWN) //Select the customer.
`mark_invoice_as_sent` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  invoice_id★(DROPDOWN) //Select the invoice.
`mark_invoice_as_draft` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  invoice_id★(DROPDOWN) //Select the invoice.
`void_invoice` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  invoice_id★(DROPDOWN) //Select the invoice.
`email_invoice` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  invoice_id★(DROPDOWN) //Select the invoice.
  to_mail_ids★(ARRAY) //Email addresses to send the invoice to. Add one email per en
  subject(SHORT_TEXT) //Email subject.
  body(LONG_TEXT) //Email body.
`create_contact` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  contact_name★(SHORT_TEXT) //The name of the contact.
  company_name(SHORT_TEXT) //The company name.
  contact_type(STATIC_DROPDOWN) ["Customer"|"Vendor"] //The type of contact.
  email(SHORT_TEXT) //The email address of the contact.
  phone(SHORT_TEXT) //The phone number of the contact.
  mobile(SHORT_TEXT) //The mobile number of the contact.
  billing_address(JSON) //Billing address with fields: address, city, state, zip, coun
  currency_code(SHORT_TEXT) //The currency code (e.g., USD, EUR).
`get_contact` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  contact_id★(DROPDOWN) //Select the contact.
`update_contact` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  contact_id★(DROPDOWN) //Select the contact.
  contact_name(SHORT_TEXT) //The name of the contact.
  company_name(SHORT_TEXT) //The company name.
  email(SHORT_TEXT) //The email address of the contact.
  phone(SHORT_TEXT) //The phone number of the contact.
  mobile(SHORT_TEXT) //The mobile number of the contact.
  billing_address(JSON) //Billing address with fields: address, city, state, zip, coun
`find_contact` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  search_text★(SHORT_TEXT) //Search by contact name or email.
`find_contact_email` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  email★(SHORT_TEXT) //The email address to search for.
`create_contact_person` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  contact_id★(DROPDOWN) //Select the contact.
  first_name★(SHORT_TEXT) //The first name of the contact person.
  last_name(SHORT_TEXT) //The last name of the contact person.
  email(SHORT_TEXT) //The email address of the contact person.
  phone(SHORT_TEXT) //The phone number of the contact person.
  mobile(SHORT_TEXT) //The mobile number of the contact person.
  is_primary_contact(CHECKBOX) //Whether this person is the primary contact.
`get_contact_person` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  contact_id★(DROPDOWN) //Select the contact.
  contact_person_id★(DROPDOWN) //Select the contact person.
`update_contact_person` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  contact_id★(DROPDOWN) //Select the contact.
  contact_person_id★(DROPDOWN) //Select the contact person.
  first_name(SHORT_TEXT) //The first name of the contact person.
  last_name(SHORT_TEXT) //The last name of the contact person.
  email(SHORT_TEXT) //The email address of the contact person.
  phone(SHORT_TEXT) //The phone number of the contact person.
  mobile(SHORT_TEXT) //The mobile number of the contact person.
`create_estimate` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  customer_id★(DROPDOWN) //Select the customer.
  estimate_number(SHORT_TEXT) //The estimate number.
  date(SHORT_TEXT) //Estimate date in YYYY-MM-DD format.
  expiry_date(SHORT_TEXT) //Estimate expiry date in YYYY-MM-DD format.
  line_items★(JSON) //Array of line items.
  notes(LONG_TEXT) //Notes for the estimate.
  terms(LONG_TEXT) //Terms and conditions for the estimate.
`get_estimate` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  estimate_id★(DROPDOWN) //Select the estimate.
`update_estimate` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  estimate_id★(DROPDOWN) //Select the estimate.
  customer_id★(DROPDOWN) //Select the customer.
  date(SHORT_TEXT) //Estimate date in YYYY-MM-DD format.
  expiry_date(SHORT_TEXT) //Estimate expiry date in YYYY-MM-DD format.
  line_items(JSON) //Array of line items.
  notes(LONG_TEXT) //Notes for the estimate.
`create_expense` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  account_id★(DROPDOWN) //Select the expense account.
  paid_through_account_id(DROPDOWN) //Select the account through which the expense was paid.
  date★(SHORT_TEXT) //Expense date in YYYY-MM-DD format.
  amount★(NUMBER) //The expense amount.
  description(LONG_TEXT) //Description of the expense.
  vendor_id(SHORT_TEXT) //The ID of the vendor.
  customer_id★(DROPDOWN) //Select the customer.
  is_billable(CHECKBOX) //Whether the expense is billable.
  currency_code(SHORT_TEXT) //The currency code (e.g., USD, EUR).
`get_expense` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  expense_id★(DROPDOWN) //Select the expense.
`update_expense` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  expense_id★(DROPDOWN) //Select the expense.
  account_id★(DROPDOWN) //Select the expense account.
  date(SHORT_TEXT) //Expense date in YYYY-MM-DD format.
  amount(NUMBER) //The expense amount.
  description(LONG_TEXT) //Description of the expense.
  is_billable(CHECKBOX) //Whether the expense is billable.
`find_expense` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  description(SHORT_TEXT) //Search by expense description.
  vendor_id(SHORT_TEXT) //Filter by vendor ID.
`create_item` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  name★(SHORT_TEXT) //The name of the item.
  rate★(NUMBER) //The rate/price of the item.
  description(LONG_TEXT) //Description of the item.
  unit(SHORT_TEXT) //The unit of measurement for the item.
  sku(SHORT_TEXT) //The SKU of the item.
  product_type(STATIC_DROPDOWN) ["Goods"|"Service"] //The type of product.
`get_item` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  item_id★(DROPDOWN) //Select the item.
`update_item` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  item_id★(DROPDOWN) //Select the item.
  name(SHORT_TEXT) //The name of the item.
  rate(NUMBER) //The rate/price of the item.
  description(LONG_TEXT) //Description of the item.
  unit(SHORT_TEXT) //The unit of measurement for the item.
  sku(SHORT_TEXT) //The SKU of the item.
`get_item_by_name` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  name★(SHORT_TEXT) //The name of the item to search for.
`create_payment` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  customer_id★(DROPDOWN) //Select the customer.
  payment_mode★(STATIC_DROPDOWN) ["Cash"|"Check"|"Bank Transfer"|"Credit Card"|"Others"] //The mode of payment.
  amount★(NUMBER) //The payment amount.
  date★(SHORT_TEXT) //Payment date in YYYY-MM-DD format.
  invoices(JSON) //Array of invoices with fields: invoice_id, amount_applied.
  reference_number(SHORT_TEXT) //Reference number for the payment.
  description(LONG_TEXT) //Description of the payment.
`get_payment` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  payment_id★(DROPDOWN) //Select the payment.
`update_payment` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  payment_id★(DROPDOWN) //Select the payment.
  payment_mode(STATIC_DROPDOWN) ["Cash"|"Check"|"Bank Transfer"|"Credit Card"|"Others"] //The mode of payment.
  amount(NUMBER) //The payment amount.
  date(SHORT_TEXT) //Payment date in YYYY-MM-DD format.
  reference_number(SHORT_TEXT) //Reference number for the payment.
`find_customer_payment` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  reference_number★(SHORT_TEXT) //The reference number of the payment.
`create_credit_note` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  customer_id★(DROPDOWN) //Select the customer.
  creditnote_number(SHORT_TEXT) //The credit note number.
  date(SHORT_TEXT) //Credit note date in YYYY-MM-DD format.
  line_items★(JSON) //Array of line items.
  notes(LONG_TEXT) //Notes for the credit note.
`get_credit_note` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  creditnote_id★(DROPDOWN) //Select the credit note.
`update_credit_note` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  creditnote_id★(DROPDOWN) //Select the credit note.
  customer_id★(DROPDOWN) //Select the customer.
  date(SHORT_TEXT) //Credit note date in YYYY-MM-DD format.
  line_items(JSON) //Array of line items.
  notes(LONG_TEXT) //Notes for the credit note.
`find_credit_note` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  creditnote_number★(DROPDOWN) //Select the credit note to search for.
`email_credit_note` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  creditnote_id★(DROPDOWN) //Select the credit note.
  to_mail_ids★(ARRAY) //Email addresses to send the credit note to. Add one email pe
  subject(SHORT_TEXT) //Email subject.
  body(LONG_TEXT) //Email body.
`create_project` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  project_name★(SHORT_TEXT) //The name of the project.
  customer_id★(DROPDOWN) //Select the customer.
  description(LONG_TEXT) //Description of the project.
  billing_type★(STATIC_DROPDOWN) ["Fixed Cost for Project"|"Based on Project Hours"|"Based on Task Hours"|"Based on Staff Hours"] //The billing type for the project.
  rate(NUMBER) //The billing rate for the project.
  budget_hours(NUMBER) //The budget hours for the project.
`get_project` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  project_id★(DROPDOWN) //Select the project.
`update_project` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  project_id★(DROPDOWN) //Select the project.
  project_name(SHORT_TEXT) //The name of the project.
  description(LONG_TEXT) //Description of the project.
  rate(NUMBER) //The billing rate for the project.
  budget_hours(NUMBER) //The budget hours for the project.
`create_task` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  project_id★(DROPDOWN) //Select the project.
  task_name★(SHORT_TEXT) //The name of the task.
  description(LONG_TEXT) //Description of the task.
  rate(NUMBER) //The billing rate for the task.
  budget_hours(NUMBER) //The budget hours for the task.
`get_task` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  project_id★(DROPDOWN) //Select the project.
  task_id★(DROPDOWN) //Select the task.
`create_user` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  name★(SHORT_TEXT) //The full name of the user.
  email★(SHORT_TEXT) //The email address of the user.
  role(STATIC_DROPDOWN) ["Admin"|"Staff"|"Accountant"|"Timesheet Staff"] //The role assigned to the user.
`update_user` props:
  organization_id★(DROPDOWN) //Select your Zoho Invoice organization.
  user_id★(SHORT_TEXT) //The ID of the user to update.
  name(SHORT_TEXT) //The full name of the user.
  email(SHORT_TEXT) //The email address of the user.
  role(STATIC_DROPDOWN) ["Admin"|"Staff"|"Accountant"|"Timesheet Staff"] //The role assigned to the user.
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### mollie  v2.0.0 | API Key
*Automate Mollie payments, orders, refunds, customers, and invoices. Triggers on payment events and s*
**Triggers:** `new_customer` `new_order` `new_settlement` `new_invoice` `new_payment` `new_refund` `new_chargeback`
**Actions:** `create_order` `create_payment_link` `create_payment` `create_customer` `create_payment_refund` `search_order` `search_payment` `search_customer`

### razorpay  v2.0.0 | Custom(keyID,keySecret)
*Automate your payments and financial operations with Razorpay. Create payment links and use custom A*
**Actions:** `custom_api_call` `create-payment-link`

### chargekeep  v2.0.0 | Custom(base_url,api_key)
*Easy-to-use recurring and one-time payments software for Stripe & PayPal*
**Triggers:** `new_lead` `new_payment` `new_subscription`
**Actions:** `addOrUpdateContact` `addOrUpdateContact(extended)` `addOrUpdateSubscription` `createInvoice` `createProduct` `getContactDetails`

### checkout  v2.0.0 | API Key
*Manage payments, customers, and payouts with Checkout.com. Automate payment links, refunds, and moni*
**Triggers:** `payment_events` `dispute_events`
**Actions:** `create_customer` `update_customer` `create_payment_link` `create_payment` `refund_payment` `get_payment_details` `get_payment_actions`

### amazon-seller  v2.0.1 | Custom(lwaClientId,lwaClientSecret,refreshToken,marketplaceId,sellerId,awsRegion,awsAccessKeyId,awsSecretAccessKey)
*Amazon Selling Partner API for managing orders, inventory, and seller operations.*
**Triggers:** `new_order_placed`
**Actions:** `list_orders` `get_order` `get_order_items` `get_order_address` `get_order_buyer_info` `get_order_items_buyer_info` `get_order_regulated_info` `search_orders` `custom_api_call`

### cartloom  v2.0.0 | Custom(domain,apiKey)
*Sell products beautifully*
**Actions:** `get_products` `get_order` `create_discount` `get_discount` `get_all_discounts` `get_orders_by_date` `get_orders_by_email` `custom_api_call`

### pandadoc  v2.0.0 | API Key
*Create, track, and eSign documents with PandaDoc. Automate document creation from templates, manage *
**Triggers:** `documentCompleted` `documentStateChanged` `documentUpdated`
**Actions:** `createDocumentFromTemplate` `createAttachment` `createOrUpdateContact` `findDocument` `getDocumentAttachments` `getDocumentDetails` `downloadDocument` `custom_api_call`

### docusign  v2.0.0 | Custom(clientId,privateKey,environment,impersonatedUserId,scopes)
*Manage eSignatures and document workflows with DocuSign. List envelopes, retrieve envelope details, *
**Actions:** `listEnvelopes` `getEnvelope` `getDocument` `custom_api_call`

### saleor  v2.0.0 | Custom(apiUrl,token)
*Manage your e-commerce operations with Saleor. Execute custom GraphQL queries, retrieve order detail*
**Actions:** `rawGraphqlQuery` `getOrder` `addOrderNote`

### vtex  v2.0.0 | Custom(hostUrl,appKey,appToken)
*Unified commerce platform*
**Actions:** `get-product-by-id` `create-product` `Update-product` `get-brand-list` `get-brand-by-id` `create-brand` `update-brand` `delete-brand` `get-category-by-id` `get-sku-by-product-id` `create-sku` `create-sku-file` `get-client-list` `get-client-by-id` `get-order-by-id` `get-order-list` `custom_api_call`

### webflow  v2.0.0 | OAuth2
*Design, build, and launch responsive websites visually*
**Triggers:** `new_submission`
**Actions:** `create_collection_item` `delete_collection_item` `update_collection_item` `find_collection_item` `get_collection_item` `fulfill_order` `unfulfill_order` `refund_order` `find_order` `custom_api_call`

### wordpress  v2.0.0 | Custom(username,password,website_url)
*Open-source website creation software*
**Triggers:** `new_post`
**Actions:** `create_post` `create_page` `update_post` `get_post` `custom_api_call`

### bubble  v2.0.0 | None
*No-code platform for web and mobile apps*
**Actions:** `bubble_create_thing` `bubble_delete_thing` `bubble_update_thing` `bubble_get_thing` `bubble_list_things`

### onfleet  v2.0.0 | API Key
*Last mile delivery software*
**Triggers:** `task_arrival` `task_assigned` `task_cloned` `task_completed` `task_created` `task_delayed` `task_deleted` `task_eta` `task_failed` `task_started` `task_unassigned` `task_updated` `worker_created` `worker_deleted` `worker_duty_change` `auto_dispatch_completed` `sms_recipient_opt_out` `sms_recipient_response_missed`
**Actions:** `create_recipient` `update_recipient` `get_recipient` `create_task` `delete_task` `complete_task` `clone_task` `update_task` `get_task` `get_tasks` `create_destination` `get_destination` `get_hubs` `create_hub` `update_hub` `get_organization` `get_delegatee_details` `create_admin` `update_admin` `get_admins` `delete_admin` `create_worker` `delete_worker` `get_worker` `get_worker_schedule` `update_worker` `create_team` `delete_team` `get_team` `get_teams` `update_team` `get_container` `custom_api_call`

### simpliroute  v2.0.0 | API Key
*Connect with SimpliRoute, the last-mile delivery optimization platform. Manage clients, vehicles, vi*
**Actions:** `get_me` `get_clients` `create_clients` `bulk_delete_clients` `create_client_property` `get_vehicles` `create_vehicle` `get_vehicle` `delete_vehicle` `get_visits` `create_visits` `get_visit` `update_visit_partial` `update_visit` `delete_visit` `add_visit_items` `get_routes` `create_route` `get_route` `delete_route` `get_plans` `create_plan` `get_plan_vehicles` `get_visit_detail` `get_drivers` `create_users` `get_user` `update_user` `get_skills` `get_observations` `get_tags` `get_zones` `get_fleets` `get_sellers` `custom_api_call`

### netsuite  v2.0.0 | Custom(accountId,consumerKey,consumerSecret,tokenId,tokenSecret)
*Manage your business operations with NetSuite. Automate customer and vendor data retrieval, and inte*
**Actions:** `getVendor` `getCustomer` `custom_api_call`

### zuora  v2.0.0 | Custom(clientId,clientSecret,environment)
*Cloud-based subscription management platform that enables businesses to launch and monetize subscrip*
**Actions:** `create-invoice` `find-account` `find-product-rate-plan` `find-product`

### truelayer  v2.0.0 | OAuth2
*Connect with TrueLayer to leverage secure open banking services. This integration allows seamless in*
**Actions:** `create-payout` `get-payout` `start-payout-authorization-flow` `submit-payments-provider-return-parameters` `create-mandate` `list-mandate` `get-mandate` `start-mandate-authorization-flow` `submit-consent-mandate` `submit-mandate-provider-selection` `revoke-mandate` `confirm-mandate-funds` `get-constraints` `list-operating-accounts` `get-operating-account` `merchant-account-get-transactions` `merchant-account-setup-sweeping` `merchant-account-disable-sweeping` `merchant-account-get-sweeping` `get-merchant-account-payment-sources` `create-payment-link` `get-payment-link` `get-payment-link-payments` `create-payment` `start-payment-authorization-flow` `submit-provider-selection` `submit-scheme-selection` `submit-form` `submit-consent` `submit-user-account-selection` `cancel-payment` `save-user-account-payment` `get-payment` `create-payment-refund` `get-payment-refunds` `get-payment-refund` `search-payment-providers` `get-payment-provider` `custom_api_call`

### wedof  v2.0.0 | API Key
*Automatisez la gestion de vos dossiers de formations (CPF, EDOF, Kairos, AIF, OPCO et autres)*
**Triggers:** `newRegistrationFolderNotProcessed` `registrationFolderUpdated` `registrationFolderAccepted` `registrationFolderInTraining` `registrationFolderTerminated` `registrationFolderPaid` `registrationFolderSelected` `registrationFolderTobill` `newCertificationFolderCreated` `certificationFolderUpdated` `certificationFolderRegistred` `certificationFolderTotake` `certificationFolderToControl` `certificationfolderSuccess` `certificationFolderToretake` `certificationFolderSelected` `certificationFolderSurveyInitialExperienceAvailable` `certificationFolderSurveyInitialExperienceAnswered` `certificationFolderSurveyLongTermExperienceAnswered` `certificationFolderSurveyLongTermExperienceAvailable` `certificationFolderSurveySixMonthExperienceAnswered` `certificationFolderSurveySixMonthExperienceAvailable` `certificationPartnerAborted` `certificationPartnerProcessing` `certificationPartnerActive` `certificationPartnerRefused` `certificationPartnerRevoked` `certificationPartnerSuspended`
**Actions:** `listPartnerStats` `getRegistrationFolder` `listRegistrationFolders` `updateRegistrationFolder` `validateRegistrationFolder` `declareRegistrationFolderTerminated` `declareRegistrationFolderServicedone` `declareRegistrationFolderIntraining` `billRegistrationFolder` `cancelRegistrationFolder` `refuseRegistrationFolder` `getMinimalSessionsDates` `getRegistrationFolderDocuments` `updateCompletionRate` `createRegistrationFolder` `getCertificationFolder` `searchCertificationFolder` `declareCertificationFolderRegistred` `declareCertificationFolderToTake` `declareCertificationFolderToControl` `declareCertificationFolderSuccess` `declareCertificationFolderToRetake` `declareCertificationFolderFailed` `refuseCertificationFolder` `abortCertificationFolder` `getCertificationFolderDocuments` `updateCertificationFolder` `createCertificationFolder` `listActivitiesAndTasks` `createTask` `createActivitie` `sendFile` `me` `myOrganism` `addExecutionTag` `getCertificationFolderSurvey` `listCertificationFolderSurveys` `createCertificationPartnerAudit` `createGeneralAudit` `getPartnership` `updatePartnership` `deletePartnership` `listPartnerships` `createPartnership` `resetPartnership`

### respaid  v2.0.0 | API Key
*Automate your debt collection and payment recovery with Respaid. Recover unpaid invoices and manage *
**Triggers:** `new_campaign_creation` `new_cancelled_case` `new_disputed_case` `new_payout` `new_successful_collection_paid_to_creditor` `new_successful_installment_payment_via_respaid` `new_successful_collection_via_legal_officer` `new_successful_partial_payment_to_creditor` `new_successful_partial_payment_via_respaid` `new_successful_collection_via_respaid`
**Actions:** `create_new_campaign` `stop_collection_client_paid_directly` `stop_collection_for_direct_partial_payment` `stop_collection_for_direct_instalment_payment`


## ★ MARKETING & EMAIL

### mailchimp  v2.0.2 | OAuth2
*All-in-One integrated marketing platform for managing audiences, sending campaigns, tracking engagem*
**Triggers:** `subscribe` `unsubscribe` `subscriber_updated` `new_campaign` `email_opened` `link_clicked` `cleaned_emails` `email_address_changes` `new_audience` `new_customer` `new_order` `new_segment_tag_subscriber`
**Actions:** `add_member_to_list` `add_new_member_with_custom_fields` `add_note_to_subscriber` `add_subscriber_to_tag` `add_member_to_segment` `remove_subscriber_from_tag` `remove_member_from_segment` `remove_member_tags_list` `update_member_in_list` `update_member_with_custom_fields` `create_campaign` `send_campaign` `get_campaign_report` `click_report` `search_campaigns` `create_audience` `create_tag` `create_custom_event` `archive_subscriber` `permanently_delete_member` `delete_list_member` `unsubscribe_email` `get_all_members` `get_list_segments` `get_list_tags` `get_interests_information` `find_campaign` `find_customer` `find_tag` `find_subscriber`

### convertkit  v2.0.0 | API Key
*Email marketing for creators*
**Triggers:** `webhook_subscriber_tag_add` `webhook_subscriber_tag_remove` `webhook_subscriber_activated` `webhook_subscriber_unsubscribed` `webhook_subscriber_bounced` `webhook_subscriber_complained` `webhook_form_subscribed` `webhook_sequence_subscribed` `webhook_sequence_completed` `webhook_link_clicked` `webhook_product_purchased` `webhook_purchase_created`
**Actions:** `subscribers_get_subscriber_by_id` `subscribers_get_subscriber_by_email` `subscribers_list_subscribers` `subscribers_update_subscriber` `subscribers_unsubscribe_subscriber` `subscribers_list_tags_by_email` `subscribers_list_tags_by_subscriber_id` `create_webhook` `destroy_webhook` `custom_fields_list_fields` `custom_fields_create_field` `custom_fields_update_field` `custom_fields_delete_field` `broadcasts_list_broadcasts` `broadcasts_create_broadcast` `broadcasts_get_broadcast` `broadcasts_update_broadcast` `broadcasts_delete_broadcast` `broadcasts_broadcast_stats` `forms_list_forms` `forms_add_subscriber_to_form` `forms_list_form_subscriptions` `sequences_list_sequences` `sequences_add_subscriber_to_sequence` `sequences_list_subscriptions_to_sequence` `tags_list_tags` `tags_create_tag` `tags_tag_subscriber` `tags_remove_tag_from_subscriber_by_email` `tags_remove_tag_from_subscriber_by_id` `tags_list_subscriptions_to_tag` `purchases_list_purchases` `purchases_get_purchase_by_id` `purchases_create_purchase` `purchases_create_multiple_purchases`

### mailer-lite  v2.0.0 | API Key
*Email marketing software*
**Triggers:** `subscriber.created` `subscriber.updated` `subscriber.unsubscribed` `subscriber.added_to_group`
**Actions:** `add_subscriber_to_group` `add_or_update_subscriber` `find_subscriber` `remove_subscriber_from_group` `custom_api_call`
`subscriber.created` props:
  name★(SHORT_TEXT)
`subscriber.updated` props:
  name★(SHORT_TEXT)
`subscriber.unsubscribed` props:
  name★(SHORT_TEXT)
`subscriber.added_to_group` props:
  name★(SHORT_TEXT)
`add_subscriber_to_group` props:
  subscriberId★(DROPDOWN)
  subscriberGroupId★(DROPDOWN)
`add_or_update_subscriber` props:
  email★(SHORT_TEXT) //Email of the new contact
  subscriberFields★(DYNAMIC)
  status(STATIC_DROPDOWN)='active' ["Active"|"Unsubscribed"|"Unconfirmed"|"Bounced"|"Junk"] //If empty, status Active is used by default.
  subscriberGroupId(MULTI_SELECT_DROPDOWN)
  subscribed_at(DATE_TIME)
  opted_in_at(DATE_TIME)
  ip_address(SHORT_TEXT)
  optin_ip(SHORT_TEXT)
`find_subscriber` props:
  searchValue★(SHORT_TEXT)
`remove_subscriber_from_group` props:
  subscriberId★(DROPDOWN)
  subscriberGroupId★(DROPDOWN)
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### emailoctopus  v2.0.0 | API Key
*Email marketing platform for list management, campaign sending, tagging & unsubscribes. Automate con*
**Triggers:** `email_bounced` `email_opened` `emailClicked` `newContact` `contactUnsubscribes`
**Actions:** `add_or_update_contact` `unsubscribe_contact` `update_contact_email` `add_tag_to_contact` `remove_tag_from_contact` `create_list` `find_contact` `custom_api_call`
`email_bounced` props:
  campaign_id(DROPDOWN) //Select a campaign to filter events. Leave blank to trigger f
  liveMarkdown(MARKDOWN) //**Live URL:** ```text {{webhookUrl}} ```
  instructions(MARKDOWN) //**Manual Setup Required** 1. Go to your EmailOctopus Dashboa
`email_opened` props:
  campaign_id(DROPDOWN) //Select a campaign to filter events. Leave blank to trigger f
  liveMarkdown(MARKDOWN) //**Live URL:** ```text {{webhookUrl}} ```
  instructions(MARKDOWN) //**Manual Setup Required** 1. Go to your EmailOctopus Dashboa
`emailClicked` props:
  campaign_id(DROPDOWN) //Select a campaign to filter events. Leave blank to trigger f
  liveMarkdown(MARKDOWN) //**Live URL:** ```text {{webhookUrl}} ```
  instructions(MARKDOWN) //**Manual Setup Required** 1. Go to your EmailOctopus Dashboa
`newContact` props:
  list_id★(DROPDOWN) //The mailing list to use.
  liveMarkdown(MARKDOWN) //**Live URL:** ```text {{webhookUrl}} ```
  instructions(MARKDOWN) //**Manual Setup Required** 1. Go to your EmailOctopus Dashboa
`contactUnsubscribes` props:
  list_id★(DROPDOWN) //The mailing list to use.
  liveMarkdown(MARKDOWN) //**Live URL:** ```text {{webhookUrl}} ```
  instructions(MARKDOWN) //**Manual Setup Required** 1. Go to your EmailOctopus Dashboa
`add_or_update_contact` props:
  list_id★(DROPDOWN) //The mailing list to use.
  email_address★(SHORT_TEXT) //The contact's email address.
  fields★(DYNAMIC) //The contact's custom fields.
  tags(ARRAY) //Tags to associate with the contact. Existing tags will not b
  status(STATIC_DROPDOWN) ["Subscribed"|"Unsubscribed"|"Pending"] //The status of the contact.
`unsubscribe_contact` props:
  list_id★(DROPDOWN) //The mailing list to use.
  email_address★(SHORT_TEXT) //The email address of the contact to unsubscribe.
`update_contact_email` props:
  list_id★(DROPDOWN) //The mailing list to use.
  current_email_address★(SHORT_TEXT) //The contact's current email address used to find them.
  new_email_address★(SHORT_TEXT) //The new email address for the contact.
`add_tag_to_contact` props:
  list_id★(DROPDOWN) //The mailing list to use.
  email_address★(SHORT_TEXT) //The contact's email address.
  tags★(ARRAY) //The tags to add to the contact.
`remove_tag_from_contact` props:
  list_id★(DROPDOWN) //The mailing list to use.
  email_address★(SHORT_TEXT) //The email address of the contact to modify.
  tags★(ARRAY) //The tags to remove from the contact.
`create_list` props:
  name★(SHORT_TEXT) //The name for the new list.
`find_contact` props:
  list_id★(DROPDOWN) //The mailing list to use.
  email_address★(SHORT_TEXT) //The email address of the contact to find.
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### campaign-monitor  v2.0.0 | API Key
*Email marketing platform for delivering exceptional email campaigns.*
**Triggers:** `new_subscriber_added` `subscriber_unsubscribed` `new_client`
**Actions:** `add_subscriber_to_list` `update_subscriber_details` `unsubscribe_subscriber` `find_subscriber`
`new_subscriber_added` props:
  clientId★(DROPDOWN)
  listId★(DROPDOWN)
`subscriber_unsubscribed` props:
  clientId★(DROPDOWN)
  listId★(DROPDOWN)
`add_subscriber_to_list` props:
  clientId★(DROPDOWN)
  listId★(DROPDOWN)
  email★(SHORT_TEXT)
  name(SHORT_TEXT)
  phone(SHORT_TEXT)
  consentToTrack★(STATIC_DROPDOWN)='Unchanged' ["Yes"|"No"|"Unchanged"] //Whether the subscriber has consented to tracking.
  consentToSendSms(STATIC_DROPDOWN)='Unchanged' ["Yes"|"No"|"Unchanged"] //Whether the subscriber has consented to send SMS.
  resubscribe(CHECKBOX)=false //If true, the subscriber will be resubscribed if they previou
  fields★(DYNAMIC)
`update_subscriber_details` props:
  clientId★(DROPDOWN)
  listId★(DROPDOWN)
  email★(SHORT_TEXT)
  name(SHORT_TEXT)
  phone(SHORT_TEXT)
  consentToTrack(STATIC_DROPDOWN)='Yes' ["Yes"|"No"|"Unchanged"] //Whether the subscriber has consented to tracking.
  consentToSendSms(STATIC_DROPDOWN)='Unchanged' ["Yes"|"No"|"Unchanged"] //Whether the subscriber has consented to send SMS.
  resubscribe(CHECKBOX)=false //If true, the subscriber will be resubscribed if they previou
  fields★(DYNAMIC)
`unsubscribe_subscriber` props:
  clientId★(DROPDOWN)
  listId★(DROPDOWN)
  email★(SHORT_TEXT) //The email address of the subscriber to unsubscribe.
`find_subscriber` props:
  clientId★(DROPDOWN)
  listId★(DROPDOWN)
  email★(SHORT_TEXT) //The email address of the subscriber to find

### sendinblue  v2.0.0 | API Key
*Formerly Sendinblue, is a SaaS solution for relationship marketing*
**Actions:** `create_or_update_contact` `custom_api_call`
`create_or_update_contact` props:
  email★(SHORT_TEXT) //Email address of the user. Mandatory if "SMS" field is not p
  ext_id(SHORT_TEXT) //Pass your own Id to create a contact.
  attributes(OBJECT) //Pass the set of attributes and their values. The attribute's
  email_blacklisted(CHECKBOX)=false //Set this field to blacklist the contact for emails (emailBla
  sms_blacklisted(CHECKBOX)=false //Set this field to blacklist the contact for SMS (smsBlacklis
  list_ids(ARRAY) //Ids of the lists to add the contact to.
  smtp_blacklist_sender(CHECKBOX)=false //transactional email forbidden sender for contact. Use only f
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### drip  v2.0.0 | API Key
*E-commerce CRM for B2B marketers*
**Triggers:** `new_subscriber` `tag_applied_to_subscribers`
**Actions:** `apply_tag_to_subscriber` `add_subscriber_to_campaign` `upsert_subscriber` `custom_api_call`

### beehiiv  v2.0.0 | API Key
*Manage subscriptions, create posts, and automate your newsletter workflow with beehiiv.*
**Triggers:** `beehiiv_new_post_sent` `beehiiv_user_unsubscribes` `beehiiv_new_subscription_confirmed`
**Actions:** `create_subscription` `update_subscription` `add_subscription_to_automation` `list_automations` `list_posts` `custom_api_call`

### ghostcms  v2.0.0 | Custom(baseUrl,apiKey)
*Publishing platform for professional bloggers*
**Triggers:** `member_added` `member_edited` `member_deleted` `post_published` `post_scheduled` `page_published`
**Actions:** `create_member` `update_member` `create_post` `find_member` `find_user` `custom_api_call`

### constant-contact  v2.0.0 | OAuth2
*Email marketing for small businesses*
**Actions:** `create_or_update_contact` `custom_api_call`

### customer-io  v2.0.0 | Custom(region,track_site_id,track_api_key,api_bearer_token)
*Create personalized journeys across all channels with our customer engagement platform.*
**Actions:** `create_event` `custom_track_api_call` `custom_app_api_call`

### mautic  v2.0.0 | Custom(base_url,username,password)
*Open-source marketing automation software*
**Triggers:** `mautic_lead_post_save_update_trigger` `mautic_lead_company_change_trigger` `mautic_lead_channel_subscription_changed_trigger` `mautic_lead_post_save_new_trigger`
**Actions:** `create_mautic_contact` `search_mautic_contact` `update_mautic_contact` `create_mautic_company` `search_mautic_company` `update_mautic_company` `custom_api_call`

### sendpulse  v2.0.0 | Custom(clientId,clientSecret)
*Automate your multi-channel marketing with SendPulse. Manage subscribers, update contact details, an*
**Triggers:** `new_subscriber` `new_unsubscriber` `updated_subscriber`
**Actions:** `add-subscriber` `change-variable-for-subscriber` `delete-contact` `unsubscribe-user` `update-subscriber` `custom_api_call`

### mailjet  v2.0.0 | Basic Auth
*Email delivery service for sending transactional and marketing emails*
**Actions:** `send_email`

### maileroo  v2.0.0 | Custom(keyType,apiKey)
*Email Delivery Service with Real-Time Analytics and Reporting*
**Actions:** `sendEmail` `sendFromTemplate` `verifyEmail`

### resend  v2.0.0 | API Key
*Email for developers*
**Actions:** `send_email` `custom_api_call`

### sendfox  v2.0.0 | API Key
*Email marketing made simple*
**Actions:** `create-list` `unsubscribe` `create-contact` `custom_api_call`

### smaily  v2.0.0 | Custom(domain,username,password)
*Automate your email marketing with Smaily. Effortlessly manage your subscribers, update contact info*
**Actions:** `create-or-update-subscriber` `get-subscriber` `custom_api_call`

### zagomail  v2.0.0 | API Key
*All-in-one email marketing and automation platform*
**Triggers:** `addedSubscriber` `unsubscribedSubscriber` `taggedSubscriber`
**Actions:** `createSubscriber` `tagSubscriber` `updateSubscriber` `searchSubscriberByEmail` `getSubscriberDetails` `getCampaignDetails`

### tarvent  v2.0.0 | Custom(accountId,apiKey)
*Tarvent is an email marketing, automation, and email API platform that allows to you to send campaig*
**Triggers:** `tarvent_contact_added` `tarvent_contact_group_updated` `tarvent_contact_updated` `tarvent_contact_status_updated` `tarvent_contact_tag_updated` `tarvent_contact_note_added` `tarvent_contact_unsubscribed` `tarvent_form_submitted` `tarvent_page_performed` `tarvent_survey_submitted` `tarvent_contact_clicked` `tarvent_contact_opened` `tarvent_contact_replied` `tarvent_contact_bounced` `tarvent_campaign_send_finished` `tarvent_transaction_created` `tarvent_transaction_sent`
**Actions:** `tarvent_create_contact` `tarvent_update_contact_tag` `tarvent_update_contact_group` `tarvent_create_contact_note` `tarvent_update_contact_journey` `tarvent_update_contact_status` `tarvent_create_audience_group` `tarvent_update_journey_status` `tarvent_create_transaction` `tarvent_send_campaign` `tarvent_generate_custom_event` `tarvent_get_audiences` `tarvent_get_audience_groups` `tarvent_create_suppression_filter` `tarvent_get_campaigns` `tarvent_get_contact` `tarvent_get_custom_event` `tarvent_get_journey`

### sendy  v2.0.0 | Custom(domain,apiKey,brandId)
*Self-hosted email marketing software*
**Actions:** `count_subscribers` `create_campaign` `delete_subscriber` `get_brands` `get_brand_lists` `get_subscription_status` `subscribe` `subscribe_multiple_lists` `unsubscribe` `unsubscribe_multiple`

### vbout  v2.0.0 | API Key
*Marketing automation platform for agencies*
**Actions:** `vbout_add_contact` `vbout_add_tag` `vbout_create_email_list` `vbout_add_email_marketing_campaign` `vbout_create_social_media_message` `vbout_get_contact_by_email` `vbout_get_email_list` `vbout_remove_tag` `vbout_unsubscribe_contact` `vbout_update_contact`

### smoove  v2.0.0 | API Key
*Smoove is a platform for creating and managing your email list and sending emails to your subscriber*
**Triggers:** `newListCreated` `newSubscriber` `newFormCreated` `newLeadSubmitted`
**Actions:** `addOrUpdateSubscriber` `createAList` `findSubscriber` `unsubscribe`

### acumbamail  v2.0.1 | API Key
*Easily send email and SMS campaigns and boost your business*
**Actions:** `acumbamail_add_update_subscriber` `acumbamail_create_subscriber_list` `acumbamail_unsubscribe_subscriber` `acumbamail_delete_subscriber_list` `acumbamail_search_subscriber` `acumbamail_remove_subscriber`

### clickfunnels  v2.0.0 | Custom(subdomain,apiKey)
*Manage sales funnels, track leads, and automate marketing workflows with ClickFunnels.*
**Triggers:** `scheduledAppointmentEventCreated` `courseEnrollmentCreatedForContact` `contactSubmittedForm` `OneTimeOrderPaid` `subscriptionInvoicePaid` `contactCompletedCourse` `contactIdentified` `contactSuspendedFromCourse`
**Actions:** `createOpportunity` `applyTagToContact` `removeTagFromContact` `enrollAContactIntoACourse` `updateOrCreateContact` `searchContacts` `custom_api_call`

### foreplay-co  v2.0.0 | API Key
*Competitive advertising data and creative insights platform. Search, filter, and analyze ads and bra*
**Triggers:** `newAdInSpyder` `newAdInBoard` `newSwipefileAd`
**Actions:** `getAdById` `getAdsByPage` `findBrands` `findAds` `findBoards`

### dittofeed  v2.0.0 | Custom(apiKey,baseUrl)
*Customer data platform for user analytics and tracking*
**Actions:** `identify` `track` `screen`

### contentful  v2.0.0 | Custom(apiKey,space,environment)
*Content infrastructure for digital teams*
**Actions:** `contentful_record_search` `contentful_record_get` `contentful_record_create` `custom_api_call`

### datocms  v2.0.0 | Custom(apiKey,environment)
*Dato is a modern headless CMS*
**Actions:** `custom_api_call`

### posthog  v2.0.0 | API Key
*Open-source product analytics*
**Actions:** `create_event` `create_project` `custom_api_call`

### mixpanel  v2.0.0 | API Key
*Simple and powerful product analytics that helps everyone make better decisions*
**Actions:** `track_event` `custom_api_call`

### segment  v2.0.0 | API Key
*Collect and route your customer data with Segment. Identify users and track their behavior across di*
**Actions:** `identifyUser`

### cloutly  v2.0.0 | API Key
*Review Management Tool*
**Actions:** `sendReviewInvite` `custom_api_call`

### circle  v2.0.0 | API Key
*Circle.so is a platform for creating and managing communities.*
**Triggers:** `new_post_created` `new_member_added`
**Actions:** `create_post` `create_comment` `add_member_to_space` `find_member_by_email` `get_post_details` `get_member_details` `custom_api_call`

### bettermode  v2.0.0 | Custom(region,domain,email,password)
*Feature-rich engagement platform. Browse beautifully designed templates, each flexible for precise c*
**Actions:** `create_discussion` `create_question` `assign_badge` `revoke_badge` `custom_api_call`

### bitly  v2.0.0 | Custom(accessToken)
*URL shortening and link management platform with analytics.*
**Triggers:** `new_bitlink_created`
**Actions:** `archive_bitlink` `create_bitlink` `create_qr_code` `get_bitlink_details` `update_bitlink` `custom_api_call`

### short-io  v2.0.0 | Custom(apiKey)
*Create, manage, and track branded short links with Short.io,Automate link creation, monitor clicks, *
**Triggers:** `new_link_created`
**Actions:** `create-country-targeting-rule` `create-short-link` `delete-short-link` `expire-short-link` `get-domain-statistics` `get-short-link-info-by-path` `get-link-clicks` `list-short-links` `update-short-link` `custom_api_call`

### zoho-campaigns  v2.0.1 | OAuth2
*Zoho Campaigns is an email marketing platform for managing mailing lists, sending campaigns, trackin*
**Triggers:** `newContact` `unsubscribe` `newCampaign`
**Actions:** `createCampaign` `cloneCampaign` `sendCampaign` `addUpdateContact` `addTagToContact` `removeTag` `unsubscribeContact` `addContactToMailingList` `create_tag` `create_topic` `move_to_do_not_mail` `findContact` `findCampaign` `get_all_tags` `list_custom_fields`

### systeme-io  v2.0.0 | API Key
*Systeme.io is a CRM platform that allows you to manage your contacts, sales, and marketing campaigns*
**Triggers:** `newContact` `newSale` `newTagAddedToContact`
**Actions:** `createContact` `addTagToContact` `removeTagFromContact` `findContactByEmail` `updateContact`

### acuity-scheduling  v2.0.0 | OAuth2
*Acuity Scheduling is online appointment scheduling software that helps businesses manage bookings, c*
**Triggers:** `appointment_canceled` `new_appointment`
**Actions:** `add_blocked_time` `create_appointment` `create_client` `reschedule_appointment` `update_client` `find_appointment` `find_client` `custom_api_call`

### sessions-us  v2.0.0 | API Key
*Video conferencing platform for businesses and professionals*
**Triggers:** `booking_created` `booking_started` `booking_ended` `event_created` `event_published` `event_started` `event_ended` `event_new_registration` `session_created` `session_started` `session_ended` `takeaway_ready` `transcript_ready`
**Actions:** `create_session` `create_event` `publish_event` `custom_api_call`

### frame  v2.0.0 | API Key
*Collaborative workspace platform*
**Triggers:** `frame_trigger_project_created` `frame_trigger_asset_created` `frame_trigger_comment_created`
**Actions:** `custom_api_call`

### pinterest  v2.0.0 | OAuth2
*Expand your reach on Pinterest. Create and manage pins and boards, find content, and track new follo*
**Triggers:** `newBoard` `newFollower` `newPinOnBoard`
**Actions:** `createPin` `createBoard` `deletePin` `findBoardByName` `findPin` `updateBoard`

### reddit  v2.0.0 | OAuth2
*Interact with Reddit - fetch and submit posts.*
**Actions:** `retrieveRedditPost` `getRedditPostDetails` `createRedditPost` `createRedditComment` `fetchPostComments` `editRedditPost` `editRedditComment` `deleteRedditPost` `deleteRedditComment` `custom_api_call`


## ★ FORMS & SURVEYS

### typeform  v2.0.1 | OAuth2
*Typeform is a web-based platform you can use to create anything from surveys to apps. It makes colle*
**Triggers:** `new_submission` `new_entry_legacy`
**Actions:** `create_form` `create_workspace` `duplicate_form` `update_choice_options` `lookup_responses` `custom_api_call`

### tally  v2.0.0 | None
*Receive form submissions from Tally forms*
**Triggers:** `new-submission`

### jotform  v2.0.0 | Custom(apiKey,region)
*Create online forms and surveys*
**Triggers:** `new_submission`
**Actions:** `custom_api_call`

### fillout-forms  v2.0.0 | API Key
*Create interactive forms and automate workflows with Fillout*
**Triggers:** `new-form-response`
**Actions:** `getFormResponses` `getSingleResponse` `findFormByTitle` `custom_api_call`

### cognito-forms  v2.0.0 | API Key
*Build powerful online forms and manage entries with Cognito Forms. Automate form submission tracking*
**Triggers:** `new_entry` `entry_updated`
**Actions:** `create_entry` `update_entry` `delete_entry` `get_entry` `custom_api_call`

### kizeo-forms  v2.0.0 | API Key
*Create custom mobile forms*
**Triggers:** `event_on_data` `event_on_data_deleted` `event_on_data_finished` `event_on_data_pushed` `event_on_data_received` `event_on_data_updated`
**Actions:** `get_data_definition` `push_data` `download_standard_pdf` `download_custom_export_in_its_original_format` `get_list_definition` `get_list_item` `get_all_list_items` `create_list_item` `edit_list_item` `delete_list_item` `custom_api_call`

### paperform  v2.0.0 | API Key
*Create beautiful forms, manage submissions, and automate your e-commerce workflows with Paperform. C*
**Triggers:** `new_form_submission` `new_partial_form_submission`
**Actions:** `deleteFormSubmission` `deletePartialFormSubmission` `createFormCoupon` `updateFormCoupon` `deleteFormCoupon` `createFormProduct` `updateFormProduct` `deleteFormProduct` `createSpace` `updateSpace` `findFormProduct` `findForm` `findSpace` `custom_api_call`

### formstack  v2.0.0 | OAuth2
*Trigger workflows when a new submission is received*
**Triggers:** `newSubmission` `newForm`
**Actions:** `createSubmission` `findFormByNameOrId` `getSubmissionDetails` `findSubmissionByFieldValue` `custom_api_call`

### gravityforms  v2.0.0 | None
*Build and publish your WordPress forms*
**Triggers:** `new-submission`

### formbricks  v2.0.0 | Custom(appUrl,apiKey)
*Open source Survey Platform*
**Triggers:** `formbricks_trigger_response_created` `formbricks_trigger_response_updated` `formbricks_trigger_response_finished`
**Actions:** `custom_api_call`

### wufoo  v2.0.0 | Custom(apiKey,subdomain)
*Create and manage your online forms with Wufoo. Automate form entry creation, search for submissions*
**Triggers:** `new_form_entry` `new_form_created`
**Actions:** `create-form-entry` `find-form` `find-submission-by-field` `get-entry-details` `custom_api_call`

### zoho-forms  v2.0.0 | OAuth2
*Online form builder and data collection tool by Zoho*
**Triggers:** `new_form_created` `new_form_submission`
**Actions:** `get_all_forms` `get_form_details` `custom_api_call`

### airtable  v2.0.0 | API Key
*Low‒code platform to build apps.*
**Triggers:** `new_record` `updated_record`
**Actions:** `airtable_create_record` `airtable_find_record` `airtable_update_record` `airtable_delete_record` `airtable_upload_file_to_column` `airtable_add_comment_to_record` `airtable_create_base` `airtable_create_table` `airtable_find_base` `airtable_find_table_by_id` `airtable_get_record_by_id` `airtable_find_table` `airtable_get_base_schema` `custom_api_call`

### apitable  v2.0.0 | Custom(token,apiTableUrl)
*Interactive spreadsheets with collaboration*
**Triggers:** `new_record`
**Actions:** `apitable_create_record` `apitable_update_record` `apitable_find_record` `custom_api_call`

### bika  v2.0.0 | Custom(token)
*Interactive spreadsheets with collaboration*
**Actions:** `bika_create_record` `bika_find_records` `bika_find_record` `bika_update_record` `bika_delete_record` `custom_api_call`
`bika_create_record` props:
  space_id★(DROPDOWN)
  database_id★(DROPDOWN)
  fields★(DYNAMIC) //The fields to add to the record.
`bika_find_records` props:
  space_id★(DROPDOWN)
  database_id★(DROPDOWN)
  maxRecords(NUMBER) //How many records are returned in total.
  pageSize(NUMBER) //How many records are returned per page (max 1000).
  filter(LONG_TEXT) //The filter to apply to the records (see https://bika.ai/help
`bika_find_record` props:
  space_id★(DROPDOWN)
  database_id★(DROPDOWN)
  recordId★(SHORT_TEXT)
`bika_update_record` props:
  space_id★(DROPDOWN)
  database_id★(DROPDOWN)
  recordId★(SHORT_TEXT) //The ID of the record to update.
  fields★(DYNAMIC) //The fields to add to the record.
`bika_delete_record` props:
  space_id★(DROPDOWN)
  database_id★(DROPDOWN)
  recordId★(SHORT_TEXT) //The ID of the record to delete.
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### grist  v2.0.0 | Custom(apiKey,domain)
*open source spreadsheet*
**Triggers:** `grist-new-record` `grist-updated-record`
**Actions:** `grist-create-record` `grist-search-record` `grist-update-record` `grist-upload-attachments-to-document` `custom_api_call`

### retable  v2.0.0 | API Key
*Turn your spreadsheets into smart database apps*
**Actions:** `retable_create_record` `retable_get_workspaces` `retable_get_projects` `retable_get_retables` `retable_create_workspace` `retable_create_project` `custom_api_call`

### ninox  v2.0.0 | API Key
*Manage your business data and build custom apps with Ninox. Create, update, and find records, manage*
**Triggers:** `newRecord`
**Actions:** `createRecord` `updateRecord` `deleteRecord` `uploadFile` `downloadFileFromRecord` `findRecord` `listFilesFromRecord` `custom_api_call`

### knack  v2.0.0 | Custom(apiKey,applicationId)
*Build online databases and manage your data with Knack. Create, update, delete, and search for recor*
**Actions:** `create_record` `delete_record` `find_record` `update_record` `custom_api_call`


## ★ STORAGE & FILES

### dropbox  v2.0.0 | OAuth2
*Cloud storage and file synchronization*
**Actions:** `search_dropbox` `create_new_dropbox_text_file` `upload_dropbox_file` `downloadFile` `get_dropbox_file_link` `delete_dropbox_file` `move_dropbox_file` `copy_dropbox_file` `create_new_dropbox_folder` `delete_dropbox_folder` `move_dropbox_folder` `copy_dropbox_folder` `list_dropbox_folder` `custom_api_call`

### amazon-s3  v2.0.0 | Custom(accessKeyId,secretAccessKey,bucket,endpoint,region)
*Scalable storage in the cloud*
**Triggers:** `new_file`
**Actions:** `upload-file` `read-file` `generate-signed-url` `moveFile` `deleteFile` `list-files`

### box  v2.0.0 | OAuth2
*Secure content management and collaboration*
**Triggers:** `new_file` `new_folder` `new_comment`
**Actions:** `custom_api_call`
`new_file` props:
  folder★(SHORT_TEXT) //The ID of the folder in which file uploads will trigger this
`new_folder` props:
  folder★(SHORT_TEXT) //The ID of the folder in which file uploads will trigger this
`new_comment` props:
  id★(SHORT_TEXT) //The ID of the item to trigger a webhook
  type★(STATIC_DROPDOWN) ["File"|"Folder"] //The type of the item to trigger a webhook
`custom_api_call` props:
  url★(DYNAMIC)
  method★(STATIC_DROPDOWN) ["GET"|"POST"|"PATCH"|"PUT"|"DELETE"|"HEAD"]
  headers★(OBJECT) //Authorization headers are injected automatically from your c
  queryParams★(OBJECT)
  body(JSON)
  response_is_binary(CHECKBOX)=false //Enable for files like PDFs, images, etc..
  failsafe(CHECKBOX)
  timeout(NUMBER)

### sftp  v2.0.0 | Custom(protocol,allow_unauthorized_certificates,host,port,username,password,privateKey,algorithm)
*Connect to FTP, FTPS or SFTP servers*
**Triggers:** `new_file`
**Actions:** `create_file` `upload_file` `read_file_content` `deleteFile` `createFolder` `deleteFolder` `listFolderContents` `renameFileOrFolder`
`new_file` props:
  path★(SHORT_TEXT)='./' //The path to watch for new files
  ignoreHiddenFiles(CHECKBOX)=false //Ignore hidden files
`create_file` props:
  fileName★(SHORT_TEXT)
  fileContent★(LONG_TEXT)
`upload_file` props:
  fileName★(SHORT_TEXT) //The path on the sftp server to store the file. e.g. `./myfol
  fileContent★(FILE)
`read_file_content` props:
  filePath★(SHORT_TEXT)
`deleteFile` props:
  filePath★(SHORT_TEXT) //The path of the file to delete e.g. `./myfolder/test.mp3`
`createFolder` props:
  folderPath★(SHORT_TEXT) //The new folder path e.g. `./myfolder`. For FTP/FTPS, it will
  recursive(CHECKBOX)=false //For SFTP only: Create parent directories if they do not exis
`deleteFolder` props:
  folderPath★(SHORT_TEXT) //The path of the folder to delete e.g. `./myfolder`
  recursive(CHECKBOX)=false //Enable this option to delete the folder and all its contents
`listFolderContents` props:
  directoryPath★(SHORT_TEXT) //The path of the folder to list e.g. `./myfolder`
`renameFileOrFolder` props:
  information(MARKDOWN) //Depending on the server you can also use this to move a file
  oldPath★(SHORT_TEXT) //The path of the file or folder to rename e.g. `./myfolder/te
  newPath★(SHORT_TEXT) //The new path of the file or folder e.g. `./myfolder/new-name

### cloudinary  v2.0.0 | Custom(api_key,api_secret,cloud_name)
*Cloudinary is a cloud-based image and video management platform that allows you to upload, store, ma*
**Triggers:** `new_resource` `new_tag_added_to_asset`
**Actions:** `uploadResource` `deleteResource` `createUsageReport` `findResourceByPublicId` `transformResource`

### backblaze  v2.0.0 | Custom(accessKeyId,secretAccessKey,bucket,endpoint,region)
*Scalable storage in the cloud*
**Triggers:** `new_backblaze_file`
**Actions:** `upload-backblaze-file` `read-backblaze-file`
`new_backblaze_file` props:
  folderPath(SHORT_TEXT)
`upload-backblaze-file` props:
  file★(FILE)
  fileName(SHORT_TEXT) //my-file-name (no extension). write full path if you want to 
  acl(STATIC_DROPDOWN) ["private"|"public-read"|"public-read-write"|"authenticated-read"|"aws-exec-read"|"bucket-owner-read"|"bucket-owner-full-control"]
  type★(STATIC_DROPDOWN)
`read-backblaze-file` props:
  key★(SHORT_TEXT) //The key of the file to read. include extension if file has a

### cloudconvert  v2.0.0 | OAuth2
*File conversion and processing platform supporting 200+ formats*
**Triggers:** `new_job` `job_finished` `job_failed`
**Actions:** `convert_file` `capture_website` `merge_pdf` `download_file` `archive_file` `optimize_file` `custom_api_call`

### gcloud-pubsub  v2.0.0 | Custom(json)
*Google Cloud's event streaming service*
**Triggers:** `new_message_in_topic`
**Actions:** `publish_to_topic`

### amazon-sns  v2.0.0 | Custom(accessKeyId,secretAccessKey,region,endpoint)
*Send messages to Amazon Simple Notification Service (SNS) topics.*
**Actions:** `send-message`

### amazon-sqs  v2.0.0 | Custom(accessKeyId,secretAccessKey,region)
*Send messages to Amazon Simple Queue Service (SQS) queues.*
**Actions:** `sendMessage`

### figma  v2.0.0 | OAuth2
*Collaborative interface design tool*
**Triggers:** `new_comment`
**Actions:** `get_file` `get_comments` `post_comment` `custom_api_call`

### rabbitmq  v2.0.0 | Custom(host,username,password,port,vhost)
*Connect and automate your messaging with RabbitMQ. Send messages to exchanges or queues, and trigger*
**Triggers:** `messageReceived`
**Actions:** `sendMessageToExchange` `sendMessageToQueue`

### rss  v2.0.0 | None
*Stay updated with RSS feeds*
**Triggers:** `new-item` `new-item-list`

### anyhook-graphql  v2.0.0 | Custom(proxyBaseUrl)
*AnyHook GraphQL enables real-time communication through AnyHook proxy server by allowing you to subs*
**Triggers:** `graphql_subscription_trigger`

### anyhook-websocket  v2.0.0 | Custom(proxyBaseUrl)
*AnyHook Websocket enables real-time communication through AnyHook proxy server by allowing you to su*
**Triggers:** `websocket_subscription_trigger`


## ★ DATABASES

### supabase  v2.0.0 | Custom(url,apiKey)
*The open-source Firebase alternative*
**Triggers:** `new_row`
**Actions:** `upload-file` `create_row` `update_row` `upsert_row` `delete_rows` `search_rows` `custom_api_call`

### postgres  v2.0.0 | Custom(host,port,user,password,database,enable_ssl,reject_unauthorized,certificate)
*The world's most advanced open-source relational database*
**Triggers:** `new-row`
**Actions:** `run-query`

### mysql  v2.0.0 | Custom(host,port,user,password,database)
*The world's most popular open-source database*
**Actions:** `find_rows` `insert_row` `update_row` `delete_row` `get_tables` `execute_query`
`find_rows` props:
  timezone(SHORT_TEXT) //Timezone for the MySQL server to use
  table★(DROPDOWN)
  condition★(SHORT_TEXT) //SQL condition, can also include logic operators, etc.
  args(ARRAY) //Arguments can be used using ? in the condition
  columns(ARRAY) //Specify the columns you want to select
`insert_row` props:
  timezone(SHORT_TEXT) //Timezone for the MySQL server to use
  table★(DROPDOWN)
  values★(OBJECT)
`update_row` props:
  timezone(SHORT_TEXT) //Timezone for the MySQL server to use
  table★(DROPDOWN)
  values★(OBJECT)
  search_column★(SHORT_TEXT)
  search_value★(SHORT_TEXT)
`delete_row` props:
  timezone(SHORT_TEXT) //Timezone for the MySQL server to use
  table★(DROPDOWN)
  search_column★(SHORT_TEXT)
  search_value★(SHORT_TEXT)
`execute_query` props:
  timezone(SHORT_TEXT) //Timezone for the MySQL server to use
  query★(SHORT_TEXT) //The query string to execute, use ? for arguments to avoid SQ
  args(ARRAY) //Arguments to use in the query, if any. Should be in the same

### mongodb  v2.0.0 | Custom(host,useAtlasUrl,database,username,password,authSource)
*Interact with your MongoDB databases. Perform CRUD operations, execute commands, and manage collecti*
**Actions:** `find_documents` `insert_documents` `update_documents` `delete_documents` `find_and_update_documents` `find_and_replace_documents` `aggregate_documents`
`find_documents` props:
  database(SHORT_TEXT) //The MongoDB database to connect to (from your authentication
  collection★(DROPDOWN)
  query(JSON) //MongoDB query to filter documents (e.g., {"status": "active"
  projection(JSON) //Fields to include or exclude (e.g., {"name": 1, "_id": 0})
  sort(JSON) //Sort criteria (e.g., {"createdAt": -1})
  limit(NUMBER) //Maximum number of documents to return
  skip(NUMBER)=0 //Number of documents to skip
`insert_documents` props:
  database(SHORT_TEXT) //The MongoDB database to connect to (from your authentication
  collection★(DROPDOWN)
  documents★(JSON) //Document(s) to insert. Can be a single document object or an
`update_documents` props:
  database(SHORT_TEXT) //The MongoDB database to connect to (from your authentication
  collection★(DROPDOWN)
  filter★(JSON) //MongoDB query to select documents to update (e.g., {"status"
  update★(JSON) //MongoDB update operations (e.g., {"$set": {"status": "comple
  upsert(CHECKBOX)=false //Insert a document if no documents match the filter
`delete_documents` props:
  database(SHORT_TEXT) //The MongoDB database to connect to (from your authentication
  collection★(DROPDOWN)
  filter★(JSON) //MongoDB query to select documents to delete (e.g., {"status"
`find_and_update_documents` props:
  database(SHORT_TEXT) //The MongoDB database to connect to (from your authentication
  collection★(DROPDOWN)
  filter★(JSON) //MongoDB query to select documents to update (e.g., {"status"
  update★(JSON) //MongoDB update operations (e.g., {"$set": {"status": "comple
  upsert(CHECKBOX)=false //Insert a document if no documents match the filter
  returnUpdated(CHECKBOX)=true //Return the documents after updates are applied
`find_and_replace_documents` props:
  database(SHORT_TEXT) //The MongoDB database to connect to (from your authentication
  collection★(DROPDOWN)
  filter★(JSON) //MongoDB query to select documents to replace (e.g., {"_id": 
  replacement★(JSON) //New document that will replace the matched documents
  upsert(CHECKBOX)=false //Insert the document if no documents match the filter
  returnDocument(STATIC_DROPDOWN)='after' ["Before Update"|"After Update"] //Which version of the document to return
`aggregate_documents` props:
  database(SHORT_TEXT) //The MongoDB database to connect to (from your authentication
  collection★(DROPDOWN)
  pipeline★(JSON) //Array of aggregation stages (e.g., [{"$match": {"status": "a

### snowflake  v2.0.1 | Custom(account,username,password,privateKey,database,role,warehouse)
*Data warehouse built for the cloud*
**Actions:** `runQuery` `runMultipleQueries` `insert-row`

### baserow  v2.0.0 | Custom(apiUrl,token)
*Open-source online database tool, alternative to Airtable*
**Actions:** `baserow_create_row` `baserow_delete_row` `baserow_get_row` `baserow_list_rows` `baserow_update_row` `custom_api_call`

### nocodb  v2.0.0 | Custom(baseUrl,apiToken,version)
*Turn any database into a smart spreadsheet with NocoDB. Create, update, delete, and search records w*
**Actions:** `nocodb-create-record` `nocodb-delete-record` `nocodb-update-record` `nocodb-get-record` `nocodb-search-records`

### surrealdb  v2.0.0 | Custom(url,database,namespace,username,password)
*Multi Model Database*
**Triggers:** `new-row`
**Actions:** `run-query`


## ★ ACCOUNTING & HR

### actualbudget  v2.0.0 | Custom(server_url,password,sync_id,encryption_password)
*Personal finance app*
**Actions:** `get_budget` `import_transaction` `import_transactions` `get_categories` `get_accounts`

### odoo  v2.0.0 | Custom(base_url,database,username,api_key)
*Open source all-in-one management software*
**Actions:** `get_contacts` `create_contact` `create_company` `get_records` `create_record` `update_record` `custom_odoo_api_call`

### zoho-mail  v2.0.2 | OAuth2
*Zoho Mail is a powerful email service that allows you to manage your email, contacts, and calendars *
**Triggers:** `new_email_received` `new_email_matching_search` `new_tagged_email`
**Actions:** `get_email_details` `mark_email_as_read` `mark_email_as_unread` `move_email` `send_email` `create_draft` `create_folder` `create_task` `create_tag` `custom_api_call`


## ★ SCHEDULING

### calendly  v2.0.1 | API Key
*Calendly is an elegant and simple scheduling tool for businesses that eliminates email back and fort*
**Triggers:** `invitee_created` `invitee_canceled` `invitee_no_show_created` `routing_form_submission` `meeting_recap_created` `event_canceled_polling`
**Actions:** `book_meeting_for_invitee` `cancel_event` `create_event` `create_one_off_meeting_link` `mark_invitee_no_show` `find_event` `find_meeting_recap` `find_meeting_recap_transcript` `find_user` `get_event` `get_event_type` `get_invitee` `get_user` `custom_api_call`

### cal-com  v2.0.0 | API Key
*Open-source alternative to Calendly*
**Triggers:** `BOOKING_CANCELLED` `BOOKING_CREATED` `BOOKING_RESCHEDULED`

### tidycal  v2.0.0 | API Key
*Streamline your scheduling*
**Triggers:** `booking_canceled` `new_booking` `new_contact`
**Actions:** `custom_api_call`


## REMAINING TOOLS

*35 more:*

### aminos  v2.0.0 | Custom(base_url,access_token)
*Integrate with Aminos One to manage users.*
**Actions:** `createUser`

### ashby  v2.0.0 | Custom(apiKey)
*Manage your recruiting and hiring process with Ashby.*
**Actions:** `custom_api_call`

### binance  v2.0.0 | None
*Fetch the price of a crypto pair from Binance*
**Actions:** `fetch_crypto_pair_price`

### blockscout  v2.0.0 | None
*Blockscout is a tool for inspecting and analyzing EVM chains.*
**Actions:** `search` `check_redirect` `get_blocks` `get_main_page_blocks` `get_block_by_hash` `get_block_transactions` `get_block_withdrawals` `get_transactions` `get_main_page_transactions` `get_transaction_by_hash` `get_transaction_token_transfers` `get_transaction_internal_transactions` `get_transaction_logs` `get_transaction_raw_trace` `get_transaction_state_changes` `get_transaction_summary` `get_addresses` `get_address_by_hash` `get_address_counters` `get_address_transactions` `get_address_token_transfers` `get_address_logs` `get_address_blocks_validated` `get_address_token_balances` `get_address_tokens` `get_address_withdrawals` `get_address_coin_balance_history` `get_address_coin_balance_history_by_day` `get_tokens` `get_token_by_address` `get_token_transfers` `get_token_holders` `get_token_counters` `get_token_instances`

### brilliant-directories  v2.0.0 | Custom(api_key,site_url)
*All-in-one membership software*
**Actions:** `create_new_user` `custom_api_call`

### certopus  v2.0.0 | API Key
*Your certificates, made simple*
**Actions:** `create_credential` `custom_api_call`

### chainalysis-api  v2.0.0 | API Key
*Chainalysis Screening API allows you to check if a blockchain address is sanctioned.*
**Actions:** `checkAddressSanction`

### deepl  v2.0.0 | Custom(key,type)
*AI-powered language translation*
**Actions:** `translate_text` `custom_api_call`

### dimo  v2.0.0 | Custom(clientId,redirectUri,apiKey)
*DIMO is an open protocol using blockchain to establish universal digital vehicle identity, permissio*
**Triggers:** `battery-is-charging-trigger` `battery-power-trigger` `charge-level-trigger` `fuel-absolute-level-trigger` `fuel-relative-level-trigger` `ignition-trigger` `odometer-trigger` `speed-trigger` `tire-pressure-trigger`
**Actions:** `attestation-create-vin-vc` `device-definitions-decode-vin` `device-definitions-lookup-device-definitions` `token-exchange-get-vehicle-jwt` `identity-custom-query` `identity-total-vehicle-count` `identity-get-developer-license-info` `identity-get-vehicle-by-dev-license` `identity-get-total-vehicle-count-for-owner` `identity-get-vehicle-mmy-by-owner` `identity-get-vehicle-mmy-by-tokenid` `identity-get-sacd-for-vehicle` `identity-get-rewards-by-owner` `identity-get-reward-history-by-owner` `identity-get-device-definition-by-tokenid` `identity-get-device-definition-by-definitionid` `identity-get-owner-vehicles` `identity-get-developer-shared-vehicles-from-owner` `identity-get-dcns-by-owner` `telemetry-custom-query` `telemetry-available-signals` `telemetry-signals` `telemetry-daily-avg-speed` `telemetry-event` `telemetry-max-speed` `telemetry-vin-vc-latest` `vehicle-events-list-webhooks-action` `vehicle-events-upsert-webhook-numeric-action` `vehicle-events-upsert-webhook-boolean-action` `vehicle-events-delete-webhook-action` `vehicle-events-list-signals-action` `vehicle-events-list-subscribed-vehicles-action` `vehicle-events-list-vehicle-subscriptions-action` `vehicle-events-subscribe-vehicle-action` `vehicle-events-subscribe-all-vehicles-action` `vehicle-events-unsubscribe-vehicle-action` `vehicle-events-unsubscribe-all-vehicles-action`

### discourse  v2.0.0 | Custom(api_key,api_username,website_url)
*Modern open source forum software*
**Actions:** `create_post` `create_topic` `change_user_trust_level` `add_users_to_group` `send_private_message` `custom_api_call`

### eth-name-service  v2.0.0 | API Key
*Ethereum Name Service (ENS) is a decentralized naming system on the Ethereum blockchain.*
**Actions:** `listEnsDomains`

### hackernews  v2.0.0 | None
*A social news website*
**Actions:** `fetch_top_stories`

### mailchain  v2.0.0 | API Key
*Mailchain is a simple, secure, and decentralized communications protocol that enables blockchain-bas*
**Actions:** `getAuthenticatedUser` `sendEmail`

### matomo  v2.0.0 | Custom(domain,tokenAuth,siteId)
*Open source alternative to Google Analytics*
**Actions:** `add_annotation` `custom_api_call`

### mempool-space  v2.0.0 | None
*The mempool.space website invented the concept of visualizing a Bitcoin node's mempool as projected *
**Actions:** `get_difficulty_adjustment` `get_price` `get_historical_price` `get_address_details` `get_address_transactions` `get_address_transactions_chain` `get_address_transactions_mempool` `get_address_utxo` `validate_address` `get_mempool_blocks_fees` `get_recommended_fees` `get_block` `get_block_header` `get_block_height` `get_block_timestamp` `get_block_raw` `get_block_status` `get_block_tip_height` `get_block_tip_hash` `get_block_transaction_id` `get_block_transaction_ids` `get_block_transactions` `get_blocks_bulk` `get_transaction` `get_transaction_hex` `get_transaction_merkleblock_proof` `get_transaction_merkle_proof` `get_transaction_outspend` `get_transaction_outspends` `get_transaction_raw` `get_transaction_rbf_timeline` `get_transaction_status` `get_transaction_times` `post_transaction` `custom_api_call`

### metabase  v2.0.0 | Custom(baseUrl,apiKey)
*The simplest way to ask questions and learn from data*
**Actions:** `getQuestion` `getQuestionPngPreview` `getDashboardQuestions` `embedQuestion`

### pastebin  v2.0.0 | Custom(token,username,password)
*Simple and secure text sharing*
**Actions:** `create_paste` `get_paste_content`

### pastefy  v2.0.0 | Custom(instance_url,token)
*Sharing code snippets platform*
**Triggers:** `paste_changed`
**Actions:** `create_paste` `get_paste` `edit_paste` `delete_paste` `create_folder` `get_folder` `get_folder_hierarchy` `delete_folder` `custom_api_call`

### poper  v2.0.0 | None
*AI Driven Pop-up Builder that can convert visitors into customers,increase subscriber count, and sky*
**Triggers:** `newLead`

### qrcode  v2.0.0 | None
*Generate QR codes for your URLs, text, and other data. Easily create custom QR code images for your *
**Actions:** `text_to_qrcode`

### scenario  v2.0.0 | Basic Auth
*AI-generated gaming assets with Scenario. Create custom API calls to generate high-quality images, t*
**Actions:** `custom_api_call`

### simplepdf  v2.0.0 | None
*PDF editing and generation tool*
**Triggers:** `new-submission`

### sitespeakai  v2.0.0 | API Key
*Integrate with Sitespeakai to leverage AI-powered chatbots and enhance user interactions on your web*
**Triggers:** `newLead`
**Actions:** `sendQuery` `create_finetune` `delete_finetune`

### softr  v2.0.0 | API Key
*Build powerful apps and portals with Softr. Automate user management, database record operations, an*
**Triggers:** `newDatabaseRecord`
**Actions:** `createAppUser` `createDatabaseRecord` `deleteAppUser` `deleteDatabaseRecord` `findDatabaseRecord` `updateDatabaseRecord` `custom_api_call`

### spotify  v2.0.0 | OAuth2
*Music for everyone*
**Triggers:** `playlist_items_changed`
**Actions:** `search` `get_playback_state` `play` `pause` `set_volume` `get_playlists` `get_playlist_info` `get_playlist_items` `get_saved_tracks` `create_playlist` `update_playlist` `add_playlist_items` `remove_playlist_items` `reorder_playlist` `custom_api_call`

### surveymonkey  v2.0.0 | OAuth2
*Receive survey responses from SurveyMonkey*
**Triggers:** `new_response`
**Actions:** `custom_api_call`

### thankster  v2.0.0 | API Key
*Send personalized, handwritten-style cards with Thankster. Automate your direct mail campaigns and c*
**Actions:** `send_handwritten_cards`

### totalcms  v2.0.0 | Custom(domain,license)
*Content management system for modern websites*
**Triggers:** `new_blog_post`
**Actions:** `get_content` `get_blog_post` `save_blog_post` `save_blog_gallery` `save_blog_image` `save_date` `save_depot` `save_file` `save_gallery` `save_image` `save_text` `save_toggle` `save_video` `custom_api_call`

### vimeo  v2.0.0 | OAuth2
*Vimeo is a video hosting platform. Upload videos, monitor your library, and track new content from a*
**Triggers:** `new_video_by_search` `new_video_by_user` `new_video_liked` `new_video_mine`
**Actions:** `custom_api_call`

### webling  v2.0.0 | Custom(baseUrl,apikey)
*Manage your club or association with Webling. Retrieve calendar events and trigger workflows on data*
**Triggers:** `onEventChanged` `onChangedData`
**Actions:** `EventsById`

### what-converts  v2.0.0 | Custom(api_token,api_secret)
*Track and manage your marketing leads with WhatConverts. Automate lead creation and updates, export *
**Triggers:** `new_lead` `updated_lead`
**Actions:** `create_lead` `export_leads` `update_lead` `find_lead`

### whatsable  v2.0.0 | API Key
*Manage your WhatsApp business account*
**Actions:** `sendMessage`

### wonderchat  v2.0.0 | API Key
*Wonderchat is a no-code chatbot platform that lets you deploy AI-powered chatbots for websites quick*
**Triggers:** `newUserMessage`
**Actions:** `askQuestion` `addPage` `addTag` `removeTag`

### youtube  v2.0.2 | OAuth2
*Enjoy the videos and music you love, upload original content, and share it all with friends, family,*
**Triggers:** `new-video` `new_video_in_playlist`
**Actions:** `list_videos` `delete_video` `update_video` `search_videos` `add_video_to_playlist` `get_report` `custom_api_call`

### zoo  v2.0.0 | API Key
*Generate and iterate on 3D models from text descriptions using ML endpoints.*
**Actions:** `generate_cad_model` `kcl_completions` `text_to_cad_iteration` `list_cad_models` `get_cad_model` `give_model_feedback` `get_async_operation` `list_org_api_calls` `get_org_api_call` `list_user_api_calls` `get_user_api_call` `list_api_tokens` `create_api_token` `get_api_token` `delete_api_token` `get_center_of_mass` `convert_cad_file` `get_density` `get_mass` `get_surface_area` `get_volume` `get_openapi_schema` `return_pong` `send_modeling_command` `get_org` `update_org` `create_org` `list_org_members` `add_org_member` `get_org_member` `get_org_payment` `update_org_payment` `create_org_payment` `delete_org_payment` `get_org_balance` `list_org_invoices` `list_org_payment_methods` `get_org_subscription` `update_org_subscription` `create_org_subscription` `get_user_payment` `update_user_payment` `create_user_payment` `delete_user_payment` `get_user_balance` `list_user_invoices` `list_user_payment_methods` `get_user_subscription` `update_user_subscription` `create_user_subscription` `list_service_accounts` `create_service_account` `get_service_account` `delete_service_account` `list_org_shortlinks` `list_user_shortlinks` `create_shortlink` `update_shortlink` `delete_shortlink` `convert_angle` `convert_area` `convert_current` `convert_energy` `convert_force` `convert_frequency` `convert_length` `convert_mass` `convert_power` `convert_pressure` `convert_temperature` `convert_torque` `convert_volume` `get_user` `update_user` `delete_user` `get_extended_user` `get_oauth2_providers` `get_user_org` `get_privacy_settings` `update_privacy_settings` `get_user_session`

═══════════════════════════════════════════════════════════════
# REMINDER (last thing before you generate)
Re-run the §1.14 SELF-CHECK now. The most common failure is a ROUTER whose `children` array is missing or not equal in length to `branches`. Clone the §1.3 template; verify branches==children; verify every pieceName/action/field exists in PART 2; emit the SELF-CHECK block; then output ONLY the JSON.
