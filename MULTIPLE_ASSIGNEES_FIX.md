# Multiple Assignees Database Storage Fix

## Issue
Multiple assignees were not being stored in the `work_item_assignees` table when editing work items.

## Root Cause
The `updateWorkItem()` function in the API was missing logic to handle the `assignees`/`multipleAssignees` field when updating work items. While the feature worked during work item **creation**, it was not functional during work item **updates/edits**.

## Changes Made

### 1. Backend API Fix ([api/work-items.php](api/work-items.php))

#### Added Multiple Assignees Handling in `updateWorkItem()` Function
- Added logic to process `assignees` or `multipleAssignees` field after work item update
- Supports both field names for backward compatibility
- Deletes existing assignees and inserts new ones (replace strategy)
- Only processes for EPIC and FEATURE work item types
- Added comprehensive error logging

**Code Location:** Lines ~1230-1270

```php
// Handle multiple assignees for Epic and Feature types
// Support both 'assignees' and 'multipleAssignees' field names
$assignees = isset($data['assignees']) ? $data['assignees'] : (isset($data['multipleAssignees']) ? $data['multipleAssignees'] : null);

if ($result && $assignees !== null && is_array($assignees)) {
    // Get work item type from database (current type)
    $typeStmt = $conn->prepare("SELECT type FROM work_items WHERE id = ?");
    $typeStmt->execute([$id]);
    $workItemType = $typeStmt->fetchColumn();
    
    // Only process assignees for EPIC and FEATURE types
    if (in_array($workItemType, ['EPIC', 'FEATURE'])) {
        // Delete existing assignees
        // Insert new assignees with role and assigned_by tracking
    }
}
```

#### Enhanced `getWorkItem()` Function
- Added call to `enrichWorkItemsWithAssignees()` to fetch assignees when retrieving a single work item
- Ensures frontend receives complete assignee data including roles

**Code Location:** Lines ~535-540

```php
// Enrich with multiple assignees for Epic and Feature types
$workItems = enrichWorkItemsWithAssignees($conn, [$workItem]);
$workItem = $workItems[0];
```

### 2. Database Schema Fix

#### Created Migration File: [database/fix_work_item_assignees_table.sql](database/fix_work_item_assignees_table.sql)
- Ensures the `role` column exists in the `work_item_assignees` table
- Adds missing indexes for performance
- Provides MySQL-compatible syntax with fallback options

**Required Columns in `work_item_assignees` Table:**
```sql
- id (PRIMARY KEY)
- work_item_id (INTEGER, NOT NULL, FOREIGN KEY)
- user_id (INTEGER, NOT NULL, FOREIGN KEY)
- role (VARCHAR(50), DEFAULT 'ASSIGNEE', NOT NULL) -- OWNER, ASSIGNEE, COLLABORATOR
- assigned_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- assigned_by (INTEGER, FOREIGN KEY to users.id)
```

## How It Works Now

### Creating Work Items with Multiple Assignees
1. Frontend sends `multipleAssignees` array with work item data
2. Backend inserts work item into `work_items` table
3. Backend iterates through assignees and inserts each into `work_item_assignees` table
4. Returns created work item with assignees

### Updating Work Items with Multiple Assignees
1. Frontend sends `assignees` array with work item update data
2. Backend updates work item fields in `work_items` table
3. **NEW:** Backend checks if assignees field is present
4. **NEW:** Backend deletes all existing assignees for this work item
5. **NEW:** Backend inserts new assignees into `work_item_assignees` table
6. Returns updated work item with enriched assignees

### Retrieving Work Items with Multiple Assignees
1. Backend fetches work item(s) from `work_items` table
2. Backend calls `enrichWorkItemsWithAssignees()` function
3. Function fetches all assignees from `work_item_assignees` table
4. Function joins with `users` table to get user details
5. Returns work items with nested `assignees` array

## Testing Steps

1. **Verify Database Schema:**
   ```sql
   -- Run the migration
   SOURCE database/fix_work_item_assignees_table.sql;
   
   -- Verify table structure
   DESCRIBE work_item_assignees;
   ```

2. **Test Creating Epic/Feature with Multiple Assignees:**
   - Create a new EPIC or FEATURE work item
   - Add multiple assignees with different roles
   - Save and verify in database

3. **Test Updating Epic/Feature Assignees:**
   - Edit an existing EPIC or FEATURE work item
   - Change assignees (add, remove, or modify roles)
   - Save and verify in database
   - Check error logs for confirmation

4. **Verify Database Records:**
   ```sql
   -- Check assignees for a specific work item
   SELECT wi.id, wi.title, wa.user_id, u.full_name, wa.role, wa.assigned_at
   FROM work_items wi
   JOIN work_item_assignees wa ON wi.id = wa.work_item_id
   JOIN users u ON wa.user_id = u.id
   WHERE wi.type IN ('EPIC', 'FEATURE')
   ORDER BY wi.id, wa.assigned_at;
   ```

## Error Logging

The fix includes comprehensive error logging. Check your PHP error logs for:
- `"Processing multiple assignees update for..."`
- `"Deleted existing assignees for work item..."`
- `"Added assignee:..."`
- `"Error deleting existing assignees:..."`
- `"Error adding assignee:..."`

## Frontend Compatibility

The backend now accepts both field names:
- `assignees` (used by edit modal)
- `multipleAssignees` (used by create modal)

This ensures backward compatibility with existing frontend code.

## Database Relationship

```
work_items (1) ----< (N) work_item_assignees (N) >---- (1) users
                          |
                          |---< assigned_by references users(id)
```

Each work item can have multiple assignees, and each assignee has:
- A role (OWNER, ASSIGNEE, COLLABORATOR)
- Timestamp when assigned
- User who assigned them

## Important Notes

1. **EPIC and FEATURE Only:** Multiple assignees only work for EPIC and FEATURE work item types
2. **Replace Strategy:** When updating assignees, all existing assignees are deleted and replaced with new ones
3. **Transaction Safety:** The code continues processing other assignees if one fails
4. **Session Required:** The user must be logged in (`$_SESSION['user_id']` must be set)

## Next Steps

If issues persist:
1. Check PHP error logs for detailed error messages
2. Verify database table structure matches expected schema
3. Check browser console for frontend errors
4. Verify API request payload includes `assignees` field
5. Test with browser dev tools network tab to see actual request/response
