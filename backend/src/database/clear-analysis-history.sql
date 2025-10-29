-- Clear Analysis History (Privacy Fix)
-- Run this AFTER user-management-migration.sql

-- This will delete ALL existing analysis history to ensure privacy
-- Each user will only see their own scans going forward

-- Backup first (optional - uncomment if you want to keep a backup)
-- CREATE TABLE analysis_history_backup AS SELECT * FROM analysis_history;

-- Clear all analysis history
TRUNCATE TABLE analysis_history CASCADE;

-- Verify it's empty
SELECT COUNT(*) as remaining_records FROM analysis_history;
-- Should return 0

-- Note: Going forward, analysis history will be filtered by user_id
-- in the backend API endpoints

