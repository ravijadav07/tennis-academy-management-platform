-- ============================================================================
-- Arnav Jain Tennis Academy — UC-4 Renewal & Reminder Engine Schema Extension
-- Supabase Postgres Migration 003
-- Run via: Supabase SQL Editor or `supabase db push`
-- ============================================================================

-- 1. Add LAPSED to package_status enum
ALTER TYPE package_status ADD VALUE IF NOT EXISTS 'lapsed';

-- 2. Add overdue_days column to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS overdue_days INTEGER NOT NULL DEFAULT 0;

-- 3. Add index for overdue packages queries
CREATE INDEX IF NOT EXISTS idx_packages_overdue_days ON packages(overdue_days);

-- 4. Add reminder_channel values: the whatsapp value stays for backward compat;
--    no change needed since 'email' already exists and is now the primary channel.
