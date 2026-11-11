# Auth (`src/auth.ts`)

JWT authentication with **separate secrets** for employers and candidates.

```ts
const SECRETS: Record<Role, string> = {
  employer: process.env.EMPLOYER_JWT_SECRET ?? "employer-secret",
  candidate: process.env.CANDIDATE_JWT_SECRET ?? "candidate-secret",
};
```

## Why separate secrets

A token signed with the candidate secret fails verification against the employer secret. So even a valid candidate token can't reach employer routes, because the check fails before any role logic runs.

## `sign(id, role)`

Creates a JWT containing `{ id, role }` that expires in 7 days. It's returned from register and login.

## `requireAuth(role)`

Express middleware:

1. Reads `Authorization: Bearer <token>`.
2. Verifies the token with that role's secret.
3. On success, sets `req.userId` and continues.
4. On failure, returns `401 { ok: false, error }`.

```ts
router.post("/jobs", requireAuth("employer"), handler);
```

## Passwords

Passwords are hashed with `Bun.password.hash` (bcrypt/argon2) when a user registers, and checked with `Bun.password.verify` at login. The hash is never returned: `publicUser()` in the routes removes it.

## In production

Set `EMPLOYER_JWT_SECRET` and `CANDIDATE_JWT_SECRET` to long random values.
