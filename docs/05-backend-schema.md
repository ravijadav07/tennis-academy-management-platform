# Backend Schema — Arnav Jain Tennis Academy

## Mode: GREENFIELD (fresh Postgres on Supabase)

Data is owned fresh in Supabase Postgres. No external Tally/ERP wrapper. Workflows read/write directly via `@puchoaistudio/tool-supabase` (service_role key).

## Entity-Relationship Diagram

```
courts ──1:N──> batches (via court_id)

coaches ──1:N──> batches (primary_coach_id, support_coach_id)
coaches ──1:N──> schedule
coaches ──1:N──> attendance (student)
coaches ──1:N──> coach_attendance
coaches ──1:N──> leave_requests

batches ──1:N──> students
batches ──1:N──> schedule
batches ──1:N──> enrollments

students ──1:N──> packages
students ──1:N──> attendance
students ──1:N──> payments
students ──1:N──> reminders
students ──1:N──> progress
students ──1:N──> communications_log
students ──1:N──> schedule (1-on-1)
students ──1:N──> enrollments
students ──1:N──> certificates
students ──M:N──> parents (via student_parents)

parents ──1:N──> payments
parents ──1:N──> communications_log
```

## Tables

### 1. coaches
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| name | text | NOT NULL | |
| phone | text | | |
| email | text | | |
| specialization | text | | e.g. 'Advanced Tournament', 'Beginners' |
| entity | entity_type | NOT NULL | 'the-club', 'tots-tennis' |
| status | coach_status | NOT NULL, DEFAULT 'active' | active, on_leave, inactive |
| payroll_rate | integer | NOT NULL, DEFAULT 0 | Monthly base in INR (The Club) |
| designation | text | | e.g. 'Senior Tennis Coach', 'Junior Tennis Coach', 'Fitness Team' |
| duty_type | duty_type | | FULL_TIME, EVENING_ONLY, MORNING_ONLY, PART_TIME |
| base_salary | integer | DEFAULT 0 | Monthly base salary in INR |
| rate_1on1_per_hour | integer | DEFAULT 0 | Per-hour rate for 1-on-1 sessions |
| rate_overtime_per_hour | integer | DEFAULT 0 | Per-hour overtime rate |
| paid_holidays_per_month | integer | DEFAULT 0 | Number of paid holidays |
| hours_logged | integer | DEFAULT 0 | Monthly hours logged (TOTS Tennis only) |
| hourly_rate | integer | DEFAULT 0 | INR per hour (TOTS Tennis only) |
| join_date | date | | |
| photo_url | text | | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 2. batches
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| name | text | NOT NULL | e.g. 'Advanced Tournament' |
| coach_id | uuid | FK → coaches.id | Legacy single-coach reference |
| entity | entity_type | NOT NULL | 'the-club', 'tots-tennis' |
| level | student_level | NOT NULL | beginner, intermediate, advanced, all |
| schedule_text | text | | Human-readable schedule |
| capacity | integer | NOT NULL | Max students |
| location | text | | Court 1, Court 2, Gym |
| age_group | text | | U-10, U-14, U-16, etc. |
| status | batch_status | NOT NULL, DEFAULT 'active' | active, inactive |
| program | text | | e.g. RED, GREEN, YELLOW, ADULT, FITNESS, WEEKEND |
| day_pattern | text | | e.g. TTS, MWF, SAT_SUN |
| court_id | text | | FK to courts.id (text reference) |
| ball_level | text | | Red, Green, Orange, Yellow |
| primary_coach_id | uuid | FK → coaches.id | Primary coach for batch |
| support_coach_id | uuid | FK → coaches.id | Support coach for batch |
| start_time | time | | Batch start time |
| end_time | time | | Batch end time |
| is_semi_batch | boolean | DEFAULT FALSE | Whether this is a semi-batch |
| semi_batch_group | text | | Group ID for semi-batches (e.g. 'wk_230') |
| court_change_at | text | | When to change court |
| court_change_to | text | | New court ID |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 3. students
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| name | text | NOT NULL | |
| age | integer | | |
| age_group | text | | U-10, U-12, U-14, U-16, U-18 |
| level | student_level | NOT NULL | beginner, intermediate, advanced |
| batch_id | uuid | FK → batches.id | Current batch |
| coach_id | uuid | FK → coaches.id | Assigned coach |
| entity | entity_type | NOT NULL | 'the-club', 'tots-tennis' |
| status | student_status | NOT NULL, DEFAULT 'active' | active, injured, inactive, completed |
| join_date | date | | |
| photo_url | text | | Supabase Storage URL |
| document_url | text | | Aadhar/registration doc |
| guardian_name | text | | Parent/guardian name |
| guardian_phone | text | | Parent/guardian phone |
| guardian_email | text | | Parent/guardian email |
| guardian_relationship | text | | e.g. Father, Mother, Guardian |
| alternate_phone | text | | Alternate contact number |
| membership_type | text | | e.g. Standard, Premium |
| remarks | text | | General remarks |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 4. parents
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| name | text | NOT NULL | |
| phone | text | NOT NULL | Primary contact phone |
| email | text | | |
| entity | entity_type | NOT NULL | 'the-club', 'tots-tennis' |
| account_status | account_status | NOT NULL, DEFAULT 'active' | active, inactive |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 5. student_parents (junction)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| student_id | uuid | PK, FK → students.id ON DELETE CASCADE | |
| parent_id | uuid | PK, FK → parents.id ON DELETE CASCADE | |

### 6. packages
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id ON DELETE CASCADE | |
| plan_type | package_plan | NOT NULL | Monthly, Quarterly, 4-Week |
| amount | integer | NOT NULL | In INR |
| start_date | date | NOT NULL | |
| expiry_date | date | NOT NULL | |
| status | package_status | NOT NULL, DEFAULT 'active' | active, expired, cancelled, lapsed |
| payment_status | payment_status | NOT NULL, DEFAULT 'pending' | paid, pending, overdue |
| reminder_stage | reminder_stage | | d_minus_7, d_minus_3, d_minus_1, expiry_day, d_plus_1, d_plus_7, d_minus_6, d_plus_14, d_plus_21, d_plus_28, d_minus_10, dormant |
| last_reminder_at | timestamptz | | |
| overdue_days | integer | NOT NULL, DEFAULT 0 | UC-4: days past expiry |
| sessions_consumed | integer | DEFAULT 0 | UC-3: sessions consumed |
| remaining_balance | integer | DEFAULT 0 | UC-3: remaining balance |
| total_sessions | integer | DEFAULT 0 | UC-3: total sessions |
| program | text | | Billing program |
| amount_received | integer | | Actual amount received |
| balance_amount | integer | | Remaining balance |
| payment_url | text | | Payment link URL |
| payment_mode | text | | e.g. online, cash, UPI |
| payment_date | date | | Date of payment |
| transaction_ref | text | | Transaction reference |
| next_payment_due | date | | Next due date |
| base_amount | integer | | Base amount before tax |
| tax_amount | integer | | GST amount |
| gst_rate | numeric | | GST rate |
| tax_inclusive | boolean | DEFAULT FALSE | Tax inclusive flag |
| package_duration | text | | Duration label |
| discount | integer | DEFAULT 0 | Discount amount |
| discount_reason | text | | Reason for discount |
| sessions_used | integer | DEFAULT 0 | Sessions used |
| sessions_purchased | integer | DEFAULT 0 | Sessions purchased |
| makeup_credit | integer | DEFAULT 0 | Makeup session credits |
| extension_days | integer | DEFAULT 0 | Extension days |
| valid_to | date | | Valid until date |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 7. schedule
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| type | schedule_type | NOT NULL | group, one_on_one, cancelled |
| batch_id | uuid | FK → batches.id | NULL for 1-on-1 |
| student_id | uuid | FK → students.id | NULL for group |
| coach_id | uuid | FK → coaches.id | |
| entity | entity_type | NOT NULL | 'the-club', 'tots-tennis' |
| day | text | NOT NULL | Mon, Tue, Wed, Thu, Fri, Sat, Sun |
| start_time | time | NOT NULL | |
| end_time | time | NOT NULL | |
| session_period | text | | The Club only: half_day, full_day |
| location | text | | Court 1, Court 2, Gym |
| status | text | NOT NULL, DEFAULT 'confirmed' | confirmed, cancelled, cancelled_charged |
| confirmation | confirmation_status | | confirmed_yes, sent_no_reply, declined_no, not_sent, no_response |
| cancelled_reason | text | | |
| cancelled_type | text | | advance, same_day |
| student_name | text | | Denormalized student name for display |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 8. attendance
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id ON DELETE CASCADE | |
| batch_id | uuid | FK → batches.id | NULL allowed for trial/out-of-schedule entries |
| coach_id | uuid | FK → coaches.id | |
| date | date | NOT NULL | |
| status | attendance_status | NOT NULL | present, absent, late |
| session_period | text | | The Club only: half_day, full_day |
| check_in | time | | |
| check_out | time | | |
| marked_by | text | DEFAULT 'coach' | coach, admin |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

UNIQUE(student_id, batch_id, date)

### 9. coach_attendance
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| coach_id | uuid | FK → coaches.id ON DELETE CASCADE | |
| date | date | NOT NULL | |
| status | coach_attendance_status | NOT NULL | present, absent, late, leave |
| sessions_count | integer | DEFAULT 0 | |
| session_period | text | | The Club only: half_day, full_day |
| approval_status | text | DEFAULT 'pending' | pending, approved |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

UNIQUE(coach_id, date)

### 10. payments
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id | |
| parent_id | uuid | FK → parents.id | |
| entity | entity_type | NOT NULL | 'the-club', 'tots-tennis' |
| amount | integer | NOT NULL | In INR |
| date | date | NOT NULL | |
| gateway | payment_gateway | NOT NULL | stripe, cc_avenue, excel_reported |
| type | package_plan | NOT NULL | Monthly, Quarterly, 4-Week |
| status | payment_status | NOT NULL, DEFAULT 'pending' | paid, pending, overdue |
| invoice_id | text | | |
| stripe_payment_intent_id | text | | NULL if not Stripe |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 11. reconciliation
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id | |
| entity | entity_type | NOT NULL | 'the-club', 'tots-tennis' |
| excel_amount | integer | NOT NULL | |
| system_amount | integer | NOT NULL, DEFAULT 0 | |
| difference | integer | | Computed by app layer, not DB generated |
| gateway | payment_gateway | | stripe, cc_avenue, excel_reported |
| status | reconciliation_status | NOT NULL, DEFAULT 'new' | matched, mismatch, new |
| date | date | NOT NULL | |
| note | text | | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 12. reminders
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id ON DELETE CASCADE | |
| package_id | uuid | FK → packages.id ON DELETE CASCADE | |
| channel | reminder_channel | NOT NULL | email, sms, whatsapp |
| stage | reminder_stage | NOT NULL | d_minus_7, d_minus_3, d_minus_1, expiry_day, d_plus_1, d_plus_7, d_minus_6, d_plus_14, d_plus_21, d_plus_28, d_minus_10, dormant |
| status | reminder_status | NOT NULL, DEFAULT 'pending' | pending, sent, failed |
| sent_at | timestamptz | | |
| message_body | text | | |
| created_at | timestamptz | DEFAULT now() | |

### 13. workflow_state
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| workflow_key | text | NOT NULL | wf_d, wf_e, wf_f, wf_g, wf_h, wf_i, wf_j, wf_k, wf_l |
| entity_key | text | | student_id, package_id, etc. |
| entity_value | text | | UUID of the entity |
| state_json | jsonb | NOT NULL, DEFAULT '{}' | Arbitrary state blob |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

UNIQUE(workflow_key, entity_key, entity_value)

### 14. leave_requests
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| coach_id | uuid | FK → coaches.id ON DELETE CASCADE | |
| type | leave_type | NOT NULL | casual, sick |
| start_date | date | NOT NULL | |
| end_date | date | NOT NULL | |
| reason | text | | |
| status | leave_request_status | NOT NULL, DEFAULT 'pending' | pending, approved, rejected |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 15. progress
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id ON DELETE CASCADE | |
| category | progress_category | NOT NULL | forehand, backhand, serve, fitness, footwork, match_play |
| rating | integer | CHECK (rating >= 1 AND rating <= 5) | 1-5 stars |
| note | text | | |
| date | date | NOT NULL | |
| created_at | timestamptz | DEFAULT now() | |

### 16. communications_log
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id | NULL if parent-only comm |
| parent_id | uuid | FK → parents.id | |
| type | comm_type | NOT NULL | welcome, reminder, confirmation, progress_report, certificate, invoice, absence_alert, payroll, payment_confirmation, payment_reminder, slot_report |
| channel | comm_channel | NOT NULL | email, sms, whatsapp |
| status | comm_status | NOT NULL, DEFAULT 'pending' | pending, sent, delivered, failed |
| date | date | NOT NULL | |
| file_link | text | | Supabase Storage URL |
| created_at | timestamptz | DEFAULT now() | |

### 17. platform_settings
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| key | text | PK | e.g. 'absence_alert_delay_hours' |
| value | text | NOT NULL | Configurable setting value |
| updated_at | timestamptz | DEFAULT now() | |

### 18. certificates
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id | |
| package_id | uuid | FK → packages.id | |
| file_path | text | NOT NULL | Supabase Storage path |
| generated_at | timestamptz | | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 19. enrollments
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id | |
| batch_id | uuid | FK → batches.id | |
| billing_program | text | | e.g. JDP, MWP |
| status | text | NOT NULL | ACTIVE, INACTIVE, etc. |
| start_date | date | | |
| end_date | date | | End date of enrollment |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 20. courts
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | text | PK | e.g. 'court_2', 'court_3' |
| name | text | NOT NULL | e.g. 'Court 2' |
| entity | entity_type | | Business entity |
| status | text | DEFAULT 'active' | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 21. report_verifications
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| key | text | PK | Unique report key |
| month | integer | NOT NULL | |
| year | integer | NOT NULL | |
| locked | boolean | DEFAULT FALSE | |
| verified_by | text | | |
| verified_at | timestamptz | | |
| invalidated_at | timestamptz | | |
| invalidated_reason | text | | |
| created_at | timestamptz | DEFAULT now() | |

## Custom Types / Enums

| Enum | Values |
|------|--------|
| entity_type | the-club, tots-tennis (unused: todds-tennis) |
| student_status | active, injured, inactive, completed |
| student_level | beginner, intermediate, advanced, all |
| batch_status | active, inactive |
| coach_status | active, on_leave, inactive |
| package_status | active, expired, cancelled, lapsed |
| payment_status | paid, pending, overdue |
| payment_gateway | stripe, cc_avenue, excel_reported |
| package_plan | Monthly, Quarterly, 4-Week |
| schedule_type | group, one_on_one, cancelled |
| confirmation_status | confirmed_yes, sent_no_reply, declined_no, not_sent, no_response |
| attendance_status | present, absent, late |
| coach_attendance_status | present, absent, late, leave |
| reminder_stage | d_minus_7, d_minus_3, d_minus_1, expiry_day, d_plus_1, d_plus_7, d_minus_6, d_plus_14, d_plus_21, d_plus_28, d_minus_10, dormant |
| reminder_channel | email, sms, whatsapp |
| reminder_status | pending, sent, failed |
| leave_type | casual, sick |
| leave_request_status | pending, approved, rejected |
| comm_type | welcome, reminder, confirmation, progress_report, certificate, invoice, absence_alert, payroll, payment_confirmation, payment_reminder, slot_report |
| comm_channel | email, sms, whatsapp |
| comm_status | pending, sent, delivered, failed |
| progress_category | forehand, backhand, serve, fitness, footwork, match_play |
| reconciliation_status | matched, mismatch, new |
| account_status | active, inactive |
| session_period | text column (not an enum) | half_day, full_day |
| approval_status | text column (not an enum) | pending, approved |
| marked_by | text column (not an enum) | coach, admin |
| duty_type | FULL_TIME, EVENING_ONLY, MORNING_ONLY, PART_TIME |

## Indexes

```sql
-- Performance indexes for common workflow queries
CREATE INDEX idx_students_entity ON students(entity);
CREATE INDEX idx_students_coach_id ON students(coach_id);
CREATE INDEX idx_students_batch_id ON students(batch_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_packages_expiry_date ON packages(expiry_date);
CREATE INDEX idx_packages_student_id ON packages(student_id);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_payment_status ON packages(payment_status);
CREATE INDEX idx_packages_overdue_days ON packages(overdue_days);
CREATE INDEX idx_packages_program ON packages(program);
CREATE INDEX idx_packages_valid_to ON packages(valid_to);
CREATE INDEX idx_packages_payment_mode ON packages(payment_mode);
CREATE INDEX idx_schedule_day ON schedule(day);
CREATE INDEX idx_schedule_coach_id ON schedule(coach_id);
CREATE INDEX idx_schedule_type ON schedule(type);
CREATE INDEX idx_schedule_entity ON schedule(entity);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_batch_id ON attendance(batch_id);
CREATE INDEX idx_attendance_session_period ON attendance(session_period);
CREATE INDEX idx_coach_attendance_date ON coach_attendance(date);
CREATE INDEX idx_coach_attendance_coach_id ON coach_attendance(coach_id);
CREATE INDEX idx_coach_attendance_session_period ON coach_attendance(session_period);
CREATE INDEX idx_coach_attendance_approval_status ON coach_attendance(approval_status);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_entity ON payments(entity);
CREATE INDEX idx_payments_gateway ON payments(gateway);
CREATE INDEX idx_reminders_package_id ON reminders(package_id);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminders_stage ON reminders(stage);
CREATE INDEX idx_workflow_state_lookup ON workflow_state(workflow_key, entity_key, entity_value);
CREATE INDEX idx_leave_requests_coach_id ON leave_requests(coach_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_progress_student_id ON progress(student_id);
CREATE INDEX idx_comm_log_student_id ON communications_log(student_id);
CREATE INDEX idx_comm_log_parent_id ON communications_log(parent_id);
CREATE INDEX idx_reconciliation_status ON reconciliation(status);
CREATE INDEX idx_reconciliation_date ON reconciliation(date);
CREATE INDEX idx_coaches_entity ON coaches(entity);
CREATE INDEX idx_coaches_duty_type ON coaches(duty_type);
CREATE INDEX idx_batches_entity ON batches(entity);
CREATE INDEX idx_batches_court_id ON batches(court_id);
CREATE INDEX idx_batches_program ON batches(program);
CREATE INDEX idx_batches_primary_coach_id ON batches(primary_coach_id);
CREATE INDEX idx_batches_support_coach_id ON batches(support_coach_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_batch_id ON enrollments(batch_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_courts_entity ON courts(entity);
```

## RLS Policies

All tables are owned by the service_role for workflow access. Client-facing access (React app) uses RLS-gated policies:

- **Admin**: Full CRUD on all tables (checked via `auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'`)
- **Coach**: See own data — schedule, attendance, coach_attendance, leave_requests, students
- **Parent**: See own children's data via `student_parents` junction — students, packages, attendance, schedule, payments, progress
- **Service Role Only**: workflow_state, reminders (no anon key access)
- **Public Read**: All tables have public SELECT policies for anon-key frontend dashboards

### Per-Table RLS Summary

| Table | Admin | Coach | Parent | Public Read | Service Role Only |
|-------|-------|-------|--------|-------------|-------------------|
| coaches | ALL | SELECT (own) | — | SELECT | — |
| batches | ALL | — | — | SELECT | — |
| students | ALL | SELECT (own) | SELECT (own children) | SELECT | — |
| parents | ALL | — | — | SELECT | — |
| student_parents | ALL | — | SELECT (own) | SELECT | — |
| packages | ALL | — | SELECT (own children) | SELECT | — |
| schedule | ALL | SELECT (own) | SELECT (own children + group) | SELECT | — |
| attendance | ALL | SELECT (own) + UPDATE (own) | SELECT (own children) | SELECT | — |
| coach_attendance | ALL | SELECT (own) | — | SELECT | — |
| payments | ALL | — | SELECT (own) | SELECT | — |
| reconciliation | ALL | — | — | SELECT | — |
| reminders | — | — | — | SELECT | ALL (service role) |
| workflow_state | — | — | — | — | ALL (service role) |
| leave_requests | ALL | SELECT (own) | — | SELECT | — |
| progress | ALL | — | SELECT (own children) | SELECT | — |
| communications_log | ALL | — | — | SELECT | — |
| certificates | ALL | SELECT (own students) | SELECT (own children) | SELECT | — |
| courts | ALL | — | — | SELECT | — |
| enrollments | ALL | — | — | SELECT | — |
| report_verifications | ALL | — | — | SELECT | — |

## Auth

Supabase Auth with email/password. Three roles: admin, coach, parent. Role stored in `auth.users.raw_user_meta_data.role`.

## File Storage

Supabase Storage bucket `academy-assets` with two folders:
- `student-photos/` — Student profile photos
- `student-documents/` — Registration/Aadhar documents
- `certificates/` — Generated certificate PDFs

RLS: Private bucket, signed URLs via Edge Function.