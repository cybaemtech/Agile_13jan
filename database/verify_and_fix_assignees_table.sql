-- Quick Fix: Ensure work_item_assignees table has all required columns
-- Run this if you're experiencing issues with multiple assignees not being stored

-- Step 1: Check if table exists
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'work_item_assignees';

-- Step 2: If table doesn't exist, create it with all required columns
CREATE TABLE IF NOT EXISTS work_item_assignees (
    id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    work_item_id INT(11) NOT NULL,
    user_id INT(11) NOT NULL,
    role VARCHAR(50) DEFAULT 'ASSIGNEE' NOT NULL,
    assigned_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP(),
    assigned_by INT(11) DEFAULT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_work_item_assignees_work_item 
        FOREIGN KEY (work_item_id) REFERENCES work_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_item_assignees_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_item_assignees_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Ensure unique work_item + user combination
    CONSTRAINT uk_work_item_assignees_unique UNIQUE (work_item_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_item_assignees_work_item ON work_item_assignees(work_item_id);
CREATE INDEX IF NOT EXISTS idx_work_item_assignees_user ON work_item_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_work_item_assignees_role ON work_item_assignees(role);

-- Step 4: If table exists but role column is missing, add it
-- Note: This will fail if column already exists, which is fine
ALTER TABLE work_item_assignees 
ADD COLUMN role VARCHAR(50) DEFAULT 'ASSIGNEE' NOT NULL AFTER user_id;

-- Step 5: Verify the table structure
DESCRIBE work_item_assignees;

-- Step 6: Check existing data
SELECT COUNT(*) as total_assignees FROM work_item_assignees;

-- Step 7: Check assignees by work item type
SELECT 
    wi.type,
    COUNT(DISTINCT wa.work_item_id) as work_items_with_assignees,
    COUNT(*) as total_assignees
FROM work_item_assignees wa
JOIN work_items wi ON wa.work_item_id = wi.id
GROUP BY wi.type;
