# RBAC & ABAC Permissions and Claims Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, end-to-end Role-Based (RBAC) and Attribute-Based (ABAC) Access Control system featuring custom and default roles, a searchable granular resource permission matrix with data-ownership scoping (`own` vs `department` vs `all`), explicit user-level permission overrides, login claims compilation, and strict enforcement across frontend views and backend resources conforming to `design.md`.

**Architecture:**
- **Shared Layer (`@backnode/shared`)**: Define `PermissionAction`, `DataScope`, `PermissionRule`, `UserClaim`, and `Role` models. Export standard system default roles (`Owner`, `Administrator`, `Department Lead`, `Member`, `Restricted Member`, `Viewer / Auditor`).
- **Backend Layer (`@backnode/backend`)**: Create TypeORM `Role` entity, `RolesModule`, `RolesService`, and `RolesController` with full CRUD. Enhance `AuthService` to aggregate user role permissions and explicit overrides into an effective `claims` list on login and `/auth/me`. Implement `ClaimsGuard` and `@RequireClaim()` decorator.
- **Frontend Layer (`@backnode/frontend`)**: Update `AuthContext` to expose effective claims and security evaluation (`hasClaim`, `can`). Create a searchable `RoleSettingsView` in `WorkspaceSettingsPage` (`/settings/roles`) with 6px border radii and obsidian/electric-orange styling. Update `TeamAccessPage` to support role assignment and explicit permission override claims.

**Tech Stack:** TypeScript, React 19, Vite, Tailwind CSS v4, NestJS, TypeORM, PostgreSQL.

---

### Task 1: Shared Models & Mock Roles Definition

**Files:**
- Modify: `packages/shared/src/types.ts`
- Modify: `packages/shared/src/mockData.ts`

- [ ] **Step 1: Define RBAC/ABAC types in `packages/shared/src/types.ts`**
  - Add `PermissionAction` (`'read' | 'write' | 'delete' | 'manage'`).
  - Add `DataScope` (`'own' | 'department' | 'all'`).
  - Add `PermissionRule` (`resource: string; actions: PermissionAction[]; scope: DataScope`).
  - Add `UserClaim` (`resource: string; action: PermissionAction; scope: DataScope`).
  - Add `Role` (`id`, `name`, `code`, `description`, `color`, `icon`, `isSystem`, `isDefault`, `permissions: PermissionRule[]`, `accountId`).
  - Update `User` and `TeamMember` to include `roleId?: string`, `roleObject?: Role`, `customClaims?: PermissionRule[]`, `claims?: UserClaim[]`.
  - Update `AuthResponse` to return `claims: UserClaim[]`.

- [ ] **Step 2: Add default system roles to `packages/shared/src/mockData.ts`**
  - Create `initialRoles: Role[]`:
    1. `Workspace Owner` (`role-owner`): Universal access across all resources (`read`, `write`, `delete`, `manage`), `scope: 'all'`, system role.
    2. `Administrator` (`role-admin`): All operational and administration access (`read`, `write`, `delete`, `manage`), `scope: 'all'`.
    3. `Department Lead` (`role-dept-lead`): Manage department tasks, deals, contacts, and team members (`scope: 'department'`).
    4. `Member / Contributor` (`role-member`): Standard read/write access to workspace items with `scope: 'department'`.
    5. `Restricted Contributor` (`role-restricted-member`): Only view/edit their **own** data (`scope: 'own'`).
    6. `Auditor / Viewer` (`role-viewer`): Read-only access across resources (`action: ['read']`, `scope: 'all'`).
  - Re-export `RESOURCE_DEFINITIONS` metadata mapping for UI searchable matrix.

- [ ] **Step 3: Compile `@backnode/shared` and verify**
  Run: `npm run build --workspace=@backnode/shared`
  Expected: 0 errors.

---

### Task 2: Backend Role Entity & Database Sync

**Files:**
- Create: `packages/backend/src/entities/role.entity.ts`
- Modify: `packages/backend/src/entities/index.ts`
- Modify: `packages/backend/src/entities/user.entity.ts`
- Modify: `packages/backend/src/entities/team-member.entity.ts`

- [ ] **Step 1: Create `role.entity.ts`**
  - Define `Role` entity with columns: `id`, `name`, `code`, `description`, `color`, `icon`, `isSystem`, `isDefault`, `permissions` (jsonb/simple-json), `accountId`, `createdAt`, `updatedAt`.
  - Add `BeforeInsert` hook to generate `role-${randomUUID()}`.

- [ ] **Step 2: Update `user.entity.ts` and `team-member.entity.ts`**
  - Add `role_id` column (`roleId?: string`).
  - Add `custom_claims` jsonb column (`customClaims?: PermissionRule[]`).

- [ ] **Step 3: Re-export in `packages/backend/src/entities/index.ts`**
  - Export `* from './role.entity'`.

---

### Task 3: Backend Roles Service & Controller

**Files:**
- Create: `packages/backend/src/roles/roles.service.ts`
- Create: `packages/backend/src/roles/roles.controller.ts`
- Create: `packages/backend/src/roles/roles.module.ts`
- Modify: `packages/backend/src/app.module.ts`

- [ ] **Step 1: Implement `roles.service.ts`**
  - `findAll(accountId: string)`: Return all workspace roles. Seed `initialRoles` if table is empty for this workspace.
  - `findOne(accountId: string, id: string)`: Return single role or throw `NotFoundException`.
  - `create(accountId: string, data: Partial<Role>)`: Validate and save custom role.
  - `update(accountId: string, id: string, data: Partial<Role>)`: Update custom role (protect `isSystem` roles from name/code changes, allow updating permissions).
  - `delete(accountId: string, id: string)`: Delete custom role. Throw `BadRequestException` if system role or assigned to active members.

- [ ] **Step 2: Implement `roles.controller.ts`**
  - Endpoints:
    - `GET /roles`
    - `GET /roles/:id`
    - `POST /roles`
    - `PATCH /roles/:id`
    - `DELETE /roles/:id`
  - Guard with `JwtAuthGuard`.

- [ ] **Step 3: Register `RolesModule` in `packages/backend/src/app.module.ts`**
  - Import `RolesModule` into `imports` list.

---

### Task 4: Login Claims Compilation & Claims Guard

**Files:**
- Modify: `packages/backend/src/auth/auth.service.ts`
- Create: `packages/backend/src/auth/claims.guard.ts`
- Create: `packages/backend/src/auth/require-claim.decorator.ts`
- Modify: `packages/backend/src/members/members.service.ts`

- [ ] **Step 1: Implement `compileUserClaims` in `auth.service.ts`**
  - Create helper `compileUserClaims(user: User, member?: TeamMember): Promise<UserClaim[]>`:
    1. Fetch role assigned to member/user (by `roleId` or match `user.role` e.g. `OWNER` -> `role-owner`).
    2. Extract role permissions.
    3. Merge member or user `customClaims` (explicit user overrides).
    4. Compile final flat `claims` array and deduplicate.
  - Call `compileUserClaims` in `login()`, `signup()`, `refresh()`, and `getMe()`.
  - Include `claims` in `AuthResponse.user` and in the signed JWT token payload.

- [ ] **Step 2: Sync role assignment & custom claims in `members.service.ts`**
  - In `create()` and `update()`, accept `roleId` and `customClaims`.
  - Persist on `TeamMember` and sync to corresponding `User` record.

- [ ] **Step 3: Create `@RequireClaim()` and `ClaimsGuard`**
  - `@RequireClaim(resource: string, action: string, scope?: string)`.
  - `ClaimsGuard` checks request `user.claims` against required claim and ownership context.

- [ ] **Step 4: Verify Backend build**
  Run: `npm run build --workspace=@backnode/backend`
  Expected: Clean compilation, 0 TypeScript errors.

---

### Task 5: Frontend API Service & Workspace Context

**Files:**
- Modify: `packages/frontend/src/services/api.ts`
- Modify: `packages/frontend/src/context/WorkspaceContext.tsx`
- Modify: `packages/frontend/src/context/AuthContext.tsx`
- Modify: `packages/frontend/src/utils/security.ts`

- [ ] **Step 1: Add `rolesApi` in `packages/frontend/src/services/api.ts`**
  - Implement `rolesApi.getAll()`, `rolesApi.create()`, `rolesApi.update()`, `rolesApi.delete()`.
  - Update `membersApi.create` and `membersApi.update` to accept `roleId?: string` and `customClaims?: PermissionRule[]`.

- [ ] **Step 2: Expose roles state in `WorkspaceContext.tsx`**
  - Add state: `roles: Role[]`, `isLoadingRoles: boolean`.
  - Add handlers: `handleCreateRole`, `handleUpdateRole`, `handleDeleteRole`.
  - Fetch roles on active space initialization.

- [ ] **Step 3: Update `AuthContext.tsx` & `security.ts` for claims evaluation**
  - Store `claims: UserClaim[]` in `AuthContext` (derived from `user.claims` returned by backend).
  - Expose `hasClaim(resource: string, action: PermissionAction, context?: { ownerId?: string; department?: string }): boolean`.
  - Expose `canAccessPage(pageKey: string): boolean`.
  - In `security.ts`, implement ABAC evaluation:
    - If user has `scope: 'all'`, access is granted.
    - If user has `scope: 'department'`, access is granted if resource department matches user's department.
    - If user has `scope: 'own'`, access is granted if resource `authorId` / `assignee.id` matches user's ID.

---

### Task 6: Frontend Searchable Roles & Permissions Management UI

**Files:**
- Create: `packages/frontend/src/components/RoleSettingsView.tsx`
- Modify: `packages/frontend/src/pages/WorkspaceSettingsPage.tsx`
- Modify: `packages/frontend/src/App.tsx` (ensure `/settings/roles` route is supported)

- [ ] **Step 1: Build `RoleSettingsView.tsx`**
  - Strictly adhere to `design.md`:
    - Canvas `#09090b`, Card surfaces `#121214`, elevated `#18181b`, borders `#27272a`, primary orange `#ea580c`.
    - Strict `rounded-[6px]` across all elements.
  - Bento Layout:
    - Top stats: Total Roles, Default Roles, Custom Roles, Active Operators covered.
    - Left column (300px): List of roles with color dots, system badge, and "+ New Role" button.
    - Right panel: Role Editor:
      - Role Name, Code, Description, Color picker, Icon selector.
      - **Searchable Permissions Matrix**:
        - Prominent search input with instant filtering by resource, action name, or keyword.
        - Quick action presets: "Grant Full Admin", "Standard Contributor", "Read Only All", "Clear All".
        - Matrix rows: Resource name, description, Category badge.
        - Action toggles: `[Read]` `[Write]` `[Delete]` `[Manage]`.
        - **Data Ownership Scope (ABAC)** selector pills:
          - `[Own Data Only]` (Can only inspect/edit their own items).
          - `[Department Data]` (Can inspect/edit items in their department).
          - `[All Data]` (Universal workspace-wide access).
  - Save role and Delete role (with confirmation modal).

- [ ] **Step 2: Add Roles Tab to `WorkspaceSettingsPage.tsx`**
  - Tab pills: `General Settings`, `Departments`, `Roles & Permissions`.
  - Render `RoleSettingsView` when `tab === 'roles'`.

---

### Task 7: User Role Assignment & Explicit Custom Claims UI

**Files:**
- Modify: `packages/frontend/src/pages/TeamAccessPage.tsx`

- [ ] **Step 1: Update Invite / Create Member Modal in `TeamAccessPage.tsx`**
  - Replace hardcoded accessLevel radio buttons with dynamic **Role Picker** dropdown / selector populated from workspace `roles`.
  - Add collapsible accordion: **"Explicit Permissions & Custom Claims (Optional Overrides)"**:
    - Searchable permissions list.
    - Allows checking specific permissions (e.g. `settings:read:all`, `deals:write:own`) to explicitly grant them to this operator.
    - Clear indicator: "Inherited from [Role Name]" vs "Explicit Override".

- [ ] **Step 2: Update Member Edit Drawer & Member Table**
  - Allow changing the member's assigned role.
  - Display role badge with role's custom color in the member table.
  - Show explicit claim override count (e.g. `+2 custom claims`) if overrides exist.
  - Filter members by role (dynamically populated from workspace `roles`).

---

### Task 8: Verification & End-to-End Testing

- [ ] **Step 1: Lint & Build Verification**
  - Run `npm run build` across all packages (`shared`, `backend`, `frontend`).
  - Verify 0 TypeScript errors and 0 lint failures.

- [ ] **Step 2: Functional Verification**
  - Verify login returns compiled `claims` in `AuthResponse.user`.
  - Create a custom role with restricted scope (`tasks: read: own`).
  - Assign to a test user, log in, verify that the claims list enforces `tasks:read:own`.
  - Grant an explicit permission override (`deals:write:own`), verify it gets merged into their effective claims list.
