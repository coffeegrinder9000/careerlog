# CareerLog
 
A full-stack job application tracker built with Next.js 14, Tailwind CSS, Prisma ORM, PostgreSQL, NextAuth.js, and Recharts. Users can register, log in, and manage their job applications through a dashboard with real-time status updates and a live pie chart breakdown.
 
**Live Demo:** [your-project.vercel.app](https://your-project.vercel.app)  
**Repository:** [github.com/your-username/careerlog](https://github.com/your-username/careerlog)
 
---
 
## Table of Contents
 
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Database Schema](#database-schema)
6. [Server API Reference](#server-api-reference)
7. [Security Analysis](#security-analysis)
8. [Deployment](#deployment)
9. [Local Development](#local-development)
10. [Dependencies](#dependencies)
11. [References](#references)
---
 
## Features
 
- Email and password authentication with hashed credentials
- Protected routes enforced at the middleware layer
- Add, edit, and delete job applications
- Four application statuses: Applied, Interview, Offer, Rejected
- Live pie chart that updates instantly on status change without a page reload
- Responsive card grid layout with color-coded status badges
- Edit modal with pre-filled fields and keyboard (Escape) dismissal
- Confirmation dialog before destructive delete actions
---
 
## Tech Stack
 
| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 3 |
| ORM | Prisma | 5 |
| Database | PostgreSQL via Supabase | — |
| Authentication | NextAuth.js | 4 |
| Charts | Recharts | 2 |
| Hosting | Vercel | — |
 
---
 
## Project Structure
 
```
careerlog/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # NextAuth catch-all handler (GET + POST)
│   ├── dashboard/
│   │   ├── actions.ts                # Server actions: addApplication, deleteApplication
│   │   ├── update-action.ts          # Server action: updateApplication (separate file for bundler)
│   │   └── page.tsx                  # Protected dashboard page (server component)
│   ├── login/
│   │   └── page.tsx                  # Login form (client component)
│   ├── register/
│   │   ├── actions.ts                # Server action: registerUser
│   │   └── page.tsx                  # Register form (client component)
│   ├── globals.css                   # Tailwind base styles
│   ├── layout.tsx                    # Root layout — wraps app in SessionProvider + Header
│   └── page.tsx                      # Landing page with Login / Register links
├── components/
│   ├── AddApplicationForm.tsx        # Collapsible form for creating new applications
│   ├── ApplicationList.tsx           # Card grid — owns live state + chart data
│   ├── EditApplicationModal.tsx      # Full-screen modal for editing an application
│   ├── Header.tsx                    # Nav bar (server component) with session-aware links
│   ├── SessionProvider.tsx           # Client wrapper re-exporting next-auth SessionProvider
│   ├── SignOutButton.tsx             # Client component calling next-auth signOut()
│   └── StatsChart.tsx               # Recharts pie chart, receives status counts as props
├── lib/
│   ├── auth.ts                       # NextAuth config (authOptions) + getSession helper
│   └── prisma.ts                     # PrismaClient singleton (prevents hot-reload leaks)
├── prisma/
│   └── schema.prisma                 # Data models: User, Application
├── types/
│   └── next-auth.d.ts               # Module augmentation: adds id to Session['user']
├── middleware.ts                     # NextAuth middleware — protects /dashboard/** routes
├── .env                              # Environment variables (not committed)
├── .gitignore
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```
 
---
 
## Architecture Overview
 
CareerLog uses the Next.js 14 App Router model, which blends server and client rendering in the same component tree. Understanding where each piece runs matters for both performance and security.
 
### Rendering Model
 
```
Browser                         Server (Node.js / Edge)
──────────────────────          ──────────────────────────────────────
                                app/layout.tsx          (server)
                                  └── Header.tsx        (server — reads session)
                                  └── SessionProvider   (client boundary)
                                        └── {children}
 
                                app/dashboard/page.tsx  (server)
                                  ├── reads session via getSession()
                                  ├── queries DB via Prisma
                                  ├── AddApplicationForm (client boundary)
                                  └── ApplicationList   (client boundary)
                                        ├── owns useState([applications])
                                        ├── StatsChart  (client)
                                        └── ApplicationCard (client)
                                              └── EditApplicationModal (client)
```
 
**Server components** (no `'use client'` directive) run only on the server. They can directly call Prisma and read the session from `getServerSession`. They never ship their own code to the browser.
 
**Client components** (`'use client'`) run in the browser and can use React hooks. They cannot call Prisma directly. Instead, they invoke **server actions** — async functions marked `'use server'` that execute on the server and can be called from client code as if they were regular async functions.
 
### Data Flow
 
```
User edits a card
      │
      ▼
EditApplicationModal (client)
  calls updateApplication(formData)   ← server action
      │
      ▼
update-action.ts (server)
  1. Verifies session
  2. updateMany({ id, userId })       ← ownership check
  3. findFirst() to get updated row
  4. returns Application object
      │
      ▼
EditApplicationModal receives updated Application
  calls onUpdate(updated)
      │
      ▼
ApplicationList.handleUpdate (client)
  setApps(prev => prev.map(...))      ← patches single item in local state
      │
      ▼
React re-renders:
  - ApplicationCard shows new status badge
  - StatsChart recomputes from updated apps array
  (no page reload, no router.refresh())
```
 
### Why Two Action Files
 
Next.js statically analyses which server action exports each client component imports at build time. When `EditApplicationModal` (a client component) imports from `actions.ts`, the bundler needs to resolve that export statically. If `updateApplication` lives in the same file as `addApplication` and `deleteApplication` (which are imported from other components), the bundler can produce a module resolution conflict. Splitting `updateApplication` into `update-action.ts` gives it an unambiguous single-export module and eliminates the error.
 
### Session Strategy
 
Authentication uses **JWT sessions** (`strategy: 'jwt'`). On sign-in, NextAuth signs a JWT containing the user's `id`, `email`, and `name`, and stores it in an `HttpOnly` cookie. On subsequent requests, the cookie is read and verified server-side — no database lookup is needed per request. The user `id` is injected into the session via a `jwt` callback and made available in the session via a `session` callback.
 
---
 
## Database Schema
 
Managed with Prisma ORM, backed by a PostgreSQL database hosted on Supabase.
 
### Entity Relationship
 
```
User 1 ──────────────── N Application
```
 
One user owns many applications. Deleting a user cascades to delete all their applications (`onDelete: Cascade`).
 
### User
 
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | Primary key | CUID — collision-resistant unique ID |
| `name` | `String?` | Nullable | Optional display name |
| `email` | `String` | Unique, Not null | Used as login identifier |
| `password` | `String?` | Nullable | bcrypt hash; null for OAuth-only users |
| `createdAt` | `DateTime` | Default: now() | Account creation timestamp |
 
### Application
 
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `String` | Primary key | CUID |
| `company` | `String` | Not null | Company name |
| `role` | `String` | Not null | Job title or position |
| `status` | `String` | Default: `"applied"` | One of: `applied`, `interview`, `offer`, `rejected` |
| `appliedDate` | `DateTime` | Default: now() | Populated automatically on creation |
| `notes` | `String?` | Nullable | Free-text notes |
| `userId` | `String` | Foreign key → User.id | Ownership reference |
 
**Indexes:** `@@index([userId])` on `Application` for efficient per-user queries.
 
### Prisma Schema
 
```prisma
model User {
  id           String        @id @default(cuid())
  name         String?
  email        String        @unique
  password     String?
  applications Application[]
  createdAt    DateTime      @default(now())
}
 
model Application {
  id          String   @id @default(cuid())
  company     String
  role        String
  status      String   @default("applied")
  appliedDate DateTime @default(now())
  notes       String?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
 
  @@index([userId])
}
```
 
---
 
## Server API Reference
 
CareerLog uses Next.js Server Actions for all mutations — there are no traditional REST endpoints for data operations. The only HTTP endpoints are the NextAuth auth routes.
 
### NextAuth Endpoints
 
All handled automatically by `app/api/auth/[...nextauth]/route.ts`. These are called internally by the NextAuth client library and are not intended to be called directly.
 
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/session` | Returns the current session (or null) |
| `GET` | `/api/auth/csrf` | Returns a CSRF token for form submissions |
| `GET` | `/api/auth/providers` | Lists configured auth providers |
| `POST` | `/api/auth/callback/credentials` | Processes email/password login |
| `POST` | `/api/auth/signout` | Clears the session cookie and signs out |
 
### Server Actions
 
Server actions are invoked directly from client components as async function calls. They execute exclusively on the server — they are never exposed as public HTTP endpoints and their source code is never sent to the browser.
 
---
 
#### `registerUser(formData: FormData)`
 
**File:** `app/register/actions.ts`  
**Called from:** `app/register/page.tsx`
 
Registers a new user account.
 
**Input fields (from FormData):**
 
| Field | Type | Required |
|---|---|---|
| `email` | string | Yes |
| `password` | string | Yes |
| `name` | string | No |
 
**Behaviour:**
1. Checks that `email` and `password` are present.
2. Queries the database for an existing user with the same email.
3. If a conflict exists, throws an error with a human-readable message.
4. Hashes the password with `bcrypt` at cost factor 10.
5. Creates the `User` record.
**Returns:** `void` on success; throws `Error` on failure.
 
---
 
#### `addApplication(formData: FormData)`
 
**File:** `app/dashboard/actions.ts`  
**Called from:** `components/AddApplicationForm.tsx`
 
Creates a new job application record owned by the authenticated user.
 
**Input fields (from FormData):**
 
| Field | Type | Required | Default |
|---|---|---|---|
| `company` | string | Yes | — |
| `role` | string | Yes | — |
| `status` | string | No | `"applied"` |
| `notes` | string | No | `null` |
 
**Behaviour:**
1. Calls `getSession()` — redirects to `/login` if unauthenticated.
2. Guards against missing `company` or `role`.
3. Creates the `Application` record with `userId` set to the authenticated user's id.
4. Calls `revalidatePath('/dashboard')` to invalidate the Next.js cache for the dashboard.
**Returns:** `void`
 
---
 
#### `deleteApplication(formData: FormData)`
 
**File:** `app/dashboard/actions.ts`  
**Called from:** `components/ApplicationList.tsx`
 
Deletes a job application by id.
 
**Input fields (from FormData):**
 
| Field | Type | Required |
|---|---|---|
| `id` | string | Yes |
 
**Behaviour:**
1. Calls `getSession()` — redirects if unauthenticated.
2. Calls `prisma.application.deleteMany({ where: { id, userId } })` — the `userId` filter ensures a user can only delete their own records.
3. Calls `revalidatePath('/dashboard')`.
**Returns:** `void`
 
---
 
#### `updateApplication(formData: FormData)`
 
**File:** `app/dashboard/update-action.ts`  
**Called from:** `components/EditApplicationModal.tsx`
 
Updates an existing job application and returns the fresh record to the caller for instant client-side state patching.
 
**Input fields (from FormData):**
 
| Field | Type | Required | Default |
|---|---|---|---|
| `id` | string | Yes | — |
| `company` | string | Yes | — |
| `role` | string | Yes | — |
| `status` | string | No | `"applied"` |
| `notes` | string | No | `null` |
 
**Behaviour:**
1. Calls `getSession()` — redirects if unauthenticated.
2. Guards against missing `id`, `company`, or `role`.
3. Calls `prisma.application.updateMany({ where: { id, userId }, data: { ... } })`.
4. Calls `prisma.application.findFirst({ where: { id, userId } })` to retrieve the updated record.
5. Returns the updated `Application` object. The calling component uses this to patch its local `useState` array immediately — no page reload or `router.refresh()` needed.
**Returns:** `Application | null`
 
---
 
## Security Analysis
 
### Authentication
 
Passwords are hashed using `bcryptjs` with a work factor of 10 before storage. The plaintext password is never persisted. On login, `bcrypt.compare()` performs a constant-time comparison against the stored hash.
 
Sessions use signed JWTs stored in an `HttpOnly` cookie managed by NextAuth. `HttpOnly` prevents JavaScript from reading the cookie, which blocks XSS-based session theft. The cookie is also `SameSite=Lax` by default, which provides CSRF protection for cross-origin navigations.
 
### Route Protection — Two Layers
 
Protection is applied at two levels:
 
**Layer 1 — Middleware (`middleware.ts`):**  
The `next-auth/middleware` export runs on the Edge runtime before any page or server component renders. Any request to `/dashboard/**` that lacks a valid session cookie is redirected to `/login` immediately. This is the primary gate.
 
**Layer 2 — Server component session check (`app/dashboard/page.tsx`):**  
Even if middleware is bypassed (e.g., during local development with middleware misconfigured), the dashboard page calls `getSession()` and calls `redirect('/login')` if no session is found. This is a secondary defence.
 
### Ownership Enforcement
 
Every database mutation filters by both the record `id` **and** the authenticated user's `userId`. This prevents Insecure Direct Object Reference (IDOR) attacks — a logged-in user cannot read, modify, or delete another user's records by guessing or enumerating IDs, even if they are authenticated.
 
```ts
// Example — deleteApplication
await prisma.application.deleteMany({
  where: { id, userId: session.user.id },  // ← both conditions required
});
```
 
If an attacker sends a request with a valid `id` belonging to another user, the `userId` check causes the query to match zero rows and silently no-op.
 
### Server Actions Are Not Public Endpoints
 
Next.js server actions are compiled to opaque POST endpoints with encrypted action IDs. The function bodies are never sent to the browser. They cannot be discovered by endpoint scanning tools and are not part of the public API surface. All session checks inside actions run on the server — there is no way to skip them from the client.
 
### CSRF
 
NextAuth provides built-in CSRF token validation for its own endpoints. For server actions, Next.js validates the `Origin` header against the application's host on every action invocation, rejecting cross-origin calls.
 
### Known Limitations
 
- **No rate limiting** on login or registration. A production deployment should add rate limiting (e.g., Upstash Ratelimit with a Vercel Edge middleware) to prevent brute-force attacks against the credentials endpoint.
- **Status is a free string** in the database. Values are constrained only by the UI, not a database-level enum. A direct database manipulation could insert arbitrary status strings. A Prisma validator or a Zod schema check in the server action would harden this.
- **No email verification**. Accounts are considered valid immediately on registration. A production app should send a verification email before activating the account.
---
 
## Deployment
 
### Prerequisites
 
- GitHub repository with the project pushed to `main`
- Supabase project with a PostgreSQL database created
- Vercel account connected to GitHub
### Environment Variables
 
| Variable | Where to get it | Required on Vercel |
|---|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Transaction pooler URI (port 6543) | Yes |
| `NEXTAUTH_SECRET` | Generate locally: PowerShell `[Convert]::ToBase64String((1..32 \| ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])` | Yes |
| `NEXTAUTH_URL` | **Do not set on Vercel** — Vercel injects `VERCEL_URL` automatically and NextAuth reads it | Local `.env` only |
 
> **Important:** Use the Supabase **Transaction pooler** connection string (port **6543**), not the direct connection (port 5432). Serverless environments like Vercel open and close database connections on every invocation. The direct connection exhausts Supabase's connection limit quickly. The pooler is designed for this workload.
 
### Steps
 
1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import your repository.
3. Vercel auto-detects Next.js. Before clicking Deploy, open **Environment Variables** and add `DATABASE_URL` and `NEXTAUTH_SECRET`.
4. Click **Deploy**. Vercel builds the project and assigns a `.vercel.app` domain.
5. Verify the deployment by registering a new user, logging in, and creating an application.
### Running Database Migrations
 
The Supabase Transaction pooler does not support DDL commands (`CREATE TABLE`, `ALTER TABLE`, etc.). To run Prisma migrations, temporarily use the **Direct Connection** URL (port 5432) from Supabase instead of the pooler URL, run `npx prisma migrate deploy`, then switch back to the pooler URL.
 
For initial setup, `npx prisma migrate dev --name init` handles this locally before deployment.
 
---
 
## Local Development
 
### Requirements
 
- Node.js 18 or later
- A Supabase project (free tier is sufficient)
### Setup
 
```powershell
# 1. Clone the repository
git clone https://github.com/your-username/careerlog.git
cd careerlog
 
# 2. Install dependencies
npm install
 
# 3. Generate a NEXTAUTH_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```
 
Create a `.env` file in the project root:
 
```env
DATABASE_URL="postgresql://postgres.xxxx:YOUR-PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
```
 
```powershell
# 4. Run database migrations
npx prisma migrate dev --name init
 
# 5. Start the development server
npm run dev
```
 
Open [http://localhost:3000](http://localhost:3000).
 
### Available Scripts
 
| Script | Description |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build the production bundle |
| `npm run start` | Start the production server locally |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma Studio — a GUI for browsing the database |
| `npx prisma migrate dev` | Create and apply a new migration |
| `npx prisma generate` | Regenerate the Prisma client after schema changes |
 
---
 
## Dependencies
 
### Production
 
| Package | Version | Purpose |
|---|---|---|
| `next` | 14 | Framework — App Router, server components, server actions |
| `react` | 18 | UI library |
| `react-dom` | 18 | React DOM renderer |
| `next-auth` | 4 | Authentication — session management, JWT, credentials provider |
| `@prisma/client` | 5 | Prisma query client — generated from schema |
| `bcryptjs` | 2 | Password hashing with bcrypt algorithm |
| `recharts` | 2 | React charting library — pie chart for status breakdown |
| `tailwindcss` | 3 | Utility-first CSS framework |
 
### Development
 
| Package | Purpose |
|---|---|
| `prisma` | Prisma CLI — migrations, schema management, client generation |
| `@types/bcryptjs` | TypeScript types for bcryptjs |
| `@types/node` | TypeScript types for Node.js |
| `@types/react` | TypeScript types for React |
| `typescript` | TypeScript compiler |
| `eslint` | Linter |
| `eslint-config-next` | ESLint rules for Next.js projects |
 
---
 
## References
 
### Official Documentation
 
- [Next.js 14 App Router Documentation](https://nextjs.org/docs/app) — App Router concepts, server components, server actions, routing, middleware
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) — How server actions work, `'use server'`, `revalidatePath`
- [NextAuth.js v4 Documentation](https://next-auth.js.org/getting-started/introduction) — Configuration, providers, callbacks, session strategies
- [NextAuth.js Credentials Provider](https://next-auth.js.org/providers/credentials) — Email/password authentication setup
- [NextAuth.js Middleware](https://next-auth.js.org/configuration/nextjs#middleware) — Route protection with `next-auth/middleware`
- [Prisma ORM Documentation](https://www.prisma.io/docs) — Schema definition, migrations, client API, relations
- [Prisma with Next.js](https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices) — Singleton pattern to prevent hot-reload connection leaks
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler) — Transaction pooler vs direct connection, when to use each
- [Recharts Documentation](https://recharts.org/en-US/api) — PieChart, Cell, Tooltip, Legend API reference
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) — Utility class reference
### Security References
 
- [OWASP IDOR (Insecure Direct Object Reference)](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References) — The vulnerability that ownership checks in `deleteMany`/`updateMany` defend against
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) — Guidance on bcrypt work factors and password hashing best practices
- [HttpOnly Cookies](https://owasp.org/www-community/HttpOnly) — Why `HttpOnly` prevents XSS-based session theft
- [SameSite Cookie Attribute](https://web.dev/articles/samesite-cookies-explained) — How `SameSite=Lax` mitigates CSRF attacks
### Concepts
 
- [React `useTransition`](https://react.dev/reference/react/useTransition) — Non-blocking state transitions used for pending UI states during server action calls
- [Next.js `revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) — Invalidating the Next.js data cache after a mutation
- [CUIDs](https://github.com/paralleldrive/cuid2) — Collision-resistant unique identifiers used as primary keys
- [bcrypt Algorithm](https://en.wikipedia.org/wiki/Bcrypt) — Adaptive hashing function designed for password storage
- [JWT (JSON Web Tokens)](https://jwt.io/introduction) — The token format used for NextAuth sessions in this project
 
