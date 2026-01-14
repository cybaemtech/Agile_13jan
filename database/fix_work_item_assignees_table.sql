-- Fix work_item_assignees table to add missing role column if needed
-- Date: 2026-01-14
-- Description: Ensures the role column exists in work_item_assignees table

-- Check if role column exists, if not add it
-- MySQL doesn't support IF NOT EXISTS for columns, so we use a different approach

-- For MySQL, you can run this to check and add the column:
ALTER TABLE work_item_assignees 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'ASSIGNEE' NOT NULL 
AFTER user_id;

-- If the above doesn't work in your MySQL version, use this approach:
-- First check if column exists:
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'work_item_assignees' AND COLUMN_NAME = 'role';

-- If column doesn't exist, run this:
-- ALTER TABLE work_item_assignees 
-- ADD COLUMN role VARCHAR(50) DEFAULT 'ASSIGNEE' NOT NULL AFTER user_id;

-- Add comment
ALTER TABLE work_item_assignees MODIFY COLUMN role VARCHAR(50) DEFAULT 'ASSIGNEE' NOT NULL 
COMMENT 'Assignment role: OWNER (primary responsible), ASSIGNEE (contributor), COLLABORATOR (involved)';

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_work_item_assignees_work_item ON work_item_assignees(work_item_id);
CREATE INDEX IF NOT EXISTS idx_work_item_assignees_user ON work_item_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_work_item_assignees_role ON work_item_assignees(role);
