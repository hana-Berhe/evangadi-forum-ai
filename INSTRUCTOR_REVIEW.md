# Instructor Review — Responses and Changes

This file answers each point from the code review and lists what changed in the code.

## 1. User rate limit and the Map

`createUserRateLimit` is a factory. It runs once, when a routes file loads (for example `const aiRateLimit = createUserRateLimit(...)`), and creates one `Map`. The middleware it returns is a closure that keeps using that same `Map` for every request, so the counts persist for the life of the process. The test "should allow `max` requests per user, then block the next one with 429" proves this.

**Change:** the user limiter had no cleanup, so its `Map` grew forever. It now forgets the oldest user when it tracks more than `maxTrackedUsers` (default 10,000), like the auth limiter.

**Why industry uses a cache database (Redis):** an in-memory `Map` is reset on every restart or deploy, is not shared between several server instances, and uses the app's own memory. Redis keeps counters outside the app, expires them automatically (TTL), and increments them atomically, so every instance sees the same count. This version stays in-memory because the app runs as a single instance on Render; Redis is the next step if it scales out.

## 2. How an expired token is rejected

`jwt.verify` checks the `exp` claim that `jwt.sign` adds from `expiresIn`. If the time has passed, it throws `TokenExpiredError`. The login cookie also has `maxAge` set to the same moment, so the browser usually drops it first.

**Change:** the middleware now tells the two cases apart. An expired token returns 401 "Session expired. Please log in again."; a tampered or foreign token returns 401 "Authentication invalid". Verification also only accepts the `HS256` algorithm. Tests: `backEnd/test/authentication.test.js`.

## 3. Is the auth limit shared between login and register?

It was shared: one `Map` keyed by IP, used by both routes, so 10 attempts in total.

**Change:** `createAuthRateLimit` is now a factory, and `/login` and `/register` each get their own limiter (`loginRateLimit`, `registerRateLimit`), so each route has its own 10 attempts per IP per 15 minutes. Tests cover that a login block does not block register.

**Related fix:** on the deployed site the limiter saw proxy IPs instead of visitors' IPs. `TRUST_PROXY` is now a setting, measured with the opt-in `/api/debug/ip` route (only active when `DEBUG_IP_ROUTE=true`).

## 4. SQL injection

Every query sends user values through `?` placeholders with mysql2 `execute`, which uses prepared statements. The SQL text and the values travel separately, so `x@h.com && DROP TABLE users` is compared as a plain string and never runs as SQL. That input is also rejected earlier by `isEmail()`, and mysql2 does not allow several statements in one query by default.

The few places that build SQL text with template strings (`ORDER BY`, `LIMIT`, the `WHERE` builder) only insert fixed values or whitelisted options, never user input. The new pagination cursor is decoded, checked, and passed as `?` parameters; a tampered cursor gets 400.

## 5. ORM instead of raw SQL

Agreed. An ORM such as Prisma or Drizzle gives typed models, managed migrations, and less repeated SQL. It is not in this version because it would rewrite every service file at once. Raw SQL was a deliberate learning choice, and all values already go through placeholders via `safeExecute`. Moving to an ORM is planned as its own project.

## 6. Why password comparison works without saving the salt

The salt is saved, inside the hash. A bcrypt hash string holds the algorithm version, the cost (10), the 22-character salt, and the hash itself. `bcrypt.compare` reads the cost and salt out of the stored hash, hashes the login password with them, and compares the results.

**Changes:**
- Hashing is one call, `bcrypt.hash(password, 10)`, which creates the salt itself.
- Login now runs `bcrypt.compare` even when the email does not exist, so response time does not reveal which emails are registered.
- New passwords must be 8 or more characters, and at most 72 bytes, because bcrypt ignores everything after 72 bytes. Existing users can still log in.

## 7 and 8. File upload and vector service

Thank you.

## 9. Test names

All backend and frontend tests now use descriptive names such as "should allow 10 attempts from one IP, then block the 11th with 429 and a Retry-After header".

## Other improvements in this version

- **Pagination:** the question feed and keyword search use cursor-based "Load more". The dashboard shows forum-wide totals.
- **CORS:** only origins listed in `CORS_ORIGINS` may call the API from another site, with cookies allowed for them. Before, every website was allowed.
- **Database SSL:** with `DB_SSL=true`, the server certificate is now verified. `DB_SSL_CA` can hold the provider's CA certificate (a file path, or the certificate text).
- **Frontend API address:** defaults to `/api`, matching the Vite proxy and the Vercel rewrite. The Vite proxy now also forwards `/uploads`, so profile photos work locally.
- **Dependencies:** `nodemon` is replaced by Node's built-in `node --watch`, which removes its vulnerable packages.
