-- ============================================================================
-- Arnav Jain Tennis Academy -- UC-4 reminder_stage Enum Update
-- Supabase Postgres Migration 005
-- Run via: Supabase SQL Editor
-- ============================================================================

-- Add the 4 new enum values required by the UC-4 Renewal & Reminder Engine.
-- d_plus_7 already exists in the enum, so only these 4 need adding.
-- Old values (d_minus_7, d_minus_3, d_minus_1, expiry_day, d_plus_1)
-- remain for backward compatibility but are not used by UC-4.

ALTER TYPE reminder_stage ADD VALUE IF NOT EXISTS 'd_minus_6';
ALTER TYPE reminder_stage ADD VALUE IF NOT EXISTS 'd_plus_14';
ALTER TYPE reminder_stage ADD VALUE IF NOT EXISTS 'd_plus_21';
ALTER TYPE reminder_stage ADD VALUE IF NOT EXISTS 'd_plus_28';