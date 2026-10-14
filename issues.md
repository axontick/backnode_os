# Backnode OS — Master Issues & Task Tracking

## 1. Top Bar & Global Navigation
- [x] Rename the "Create Task" button in the top navigation bar to **"Create"** only.
- [x] In the global "Create" modal, remove the "Target Cycle / Space" field and replace it with a dropdown to select a destination list.
- [x] In the global "Create" modal, move recurring task options into a dedicated section; when enabled, display the configuration panel. For monthly recurrence, allow selecting multiple dates.
- [x] When creating a CRM opportunity from the top "Create" modal, add the missing dropdown for selecting a destination pipeline.
- [x] Remove the Filters button/dropdown from the global top bar.
- [x] Move Import and Export buttons to the top bar with a confirmation modal specifying what to import/export.
- [x] Allow UI dropdown menus to expand wider than their trigger input field whenever content requires it.

## 2. Global Navigation, Sidebar & Account Controls
- [x] Top-left Workspace Switcher: Fix the dropdown so it is not confined strictly within the sidebar boundaries; position it cleanly outside and increase its width.
- [x] User Account Dropdown: Remove "Switch Account / Login". Add a "Profile" button to edit name, profile image, and change password.
- [x] Global UI Cleanup: Remove the "New Task" button from global / Docs sidebar contexts where it does not belong.

## 3. Global Terminology & Simulation Cleanup
- [x] Remove all occurrences of "Instant local commit (0.2ms)", "WAL Encrypted", or similar simulated offline/WAL phrases throughout the application.
- [x] Remove all occurrences of "Local Draft" and other wording implying items are local/temporary drafts.

## 4. Tasks & Task Spaces
### Hierarchy & Storage
- [x] Enforce that no task can exist outside of a list. Deleting a list or folder must cascade-delete all child and related items.
- [x] Fix empty list query bug: navigating to an empty list incorrectly fetches all tasks across all lists instead of displaying an empty list view.
- [x] Add missing standard date fields to tasks: `Date Created`, `Date Start`, etc.
- [x] Opening a list with existing tasks is showing empty.
- [ ] Tasks are not showing in the lists having them and neither does the number of tassk in a list show up in the left sidebar
- [ ] Date Completed is showing "Completed" rather than showing the actual date.
- [ ] If start/end date is set in the task detail panel, the edit modal for the task does not show the start or due date.

### Task List View & Filtering
- [x] In Task List view, move Priority, Group, and Columns controls down to the secondary toolbar alongside other filter fields.
- [ ] In Task List View, the Priority, Group and Columns controls dropdown is showing inside the list bar rather than externally as a dropdown.
- [x] Remove "In Progress" and "Needs Review" filter pills from the secondary toolbar.
- [x] Ensure that filters applied within a task list are strictly scoped to that list's data only.
- [ ] Fix Group and Columns functionality: grouping by status or columns currently does not group or show accurate data, and columns must support custom fields.

### Kanban & Task Inspector
- [x] Fix runtime crash when opening a task from the Kanban board: `Uncaught TypeError: Cannot read properties of undefined (reading 'length') at TaskInspector (TaskInspector.tsx:846:30)`.

## 5. Custom Fields & Dynamic Linked Fields
- [ ] Refactor linked fields (e.g., Linked Contact) as database-defined and code-based fields. Enable full custom rendering (name, avatar, email in dropdowns and selected tags) and toggle availability based on active plugins.
- [ ] Ensure custom fields captured during task import appear in all edit panels and task detail inspectors.
- [ ] Store imported custom fields with their explicit types in Task Space Settings; allow new task records to populate and manage these custom fields.

## 6. Import & Export System
- [ ] Add Import and Export actions to the top navigation bar with a confirmation dialog detailing import/export parameters.
- [ ] Fix Task Space destination during import: currently the target list dropdown is empty. Require selecting a Space, make Folder selection optional, and select a target List.
- [ ] Automatically close the import modal upon successful completion.

## 7. CRM Pipelines & Opportunities
### Pipeline View & Header
- [ ] Remove the "Axontick Sales Pipeline" dropdown and the "New Pipeline" button from inside the pipeline canvas view.

### Pipeline Settings
- [ ] Remove "Deal Fields and Properties" and "Automations & SLA Hooks" sections from CRM Pipeline Settings.
- [ ] Add missing Delete buttons to the Danger Zone in Pipeline Settings.
- [ ] Remove static placeholder metrics from Pipeline Settings ("Active Deals: 42 Contracts", "Pipeline ARR: $4.82M USD", "Lock State: lock_open") and remove the lock state entirely.

### Deals & Opportunities
- [ ] Add an "Edit Deal" action and modal allowing users to edit deal title, price, target close date, and other properties.
- [ ] Fix Deal communication history: remove static placeholder communication history that was never populated.
- [ ] Fix primary stakeholder rendering: display the actual linked contact name instead of fallback/blank.
- [ ] Fix Active Deals filter: deals marked as "Won" must no longer appear under Active Deals.
- [ ] When creating a Linked Task or Deliverable from a deal, open a modal allowing the user to select the destination list.

## 8. Contacts Directory
### Contact Creation & Defaults
- [ ] Remove unwanted default values applied when creating a contact with empty fields (e.g. `$50,000 ARR`, placeholder Account Notes / Relationship Briefs, Health Score, and Phone Number).
- [ ] Fix false link bug: newly created contacts incorrectly show 1 linked opportunity when none was attached.

### Metrics & Inspector
- [ ] Remove comparison/progress bars from "Total Contacts" and "Linked Pipeline ARR" KPI cards (there is no baseline or ceiling to compare against).
- [ ] Remove / refactor the inline Contact Inspector section from the contacts module.
- [ ] When inspecting a contact, display all linked tasks, deals, and docs with direct links to open them.

## 9. Tags System
- [ ] Contact Tag Selector: Update tags selector to a dynamic, searchable dropdown. If a tag is not found, display a "+ Create" button at the bottom of the list.
- [ ] Centralized Tags Page: Build a dedicated Tags management page showing all tags, their color chips, usage counts, and linked entity types (Tasks, Deals, Contacts, Docs), with the ability to edit names and colors.

## 10. Documents & Knowledge Base
### Creation & Access Control
- [ ] In the document creation modal, add a dynamic tag selector with search and inline tag creation.
- [ ] Add Department selection when creating a document.
- [ ] Add custom access controls to documents (select specific user access or restrict visibility to specific roles).

### Editor & Versioning
- [ ] Replace auto-save with explicit "Save" and "Discard" actions.
- [ ] Add document versioning with the ability to view version history and restore an older version as current.

### Sidebar Navigation
- [ ] In the Docs left sidebar, display item counts (number of nested folders and documents) beside each folder.

## 11. Workspace Settings, Roles & Administration
### Workspace & Department Settings
- [ ] Remove the workspace domain slug field from Workspace Settings.
- [ ] Fix vertical scroll cutoff in Workspace Settings -> Departments tab (departments at the bottom cannot be scrolled into view).
- [ ] Remove the "Security Clearance" card from the Departments tab.

### Roles & Access Control
- [ ] Update Roles & Permissions to prevent users from modifying their own role or permissions unless they are Workspace Owner or Admin.
- [ ] Enforce Workspace Owner immutability: the Workspace Owner role cannot be assigned to any user; it belongs exclusively to the workspace creator.

### Data Consistency
- [ ] Fix department operator count mismatch: workspace owner is assigned to Engineering, but the Departments tab shows 0 operators in Engineering and 1 operator in Executive.

## 12. Cross-Cutting Systems (Audit Logs, Notifications & Bulk Actions)
- [ ] Bulk Actions: Add multi-select checkboxes and a persistent bottom action bar for bulk operations across Tasks and CRM Pipelines.
- [ ] Audit & Activity Logs: Automatically record an activity log entry whenever any field, status, or property changes on tasks or deals.
- [ ] Owner Notifications: Trigger a notification to the task/deal owner whenever an update is made by another team member.
- [ ] Dashboards & Funnel Charts: When a funnel or stage velocity metric has a value of 0%, hide the bar completely rather than rendering empty or redundant progress bars.