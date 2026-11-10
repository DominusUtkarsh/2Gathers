# 2Gathers

2Gathers is a Next.js freelance marketplace prototype built for connecting clients and freelancers with a cleaner hiring flow, role-based dashboards, wallet/token activity, AI-assisted support, and a future-ready blockchain style token system.

This project is a full-stack web app using Next.js 15, React 19, Prisma, Supabase, and a set of API routes for jobs, proposals, notifications, wallet, and authentication.

## Project Overview

The product is designed around two main user groups:

- Freelancers: browse jobs, submit proposals, track tasks, manage wallet/token activity, and grow their profile.
- Clients: post jobs, review proposals, hire talent, manage project activity, and monitor dashboard metrics.

The app also includes:

- public landing page
- auth flow with login/register verification
- onboarding for role-based profiles
- dashboard views for each user role
- support/inbox and notification system
- AI chatbot page
- leaderboard and public freelancer directory
- wallet and token purchase flow

---

## Tech Stack

- Framework: Next.js 15
- Frontend: React 19, TypeScript
- Styling: Tailwind CSS
- State/Data: React Query, Context API
- Backend/API: Next.js App Router route handlers
- Database: PostgreSQL via Prisma + Supabase
- Auth: custom auth flow with Supabase integration and JWT-style session handling
- Email: Nodemailer / SMTP
- Payments: Razorpay integration hooks
- Blockchain: token/wallet logic and smart contracts under `contracts/`
- Testing: Vitest + Playwright

---

## Main Folder Structure

```bash
app/                 # App Router pages and route groups
components/          # Shared UI components
context/             # Auth and app context
contracts/           # Solidity smart contracts
features/             # Feature-specific UI logic
hooks/                # Custom hooks
lib/                  # Shared utilities, API clients, db helpers
prisma/               # Prisma schema and migrations
scripts/              # Deployment / helper scripts
tests/                # Vitest + Playwright tests
```

---

## Landing Page and Route Map

### Public / marketing routes

- `/` — Landing page for the product. This is the main homepage and hero section. It explains the marketplace and gives CTA buttons for clients and freelancers.
- `/about` — About page describing the platform vision and team.
- `/leaderboard` — Public leaderboard showing top performers.
- `/support` — Support/inbox page with notifications and proposal messaging.
- `/jobs` — Public jobs listing page; clients can post jobs and freelancers can browse jobs.
- `/freelancers` — Public freelancer directory.
- `/login` — Sign-in page.
- `/register` — Register page.
- `/verify-email` — Email verification page.

### Role-based onboarding and entry routes

- `/start` — Post-signup selection page where users choose freelancer, client, or browse jobs.
- `/onboarding/client` — Client onboarding form.
- `/onboarding/freelancer` — Freelancer onboarding form.
- `/dashboard` — Main dashboard used for both roles.
- `/client/dashboard` — Redirect alias to `/dashboard`.
- `/freelancer/dashboard` — Redirect alias to `/dashboard`.

### Freelancer routes

- `/freelancer/jobs` — Freelancers' jobs page / opportunity discovery screen.
- `/tasks` — Task dashboard listing tasks.
- `/tasks/[id]` — Task detail page.
- `/wallet` — Wallet and token balance screen.
- `/chatbot` — AI assistant / chatbot page.
- `/freelancers/[id]` — Freelancer profile details.

### Client routes

- `/client/post-job` — Page for creating a new job.
- `/jobs/[id]` — Job detail page.
- `/jobs/[id]` — Job detail view used by clients/freelancers for project information.

### Utility / detail routes

- `/wallet` — Token and blockchain wallet management.
- `/chatbot` — AI workflow assistant.
- `/support` — Inbox / proposal messaging center.
- `/tasks/[id]` — Specific task details.
- `/freelancers/[id]` — Individual freelancer profile.
- `/jobs/[id]` — Individual job details page.

---

## API Routes

The project includes backend API endpoints under `app/api` for domain features.

Main API areas:

- `/api/auth/*` — login, logout, refresh, register, me, verify-email
- `/api/admin/*` — admin and overview endpoints
- `/api/jobs/*` — job listing and creation behavior
- `/api/proposals/*` — proposal submission and inbox logic
- `/api/messages/*` — chat/inbox messaging
- `/api/notifications/*` — notifications and read/unread handling
- `/api/freelancers/*` — freelancer-related API actions
- `/api/client-profile/*` — client profile routes
- `/api/freelancer-profile/*` — freelancer profile routes
- `/api/blockchain/*` — wallet and blockchain token actions
- `/api/payment/*` — payment flow routes
- `/api/tasks/*` — task APIs
- `/api/users/*` — user management routes
- `/api/saved/*` — saved jobs and saved freelancers
- `/api/reviews/*` — review endpoints
- `/api/chat/*` — chat-based API routes

---

## App Flow / User Journey

### Guest user

1. Visit `/`
2. Browse marketing content / jobs / leaderboard
3. Sign in at `/login` or create account at `/register`
4. Complete onboarding at `/onboarding/client` or `/onboarding/freelancer`

### Freelancer flow

1. Register as freelancer
2. Complete onboarding profile
3. Browse `/freelancer/jobs` or `/jobs`
4. Apply to jobs
5. View proposals and tasks in `/dashboard`
6. Track wallet and token actions in `/wallet`
7. Use `/chatbot` for AI support

### Client flow

1. Register as client
2. Complete onboarding
3. Create job via `/client/post-job` or `/jobs`
4. Review applications in `/dashboard`
5. Manage messages in `/support`
6. Monitor project activity and wallet related actions in `/wallet`

---

## Important Files to Know

- `app/page.tsx` — landing page
- `app/login/page.tsx` — login screen
- `app/register/page.tsx` — registration screen
- `app/dashboard/page.tsx` — role-based dashboard logic
- `app/jobs/page.tsx` — jobs listing and creation
- `app/jobs/[id]/page.tsx` — job detail page
- `app/freelancers/page.tsx` — freelancer directory
- `app/freelancers/[id]/page.tsx` — freelancer profile page
- `app/support/page.tsx` — support/inbox view
- `app/wallet/page.tsx` — wallet/token UI
- `components/Navbar.tsx` — global navigation menu
- `context/AuthContext.tsx` — auth and session state
- `prisma/schema.prisma` — database schema
- `hardhat.config.ts` and `contracts/` — blockchain contract setup

---

## Run the Project

From the project root:

```bash
npm install
npm run dev
```

Then open:

```bash
http://localhost:3000
```

Useful commands:

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
npm run prisma:generate
npm run prisma:push
```

---

## Notes

- The homepage is the main landing page at `/`.
- `/dashboard` is the core role-aware dashboard for both freelancer and client users.
- Some route paths are alias redirects, such as `/client/dashboard` and `/freelancer/dashboard`, which route to the same dashboard experience.
- The app is a polished prototype and includes both mock and live data flows depending on the screen.

---

## Summary

The application is structured as a modern freelancing marketplace with a strong landing page, role-based experiences, dashboard management, wallet/token logic, and support systems. The central entry points are:

- Landing page: `/`
- Auth: `/login` and `/register`
- Dashboard: `/dashboard`
- Jobs: `/jobs`
- Freelancer directory: `/freelancers`
- Wallet: `/wallet`
- Support: `/support`

This gives a quick mental map of how the app is organized for both users and developers.
