# Architecture

```
Client ──▶ index.ts (Express) ──▶ /api ──▶ src/routes.ts
                                              │
              ┌───────────────┬───────────────┼──────────────┬─────────────┐
              ▼               ▼               ▼              ▼             ▼
          auth.ts         store.ts       search.ts      resume.ts      email.ts
        (JWT check)   (in-memory data)  (search/match)  (parse CV)   (notify)
                              ▲
                          types.ts (shared models used everywhere)
```

## `index.ts`

The entry point. It:

1. Creates the Express app.
2. Adds `express.json()` so JSON request bodies are parsed into `req.body`.
3. Mounts all routes under `/api`.
4. Adds an error handler that turns any thrown error into `500 { ok: false, error }`.
5. Listens on `PORT` (default 3000).

## Request lifecycle

Take `POST /api/jobs/:id/apply` as an example:

1. Express matches the route in `routes.ts`.
2. `requireAuth("candidate")` checks the Bearer token against the candidate secret and sets `req.userId`.
3. The handler loads the job from `db.jobs`, checks that the candidate hasn't already applied, and creates the application in `db.applications`.
4. `sendEmail` notifies the employer and the candidate. It isn't awaited, so the response isn't held up.
5. The handler responds with `{ ok: true, data: application }`.

## Design choices

- **In-memory storage**: no database to set up. Data is cleared on restart.
- **One response shape**: every response is `{ ok: true, data }` or `{ ok: false, error }`.
- **Few dependencies**: only express, jsonwebtoken, multer, nodemailer and unpdf. Password hashing uses Bun's built-in `Bun.password`.
