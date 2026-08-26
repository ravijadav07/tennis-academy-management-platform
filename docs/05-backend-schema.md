# Backend Schema -- Arnav Jain Tennis Academy

## Mode: GREENFIELD (fresh Postgres on Supabase)

Data is owned fresh in Supabase Postgres. No external Tally/ERP wrapper. Workflows read/write directly via `@puchoaistudio/tool-supabase` (service_role key).

## Entity-Relationship Diagram

```
coaches ──1:N──> batches
coaches ──1:N──> schedule
coaches ──1:N──> attendance (student)
coaches ──1:N──> coach_attendance
coaches ──1:N──> leave_requests

batches ──1:N──> students
batches ──1:N──> schedule

students ──1:N──> packages
students ──1:N──> attendance
students ──1:N──> payments
students ──1:N──> reminders
students ──1:N──> progress
students ──1:N──> communications_log
students ──1:N──> schedule (1-on-1)
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
| entity | text | NOT NULL, CHECK IN ('the-club','tots-tennis') | Business entity |
| status | text | NOT NULL, DEFAULT 'active' | active, on_leave, inactive |
| payroll_rate | integer | NOT NULL, DEFAULT 0 | Monthly base in INR (The Club) |
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
| coach_id | uuid | FK → coaches.id | |
| entity | text | NOT NULL, CHECK IN ('the-club','tots-tennis') | |
| level | text | NOT NULL | beginner, intermediate, advanced, all |
| schedule_text | text | | Human-readable schedule |
| capacity | integer | NOT NULL | Max students |
| location | text | | Court 1, Court 2, Gym |
| age_group | text | | U-10, U-14, U-16, etc. |
| status | text | NOT NULL, DEFAULT 'active' | active, inactive |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 3. students
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| name | text | NOT NULL | |
| age | integer | | |
| age_group | text | | U-10, U-12, U-14, U-16, U-18 |
| level | text | NOT NULL | beginner, intermediate, advanced |
| batch_id | uuid | FK → batches.id | Current batch |
| coach_id | uuid | FK → coaches.id | Assigned coach |
| entity | text | NOT NULL, CHECK IN ('the-club','tots-tennis') | |
| status | text | NOT NULL, DEFAULT 'active' | active, injured, inactive, completed |
| join_date | date | | |
| photo_url | text | | Supabase Storage URL |
| document_url | text | | Aadhar/registration doc |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 4. parents
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| name | text | NOT NULL | |
| phone | text | NOT NULL | Primary contact phone |
| email | text | | |
| entity | text | NOT NULL, CHECK IN ('the-club','tots-tennis') | |
| account_status | text | NOT NULL, DEFAULT 'active' | active, inactive |
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
| plan_type | text | NOT NULL | Monthly, Quarterly, 4-Week |
| amount | integer | NOT NULL | In INR |
| start_date | date | NOT NULL | |
| expiry_date | date | NOT NULL | |
| status | text | NOT NULL, DEFAULT 'active' | active, expired, cancelled |
| payment_status | text | NOT NULL, DEFAULT 'pending' | paid, pending, overdue |
| reminder_stage | text | | d_minus_7, d_minus_3, d_minus_1, d_plus_1, stopped |
| last_reminder_at | timestamptz | | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 7. schedule
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| type | text | NOT NULL | group, one_on_one, cancelled |
| batch_id | uuid | FK → batches.id | NULL for 1-on-1 |
| student_id | uuid | FK → students.id | NULL for group |
| coach_id | uuid | FK → coaches.id | |
| entity | text | NOT NULL, CHECK IN ('the-club','tots-tennis') | |
| day | text | NOT NULL | Mon, Tue, Wed, Thu, Fri, Sat, Sun |
| start_time | time | NOT NULL | |
| end_time | time | NOT NULL | |
| session_period | text | CHECK IN ('half_day','full_day') | The Club only: computed from morning/evening slot |
| location | text | | Court 1, Court 2, Gym |
| status | text | NOT NULL, DEFAULT 'confirmed' | confirmed, cancelled, cancelled_charged |
| confirmation | text | | confirmed_yes, sent_no_reply, declined_no, not_sent |
| cancelled_reason | text | | |
| cancelled_type | text | | advance, same_day |
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
| status | text | NOT NULL | present, absent, late |
| session_period | text | CHECK IN ('half_day','full_day') | The Club only: mirrors schedule slot |
| check_in | time | | |
| check_out | time | | |
| marked_by | text | DEFAULT 'coach' | coach, admin — records who entered attendance |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

UNIQUE(student_id, batch_id, date)

### 9. coach_attendance
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| coach_id | uuid | FK → coaches.id ON DELETE CASCADE | |
| date | date | NOT NULL | |
| status | text | NOT NULL | present, absent, late, leave |
| sessions_count | integer | DEFAULT 0 | |
| session_period | text | CHECK IN ('half_day','full_day') | The Club only: segment of day |
| approval_status | text | DEFAULT 'pending', CHECK IN ('pending','approved') | Admin/head coach sign-off for Club payroll |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

UNIQUE(coach_id, date)

### 10. payments
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id | |
| parent_id | uuid | FK → parents.id | |
| entity | text | NOT NULL, CHECK IN ('the-club','tots-tennis') | |
| amount | integer | NOT NULL | In INR |
| date | date | NOT NULL | |
| gateway | text | NOT NULL | stripe, cc_avenue, excel_reported |
| type | text | NOT NULL | Monthly Fee, Quarterly Fee, 4-Week Plan |
| status | text | NOT NULL, DEFAULT 'pending' | paid, pending, overdue |
| invoice_id | text | | |
| stripe_payment_intent_id | text | | NULL if not Stripe |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 11. reconciliation
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id | |
| entity | text | NOT NULL, CHECK IN ('the-club','tots-tennis') | |
| excel_amount | integer | NOT NULL | |
| system_amount | integer | NOT NULL, DEFAULT 0 | |
| difference | integer | GENERATED (excel_amount - system_amount) STORED | |
| gateway | text | | stripe, cc_avenue, excel_reported |
| status | text | NOT NULL, DEFAULT 'new' | matched, mismatch, new |
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
| channel | text | NOT NULL | email, sms, whatsapp |
| stage | text | NOT NULL | d_minus_7, d_minus_3, d_minus_1, expiry_day, d_plus_1, d_plus_7 |
| status | text | NOT NULL, DEFAULT 'pending' | pending, sent, failed |
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
| type | text | NOT NULL | casual, sick |
| start_date | date | NOT NULL | |
| end_date | date | NOT NULL | |
| reason | text | | |
| status | text | NOT NULL, DEFAULT 'pending' | pending, approved, rejected |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 15. progress
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | FK → students.id ON DELETE CASCADE | |
| category | text | NOT NULL | forehand, backhand, serve, fitness, footwork, match_play |
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
| type | text | NOT NULL | welcome, reminder, confirmation, progress_report, certificate, invoice, absence_alert |
| channel | text | NOT NULL | email, sms, whatsapp |
| status | text | NOT NULL, DEFAULT 'pending' | pending, sent, delivered, failed |
| date | date | NOT NULL | |
| file_link | text | | Supabase Storage URL |
| created_at | timestamptz | DEFAULT now() | |

### 17. platform_settings
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| key | text | PK | e.g. 'absence_alert_delay_hours' |
| value | text | NOT NULL | Configurable setting value |
| updated_at | timestamptz | DEFAULT now() | |

## Indexes

```sql
-- Performance indexes for common workflow queries
CREATE INDEX idx_students_entity ON students(entity);
CREATE INDEX idx_students_coach_id ON students(coach_id);
CREATE INDEX idx_students_batch_id ON students(batch_id);
CREATE INDEX idx_packages_expiry_date ON packages(expiry_date);
CREATE INDEX idx_packages_student_id ON packages(student_id);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_schedule_day ON schedule(day);
CREATE INDEX idx_schedule_coach_id ON schedule(coach_id);
CREATE INDEX idx_schedule_type ON schedule(type);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_payments_date ON payments(date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_reminders_package_id ON reminders(package_id);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_workflow_state_lookup ON workflow_state(workflow_key, entity_key, entity_value);
```

## RLS Policies

All tables are owned by the service_role for workflow access. Client-facing access (React app) uses RLS-gated policies:

- `students`: Parents see their own children via `student_parents` junction
- `payments`: Parents see their own payments
- `attendance`: Parents see their children's attendance
- `schedule`: Parents see their children's schedule
- `packages`: Parents see their children's packages
- `progress`: Parents see their children's progress
- Coaches see their own schedule, attendance, students, and leave

## Auth

Supabase Auth with email/password. Three roles: admin, coach, parent. Role stored in `auth.users.raw_user_meta_data.role`.

## File Storage

Supabase Storage bucket `academy-assets` with two folders:
- `student-photos/` - Student profile photos
- `student-documents/` - Registration/Aadhar documents

RLS: Private bucket, signed URLs via Edge Function.