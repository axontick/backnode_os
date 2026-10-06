# Backnode OS (Monorepo)

High-performance task management workspace, CRM pipelines, and kinetic kanban triage powered by a **React 19** frontend, **NestJS** backend, and **PostgreSQL** database managed with **Yarn Workspaces**.

---

## Architecture & Workspaces

The project is structured as a Yarn monorepo under `packages/`:

| Package | Directory | Description |
|---|---|---|
| `@backnode/frontend` | [`packages/frontend`](packages/frontend) | React 19, Vite, Tailwind CSS, Lucide icons UI |
| `@backnode/backend` | [`packages/backend`](packages/backend) | NestJS REST API, Prisma ORM, PostgreSQL connection |
| `@backnode/shared` | [`packages/shared`](packages/shared) | Shared TypeScript interfaces, data models, and canonical seeds |

---

## Getting Started

### Prerequisites
- **Node.js**: v20+ or v24+
- **Yarn**: Classic v1.22+
- **PostgreSQL**: Running locally on port `5432` (e.g. via Docker)

### Quick Start

1. **Install dependencies across all workspaces:**
   ```bash
   yarn install
   ```

2. **Database Setup (PostgreSQL):**
   ```bash
   # Push schema to PostgreSQL database 'backnode_os'
   yarn db:push

   # Seed database with initial workspace data
   yarn db:seed
   ```

3. **Run the Full Stack:**
   ```bash
   # Starts both frontend (:3000) and backend (:3001) concurrently
   yarn dev
   ```

   Or run individual services:
   ```bash
   # Frontend only (Vite on http://localhost:3000)
   yarn dev:frontend

   # Backend only (NestJS on http://localhost:3001)
   yarn dev:backend
   ```

---

## Workspace Commands

| Command | Description |
|---|---|
| `yarn dev` | Run frontend & backend concurrently |
| `yarn dev:frontend` | Start Vite frontend dev server on port `3000` |
| `yarn dev:backend` | Start NestJS backend in live-reload watch mode |
| `yarn build` | Compile both frontend and backend |
| `yarn build:frontend` | Build Vite frontend production bundle |
| `yarn build:backend` | Compile NestJS TypeScript to `dist/` |
| `yarn db:push` | Sync Prisma schema to PostgreSQL database |
| `yarn db:seed` | Run database seed script importing from `@backnode/shared` |
| `yarn db:generate` | Regenerate Prisma client |
| `yarn lint` | Run TypeScript check on frontend |
