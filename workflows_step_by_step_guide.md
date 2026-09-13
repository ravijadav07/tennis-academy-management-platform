# Tennis Academy Management Platform: Workflows Step-by-Step Setup Guide

This document provides the complete, authoritative technical setup guide and data mapping specification for all **14 automation workflows** in the Tennis Academy Management Platform (`./workflows`).

> **IMPORTANT**: All raw Spreadsheet IDs and GID numbers have been replaced with their exact human-readable names (`TOTS Tennis Academy Master Database` and tab names like `Students`, `Parents`, `Packages`, etc.) for clean environment configuration.

---

## Master Google Sheets Reference

- **Master Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Mapping Table**:

| Sheet Tab Name | Primary Purpose / Entity | Key Column Identifier |
|---|---|---|
| `Students` | Student Profiles (Name, DOB, Age, Age Group, Gender, Level, Status) | `id`, `name`, `status` |
| `Parents` | Parent / Guardian Profiles (Name, Phone, Email, Status) | `id`, `phone`, `email` |
| `Enrollments` | Student-Batch Link & Billing Program | `id`, `student_id`, `batch_id` |
| `Packages` | Subscriptions, Validity, Expiry & Fee Details | `id`, `student_id`, `payment_status` |
| `Payments` | Payment Receipts & Transaction Records | `id`, `student_id`, `transaction_ref` |
| `Batches` | Class Batches, Schedule Patterns & Seats Capacity | `id`, `category`, `status` |
| `Coaches` | Coach Profiles, Roles & Entity Affiliation | `id`, `name`, `status` |
| `Courts` | Court Locations & Master Mapping | `id`, `name` |
| `Attendance` | Daily Student Attendance Logs | `id`, `student_id`, `date` |
| `1-on-1 Sessions` | Scheduled Private Coaching Sessions | `id`, `student_id`, `day` |
| `Coach Leaves` | Coach Absence & Leave Requests | `id`, `coach_id`, `status` |
| `Reconciliation Audits` | Club Payment & Excel Reconciliation Records | `id`, `student_name` |
| `Report Verifications` | Monthly Audit Approval & Gate Checks | `id`, `month` |
| `Progress Reports` | Student Skill Evaluations & Rating Logs | `id`, `student_id` |
| `Academies` | Platform Settings & Communication Audit Logs | `id`, `key`, `type` |

---

## Summary Table of Workflows

| # | Workflow File | Workflow Title | Trigger Type | Primary Actions / Pieces | Status |
|---|---|---|---|---|---|
| 1 | `UC-4_renewal_reminder_engine.json` | **UC-4 Renewal & Reminder Engine** | `TOOL_TRIGGER` (@puchoaistudio/tool-schedule) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 2 | `WF-D_student_onboarding.json` | **WF-D Student Onboarding** | `TOOL_TRIGGER` (@puchoaistudio/tool-webhook) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 3 | `WF-E_course_completion.json` | **WF-E Course Completion & Certification** | `TOOL_TRIGGER` (@puchoaistudio/tool-webhook) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 4 | `WF-F_daily_1on1_confirmation.json` | **WF-F Daily 1-on-1 Confirmation** | `TOOL_TRIGGER` (@puchoaistudio/tool-schedule) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 5 | `WF-G_package_validity.json` | **WF-G Package Validity & Expiry Engine** | `TOOL_TRIGGER` (@puchoaistudio/tool-schedule) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 6 | `WF-I_direct_payment_capture.json` | **WF-I Direct Payment Capture** | `TOOL_TRIGGER` (@puchoaistudio/tool-webhook) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 7 | `WF-J_club_excel_reconciliation.json` | **WF-J Club Excel Reconciliation** | `TOOL_TRIGGER` (@puchoaistudio/tool-webhook) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 8 | `WF-K_invoice_occupancy_report.json` | **WF-K Invoice & Occupancy Report** | `TOOL_TRIGGER` (@puchoaistudio/tool-webhook) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 9 | `WF-L_coach_payroll_leave.json` | **WF-L Coach Payroll & Leave Rollup** | `TOOL_TRIGGER` (@puchoaistudio/tool-webhook) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 10 | `WF-M_absence_alert.json` | **WF-M Absence Alert Engine** | `TOOL_TRIGGER` (@puchoaistudio/tool-webhook) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 11 | `WF-O_payment_reminder_email.json` | **WF-O Payment Reminder Email** | `TOOL_TRIGGER` (@puchoaistudio/tool-webhook) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 12 | `WF-P_slot_report_email.json` | **WF-P Slot Report Email** | `TOOL_TRIGGER` (@puchoaistudio/tool-webhook) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 13 | `WF-webhook-store.json` | **WF-Webhook-Store Data Persistence** | `TOOL_TRIGGER` (@puchoaistudio/tool-webhook) | Google Sheets, Gmail, Code, Router | 🟢 Active |
| 14 | `Dummy workflow for sample tools versions.json` | **Dummy Workflow Reference** | `TOOL_TRIGGER` (@puchoaistudio/tool-schedule) | Google Sheets, Gmail, Code, Router | 🟢 Active |

---

## 1. UC-4 Renewal & Reminder Engine

- **Workflow File**: [`UC-4_renewal_reminder_engine.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/UC-4_renewal_reminder_engine.json)
- **Description**: Merged WF-G + WF-H: Daily 6AM cron checks active/expired packages, sends renewal reminders at D-6, overdue nudges at D+7/14/21/28. Gmail only, idempotent per subscription per day. Lapse at 45+ days handled by separate validity workflow.
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Daily 6AM IST Renewal Check`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-schedule` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Query Active & Expired Packages`
- **Internal ID / Name**: `step_1`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `get_all_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Compute Renewal Actions`
- **Internal ID / Name**: `step_2`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const pkgs = Array.isArray(inputs.packages) ? inputs.packages : [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  today.setHours(0, 0, 0, 0);

  const messages = {
    d_minus_6: "Friendly reminder: Your child's tennis package at TOTS Tennis Academy expires in 6 days. Please renew to ensure uninterrupted training.",
    d_plus_7: "It has been a week since your package expired. We miss your child on court! Renew now at TOTS Tennis Academy to continue training.",
    d_plus_14: "Your child has been away for 2 weeks. Their spot is reserved — renew now at TOTS Tennis Academy!",
    d_plus_21: "Three weeks since expiry. Your child's progress matters — renew today at TOTS Tennis Academy!",
    d_plus_28: "Final reminder: Your package expired a month ago. Please renew at TOTS Tennis Academy to continue your child's tennis journey.",
    lapsed: "Your child's package has been inactive for over 35 days and has been marked as lapsed. Please contact TOTS Tennis Academy to re-enroll."
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
        message: messages[stage] || 'Please renew your package at TOTS Tennis Academy.',
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
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 4: `Route by Renewal Action`
- **Internal ID / Name**: `step_router`
- **Step Type**: `ROUTER`

##### 🔀 Router Branch Conditions:
- **Branch Name**: `REMIND` (Type: `CONDITION`)
  - Condition: `{{step_2['action']}}` `TEXT_EXACTLY_MATCHES` `remind`
- **Branch Name**: `NUDGE` (Type: `CONDITION`)
  - Condition: `{{step_2['action']}}` `TEXT_EXACTLY_MATCHES` `nudge`
- **Branch Name**: `LAPSED` (Type: `CONDITION`)
  - Condition: `{{step_2["action"]}}` `TEXT_EXACTLY_MATCHES` `lapse`
- **Branch Name**: `SKIP` (Type: `FALLBACK`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_router}}` down the pipeline for subsequent step consumption.

#### Step 5: `Find Student-Parent Link`
- **Internal ID / Name**: `step_remind_a`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`
- **Target Search Column**: `student_id`
- **Search Value Expression**: `{{step_2['student_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_remind_a}}` down the pipeline for subsequent step consumption.

#### Step 6: `Find Parent for Reminder`
- **Internal ID / Name**: `step_remind_b`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Parents`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_remind_a[0]['parent_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_remind_b}}` down the pipeline for subsequent step consumption.

#### Step 7: `Send Initial Expiry Reminder Email`
- **Internal ID / Name**: `step_remind_c`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `["{{step_remind_b[0]['email']}}"]`
- **Subject**: `Package Expiring Soon - TOTS Tennis Academy`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Package Expiry Reminder</p></div><div style="padding: 24px;"><p style="font-size: 15px; margin-top: 0;">Dear Parent,</p><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">{{step_2['message']}}</div><p style="font-size: 14px; color: #475569;">For any assistance, scheduling queries, or payment details, please contact the TOTS Tennis Academy team.</p></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. All rights reserved.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_remind_c}}` down the pipeline for subsequent step consumption.

#### Step 8: `Update Package Reminder Stage`
- **Internal ID / Name**: `step_remind_d`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_remind_d}}` down the pipeline for subsequent step consumption.

#### Step 9: `Log Reminder`
- **Internal ID / Name**: `step_remind_e`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_2['student_id']}}`
  - `package_id`: `{{step_2['package_id']}}`
  - `channel`: `email`
  - `stage`: `{{step_2['stage']}}`
  - `status`: `sent`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_remind_e}}` down the pipeline for subsequent step consumption.

#### Step 10: `Find Student-Parent Link for Nudge`
- **Internal ID / Name**: `step_nudge_a`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`
- **Target Search Column**: `student_id`
- **Search Value Expression**: `{{step_2['student_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_nudge_a}}` down the pipeline for subsequent step consumption.

#### Step 11: `Find Parent for Nudge`
- **Internal ID / Name**: `step_nudge_b`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Parents`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_nudge_a[0]['parent_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_nudge_b}}` down the pipeline for subsequent step consumption.

#### Step 12: `Send Overdue Nudge Email`
- **Internal ID / Name**: `step_nudge_c`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `["{{step_nudge_b[0]['email']}}"]`
- **Subject**: `Package Renewal Reminder - TOTS Tennis Academy`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Package Renewal Reminder</p></div><div style="padding: 24px;"><p style="font-size: 15px; margin-top: 0;">Dear Parent,</p><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">{{step_2['message']}}</div><p style="font-size: 14px; color: #475569;">For any assistance, scheduling queries, or payment details, please contact the TOTS Tennis Academy team.</p></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. All rights reserved.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_nudge_c}}` down the pipeline for subsequent step consumption.

#### Step 13: `Update Package Nudge Stage + Overdue Days`
- **Internal ID / Name**: `step_nudge_d`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_nudge_d}}` down the pipeline for subsequent step consumption.

#### Step 14: `Log Nudge Reminder`
- **Internal ID / Name**: `step_nudge_e`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_2['student_id']}}`
  - `package_id`: `{{step_2['package_id']}}`
  - `channel`: `email`
  - `stage`: `{{step_2['stage']}}`
  - `status`: `sent`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_nudge_e}}` down the pipeline for subsequent step consumption.

#### Step 15: `Find Student-Parent Link for Lapse`
- **Internal ID / Name**: `step_lapse_a`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`
- **Target Search Column**: `student_id`
- **Search Value Expression**: `{{step_2["student_id"]}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_lapse_a}}` down the pipeline for subsequent step consumption.

#### Step 16: `Find Parent for Lapse`
- **Internal ID / Name**: `step_lapse_b`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Parents`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_lapse_a[0]["parent_id"]}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_lapse_b}}` down the pipeline for subsequent step consumption.

#### Step 17: `Send Lapse Notification Email`
- **Internal ID / Name**: `step_lapse_c`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `['{{step_lapse_b[0]["email"]}}']`
- **Subject**: `Package Lapsed - TOTS Tennis Academy`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Package Lapsed Notice</p></div><div style="padding: 24px;"><p style="font-size: 15px; margin-top: 0;">Dear Parent,</p><div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px; color: #9f1239; line-height: 1.6;">{{step_2['message']}}</div><p style="font-size: 14px; color: #475569;">For re-enrollment options or assistance, please reach out to the TOTS Tennis Academy team.</p></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. All rights reserved.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_lapse_c}}` down the pipeline for subsequent step consumption.

#### Step 18: `Update Package to Lapsed`
- **Internal ID / Name**: `step_lapse_d`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_lapse_d}}` down the pipeline for subsequent step consumption.

#### Step 19: `Log Lapse Reminder`
- **Internal ID / Name**: `step_lapse_e`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_2["student_id"]}}`
  - `package_id`: `{{step_2["package_id"]}}`
  - `channel`: `email`
  - `stage`: `dormant`
  - `status`: `sent`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_lapse_e}}` down the pipeline for subsequent step consumption.

---

## 2. WF-D Student Onboarding

- **Workflow File**: [`WF-D_student_onboarding.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-D_student_onboarding.json)
- **Description**: Creates student profile, parent, package, sends welcome email and admission email on enrollment. Includes batch capacity soft-warning check (allow + flag).
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Parse & Validate Payload`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Route by Validation`
- **Internal ID / Name**: `step_1`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const p = typeof inputs.payload === 'string' ? JSON.parse(inputs.payload) : (inputs.payload || {});
  const name = (p.name || p.student_name || p.studentName || p.full_name || '').trim();
  const phone = (p.guardianPhone || p.phone || p.parent_phone || p.guardian_phone || p.parentPhone || '').trim();
  const email = (p.guardianEmail || p.email || p.parent_email || p.guardian_email || p.parentEmail || '').trim();
  const guardianName = (p.guardianName || p.parent_name || p.guardian_name || (name ? name + "'s Guardian" : '')).trim();
  const valid = name.length > 0;
  const hasParent = phone.length > 0 || email.length > 0 || (p.guardianName || p.parent_name || p.guardian_name || '').trim().length > 0;
  const dob = p.dateOfBirth || p.date_of_birth || p.dob || '';
  const age = String(p.age || p.student_age || p.studentAge || '');
  const ageVal = parseInt(age || '0');
  const ageGroup = p.ageGroup || p.age_group || (ageVal > 0 ? (ageVal < 8 ? 'Under 8' : '8+') : '');
  const gender = p.gender || 'Male';
  return {
    valid: valid ? 'true' : 'false',
    has_parent: hasParent ? 'true' : 'false',
    student_id: p.studentId || p.student_id || '',
    student_name: name,
    full_name: name,
    dup_check_name: name,
    date_of_birth: dob,
    student_age: age,
    age: age,
    age_group: ageGroup,
    gender: gender,
    guardian_name: guardianName,
    parent_name: guardianName,
    guardian_phone: phone,
    parent_phone: phone,
    guardian_email: email,
    parent_email: email,
    guardian_relationship: p.guardianRelationship || p.guardian_relationship || 'Parent',
    alternate_phone: p.alternatePhone || p.alternate_phone || '',
    student_level: p.level || p.student_level || p.ball_color || p.ballColor || 'Beginner',
    membership_type: p.membershipType || p.membership_type || 'Member',
    status: p.status || 'active',
    remarks: p.remarks || '',
    enrolled_from: p.enrolledFrom || p.enrolled_from || new Date().toISOString().split('T')[0],
    enrollment_type: p.enrollmentType || p.enrollment_type || 'Group',
    program: p.program || p.category || 'General',
    ball_color: p.ballColor || p.ball_color || 'Red',
    batch_id: p.batchId || p.batch_id || '',
    start_date: p.joiningDate || p.joining_date || p.start_date || new Date().toISOString().split('T')[0],
    joining_date: p.joiningDate || p.joining_date || p.start_date || new Date().toISOString().split('T')[0],
    package_duration: p.packageDuration || p.package_duration || 'Monthly',
    plan_type: p.packageDuration || p.package_duration || p.plan_type || 'Monthly',
    end_date: p.endDate || p.end_date || '',
    amount: String(p.amount || '0'),
    base_amount: parseFloat(p.baseAmount || p.amount || '0'),
    tax_amount: parseFloat(p.taxAmount || '0'),
    discount: parseFloat(p.discount || '0'),
    tax_inclusive: p.taxInclusive || false,
    discount_type: p.discountType || '',
    discount_val: p.discountVal || '',
    discount_reason: p.discountReason || '',
    payment_status: p.paymentStatus || p.payment_status || 'PAID',
    payment_mode: p.paymentMode || p.payment_mode || 'Cash',
    amount_received: parseFloat(p.amountReceived || p.amount_received || p.amount || '0'),
    balance_amount: parseFloat(p.balanceAmount || p.balance_amount || '0'),
    payment_date: p.paymentDate || p.payment_date || new Date().toISOString().split('T')[0],
    transaction_ref: p.transactionRef || p.transaction_ref || '',
    next_payment_due: p.nextPaymentDue || p.next_payment_due || '',
    coach_id: p.coachId || p.coach_id || '',
    entity: p.entity || 'TOTS Tennis Academy',
    academy_id: p.academyId || p.academy_id || 'TOTS',
    enrollments: p.enrollments || [],
    error: valid ? '' : 'Missing required field: student name'
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Check Batch Capacity (Soft Warning)`
- **Internal ID / Name**: `step_1a_cap`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Batches`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_1['batch_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1a_cap}}` down the pipeline for subsequent step consumption.

#### Step 4: `Count Enrolled Students in Batch`
- **Internal ID / Name**: `step_1b_count`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`
- **Target Search Column**: `batch_id`
- **Search Value Expression**: `{{step_1['batch_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1b_count}}` down the pipeline for subsequent step consumption.

#### Step 5: `Check For Duplicate Student by Name+Phone`
- **Internal ID / Name**: `step_1_dup`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Students`
- **Target Search Column**: `name`
- **Search Value Expression**: `{{step_1['student_name']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1_dup}}` down the pipeline for subsequent step consumption.

#### Step 6: `Route by Validation, Parent Info & Duplicate Check`
- **Internal ID / Name**: `step_router`
- **Step Type**: `ROUTER`

##### 🔀 Router Branch Conditions:
- **Branch Name**: `Duplicate Student` (Type: `CONDITION`)
  - Condition: `{{step_1['valid']}}` `TEXT_EXACTLY_MATCHES` `true`
  - Condition: `{{step_1_dup['rows'].length}}` `NUMBER_IS_GREATER_THAN` `0`
- **Branch Name**: `Valid with Parent Info` (Type: `CONDITION`)
  - Condition: `{{step_1['valid']}}` `TEXT_EXACTLY_MATCHES` `true`
  - Condition: `{{step_1['has_parent']}}` `TEXT_EXACTLY_MATCHES` `true`
- **Branch Name**: `Valid without Parent Info` (Type: `CONDITION`)
  - Condition: `{{step_1['valid']}}` `TEXT_EXACTLY_MATCHES` `true`
  - Condition: `{{step_1['has_parent']}}` `TEXT_EXACTLY_MATCHES` `false`
- **Branch Name**: `Invalid` (Type: `FALLBACK`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_router}}` down the pipeline for subsequent step consumption.

#### Step 7: `Return Duplicate Error`
- **Internal ID / Name**: `step_dup_error`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_dup_error}}` down the pipeline for subsequent step consumption.

#### Step 8: `Create Student in DB`
- **Internal ID / Name**: `step_2`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Students`
- **Values Mapping (Column Keys & Payloads)**:
  - `id`: `{{step_1['student_id']}}`
  - `academy_id`: `{{step_1['academy_id']}}`
  - `parent_id`: `{{step_3['id']}}`
  - `full_name`: `{{step_1['student_name']}}`
  - `name`: `{{step_1['student_name']}}`
  - `date_of_birth`: `{{step_1['date_of_birth']}}`
  - `age`: `{{step_1['student_age']}}`
  - `age_group`: `{{step_1['age_group']}}`
  - `gender`: `{{step_1['gender']}}`
  - `skill_level`: `{{step_1['student_level']}}`
  - `level`: `{{step_1['student_level']}}`
  - `batch_id`: `{{step_1['batch_id']}}`
  - `coach_id`: `{{step_1['coach_id']}}`
  - `entity`: `{{step_1['entity']}}`
  - `status`: `{{step_1['status']}}`
  - `join_date`: `{{step_1['start_date']}}`
  - `guardian_name`: `{{step_1['guardian_name']}}`
  - `guardian_phone`: `{{step_1['guardian_phone']}}`
  - `guardian_email`: `{{step_1['guardian_email']}}`
  - `membership_type`: `{{step_1['membership_type']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 9: `Create Parent in DB`
- **Internal ID / Name**: `step_3`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Parents`
- **Values Mapping (Column Keys & Payloads)**:
  - `name`: `{{step_1['parent_name']}}`
  - `phone`: `{{step_1['parent_phone']}}`
  - `email`: `{{step_1['parent_email']}}`
  - `entity`: `{{step_1['entity']}}`
  - `account_status`: `active`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3}}` down the pipeline for subsequent step consumption.

#### Step 10: `Link Student-Parent`
- **Internal ID / Name**: `step_4`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_2['id']}}`
  - `parent_id`: `{{step_3['id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4}}` down the pipeline for subsequent step consumption.

#### Step 11: `Create Package`
- **Internal ID / Name**: `step_5`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_2['id']}}`
  - `plan_type`: `{{step_1['plan_type']}}`
  - `amount`: `{{step_1['amount']}}`
  - `start_date`: `{{step_1['start_date']}}`
  - `expiry_date`: `{{step_1['start_date']}}`
  - `status`: `active`
  - `payment_status`: `pending`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5}}` down the pipeline for subsequent step consumption.

#### Step 12: `Send Admission Email`
- **Internal ID / Name**: `step_7`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `["{{step_1['parent_email']}}"]`
- **Subject**: `Welcome to TOTS Tennis Academy!`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Student Admission & Onboarding</p></div><div style="padding: 24px;"><p style="font-size: 15px; margin-top: 0;">Dear <strong>{{step_1['guardian_name']}}</strong>,</p><p style="font-size: 14px; color: #475569;">We are thrilled to welcome <strong>{{step_1['student_name']}}</strong> to TOTS Tennis Academy! Your admission and program enrollment details have been confirmed.</p><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;"><h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Enrollment Summary</h4><table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;"><tr><td style="padding: 6px 0; font-weight: 600; width: 40%;">Student Name:</td><td style="padding: 6px 0;">{{step_1['student_name']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Program / Category:</td><td style="padding: 6px 0;">{{step_1['program']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Ball Color / Level:</td><td style="padding: 6px 0;">{{step_1['ball_color']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Enrollment Type:</td><td style="padding: 6px 0;">{{step_1['enrollment_type']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Joining Date:</td><td style="padding: 6px 0;">{{step_1['joining_date']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Payment Status:</td><td style="padding: 6px 0;"><span style="background-color: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-weight: 600;">{{step_1['payment_status']}}</span></td></tr></table></div><p style="font-size: 14px; color: #475569;">If you have any questions or require assistance, please feel free to reach out to our team.</p></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. All rights reserved.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_7}}` down the pipeline for subsequent step consumption.

#### Step 13: `Return Success Response`
- **Internal ID / Name**: `step_9`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_9}}` down the pipeline for subsequent step consumption.

#### Step 14: `Create Student in DB`
- **Internal ID / Name**: `step_2np`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Students`
- **Values Mapping (Column Keys & Payloads)**:
  - `id`: `{{step_1['student_id']}}`
  - `academy_id`: `{{step_1['academy_id']}}`
  - `parent_id`: ``
  - `full_name`: `{{step_1['student_name']}}`
  - `name`: `{{step_1['student_name']}}`
  - `date_of_birth`: `{{step_1['date_of_birth']}}`
  - `age`: `{{step_1['student_age']}}`
  - `age_group`: `{{step_1['age_group']}}`
  - `gender`: `{{step_1['gender']}}`
  - `skill_level`: `{{step_1['student_level']}}`
  - `level`: `{{step_1['student_level']}}`
  - `batch_id`: `{{step_1['batch_id']}}`
  - `coach_id`: `{{step_1['coach_id']}}`
  - `entity`: `{{step_1['entity']}}`
  - `status`: `{{step_1['status']}}`
  - `join_date`: `{{step_1['start_date']}}`
  - `guardian_name`: `{{step_1['guardian_name']}}`
  - `guardian_phone`: `{{step_1['guardian_phone']}}`
  - `guardian_email`: `{{step_1['guardian_email']}}`
  - `membership_type`: `{{step_1['membership_type']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2np}}` down the pipeline for subsequent step consumption.

#### Step 15: `Create Package`
- **Internal ID / Name**: `step_3np`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_2np["id"]}}`
  - `plan_type`: `{{step_1['plan_type']}}`
  - `amount`: `{{step_1['amount']}}`
  - `start_date`: `{{step_1['start_date']}}`
  - `expiry_date`: `{{step_1['start_date']}}`
  - `status`: `active`
  - `payment_status`: `pending`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3np}}` down the pipeline for subsequent step consumption.

#### Step 16: `Return Success`
- **Internal ID / Name**: `step_4np`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4np}}` down the pipeline for subsequent step consumption.

#### Step 17: `Return Error Response`
- **Internal ID / Name**: `step_error`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_error}}` down the pipeline for subsequent step consumption.

---

## 3. WF-E Course Completion & Certification

- **Workflow File**: [`WF-E_course_completion.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-E_course_completion.json)
- **Description**: Marks student as completed, updates package, sends certificate email on webhook trigger. Looks up parent email for notification.
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Parse Completion Payload`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Validate Completion Payload`
- **Internal ID / Name**: `step_1`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const p = typeof inputs.payload === 'string' ? JSON.parse(inputs.payload) : inputs.payload;
  const student_id = p.student_id || '';
  const package_id = p.package_id || '';
  const entity = p.entity || 'tots-tennis';
  const today = new Date().toISOString().split('T')[0];
  return {
    student_id: String(student_id),
    package_id: String(package_id),
    entity: entity,
    completion_date: today,
    valid: student_id !== '' && package_id !== ''
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Route by Validity`
- **Internal ID / Name**: `step_router`
- **Step Type**: `ROUTER`

##### 🔀 Router Branch Conditions:
- **Branch Name**: `Valid Request` (Type: `CONDITION`)
  - Condition: `{{step_1['valid']}}` `TEXT_EXACTLY_MATCHES` `true`
- **Branch Name**: `Invalid` (Type: `FALLBACK`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_router}}` down the pipeline for subsequent step consumption.

#### Step 4: `Find Student`
- **Internal ID / Name**: `step_2`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Students`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_1['student_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 5: `Mark Student Completed`
- **Internal ID / Name**: `step_3`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Students`
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3}}` down the pipeline for subsequent step consumption.

#### Step 6: `Find Package`
- **Internal ID / Name**: `step_4`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_1['package_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4}}` down the pipeline for subsequent step consumption.

#### Step 7: `Mark Package Completed`
- **Internal ID / Name**: `step_5`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5}}` down the pipeline for subsequent step consumption.

#### Step 8: `Find Student Parent Link`
- **Internal ID / Name**: `step_5b`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`
- **Target Search Column**: `student_id`
- **Search Value Expression**: `{{step_1['student_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5b}}` down the pipeline for subsequent step consumption.

#### Step 9: `Find Parent Email`
- **Internal ID / Name**: `step_5c`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Parents`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_5b[0]['parent_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5c}}` down the pipeline for subsequent step consumption.

#### Step 10: `Generate Certificate (Idempotent)`
- **Internal ID / Name**: `step_cert_check`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const supabaseBase = 'https://zxbrvjhgbxwrizyrmvjy.supabase.co';
  const serviceKey = '{{ENV.SUPABASE_SERVICE_ROLE_KEY}}';
  const pdfServiceUrl = '{{ENV.PDF_SERVICE_URL}}';
  const pdfServiceKey = '{{ENV.PDF_SERVICE_API_KEY}}';
  const studentId = inputs.student_id;
  const packageId = inputs.package_id;

  // 1. Idempotency: check if certificate already exists
  try {
    const checkRes = await fetch(
      `${supabaseBase}/rest/v1/certificates?student_id=eq.${studentId}&package_id=eq.${packageId}&select=file_path`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const existingCerts = await checkRes.json();
    if (Array.isArray(existingCerts) && existingCerts.length > 0) {
      return {
        file_path: existingCerts[0].file_path,
        certificate_id: existingCerts[0].file_path.split('/').pop()?.replace('.pdf', '') || 'REUSE',
        is_new: false
      };
    }
  } catch (e) {
    console.warn('Certificate idempotency check failed, proceeding with generation:', e.message);
  }

  // 2. Generate new certificate via PDF microservice
  const pdfRes = await fetch(`${pdfServiceUrl}/api/generate-certificate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': pdfServiceKey
    },
    body: JSON.stringify({
      student_id: studentId,
      package_id: packageId,
      student_name: inputs.student_name,
      course_name: inputs.course_name,
      completion_date: inputs.completion_date,
      coach_name: inputs.coach_name,
      entity: inputs.entity
    })
  });

  if (!pdfRes.ok) {
    const errBody = await pdfRes.text();
    throw new Error(`PDF service returned ${pdfRes.status}: ${errBody}`);
  }

  const pdfData = await pdfRes.json();
  return {
    file_path: pdfData.file_path,
    certificate_id: pdfData.certificate_id,
    is_new: true
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_cert_check}}` down the pipeline for subsequent step consumption.

#### Step 11: `Log Certificate Communication`
- **Internal ID / Name**: `step_6`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_1['student_id']}}`
  - `parent_id`: `{{step_5b[0]['parent_id']}}`
  - `type`: `certificate`
  - `channel`: `email`
  - `status`: `sent`
  - `date`: `{{step_1['completion_date']}}`
  - `file_link`: `{{step_cert_check['file_path']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_6}}` down the pipeline for subsequent step consumption.

#### Step 12: `Send Certificate Email with Attachment`
- **Internal ID / Name**: `step_7`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `["{{step_5c[0]['email']}}"]`
- **Subject**: `Congratulations! Course Completed - TOTS Tennis Academy`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Course Completion & Certificate Award</p></div><div style="padding: 24px;"><p style="font-size: 15px; margin-top: 0;">Dear <strong>{{step_5c[0]['name']}}</strong>,</p><p style="font-size: 14px; color: #475569;">Congratulations! We are delighted to inform you that your child, <strong>{{step_2[0]['name']}}</strong>, has successfully completed their tennis training program at TOTS Tennis Academy.</p><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;"><h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Completion Summary</h4><table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;"><tr><td style="padding: 6px 0; font-weight: 600; width: 40%;">Student Name:</td><td style="padding: 6px 0;">{{step_2[0]['name']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Completion Date:</td><td style="padding: 6px 0;">{{step_1['completion_date']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Certificate:</td><td style="padding: 6px 0;">Attached to this email</td></tr></table></div><p style="font-size: 14px; color: #475569;">We are tremendously proud of their dedication and achievement. Your official completion certificate is attached to this email.</p></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. All rights reserved.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_7}}` down the pipeline for subsequent step consumption.

#### Step 13: `Return Success`
- **Internal ID / Name**: `step_8`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_8}}` down the pipeline for subsequent step consumption.

#### Step 14: `Return Error`
- **Internal ID / Name**: `step_error`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_error}}` down the pipeline for subsequent step consumption.

---

## 4. WF-F Daily 1-on-1 Confirmation

- **Workflow File**: [`WF-F_daily_1on1_confirmation.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-F_daily_1on1_confirmation.json)
- **Description**: Sends email confirmation every morning for today's 1-on-1 sessions. Queries schedule table, resolves parent via student_parents junction, sends Gmail with Confirm/Cancel links. Auto-declines sessions within T-2h cutoff (no time for response). Email only (no WhatsApp/SMS).
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Cron 8 AM Daily`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-schedule` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Compute Today's Info`
- **Internal ID / Name**: `step_1`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[today.getDay()];
  const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()];
  const dateStr = today.toISOString().split('T')[0];
  return { day: dayName, day_abbr: dayAbbr, date: dateStr };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Query Today's 1-on-1 Sessions`
- **Internal ID / Name**: `step_2`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `1-on-1 Sessions`
- **Target Search Column**: `type`
- **Search Value Expression**: `one_on_one`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 4: `Filter & Format Sessions`
- **Internal ID / Name**: `step_3`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
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
    msg = 'Reminder: Your 1-on-1 tennis session is scheduled today at ' + (firstSess.start_time || 'scheduled time') + '. Please confirm your attendance. - TOTS Tennis Academy';
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
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3}}` down the pipeline for subsequent step consumption.

#### Step 5: `Route by Sessions Found`
- **Internal ID / Name**: `step_router`
- **Step Type**: `ROUTER`

##### 🔀 Router Branch Conditions:
- **Branch Name**: `T-2h Cutoff Passed (Auto-Decline)` (Type: `CONDITION`)
  - Condition: `{{step_3['has_sessions']}}` `TEXT_EXACTLY_MATCHES` `true`
  - Condition: `{{step_3['within_cutoff']}}` `TEXT_EXACTLY_MATCHES` `false`
- **Branch Name**: `Has Sessions (Within Cutoff)` (Type: `CONDITION`)
  - Condition: `{{step_3['has_sessions']}}` `TEXT_EXACTLY_MATCHES` `true`
  - Condition: `{{step_3['within_cutoff']}}` `TEXT_EXACTLY_MATCHES` `true`
- **Branch Name**: `No Sessions` (Type: `FALLBACK`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_router}}` down the pipeline for subsequent step consumption.

#### Step 6: `Auto-Decline: Update Confirmation Status`
- **Internal ID / Name**: `step_cutoff_update`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `1-on-1 Sessions`
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_cutoff_update}}` down the pipeline for subsequent step consumption.

#### Step 7: `Log Cutoff No-Response`
- **Internal ID / Name**: `step_cutoff_log`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_3['first_student_id']}}`
  - `type`: `confirmation`
  - `channel`: `email`
  - `status`: `failed`
  - `date`: `{{step_1['date']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_cutoff_log}}` down the pipeline for subsequent step consumption.

#### Step 8: `Find Student Record`
- **Internal ID / Name**: `step_4`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Students`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_3['first_student_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4}}` down the pipeline for subsequent step consumption.

#### Step 9: `Find Parent via Student-Parents Junction`
- **Internal ID / Name**: `step_5`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`
- **Target Search Column**: `student_id`
- **Search Value Expression**: `{{step_3['first_student_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5}}` down the pipeline for subsequent step consumption.

#### Step 10: `Find Parent Email`
- **Internal ID / Name**: `step_6`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Parents`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_5[0]['parent_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_6}}` down the pipeline for subsequent step consumption.

#### Step 11: `Send Confirmation Email`
- **Internal ID / Name**: `step_7`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `["{{step_6[0]['email']}}"]`
- **Subject**: `1-on-1 Session Confirmation - TOTS Tennis Academy`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">1-on-1 Private Session Confirmation</p></div><div style="padding: 24px;"><p style="font-size: 14px; color: #334155; line-height: 1.6;">{{step_3['message']}}</p><div style="margin: 24px 0; text-align: center;"><a href="{{env['PUCHO_PROXY_URL']}}?action=confirmation.reply&session_id={{step_3['first_session_id']}}&response=confirm" style="display: inline-block; padding: 12px 28px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 12px;">Confirm Session</a><a href="{{env['PUCHO_PROXY_URL']}}?action=confirmation.reply&session_id={{step_3['first_session_id']}}&response=cancel" style="display: inline-block; padding: 12px 28px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Cancel Session</a></div><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-top: 20px;"><p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;"><strong>Cancellation Policy:</strong> Cancellations made more than 24 hours prior to scheduled session time incur no fee. Cancellations within 24 hours or no-shows are subject to standard session charges.</p></div></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. All rights reserved.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_7}}` down the pipeline for subsequent step consumption.

#### Step 12: `Update Confirmation Status to Sent`
- **Internal ID / Name**: `step_8`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `1-on-1 Sessions`
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_8}}` down the pipeline for subsequent step consumption.

#### Step 13: `Log Confirmation in Communications`
- **Internal ID / Name**: `step_9`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_3['first_student_id']}}`
  - `parent_id`: `{{step_5[0]['parent_id']}}`
  - `type`: `confirmation`
  - `channel`: `email`
  - `status`: `sent`
  - `date`: `{{step_1['date']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_9}}` down the pipeline for subsequent step consumption.

---

## 5. WF-G Package Validity & Expiry Engine

- **Workflow File**: [`WF-G_package_validity.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-G_package_validity.json)
- **Description**: Daily check of active packages: warns at day 35 (d_minus_10), expires at day 45 (expiry_day). Tracks three dimensions of unutilized: days-to-expiry, remaining sessions, and dormancy (20+ days with zero sessions consumed). Resolves parent via student_parents junction, updates DB, sends email, logs reminders. Processes ALL matching packages in a single run.
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Cron 6 AM Daily`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-schedule` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Query Active Packages`
- **Internal ID / Name**: `step_1`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Target Search Column**: `status`
- **Search Value Expression**: `active`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Analyze Package Statuses`
- **Internal ID / Name**: `step_2`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const pkgs = Array.isArray(inputs.packages) ? inputs.packages : [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expired = [];
  const expiring = [];
  const dormant = [];
  for (const p of pkgs) {
    const start = new Date(p.start_date);
    start.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const consumed = parseInt(p.sessions_consumed || 0);
    const isDormant = diffDays >= 20 && consumed === 0;
    const pkg = { id: p.id, student_id: p.student_id, days: diffDays, plan_type: p.plan_type, amount: p.amount, sessions_consumed: consumed };
    if (diffDays >= 45) {
      expired.push(pkg);
    } else if (diffDays >= 35) {
      expiring.push(pkg);
    } else if (isDormant) {
      dormant.push(pkg);
    }
  }
  const hasExpiring = expiring.length > 0;
  const hasExpired = expired.length > 0;
  const hasDormant = dormant.length > 0;
  const firstExpiring = hasExpiring ? expiring[0] : {};
  const firstExpired = hasExpired ? expired[0] : {};
  const firstDormant = hasDormant ? dormant[0] : {};
  const todayStr = today.toISOString().split('T')[0];
  return {
    has_expiring: hasExpiring ? 'true' : 'false',
    has_expired: hasExpired ? 'true' : 'false',
    has_dormant: hasDormant ? 'true' : 'false',
    expiring_count: expiring.length,
    expired_count: expired.length,
    dormant_count: dormant.length,
    expired_json: JSON.stringify(expired),
    expiring_json: JSON.stringify(expiring),
    dormant_json: JSON.stringify(dormant),
    first_expiring_id: String(firstExpiring.id || ''),
    first_expiring_student_id: String(firstExpiring.student_id || ''),
    first_expired_id: String(firstExpired.id || ''),
    first_expired_student_id: String(firstExpired.student_id || ''),
    first_dormant_id: String(firstDormant.id || ''),
    first_dormant_student_id: String(firstDormant.student_id || ''),
    today: todayStr
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 4: `Route by Package Status`
- **Internal ID / Name**: `step_router`
- **Step Type**: `ROUTER`

##### 🔀 Router Branch Conditions:
- **Branch Name**: `Has Expired` (Type: `CONDITION`)
  - Condition: `{{step_2['has_expired']}}` `TEXT_EXACTLY_MATCHES` `true`
- **Branch Name**: `Has Expiring` (Type: `CONDITION`)
  - Condition: `{{step_2['has_expiring']}}` `TEXT_EXACTLY_MATCHES` `true`
- **Branch Name**: `Has Dormant` (Type: `CONDITION`)
  - Condition: `{{step_2['has_dormant']}}` `TEXT_EXACTLY_MATCHES` `true`
- **Branch Name**: `No Action` (Type: `FALLBACK`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_router}}` down the pipeline for subsequent step consumption.

#### Step 5: `Mark Package Expired`
- **Internal ID / Name**: `step_3a`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3a}}` down the pipeline for subsequent step consumption.

#### Step 6: `Find Student-Parent Link`
- **Internal ID / Name**: `step_3b`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`
- **Target Search Column**: `student_id`
- **Search Value Expression**: `{{step_2['first_expired_student_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3b}}` down the pipeline for subsequent step consumption.

#### Step 7: `Find Parent Email`
- **Internal ID / Name**: `step_3c`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Parents`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_3b[0]['parent_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3c}}` down the pipeline for subsequent step consumption.

#### Step 8: `Send Expiry Notification`
- **Internal ID / Name**: `step_3d`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `["{{step_3c[0]['email']}}"]`
- **Subject**: `Package Expired - TOTS Tennis Academy`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Package Expiry Notice</p></div><div style="padding: 24px;"><p style="font-size: 15px; margin-top: 0;">Dear Parent,</p><p style="font-size: 14px; color: #475569;">Your child's tennis package at TOTS Tennis Academy has reached its validity limit (Day 45) and is now marked as expired.</p><div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 16px; margin: 20px 0; color: #9f1239; font-size: 13px;"><strong>Action Needed:</strong> Please renew your training package at your earliest convenience to continue training sessions without interruption.</div><p style="font-size: 14px; color: #475569;">Please contact the academy office or access your portal to renew.</p></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. All rights reserved.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3d}}` down the pipeline for subsequent step consumption.

#### Step 9: `Log Expiry Reminder`
- **Internal ID / Name**: `step_3e`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_2['first_expired_student_id']}}`
  - `package_id`: `{{step_2['first_expired_id']}}`
  - `channel`: `email`
  - `stage`: `expiry_day`
  - `status`: `sent`
  - `sent_at`: `{{step_2['today']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3e}}` down the pipeline for subsequent step consumption.

#### Step 10: `Store Flag for WF-H Renewal`
- **Internal ID / Name**: `step_3f`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-store` (Action: `put`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3f}}` down the pipeline for subsequent step consumption.

#### Step 11: `Update Reminder Stage to d_minus_6`
- **Internal ID / Name**: `step_4a`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4a}}` down the pipeline for subsequent step consumption.

#### Step 12: `Find Student-Parent for Warning`
- **Internal ID / Name**: `step_4b`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`
- **Target Search Column**: `student_id`
- **Search Value Expression**: `{{step_2['first_expiring_student_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4b}}` down the pipeline for subsequent step consumption.

#### Step 13: `Find Parent Email for Warning`
- **Internal ID / Name**: `step_4c`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Parents`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_4b[0]['parent_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4c}}` down the pipeline for subsequent step consumption.

#### Step 14: `Send Expiry Warning Email`
- **Internal ID / Name**: `step_4d`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `["{{step_4c[0]['email']}}"]`
- **Subject**: `Package Expiring Soon - TOTS Tennis Academy`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Renewal Reminder</p></div><div style="padding: 24px;"><p style="font-size: 15px; margin-top: 0;">Dear Parent,</p><p style="font-size: 14px; color: #475569;">This is a friendly reminder that your child's tennis training package at TOTS Tennis Academy will expire in approximately <strong>6 days</strong>.</p><div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 16px; margin: 20px 0; color: #854d0e; font-size: 13px;"><strong>Reminder:</strong> Renew early to maintain continuous roster placement and session availability.</div><p style="font-size: 14px; color: #475569;">Contact our administration or renew directly via your parent portal.</p></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. All rights reserved.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4d}}` down the pipeline for subsequent step consumption.

#### Step 15: `Log Warning Reminder`
- **Internal ID / Name**: `step_4e`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_2['first_expiring_student_id']}}`
  - `package_id`: `{{step_2['first_expiring_id']}}`
  - `channel`: `email`
  - `stage`: `d_minus_10`
  - `status`: `sent`
  - `sent_at`: `{{step_2['today']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4e}}` down the pipeline for subsequent step consumption.

#### Step 16: `Mark Package Dormant`
- **Internal ID / Name**: `step_5a`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5a}}` down the pipeline for subsequent step consumption.

#### Step 17: `Find Student-Parent for Dormancy`
- **Internal ID / Name**: `step_5b`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`
- **Target Search Column**: `student_id`
- **Search Value Expression**: `{{step_2['first_dormant_student_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5b}}` down the pipeline for subsequent step consumption.

#### Step 18: `Find Parent Email for Dormancy`
- **Internal ID / Name**: `step_5c`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Parents`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_5b[0]['parent_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5c}}` down the pipeline for subsequent step consumption.

#### Step 19: `Send Dormancy Notification`
- **Internal ID / Name**: `step_5d`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `["{{step_5c[0]['email']}}"]`
- **Subject**: `Your Child Hasn't Attended Recently - TOTS Tennis Academy`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Dormancy & Inactivity Notice</p></div><div style="padding: 24px;"><p style="font-size: 15px; margin-top: 0;">Dear Parent,</p><p style="font-size: 14px; color: #475569;">We noticed that your child has not attended any sessions recently despite having an active package registered with TOTS Tennis Academy.</p><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; color: #334155;">Please check their schedule and encourage them to resume training. Unused sessions remain subject to package validity periods.</div><p style="font-size: 14px; color: #475569;">If you need assistance or wish to pause/reschedule, please get in touch with academy management.</p></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. All rights reserved.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5d}}` down the pipeline for subsequent step consumption.

#### Step 20: `Log Dormancy Reminder`
- **Internal ID / Name**: `step_5e`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_2['first_dormant_student_id']}}`
  - `package_id`: `{{step_2['first_dormant_id']}}`
  - `channel`: `email`
  - `stage`: `dormant`
  - `status`: `sent`
  - `sent_at`: `{{step_2['today']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5e}}` down the pipeline for subsequent step consumption.

---

## 6. WF-I Direct Payment Capture

- **Workflow File**: [`WF-I_direct_payment_capture.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-I_direct_payment_capture.json)
- **Description**: Captures Stripe payment_intent.succeeded webhook, creates payment record, updates package status, resets reminder workflows
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Catch Payment Webhook`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Parse Payment Payload`
- **Internal ID / Name**: `step_1`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
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
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Route by Validation`
- **Internal ID / Name**: `step_router`
- **Step Type**: `ROUTER`

##### 🔀 Router Branch Conditions:
- **Branch Name**: `Valid Payment` (Type: `CONDITION`)
  - Condition: `{{step_1['valid']}}` `TEXT_EXACTLY_MATCHES` `true`
- **Branch Name**: `Invalid` (Type: `FALLBACK`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_router}}` down the pipeline for subsequent step consumption.

#### Step 4: `Find Student`
- **Internal ID / Name**: `step_2`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Students`
- **Target Search Column**: `id`
- **Search Value Expression**: `{{step_1['student_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 5: `Create Payment Record`
- **Internal ID / Name**: `step_3`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Payments`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_1['student_id']}}`
  - `amount`: `{{step_1['amount']}}`
  - `gateway`: `{{step_1['gateway']}}`
  - `type`: `direct`
  - `status`: `paid`
  - `date`: `{{step_1['date']}}`
  - `stripe_payment_intent_id`: `{{step_1['payment_intent_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3}}` down the pipeline for subsequent step consumption.

#### Step 6: `Find Active Package`
- **Internal ID / Name**: `step_4`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Target Search Column**: `student_id`
- **Search Value Expression**: `{{step_1['student_id']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4}}` down the pipeline for subsequent step consumption.

#### Step 7: `Update Package to Paid`
- **Internal ID / Name**: `step_5`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Values Mapping (Column Keys & Payloads)**:
  - `payment_status`: `paid`
  - `status`: `active`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5}}` down the pipeline for subsequent step consumption.

#### Step 8: `Stop Reminder Workflow WF-H`
- **Internal ID / Name**: `step_6`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `google-sheets-insert-multiple-rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `workflow_key`: `WF-H_stop`
  - `entity_key`: `student_id`
  - `entity_value`: `{{step_1['student_id']}}`
  - `state_json`: `{'stop': True}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_6}}` down the pipeline for subsequent step consumption.

#### Step 9: `Reset GC Workflow WF-G`
- **Internal ID / Name**: `step_7`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `google-sheets-insert-multiple-rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `workflow_key`: `WF-G_reset`
  - `entity_key`: `student_id`
  - `entity_value`: `{{step_1['student_id']}}`
  - `state_json`: `{'reset': True}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_7}}` down the pipeline for subsequent step consumption.

#### Step 10: `Return Success Response`
- **Internal ID / Name**: `step_9`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_9}}` down the pipeline for subsequent step consumption.

#### Step 11: `Return Error Response`
- **Internal ID / Name**: `step_error`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_error}}` down the pipeline for subsequent step consumption.

---

## 7. WF-J Club Excel Reconciliation

- **Workflow File**: [`WF-J_club_excel_reconciliation.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-J_club_excel_reconciliation.json)
- **Description**: PENDING CLIENT DECISION (MoM Aug 2026): Club payments are processed directly by the club, not the academy. Current Excel-reconciliation logic is a WORKING ASSUMPTION only. Do not finalize WF-J until client answers: 'How will the system handle payment tracking and billing for The Club?'. This workflow receives pre-parsed excel rows via webhook, matches against system students, creates reconciliation entries, and returns summary.
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Catch Reconciliation Webhook`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Parse Excel Rows`
- **Internal ID / Name**: `step_1`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const p = typeof inputs.payload === 'string' ? JSON.parse(inputs.payload) : inputs.payload;
  const rows = Array.isArray(p.rows) ? p.rows : (Array.isArray(p) ? p : []);
  const entity = (p.entity || 'the-club').trim();
  const normalized = rows.map(r => ({
    student_name: (r.student_name || r.name || '').trim(),
    excel_amount: parseFloat(r.amount || r.excel_amount || '0'),
    gateway: (r.gateway || 'excel_reported').trim(),
    date: (r.date || r.payment_date || '').trim(),
    note: (r.note || r.remarks || '').trim()
  }));
  return { rows: normalized, entity: entity, row_count: normalized.length };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Find All Students by Entity`
- **Internal ID / Name**: `step_2`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `get_all_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Students`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 4: `Match & Compute Reconciliation`
- **Internal ID / Name**: `step_3`
- **Step Type**: `CODE`
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Reconciliation Audits`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const excelRows = typeof inputs.excel_rows === 'string' ? JSON.parse(inputs.excel_rows) : (inputs.excel_rows || []);
  const students = typeof inputs.students === 'string' ? JSON.parse(inputs.students) : (inputs.students || []);
  const entity = inputs.entity || 'the-club';
  const studentMap = {};
  students.forEach(s => { studentMap[s.name.toLowerCase()] = s; });
  let matchedCount = 0, mismatchCount = 0, newCount = 0;
  const entries = excelRows.map(r => {
    const student = studentMap[r.student_name.toLowerCase()];
    let status = 'new';
    if (student) { status = 'matched'; matchedCount++; }
    else { newCount++; }
    return {
      student_id: student ? student.id : '',
      student_name: r.student_name,
      entity: entity,
      excel_amount: r.excel_amount,
      system_amount: 0,
      gateway: r.gateway,
      status: status,
      date: r.date,
      note: r.note
    };
  });
  return { entries: entries, matched_count: matchedCount, mismatch_count: mismatchCount, new_count: newCount, total_rows: excelRows.length };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3}}` down the pipeline for subsequent step consumption.

#### Step 5: `Create Reconciliation Entry`
- **Internal ID / Name**: `step_4`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Reconciliation Audits`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: `{{step_3['entries'][0]['student_id']}}`
  - `entity`: `{{step_3['entries'][0]['entity']}}`
  - `excel_amount`: `{{step_3['entries'][0]['excel_amount']}}`
  - `system_amount`: `{{step_3['entries'][0]['system_amount']}}`
  - `gateway`: `{{step_3['entries'][0]['gateway']}}`
  - `status`: `{{step_3['entries'][0]['status']}}`
  - `date`: `{{step_3['entries'][0]['date']}}`
  - `note`: `{{step_3['entries'][0]['note']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4}}` down the pipeline for subsequent step consumption.

#### Step 6: `Return Reconciliation Summary`
- **Internal ID / Name**: `step_5`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5}}` down the pipeline for subsequent step consumption.

---

## 8. WF-K Invoice & Occupancy Report

- **Workflow File**: [`WF-K_invoice_occupancy_report.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-K_invoice_occupancy_report.json)
- **Description**: Generates monthly invoice and occupancy report: aggregates payments and attendance, computes revenue and occupancy %, emails report to admin
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Catch Report Webhook`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Determine Report Month`
- **Internal ID / Name**: `step_1`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const p = typeof inputs.payload === 'string' ? JSON.parse(inputs.payload) : (inputs.payload || {});
  const now = new Date();
  const month = parseInt(p.month || (now.getMonth() + 1));
  const year = parseInt(p.year || now.getFullYear());
  const startDate = year + '-' + String(month).padStart(2, '0') + '-01';
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
  return { month: month, year: year, start_date: startDate, end_date: endDate, month_name: monthName };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Find Payments for Month`
- **Internal ID / Name**: `step_2`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `get_all_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Payments`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 4: `Find Attendance for Month`
- **Internal ID / Name**: `step_3`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `get_all_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Attendance`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3}}` down the pipeline for subsequent step consumption.

#### Step 5: `Aggregate Revenue & Occupancy`
- **Internal ID / Name**: `step_4`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const payments = typeof inputs.payments === 'string' ? JSON.parse(inputs.payments) : (inputs.payments || []);
  const attendance = typeof inputs.attendance === 'string' ? JSON.parse(inputs.attendance) : (inputs.attendance || []);
  const monthName = inputs.month_name;
  const year = inputs.year;
  let totalRevenue = 0, groupRevenue = 0, oneOnOneRevenue = 0;
  let totalGroupSessions = 0, totalOneOnOneSessions = 0;
  let groupAttendanceCount = 0, oneOnOneAttendanceCount = 0;
  payments.forEach(p => {
    const amt = parseFloat(p.amount || '0');
    totalRevenue += amt;
    if (p.type === 'group') { groupRevenue += amt; } else { oneOnOneRevenue += amt; }
  });
  attendance.forEach(a => {
    if (a.type === 'group') { totalGroupSessions++; if (a.status === 'present') groupAttendanceCount++; }
    else { totalOneOnOneSessions++; if (a.status === 'present') oneOnOneAttendanceCount++; }
  });
  const groupOccupancy = totalGroupSessions > 0 ? ((groupAttendanceCount / totalGroupSessions) * 100).toFixed(1) : '0';
  const oneOnOneOccupancy = totalOneOnOneSessions > 0 ? ((oneOnOneAttendanceCount / totalOneOnOneSessions) * 100).toFixed(1) : '0';
  const totalSessions = totalGroupSessions + totalOneOnOneSessions;
  const totalAttendance = groupAttendanceCount + oneOnOneAttendanceCount;
  const overallOccupancy = totalSessions > 0 ? ((totalAttendance / totalSessions) * 100).toFixed(1) : '0';
  return {
    total_revenue: totalRevenue,
    group_revenue: groupRevenue,
    one_on_one_revenue: oneOnOneRevenue,
    total_sessions: totalSessions,
    total_attendance: totalAttendance,
    group_occupancy: groupOccupancy,
    one_on_one_occupancy: oneOnOneOccupancy,
    overall_occupancy: overallOccupancy,
    month_name: monthName,
    year: year,
    payment_count: payments.length
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4}}` down the pipeline for subsequent step consumption.

#### Step 6: `Log Communication`
- **Internal ID / Name**: `step_5`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `student_id`: ``
  - `type`: `invoice`
  - `channel`: `email`
  - `status`: `sent`
  - `date`: `{{step_1['start_date']}}`
  - `file_link`: ``

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5}}` down the pipeline for subsequent step consumption.

#### Step 7: `Send Email Report`
- **Internal ID / Name**: `step_6`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `['admin@arnavtennis.com']`
- **Subject**: `Monthly Invoice & Occupancy Report - {{step_4['month_name']}} {{step_4['year']}} - TOTS Tennis Academy`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Monthly Revenue & Occupancy Report — {{step_4['month_name']}} {{step_4['year']}}</p></div><div style="padding: 24px;"><h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Financial Summary</h4><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;"><table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;"><tr><td style="padding: 6px 0; font-weight: 600; width: 50%;">Total Revenue:</td><td style="padding: 6px 0; font-weight: 700; color: #166534;">₹{{step_4['total_revenue']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Group Coaching Revenue:</td><td style="padding: 6px 0;">₹{{step_4['group_revenue']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">1-on-1 Session Revenue:</td><td style="padding: 6px 0;">₹{{step_4['one_on_one_revenue']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Payments Processed:</td><td style="padding: 6px 0;">{{step_4['payment_count']}}</td></tr></table></div><h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Occupancy & Usage Statistics</h4><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;"><table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;"><tr><td style="padding: 6px 0; font-weight: 600; width: 50%;">Total Sessions Conducted:</td><td style="padding: 6px 0;">{{step_4['total_sessions']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Total Student Attendance:</td><td style="padding: 6px 0;">{{step_4['total_attendance']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Overall Occupancy Rate:</td><td style="padding: 6px 0; font-weight: 700; color: #0284c7;">{{step_4['overall_occupancy']}}%</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Group Occupancy:</td><td style="padding: 6px 0;">{{step_4['group_occupancy']}}%</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">1-on-1 Occupancy:</td><td style="padding: 6px 0;">{{step_4['one_on_one_occupancy']}}%</td></tr></table></div></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. Generated automatically for management audit.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_6}}` down the pipeline for subsequent step consumption.

#### Step 8: `Return Report Response`
- **Internal ID / Name**: `step_7`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_7}}` down the pipeline for subsequent step consumption.

---

## 9. WF-L Coach Payroll & Leave Rollup

- **Workflow File**: [`WF-L_coach_payroll_leave.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-L_coach_payroll_leave.json)
- **Description**: Generates monthly coach payroll report with entity-specific paths: The Club (session-based, half_day/full_day, approval-gated) and TOTS Tennis (hourly billing, hours_logged x hourly_rate). Triggered via webhook with month/year params.
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Catch Payroll Webhook`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Determine Payroll Month`
- **Internal ID / Name**: `step_1`
- **Step Type**: `CODE`
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Coaches`
- **Target Search Column**: `status`
- **Search Value Expression**: `active`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const p = typeof inputs.payload === 'string' ? JSON.parse(inputs.payload) : (inputs.payload || {});
  const now = new Date();
  const month = parseInt(p.month || (now.getMonth() + 1));
  const year = parseInt(p.year || now.getFullYear());
  const startDate = year + '-' + String(month).padStart(2, '0') + '-01';
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
  return { month: month, year: year, start_date: startDate, end_date: endDate, month_name: monthName };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Query All Active Coaches`
- **Internal ID / Name**: `step_2`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Coaches`
- **Target Search Column**: `status`
- **Search Value Expression**: `active`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 4: `Query Coach Attendance for Month`
- **Internal ID / Name**: `step_3`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Attendance`
- **Target Search Column**: `date`
- **Search Value Expression**: `{{step_1['start_date']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3}}` down the pipeline for subsequent step consumption.

#### Step 5: `Query Approved Leaves for Month`
- **Internal ID / Name**: `step_4`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Coach Leaves`
- **Target Search Column**: `status`
- **Search Value Expression**: `approved`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4}}` down the pipeline for subsequent step consumption.

#### Step 6: `Check Club Payroll Approval Status`
- **Internal ID / Name**: `step_5_check_approval`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const coachesRaw = typeof inputs.coaches_json === 'string' ? JSON.parse(inputs.coaches_json) : (inputs.coaches_json || []);
  const coaches = Array.isArray(coachesRaw) ? coachesRaw : [];
  const attendance = Array.isArray(inputs.attendance) ? inputs.attendance : [];

  // Separate coaches by entity
  const clubCoaches = coaches.filter(c => c.entity === 'the-club');
  const totsCoaches = coaches.filter(c => c.entity === 'tots-tennis');

  // Check Club coaches: any unapproved attendance?
  const clubCoachIds = new Set(clubCoaches.map(c => c.id));
  const unapproved = [];
  attendance.forEach(a => {
    if (clubCoachIds.has(a.coach_id) && a.approval_status !== 'approved') {
      const coach = clubCoaches.find(c => c.id === a.coach_id);
      unapproved.push({ coach_id: a.coach_id, coach_name: coach ? coach.name : 'Unknown', date: a.date, status: a.approval_status || 'pending' });
    }
  });

  return {
    club_coach_count: clubCoaches.length,
    tots_coach_count: totsCoaches.length,
    unapproved_count: unapproved.length,
    unapproved: unapproved,
    ready_for_club: unapproved.length === 0,  // Club requires all approvals
    ready_for_tots: totsCoaches.length > 0
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5_check_approval}}` down the pipeline for subsequent step consumption.

#### Step 7: `Aggregate Coach Payroll (Entity-Specific)`
- **Internal ID / Name**: `step_5_aggregate`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const coachesRaw = typeof inputs.coaches_json === 'string' ? JSON.parse(inputs.coaches_json) : (inputs.coaches_json || []);
  const coaches = Array.isArray(coachesRaw) ? coachesRaw : [];
  const attendance = Array.isArray(inputs.attendance) ? inputs.attendance : [];
  const leaves = Array.isArray(inputs.leaves) ? inputs.leaves : [];
  const approvalCheck = inputs.approval_check || {};
  const monthName = inputs.month_name;
  const year = parseInt(inputs.year || new Date().getFullYear());
  const month = parseInt(inputs.month || new Date().getMonth() + 1);

  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 26;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    if (dayOfWeek === 0) workingDays--;
  }

  const results = [];
  let totalPayroll = 0;
  let pendingApproval = false;

  coaches.forEach(coach => {
    const isClub = coach.entity === 'the-club';
    const coachAtt = attendance.filter(a => a.coach_id === coach.id);
    const coachLeaves = leaves.filter(l => l.coach_id === coach.id);

    let leaveDays = 0;
    coachLeaves.forEach(l => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      leaveDays += Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    });

    let payrollAmount = 0;
    let calculationMethod = '';
    let details = {};

    if (isClub) {
      // THE CLUB: Session-based payroll with half_day/full_day distinction
      let halfDaySessions = 0;
      let fullDaySessions = 0;
      let hasUnapproved = false;

      coachAtt.forEach(a => {
        if (a.approval_status !== 'approved') {
          hasUnapproved = true;
          return;  // Skip unapproved sessions
        }
        if (a.session_period === 'half_day') {
          halfDaySessions += (parseInt(a.sessions_count) || 0);
        } else {
          fullDaySessions += (parseInt(a.sessions_count) || 0);
        }
      });

      const monthlySalary = parseInt(coach.payroll_rate || 0);
      const dailyRate = workingDays > 0 ? Math.round(monthlySalary / workingDays) : 0;
      const leaveDeduction = leaveDays * dailyRate;
      payrollAmount = monthlySalary - leaveDeduction;
      if (payrollAmount < 0) payrollAmount = 0;

      calculationMethod = 'Salary (Club)';
      details = {
        entity: 'the-club',
        method: 'session_based',
        monthly_salary: monthlySalary,
        daily_rate: dailyRate,
        working_days: workingDays,
        half_day_sessions: halfDaySessions,
        full_day_sessions: fullDaySessions,
        total_sessions: halfDaySessions + fullDaySessions,
        leave_days: leaveDays,
        leave_deduction: leaveDeduction,
        net_payable: payrollAmount,
        approval_status: hasUnapproved ? 'pending_approval' : 'approved'
      };

      if (hasUnapproved) {
        pendingApproval = true;
        details.approval_note = 'Payroll pending — some attendance records await admin/head coach approval';
      }
    } else {
      // TOTS TENNIS: Hourly billing model
      const hoursLogged = parseInt(coach.hours_logged || 0);
      const hourlyRate = parseInt(coach.hourly_rate || 0);
      payrollAmount = hoursLogged * hourlyRate;

      calculationMethod = 'Hourly (TOTS)';
      details = {
        entity: 'tots-tennis',
        method: 'hourly',
        hours_logged: hoursLogged,
        hourly_rate: hourlyRate,
        net_payable: payrollAmount
      };
    }

    totalPayroll += payrollAmount;

    results.push({
      coach_id: coach.id,
      coach_name: coach.name || 'Unknown',
      entity: coach.entity,
      calculation_method: calculationMethod,
      payroll_amount: payrollAmount,
      details: details
    });
  });

  return {
    month_name: monthName,
    year: year,
    working_days: workingDays,
    coach_count: results.length,
    total_payroll: totalPayroll,
    pending_approval: pendingApproval,
    coaches: results
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5_aggregate}}` down the pipeline for subsequent step consumption.

#### Step 8: `Log Payroll Run`
- **Internal ID / Name**: `step_6`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `type`: `payroll`
  - `channel`: `email`
  - `status`: `sent`
  - `date`: `{{step_1['start_date']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_6}}` down the pipeline for subsequent step consumption.

#### Step 9: `Send Payroll Report Email`
- **Internal ID / Name**: `step_7`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `['admin@arnavtennis.com']`
- **Subject**: `Coach Payroll Report - {{step_5_aggregate['month_name']}} {{step_5_aggregate['year']}} - TOTS Tennis Academy`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Coach Payroll & Attendance Summary — {{step_5_aggregate['month_name']}} {{step_5_aggregate['year']}}</p></div><div style="padding: 24px;"><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;"><table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;"><tr><td style="padding: 6px 0; font-weight: 600; width: 50%;">Total Coaches:</td><td style="padding: 6px 0;">{{step_5_aggregate['coach_count']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Working Days:</td><td style="padding: 6px 0;">{{step_5_aggregate['working_days']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Total Net Payroll:</td><td style="padding: 6px 0; font-weight: 700; color: #166534;">₹{{step_5_aggregate['total_payroll']}}</td></tr></table></div><p style="font-size: 13px; color: #475569; line-height: 1.6;">Payroll breakdown for all active coaches is compiled below for admin review and approval.</p></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. Payroll Auto-Generated Report.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_7}}` down the pipeline for subsequent step consumption.

#### Step 10: `Return Payroll Response`
- **Internal ID / Name**: `step_8`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_8}}` down the pipeline for subsequent step consumption.

---

## 10. WF-M Absence Alert Engine

- **Workflow File**: [`WF-M_absence_alert.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-M_absence_alert.json)
- **Description**: Cron-driven workflow checking for scheduled sessions with no attendance marked after a configurable timeframe. Sends absence notification email to parent via Gmail. Distinct from WF-F (pre-session confirmation) — WF-M is reactive/post-session. Configurable via platform_settings.absence_alert_delay_hours (default: 2 hours).
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Catch Absence Check Trigger`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Read Absence Alert Delay Setting`
- **Internal ID / Name**: `step_1`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Target Search Column**: `key`
- **Search Value Expression**: `absence_alert_delay_hours`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Compute Check Window`
- **Internal ID / Name**: `step_2`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  // Default to 2 hours if setting not found
  const settings = Array.isArray(inputs.settings_result) ? inputs.settings_result : [];
  let delayHours = 2;
  if (settings.length > 0 && settings[0].value) {
    const parsed = parseInt(settings[0].value);
    if (!isNaN(parsed) && parsed > 0) delayHours = parsed;
  }

  const now = new Date();
  const checkStart = new Date(now.getTime() - delayHours * 60 * 60 * 1000);
  const checkEnd = new Date(now.getTime() - 60 * 60 * 1000); // 1h buffer

  const today = now.toISOString().split('T')[0];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[now.getDay()];
  const startTime = checkStart.toTimeString().slice(0, 8);
  const endTime = checkEnd.toTimeString().slice(0, 8);

  return {
    delay_hours: delayHours,
    check_date: today,
    day_name: dayName,
    start_time: startTime,
    end_time: endTime,
    start_datetime: checkStart.toISOString(),
    end_datetime: checkEnd.toISOString()
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 4: `Query Today's Scheduled Sessions`
- **Internal ID / Name**: `step_3`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `1-on-1 Sessions`
- **Target Search Column**: `day`
- **Search Value Expression**: `{{step_2['day_name']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3}}` down the pipeline for subsequent step consumption.

#### Step 5: `Query Today's Attendance Records`
- **Internal ID / Name**: `step_4`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Attendance`
- **Target Search Column**: `date`
- **Search Value Expression**: `{{step_2['check_date']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4}}` down the pipeline for subsequent step consumption.

#### Step 6: `Identify Missed Sessions & Resolve Parents`
- **Internal ID / Name**: `step_5`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const schedule = Array.isArray(inputs.schedule_json) ? inputs.schedule_json : [];
  const attendance = Array.isArray(inputs.attendance_json) ? inputs.attendance_json : [];

  // Build set of (student_id, batch_id) pairs that have attendance
  const attendedPairs = new Set();
  attendance.forEach(a => {
    const key = (a.student_id || '') + '|' + (a.batch_id || '');
    attendedPairs.add(key);
  });

  // Find scheduled sessions in the check window with no attendance
  const missed = [];
  schedule.forEach(s => {
    // Only check sessions that have started before check_end
    const sessionTime = s.start_time || '';
    if (sessionTime > (inputs.window.end_time || '23:59:59')) return;
    if (sessionTime < (inputs.window.start_time || '00:00:00')) return;

    // Determine which students to check
    if (s.type === 'group') {
      // For group sessions, we know the batch_id — check if any attendance exists
      // We'll need to query students in this batch separately
      missed.push({
        type: 'group',
        schedule_id: s.id,
        batch_id: s.batch_id,
        coach_id: s.coach_id,
        entity: s.entity,
        start_time: s.start_time,
        end_time: s.end_time
      });
    } else if (s.type === 'one_on_one') {
      const key = (s.student_id || '') + '|' + (s.batch_id || '');
      if (!attendedPairs.has(key)) {
        missed.push({
          type: 'one_on_one',
          schedule_id: s.id,
          student_id: s.student_id,
          coach_id: s.coach_id,
          entity: s.entity,
          start_time: s.start_time,
          end_time: s.end_time
        });
      }
    }
  });

  return {
    missed_count: missed.length,
    missed_sessions: missed,
    delay_hours: inputs.window.delay_hours || 2
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5}}` down the pipeline for subsequent step consumption.

#### Step 7: `Query Students from Affected Batches`
- **Internal ID / Name**: `step_6`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Students`
- **Target Search Column**: `status`
- **Search Value Expression**: `active`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_6}}` down the pipeline for subsequent step consumption.

#### Step 8: `Query Parent-Student Links`
- **Internal ID / Name**: `step_7`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `get_all_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_7}}` down the pipeline for subsequent step consumption.

#### Step 9: `Query Parents for Email`
- **Internal ID / Name**: `step_8`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `get_all_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Parents`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_8}}` down the pipeline for subsequent step consumption.

#### Step 10: `Resolve Absentees & Parent Emails`
- **Internal ID / Name**: `step_9`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const missedResult = typeof inputs.missed_json === 'string' ? JSON.parse(inputs.missed_json) : (inputs.missed_json || {});
  const missedSessions = missedResult.missed_sessions || [];
  const students = Array.isArray(inputs.students_json) ? inputs.students_json : [];
  const spLinks = Array.isArray(inputs.sp_json) ? inputs.sp_json : [];
  const parents = Array.isArray(inputs.parents_json) ? inputs.parents_json : [];
  const attendance = Array.isArray(inputs.attendance_json) ? inputs.attendance_json : [];

  const studentById = {};
  students.forEach(s => { studentById[s.id] = s; });
  const parentById = {};
  parents.forEach(p => { parentById[p.id] = p; });

  const studentParentMap = {};
  spLinks.forEach(sp => {
    if (!studentParentMap[sp.student_id]) studentParentMap[sp.student_id] = [];
    studentParentMap[sp.student_id].push(sp.parent_id);
  });

  const attendedPairs = new Set();
  attendance.forEach(a => {
    attendedPairs.add((a.student_id || '') + '|' + (a.batch_id || ''));
  });

  const notifications = [];
  const seen = new Set();

  missedSessions.forEach(missed => {
    if (missed.type === 'one_on_one') {
      const student = studentById[missed.student_id];
      if (!student || student.status === 'trial') return;
      if (seen.has(student.id)) return;
      seen.add(student.id);
      const parentIds = studentParentMap[missed.student_id] || [];
      parentIds.forEach(pid => {
        const parent = parentById[pid];
        if (parent && parent.email) {
          notifications.push({
            student_id: missed.student_id, student_name: student.name || 'Student',
            parent_id: pid, parent_email: parent.email, parent_name: parent.name || 'Parent',
            session_time: missed.start_time || '', session_date: new Date().toISOString().split('T')[0]
          });
        }
      });
    } else if (missed.type === 'group') {
      const batchStudents = students.filter(st => st.batch_id === missed.batch_id);
      batchStudents.forEach(student => {
        if (student.status === 'trial') return;
        const key = (student.id || '') + '|' + (missed.batch_id || '');
        if (attendedPairs.has(key)) return;
        if (seen.has(student.id)) return;
        seen.add(student.id);
        const parentIds = studentParentMap[student.id] || [];
        parentIds.forEach(pid => {
          const parent = parentById[pid];
          if (parent && parent.email) {
            notifications.push({
              student_id: student.id, student_name: student.name || 'Student',
              parent_id: pid, parent_email: parent.email, parent_name: parent.name || 'Parent',
              session_time: missed.start_time || '', session_date: new Date().toISOString().split('T')[0]
            });
          }
        });
      });
    }
  });

  return {
    notifications: notifications,
    notification_count: notifications.length,
    delay_hours: missedResult.delay_hours || 2
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_9}}` down the pipeline for subsequent step consumption.

#### Step 11: `Router`
- **Internal ID / Name**: `step_15`
- **Step Type**: `ROUTER`

##### 🔀 Router Branch Conditions:
- **Branch Name**: `Has Notifications` (Type: `CONDITION`)
  - Condition: `{{step_9['notification_count']}}` `NUMBER_IS_GREATER_THAN` `0`
- **Branch Name**: `Otherwise` (Type: `FALLBACK`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_15}}` down the pipeline for subsequent step consumption.

#### Step 12: `Return Final Response`
- **Internal ID / Name**: `step_16`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_16}}` down the pipeline for subsequent step consumption.

#### Step 13: `Loop on Items`
- **Internal ID / Name**: `step_14`
- **Step Type**: `LOOP_ON_ITEMS`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_14}}` down the pipeline for subsequent step consumption.

#### Step 14: `Send Absence Alert Emails`
- **Internal ID / Name**: `step_10`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `{{step_14['item']['parent_email']}}`
- **Subject**: `Absence Notification — {{step_14['item']['student_name']}} - TOTS Tennis Academy`
- **Body Format**: `html`
- **Email Content Body**:
```html
<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Session Absence Notification</p></div><div style="padding: 24px;"><p style="font-size: 15px; margin-top: 0;">Dear <strong>{{step_14['item']['parent_name']}}</strong>,</p><p style="font-size: 14px; color: #475569;">This is to inform you that <strong>{{step_14['item']['student_name']}}</strong> was marked absent for their scheduled tennis session today.</p><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;"><h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Session Details</h4><table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;"><tr><td style="padding: 6px 0; font-weight: 600; width: 40%;">Student Name:</td><td style="padding: 6px 0;">{{step_14['item']['student_name']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Session Date:</td><td style="padding: 6px 0;">{{step_14['item']['session_date']}}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Scheduled Time:</td><td style="padding: 6px 0;">{{step_14['item']['session_time']}}</td></tr></table></div><p style="font-size: 14px; color: #475569;">If this absence was unexpected or sent in error, please contact your coach or the academy administration so we can update our records.</p></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. All rights reserved.</p></div></div>
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_10}}` down the pipeline for subsequent step consumption.

#### Step 15: `Get Current Date`
- **Internal ID / Name**: `step_13`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-date-helper` (Action: `get_current_date`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_13}}` down the pipeline for subsequent step consumption.

#### Step 16: `Log Absence Alerts`
- **Internal ID / Name**: `step_11`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `date`: `{{step_13['result']}}`
  - `type`: `absence_alert`
  - `status`: `sent`
  - `channel`: `email`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_11}}` down the pipeline for subsequent step consumption.

#### Step 17: `Return No Absentees`
- **Internal ID / Name**: `step_17`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_17}}` down the pipeline for subsequent step consumption.

---

## 11. WF-O Payment Reminder Email

- **Workflow File**: [`WF-O_payment_reminder_email.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-O_payment_reminder_email.json)
- **Description**: Queries Supabase for packages with pending balance > 0, resolves the most overdue parent email, composes a professional personalized email body via LLM-AI, and sends via Gmail. Logs in communications_log. Runs one parent per invocation — the scheduler calls it repeatedly until all pending parents are notified.
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Catch Payment Reminder Trigger`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Query Packages with Pending Balance`
- **Internal ID / Name**: `step_1`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Packages`
- **Target Search Column**: `payment_status`
- **Search Value Expression**: `paid`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Query Students`
- **Internal ID / Name**: `step_2`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Students`
- **Target Search Column**: `status`
- **Search Value Expression**: `active`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 4: `Query Parent-Student Links`
- **Internal ID / Name**: `step_3`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `get_all_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3}}` down the pipeline for subsequent step consumption.

#### Step 5: `Query Parents`
- **Internal ID / Name**: `step_4`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `get_all_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Parents`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4}}` down the pipeline for subsequent step consumption.

#### Step 6: `Filter Pending & Prepare LLM Prompt`
- **Internal ID / Name**: `step_5`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const packages = Array.isArray(inputs.packages_json) ? inputs.packages_json : [];
  const students = Array.isArray(inputs.students_json) ? inputs.students_json : [];
  const spLinks = Array.isArray(inputs.sp_json) ? inputs.sp_json : [];
  const parents = Array.isArray(inputs.parents_json) ? inputs.parents_json : [];

  const studentById = {};
  students.forEach(s => { studentById[s.id] = s; });
  const parentById = {};
  parents.forEach(p => { parentById[p.id] = p; });

  const studentParentMap = {};
  spLinks.forEach(sp => {
    if (!studentParentMap[sp.student_id]) studentParentMap[sp.student_id] = [];
    studentParentMap[sp.student_id].push(sp.parent_id);
  });

  const eligible = [];
  packages.forEach(p => {
    const pending = (p.amount || 0) - (p.amount_received || 0);
    if (pending <= 0) return;
    const student = studentById[p.student_id];
    if (!student) return;
    const parentIds = studentParentMap[student.id] || [];
    if (parentIds.length === 0) return;
    parentIds.forEach(pid => {
      const parent = parentById[pid];
      if (parent && parent.email) {
        const hasUrl = !!p.payment_url;
        eligible.push({
          studentId: student.id,
          studentName: student.name || 'Student',
          parentId: parent.id,
          parentEmail: parent.email,
          parentName: parent.name || 'Parent',
          program: p.program || 'Enrollment',
          pendingAmount: pending,
          hasPaymentUrl: hasUrl,
          paymentUrl: p.payment_url || '',
          packageId: p.id
        });
      }
    });
  });

  // Sort by pending amount descending — most overdue first
  eligible.sort((a, b) => b.pendingAmount - a.pendingAmount);

  const target = eligible[0] || null;
  if (!target) {
    return { hasReminders: false, totalPending: 0, message: 'No pending payments to remind' };
  }

  const urlNote = target.hasPaymentUrl
    ? 'Payment Link: ' + target.paymentUrl
    : 'Payment link is not yet configured. Please contact the academy for payment details.';

  const llmPrompt = `You are composing a payment reminder email for a tennis academy parent. Write a professional, warm, and clear email body in plain text. Do NOT include a subject line. Output ONLY the email body text.

Student Name: ${target.studentName}
Parent Name: ${target.parentName}
Enrollment Program: ${target.program}
Pending Amount: Rs. ${target.pendingAmount.toLocaleString('en-IN')}
${urlNote}

The email should:
- Address the parent by name
- State the pending amount clearly with the program name
- Include the payment link (or the note about it being unavailable)
- End with a warm closing from Tennis Academy Management
- Be 3-4 short paragraphs in a professional but friendly tone`;

  return {
    hasReminders: true,
    totalPending: eligible.length,
    target: target,
    llmPrompt: llmPrompt,
    subject: 'Payment Reminder \u2014 ' + target.studentName
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5}}` down the pipeline for subsequent step consumption.

#### Step 7: `Compose Professional Email Body via AI`
- **Internal ID / Name**: `step_6`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-llm-ai` (Action: `askLlm`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_6}}` down the pipeline for subsequent step consumption.

#### Step 8: `Parse AI Response & Prepare Email`
- **Internal ID / Name**: `step_7`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const step5 = inputs.step5 || {};
  const llmOutput = inputs.llmOutput || '';
  const target = step5.target || {};

  let textBody = llmOutput.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
  if (!textBody) {
    textBody = `Dear ${target.parentName || 'Parent'},

This is a friendly payment reminder for ${target.studentName || 'your child'}'s training package at TOTS Tennis Academy.

Regards,
TOTS Tennis Academy`;
  }
  textBody = textBody.replace(/Arnav Jain Tennis Academy/gi, 'TOTS Tennis Academy');

  const htmlBody = `<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Fee Payment Reminder</p></div><div style="padding: 24px;"><p style="font-size: 15px; margin-top: 0;">Dear <strong>${target.parentName || 'Parent'}</strong>,</p><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px; color: #334155; line-height: 1.6;">${textBody.replace(/\n/g, '<br>')}</div><p style="font-size: 14px; color: #475569;">Thank you for your prompt attention to this matter.</p></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. All rights reserved.</p></div></div>`;

  const rawSub = step5.subject || 'Payment Reminder — TOTS Tennis Academy';
  const cleanSub = rawSub.replace(/Arnav Jain Tennis Academy/gi, 'TOTS Tennis Academy');

  return {
    parentEmail: target.parentEmail || '',
    parentName: target.parentName || 'Parent',
    studentName: target.studentName || 'Student',
    subject: cleanSub.includes('TOTS Tennis Academy') ? cleanSub : cleanSub + ' - TOTS Tennis Academy',
    body: htmlBody,
    body_type: 'html',
    studentId: target.studentId || '',
    packageId: target.packageId || '',
    totalPending: step5.totalPending || 0
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_7}}` down the pipeline for subsequent step consumption.

#### Step 9: `Send Personalized Payment Reminder via Gmail`
- **Internal ID / Name**: `step_8`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `None`
- **Subject**: `{{step_7['subject']}}`
- **Body Format**: `html`
- **Email Content Body**:
```html
{{step_7['body']}}
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_8}}` down the pipeline for subsequent step consumption.

#### Step 10: `Get Current Date`
- **Internal ID / Name**: `step_date_9`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-date-helper` (Action: `get_current_date`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_date_9}}` down the pipeline for subsequent step consumption.

#### Step 11: `Log Payment Reminder`
- **Internal ID / Name**: `step_9`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `type`: `payment_reminder`
  - `channel`: `email`
  - `status`: `sent`
  - `date`: `{{step_date_9['result']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_9}}` down the pipeline for subsequent step consumption.

#### Step 12: `Return Response`
- **Internal ID / Name**: `step_10`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_10}}` down the pipeline for subsequent step consumption.

---

## 12. WF-P Slot Report Email

- **Workflow File**: [`WF-P_slot_report_email.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-P_slot_report_email.json)
- **Description**: Queries Supabase for batches, enrollments, and attendance data to generate Slot Analysis report. Gated behind verification check — queries report_verifications table. Sends formatted report via Gmail with CSV content. Returns 403 if not verified.
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Catch Slot Report Trigger`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Check Report Verification`
- **Internal ID / Name**: `step_1`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Report Verifications`
- **Target Search Column**: `month`
- **Search Value Expression**: `{{trigger['body']['month']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Check Verification Gate`
- **Internal ID / Name**: `step_2`
- **Step Type**: `ROUTER`

##### 🔀 Router Branch Conditions:
- **Branch Name**: `Verified` (Type: `CONDITION`)
  - Condition: `{{step_1}}` `LIST_IS_NOT_EMPTY` `true`
- **Branch Name**: `Otherwise` (Type: `FALLBACK`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 4: `Query Active Batches`
- **Internal ID / Name**: `step_3`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Batches`
- **Target Search Column**: `status`
- **Search Value Expression**: `active`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3}}` down the pipeline for subsequent step consumption.

#### Step 5: `Query Active Enrollments`
- **Internal ID / Name**: `step_4`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Enrollments`
- **Target Search Column**: `status`
- **Search Value Expression**: `active`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4}}` down the pipeline for subsequent step consumption.

#### Step 6: `Query Recent Attendance`
- **Internal ID / Name**: `step_5`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `get_all_rows`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Attendance`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5}}` down the pipeline for subsequent step consumption.

#### Step 7: `Compose Report Email`
- **Internal ID / Name**: `step_6`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const batches = Array.isArray(inputs.batches_json) ? inputs.batches_json : [];
  const enrollments = Array.isArray(inputs.enrollments_json) ? inputs.enrollments_json : [];
  const attendance = Array.isArray(inputs.attendance_json) ? inputs.attendance_json : [];
  const trigger = inputs.trigger_body || {};

  const monthName = trigger.monthName || '';
  const year = trigger.year || new Date().getFullYear();
  const recipients = trigger.recipients || [];
  const template = trigger.template || {};

  const rawSub = (template.subject || 'Monthly Slot Analysis — {month} {year}').replace('{month}', monthName).replace('{year}', year);
  const subject = rawSub.replace(/Arnav Jain Tennis Academy/gi, 'TOTS Tennis Academy') + ' - TOTS Tennis Academy';

  // Compute totals
  const totalBatches = batches.length;
  const enrolledCount = enrollments.length;
  const attendedCount = attendance.filter(a => a.status === 'present').length;
  const totalCapacity = batches.reduce((s, b) => s + (b.capacity || 0), 0);
  const occupancy = totalCapacity > 0 ? Math.round((attendedCount / totalCapacity) * 100) : 0;

  let csv = 'Day/Pattern,Court & Time,Category,Capacity,Enrolled,Attended,Members,Non-members,Guest/Trial,Occupancy %\n';
  batches.forEach(b => {
    const bEnr = enrollments.filter(e => e.batch_id === b.id).length;
    const bAtt = attendance.filter(a => a.batch_id === b.id && a.status === 'present').length;
    const bOcc = b.capacity > 0 ? Math.round((bAtt / b.capacity) * 100) : 0;
    const bMembers = bEnr;
    const bNonMembers = 0;
    const bGuests = 0;
    csv += `${b.day_pattern || ''},${b.court_id || ''} ${b.start_time || ''}-${b.end_time || ''},${b.program || ''},${b.capacity || ''},${bEnr},${bAtt},${bMembers},${bNonMembers},${bGuests},${bOcc}%\n`;
  });

  const htmlBody = `<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; overflow: hidden;"><div style="background-color: #0f172a; padding: 24px; text-align: center;"><h2 style="color: #38bdf8; margin: 0; font-size: 22px; font-weight: 700;">TOTS Tennis Academy</h2><p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">Slot Analysis & Occupancy Report — ${monthName} ${year}</p></div><div style="padding: 24px;"><p style="font-size: 14px; color: #475569;">Please find attached the verified Slot Analysis CSV report for <strong>${monthName} ${year}</strong>.</p><div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;"><h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Summary Metrics</h4><table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;"><tr><td style="padding: 6px 0; font-weight: 600; width: 50%;">Total Active Batches:</td><td style="padding: 6px 0;">${totalBatches}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Total Enrolled Students:</td><td style="padding: 6px 0;">${enrolledCount}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Attended Sessions:</td><td style="padding: 6px 0;">${attendedCount}</td></tr><tr><td style="padding: 6px 0; font-weight: 600;">Overall Occupancy Rate:</td><td style="padding: 6px 0; font-weight: 700; color: #0284c7;">${occupancy}%</td></tr></table></div></div><div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"><p style="margin: 0;">© TOTS Tennis Academy. Verified Management Audit Report.</p></div></div>`;

  return { recipients: recipients.join(','), subject, body: htmlBody, body_type: 'html', csvContent: csv, recipientCount: recipients.length };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_6}}` down the pipeline for subsequent step consumption.

#### Step 8: `Send Slot Report via Gmail`
- **Internal ID / Name**: `step_7`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-gmail` (Action: `send_email`)

##### 📧 Email Template Configuration:
- **Recipient**: `None`
- **Subject**: `{{step_6['subject']}}`
- **Body Format**: `html`
- **Email Content Body**:
```html
{{step_6['body']}}
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_7}}` down the pipeline for subsequent step consumption.

#### Step 9: `Log Report Dispatch`
- **Internal ID / Name**: `step_8`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Spreadsheet Name**: `TOTS Tennis Academy Master Database`
- **Sheet Tab Name**: `Academies`
- **Values Mapping (Column Keys & Payloads)**:
  - `type`: `slot_report`
  - `channel`: `email`
  - `status`: `sent`
  - `date`: `{{trigger['body']['monthName']}} {{trigger['body']['year']}}`

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_8}}` down the pipeline for subsequent step consumption.

#### Step 10: `Return Success Response`
- **Internal ID / Name**: `step_9`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_9}}` down the pipeline for subsequent step consumption.

#### Step 11: `Return Not Verified`
- **Internal ID / Name**: `step_fallback`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_fallback}}` down the pipeline for subsequent step consumption.

---

## 13. WF-Webhook-Store Data Persistence

- **Workflow File**: [`WF-webhook-store.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/WF-webhook-store.json)
- **Description**: Generic key/value data storage via webhook. Use Pucho AI Studio's built-in store tool to persist and retrieve arbitrary JSON data. POST with action:'put' + key + value to store, action:'get' + key to retrieve. Scope: Flow-level persistence (data survives between webhook invocations within the same flow).
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Catch Data Store Webhook`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Parse Incoming Payload`
- **Internal ID / Name**: `step_1`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  const p = inputs.payload || {};
  const action = p.action || (Object.keys(p).length > 0 ? 'put' : 'empty');
  return {
    action: action,
    key: p.key || 'default_data',
    value: action === 'put' ? JSON.stringify(p.value || p) : '',
    raw: p
  };
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Route by Action Type`
- **Internal ID / Name**: `step_2`
- **Step Type**: `ROUTER`

##### 🔀 Router Branch Conditions:
- **Branch Name**: `Store Data` (Type: `CONDITION`)
  - Condition: `{{step_1['action']}}` `TEXT_EXACTLY_MATCHES` `put`
- **Branch Name**: `Retrieve Data` (Type: `CONDITION`)
  - Condition: `{{step_1['action']}}` `TEXT_EXACTLY_MATCHES` `get`
- **Branch Name**: `Otherwise` (Type: `FALLBACK`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 4: `Store Data (Put)`
- **Internal ID / Name**: `step_3_put`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-store` (Action: `put`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3_put}}` down the pipeline for subsequent step consumption.

#### Step 5: `Return Store Success`
- **Internal ID / Name**: `step_4_put_response`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4_put_response}}` down the pipeline for subsequent step consumption.

#### Step 6: `Retrieve Data (Get)`
- **Internal ID / Name**: `step_3_get`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-store` (Action: `get`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3_get}}` down the pipeline for subsequent step consumption.

#### Step 7: `Return Retrieved Data`
- **Internal ID / Name**: `step_4_get_response`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4_get_response}}` down the pipeline for subsequent step consumption.

#### Step 8: `Return Bad Request`
- **Internal ID / Name**: `step_3_fallback`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-webhook` (Action: `return_response`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3_fallback}}` down the pipeline for subsequent step consumption.

---

## 14. Dummy Workflow Reference

- **Workflow File**: [`Dummy workflow for sample tools versions.json`](file:///Users/jadavravi/Desktop/tennis-academy-main/workflows/Dummy workflow for sample tools versions.json)
- **Description**: 
- **Schema Version**: 7

### 1. Step-by-Step Data Mapping & Node Configurations

#### Step 1: `Every Day`
- **Internal ID / Name**: `trigger`
- **Step Type**: `TOOL_TRIGGER`
- **Integration Piece**: `@puchoaistudio/tool-schedule` (Action: ``)

##### 📤 Output Data Payload Mapping:
Passes step output `{{trigger}}` down the pipeline for subsequent step consumption.

#### Step 2: `Insert Row`
- **Internal ID / Name**: `step_1`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `insert_row`)
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_1}}` down the pipeline for subsequent step consumption.

#### Step 3: `Find Rows`
- **Internal ID / Name**: `step_2`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `find_rows`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_2}}` down the pipeline for subsequent step consumption.

#### Step 4: `Update Row`
- **Internal ID / Name**: `step_3`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `update_row`)
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_3}}` down the pipeline for subsequent step consumption.

#### Step 5: `Delete Row`
- **Internal ID / Name**: `step_4`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `delete_row`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_4}}` down the pipeline for subsequent step consumption.

#### Step 6: `Get All Spreadsheet Rows`
- **Internal ID / Name**: `step_5`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `get_all_rows`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_5}}` down the pipeline for subsequent step consumption.

#### Step 7: `Insert Multiple Rows`
- **Internal ID / Name**: `step_6`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-google-sheets` (Action: `google-sheets-insert-multiple-rows`)
- **Values Mapping (Column Keys & Payloads)**:

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_6}}` down the pipeline for subsequent step consumption.

#### Step 8: `Get Current Date`
- **Internal ID / Name**: `step_7`
- **Step Type**: `PIECE`
- **Integration Piece**: `@puchoaistudio/tool-date-helper` (Action: `get_current_date`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_7}}` down the pipeline for subsequent step consumption.

#### Step 9: `Code`
- **Internal ID / Name**: `step_8`
- **Step Type**: `CODE`

##### 💻 JavaScript Code Node Logic:
```javascript
export const code = async (inputs) => {
  return true;
};
```

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_8}}` down the pipeline for subsequent step consumption.

#### Step 10: `Router`
- **Internal ID / Name**: `step_9`
- **Step Type**: `ROUTER`

##### 🔀 Router Branch Conditions:
- **Branch Name**: `Branch 1` (Type: `CONDITION`)
  - Condition: `` `TEXT_EXACTLY_MATCHES` ``
- **Branch Name**: `Branch 2` (Type: `CONDITION`)
  - Condition: `` `TEXT_CONTAINS` ``
- **Branch Name**: `Otherwise` (Type: `FALLBACK`)

##### 📤 Output Data Payload Mapping:
Passes step output `{{step_9}}` down the pipeline for subsequent step consumption.

---
