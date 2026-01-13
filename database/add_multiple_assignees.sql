-- Migration: Add multiple assignees support for Epic and Feature work items
-- Date: 2026-01-12
-- Description: Enables professional collaborative assignment where Scrum Masters and Developers can both be assigned to the same Epic/Feature

-- Create work item assignees junction table
CREATE TABLE work_item_assignees (
    id SERIAL PRIMARY KEY,
    work_item_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'ASSIGNEE', -- ASSIGNEE, OWNER, COLLABORATOR
    assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
    assigned_by INTEGER,
    
    -- Foreign key constraints`
    CONSTRAINT fk_work_item_assignees_work_item 
        FOREIGN KEY (work_item_id) REFERENCES work_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_item_assignees_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_item_assignees_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Ensure unique work_item + user combination
    CONSTRAINT uk_work_item_assignees_unique UNIQUE (work_item_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_work_item_assignees_work_item ON work_item_assignees(work_item_id);
CREATE INDEX idx_work_item_assignees_user ON work_item_assignees(user_id);
CREATE INDEX idx_work_item_assignees_role ON work_item_assignees(role);

-- Migrate existing single assignee data to multiple assignees table
-- Only for Epic and Feature items that have an assignee
INSERT INTO work_item_assignees (work_item_id, user_id, role, assigned_by)
SELECT 
    id as work_item_id,
    assignee_id as user_id,
    'OWNER' as role,
    reporter_id as assigned_by
FROM work_items 
WHERE assignee_id IS NOT NULL 
  AND type IN ('EPIC', 'FEATURE');

-- Add comments for documentation
COMMENT ON TABLE work_item_assignees IS 'Multiple assignees for work items, primarily used for Epic and Feature collaboration';
COMMENT ON COLUMN work_item_assignees.role IS 'Assignment role: OWNER (primary responsible), ASSIGNEE (contributor), COLLABORATOR (involved)';
COMMENT ON COLUMN work_item_assignees.assigned_at IS 'When the user was assigned to this work item';
COMMENT ON COLUMN work_item_assignees.assigned_by IS 'Who assigned this user to the work item';