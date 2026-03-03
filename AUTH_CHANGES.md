# Authentication System — Changes Documentation

## Overview

Added a complete user authentication system with JWT sessions, login/register UI, and route protection. Only authenticated users can access `/chat`.

---

## Dependencies Added

| Package | Purpose |
|---------|---------|
| `jose` | JWT signing & verification — works in Edge runtime (required for Next.js proxy/middleware) |
| `bcryptjs` | Password hashing & comparison — pure JS, no native binaries needed |
| `dotenv` | Loads `.env` vars for Drizzle config (was missing, caused `db:generate` to fail) |

---

## Files Created

### `lib/auth.ts` — Auth Utilities
Core helper functions used across API routes and proxy:
- `hashPassword(password)` — hashes with bcryptjs (12 salt rounds)
- `verifyPassword(password, hash)` — compares plaintext against hash
- `signToken({ userId, email })` — creates a JWT with 7-day expiry using HS256
- `verifyToken(token)` — verifies and decodes JWT, returns payload or `null`
- `setAuthCookie(response, token)` — sets `token` as an httpOnly, secure, SameSite=Lax cookie
- `clearAuthCookie(response)` — expires the cookie immediately
- `getTokenFromRequest(req)` — reads the `token` cookie from a NextRequest

### `proxy.ts` — Route Protection (Next.js 16 Proxy)
Replaces the old `middleware.ts` convention (deprecated in Next.js 16).
- **Protected paths**: `/chat`, `/api/chat` — unauthenticated users get redirected to `/login`
- **Auth pages**: `/login`, `/register` — authenticated users get redirected to `/chat`
- **Root `/`** — redirects to `/chat` if logged in, `/login` if not
- **Matcher** excludes `_next/static`, `_next/image`, `favicon.ico`, and `/api/auth/*` routes

### `store/auth.store.ts` — Zustand Auth Store
Client-side state management for the current user:
- `user` — current user object (or null)
- `isLoading` / `isAuthenticated` — loading & auth flags
- `fetchUser()` — calls `GET /api/auth/me` to hydrate user state
- `setUser(user)` — sets user directly (used after login/register)
- `logout()` — calls `POST /api/auth/logout`, clears state, redirects to `/login`
- `clearUser()` — resets state without API call

### `app/api/auth/register/route.ts` — POST `/api/auth/register`
1. Validates request body with Zod: `firstName`, `lastName`, `email`, `password` (min 6 chars)
2. Checks if email already exists in DB → returns 409 if duplicate
3. Hashes password with bcryptjs
4. Inserts user into `users` table with role `"user"`
5. Signs a JWT and sets it as an httpOnly cookie
6. Returns user data (without password)

### `app/api/auth/login/route.ts` — POST `/api/auth/login`
1. Validates request body with Zod: `email`, `password`
2. Looks up user by email → returns 401 if not found
3. Verifies password against stored hash → returns 401 if wrong
4. Signs a JWT and sets it as an httpOnly cookie
5. Returns user data (without password)

### `app/api/auth/me/route.ts` — GET `/api/auth/me`
1. Reads JWT from the `token` cookie
2. Verifies the token → returns 401 if invalid/missing
3. Fetches user from DB by `userId` from JWT payload
4. Returns user data (id, firstName, lastName, email, role)

### `app/api/auth/logout/route.ts` — POST `/api/auth/logout`
1. Clears the `token` cookie (sets maxAge to 0)
2. Returns `{ message: "Logged out" }`

### `app/login/page.tsx` — Login Page
- Dark themed UI matching the existing design system (`#0b0f1a` bg, indigo/violet gradients, glass morphism)
- Ambient glow background effect
- Email + password form fields
- Client-side error display (red banner)
- Loading spinner on submit button
- On success: sets user in Zustand store, redirects to `/chat`
- Link to `/register` at the bottom

### `app/register/page.tsx` — Register Page
- Same design system as login
- First name + last name (side by side on desktop), email, password, confirm password
- Client-side validation: password match check, minimum length
- Server-side validation errors displayed in red banner
- On success: sets user in Zustand store, redirects to `/chat`
- Link to `/login` at the bottom

### `app/chat/page.tsx` — Chat Page (moved from `/`)
- Moved from `app/page.tsx` to `app/chat/page.tsx`
- Fetches current user via `useAuthStore().fetchUser()` on mount
- Shows loading spinner while auth state is resolving
- Sidebar footer now shows **actual user initials and name** instead of hardcoded "U" / "User"
- **Logout button** added in sidebar footer (desktop) and top bar (mobile)
- User message avatars show the user's initials

### `db/migrations/0001_plain_venom.sql` — Migration
```sql
ALTER TABLE "users" ADD COLUMN "password" varchar(256) NOT NULL;
```

---

## Files Modified

### `db/schema/user.schema.ts`
Added `password` field to the users table schema:
```ts
password: varchar("password", { length: 256 }).notNull(),
```

### `lib/axios.ts`
- **Removed** localStorage-based token logic (no longer needed — cookies are sent automatically)
- **Removed** the request interceptor entirely (was only attaching `Authorization` header from localStorage)
- **Added** `withCredentials: true` to the axios config so cookies are included in requests
- **Kept** the response interceptor: 401 → redirect to `/login`, 403 → log forbidden, 5xx → log server error

### `app/page.tsx`
Replaced the entire chat UI with a simple server-side redirect:
```ts
import { redirect } from "next/navigation";
export default function Home() { redirect("/login"); }
```
The actual redirect logic is handled by `proxy.ts` — this is just a fallback.

### `.env`
Added:
```
JWT_SECRET=e0834bfcd2ed140da3c56f180f155f6776b491e6831524c6dae845f41773b8bf
```

---

## Auth Flow Summary

```
Register/Login → API hashes/verifies password → Signs JWT → Sets httpOnly cookie
                                                                    ↓
Browser auto-sends cookie with every request ← ← ← ← ← ← ← ← ← ←
                                                                    ↓
proxy.ts reads cookie → Verifies JWT → Allows or redirects
                                                                    ↓
/api/auth/me reads cookie → Returns user profile → Zustand store hydrated
                                                                    ↓
Logout → Clears cookie → Redirects to /login
```

---

## How to Run

1. Start PostgreSQL: `docker compose up -d`
2. Apply migration: `pnpm db:migrate`
3. Start dev server: `pnpm dev`
4. Visit `localhost:4000`

**Note:** The migration must be applied before registration will work — it adds the `password` column to the `users` table.
