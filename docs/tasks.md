# Auth (Email/Password) with Supabase — Task Checklist

This checklist breaks down what’s required to add Supabase email/password login to the Nuxt app, how the integration works, and the initial setup needed. It’s implementation-agnostic (no code), but includes the key commands and configuration steps to keep things actionable.


## 0) Decisions and Scope
- [x] Choose integration path
  - [x] Use Nuxt module (recommended for SSR): `@nuxtjs/supabase`
  - [ ] Or use direct client: `@supabase/supabase-js` with a Nuxt plugin
- [x] Email confirmation policy
  - [ ] Require verified email before sign-in
  - [x] Or allow sign-in without verification
- [x] Session strategy
  - [x] SSR-friendly cookies (Nuxt module)
  - [ ] Or client-only localStorage (direct client)


## 1) Supabase Project Setup
- [x] Create a Supabase project (Dashboard)
- [x] Retrieve keys
  - [x] Project URL (SUPABASE_URL)
  - [x] anon public key (SUPABASE_KEY)
  - [ ] service role key (server-only; do not expose to client)
- [x] Configure Auth
  - [x] Enable Email/Password provider
  - [x] Set Site URL (dev + prod)
  - [ ] Add Allowed Redirect URLs (e.g., `/auth/callback`, `/auth/reset-password`)
  - [ ] Configure SMTP (production) and customize email templates (verify/reset)
  - [x] Decide on email confirmation requirement


## 2) Nuxt Integration (Module or Direct)

### Option A: Nuxt module (recommended)
- [x] Install module
```bat
npm i @nuxtjs/supabase
```
- [x] Register module in `nuxt.config.ts` under `modules: []`
- [x] Provide runtime config / env vars
  - [x] Public: `SUPABASE_URL`, `SUPABASE_KEY`
  - [ ] Server-only (if needed): service role key
- [ ] Verify SSR session works via module composables/utilities

### Option B: Direct supabase-js client
- [ ] Install client
```bat
npm i @supabase/supabase-js
```
- [ ] Create a Nuxt plugin to initialize the Supabase client using env vars
- [ ] Decide on session persistence (localStorage default) and SSR implications


## 3) Environment & Secrets
- [x] Create `.env` entries for dev
  - [x] `SUPABASE_URL=...`
  - [x] `SUPABASE_KEY=...`
  - [ ] (Server-only) `SUPABASE_SERVICE_ROLE_KEY=...` (do not expose publicly)
- [ ] Ensure production secrets are configured in your hosting platform
- [ ] Confirm `runtimeConfig` in `nuxt.config.ts` reads these values and exposes only what’s safe to the client


## 4) Auth Pages & UX Flows
- [ ] Pages
  - [ ] `/auth/login` (email/password)
  - [ ] `/auth/register` (email/password)
  - [ ] `/auth/forgot-password` (request reset)
  - [ ] `/auth/reset-password` (complete password update)
  - [ ] Optional: `/auth/verify` or verification handling/feedback page
- [ ] Flows & redirects
  - [ ] After login/register, redirect to `redirect` query param or default (e.g., `/polls`)
  - [ ] Handle unverified email (show message, allow resend verification email)
  - [ ] Friendly error states (wrong password, user not found, rate limited)
  - [ ] Logout flow (clear session, redirect to home/login)
- [ ] UI/UX polish
  - [ ] Use shadcn-vue components for forms/buttons/feedback
  - [ ] Add success/error toasts or inline messages


## 5) Route Protection & Server Access
- [ ] Client-side route guards
  - [ ] Middleware to protect routes (e.g., `/polls/new`) and redirect unauthenticated users to `/auth/login?redirect=...`
- [ ] Server-side protection (SSR/API)
  - [ ] Read session on the server (module server utilities or verify token manually)
  - [ ] Enforce auth on sensitive server routes before DB operations


## 6) Data Model (App-level)
- [ ] Profiles table (optional but recommended)
  - [ ] `profiles` keyed by `auth.uid` to store display name/avatar/etc.
  - [ ] Row Level Security (RLS): users can view/update only their own row
- [ ] App tables (future features: polls/votes)
  - [ ] Define RLS policies now to align with auth (public read vs authenticated write, ownership, one vote per poll per user, etc.)
  - [ ] Unique constraints/indexes to enforce business rules
- [ ] Migration/scripts
  - [ ] SQL migrations for profiles and policies committed to repo (if using migrations)


## 7) Security Controls
- [ ] Never expose service role key to the client (only server runtime)
- [ ] Configure redirect URL allowlist to avoid open redirects
- [ ] Cookies (if SSR): set `Secure`, `HttpOnly`, appropriate `SameSite` in production
- [ ] Password policy in Supabase (min length, complexity)
- [ ] Optional: Rate limiting / CAPTCHA on auth endpoints


## 8) Testing Strategy
- [ ] Unit/Integration
  - [ ] Mock auth states in UI tests (login success/failure, unverified email)
- [ ] E2E
  - [ ] Use a test Supabase project or isolated env
  - [ ] Run end-to-end flows: register → verify → login → logout → reset password
- [ ] Server/API
  - [ ] Assert 401/403 for unauthenticated access
  - [ ] Assert successful access with valid session


## 9) Deployment & Ops
- [ ] Configure prod env vars/secrets (URL, anon key, service role key)
- [ ] Update Supabase Auth settings for prod domain (Site URL + Redirect URLs)
- [ ] Ensure HTTPS in production (cookies with `Secure` attribute)
- [ ] Monitoring/observability
  - [ ] Supabase dashboard for auth logs
  - [ ] Client error tracking (optional)


## 10) Repository Tasks (specific to this project)
- [ ] Replace placeholder `useAuth` with a thin wrapper around Supabase (keep same API: `login`, `register`, `logout`, `user`, `isAuthenticated`)
- [ ] Wire auth pages to Supabase methods (sign up, sign in, sign out)
- [ ] Add forgot/reset password pages and routes
- [ ] Update `app/middleware/auth.ts` to check Supabase session
- [ ] Ensure `nuxt.config.ts` is configured for the chosen integration (module vs direct)
- [ ] Document required `.env` variables in `README.md`


## Notes on How the Integration Works (Conceptual)
- Supabase manages identity and password auth; you call `signUp`, `signInWithPassword`, `signOut` from the client or via module composables
- On success, you receive a session (access token + refresh token). The Nuxt module syncs this to cookies for SSR; direct client uses localStorage
- Email verification and reset flows are handled by Supabase via emailed links to your whitelisted URLs, where you complete the action in-app


## Acceptance Criteria
- [ ] Users can register, verify (if required), log in, and log out
- [ ] Protected routes redirect unauthenticated users and allow access once authenticated
- [ ] Sessions persist across reloads and support SSR (if using module path)
- [ ] Password reset works end-to-end
- [ ] No secrets exposed on the client; production redirects and cookies configured securely
