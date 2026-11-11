# Job Portal API

A simple job portal REST API built with Bun, Express and TypeScript.

- Employer and candidate profiles, with separate JWT auth for each
- Job posting management (create, update, delete)
- Job search with filters: keyword, location, salary, experience, skills, type
- Applications with status tracking and email notifications
- Resume upload (PDF/TXT) with parsing for skills, experience and email
- Job ↔ candidate recommendations

Data is stored in memory and is lost when the server restarts.

## Setup

```bash
bun install
bun run dev
```

The server runs on `http://localhost:3000`, and every route is under `/api`.

### Environment variables (optional)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Server port |
| `EMPLOYER_JWT_SECRET` | `employer-secret` | Secret for employer tokens |
| `CANDIDATE_JWT_SECRET` | `candidate-secret` | Secret for candidate tokens |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | none | Email delivery. If `SMTP_HOST` is not set, emails are only logged to the console. |

## Project structure

```
index.ts          Express app entry point
src/types.ts      Generic models (User<R>, ProfileData<R>, ApiResponse<T>, Scored<T>)
src/store.ts      Generic in-memory Store<T>
src/auth.ts       JWT sign/verify with separate secrets per role
src/routes.ts     All endpoints
src/resume.ts     Resume text extraction and parsing
src/search.ts     Full-text search, match scoring, ranking
src/email.ts      Email notifications (nodemailer)
bruno/            Bruno API collection
```

## How TypeScript generics are used

- `User<R extends Role>` is one model for both roles. Its `profile` type comes from `ProfileData<R>`, so it is `EmployerData` for employers and `CandidateData` for candidates.
- `Store<T extends Entity>` is a single reusable repository for users, jobs and applications.
- `ApiResponse<T>` is a union type: `{ ok: true, data: T } | { ok: false, error: string }`.
- `textSearch<T>` and `rank<T>` work on any item type, for both job and candidate search.

## Matching

`matchScore` returns a value from 0 to 100:

- 70% skills: the share of the job's skills the candidate has
- 20% experience: candidate years compared to the job's required years, capped at 100%
- 10% location: same city as the job, or the job is remote

## Endpoints

Auth: 🅴 = employer token, 🅲 = candidate token, sent as `Authorization: Bearer <token>`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/employers/register` | | `{email, password, companyName, website?, description?}` |
| POST | `/api/employers/login` | | Returns a token |
| GET/PUT | `/api/employers/me` | 🅴 | Get or update profile |
| POST | `/api/candidates/register` | | `{email, password, name, location?, skills?, experience?}` |
| POST | `/api/candidates/login` | | Returns a token |
| GET/PUT | `/api/candidates/me` | 🅲 | Get or update profile |
| POST | `/api/candidates/me/resume` | 🅲 | Multipart field `resume` (PDF/TXT, 5MB max). Merges parsed skills and experience into the profile |
| POST | `/api/jobs` | 🅴 | Create a job |
| GET | `/api/jobs` | | Search: `q, location, minSalary, maxSalary, experience, skills (comma separated), type` |
| GET | `/api/jobs/mine` | 🅴 | Your jobs |
| GET | `/api/jobs/:id` | | Job details |
| PUT/DELETE | `/api/jobs/:id` | 🅴 | Update or delete your job (`{"open": false}` closes it) |
| POST | `/api/jobs/:id/apply` | 🅲 | `{coverLetter?}`. Emails the employer and the candidate |
| GET | `/api/applications/mine` | 🅲 | Your applications with their status |
| GET | `/api/jobs/:id/applications` | 🅴 | Applicants with match scores |
| PATCH | `/api/applications/:id/status` | 🅴 | `{status}`: `applied, reviewing, interview, rejected, hired`. Emails the candidate |
| GET | `/api/candidates` | 🅴 | Search: `q, location, experience (min), skills` |
| GET | `/api/recommendations/jobs` | 🅲 | Recommended jobs for you |
| GET | `/api/jobs/:id/recommended-candidates` | 🅴 | Recommended candidates for your job |

## Testing with Bruno

1. Start the server with `bun run dev`.
2. In Bruno, open the collection from the `bruno/` folder.
3. Select the `local` environment.
4. Run the collection in order.

The login, create job and apply requests save `employerToken`, `candidateToken`, `jobId` and `applicationId` automatically, so later requests can use them. The resume upload uses `bruno/sample-resume.txt`.

You can also run the whole collection from the command line:

```bash
cd bruno && bunx @usebruno/cli run --env local
```

Restart the server before re-running the collection, because the register requests fail if the users already exist.
