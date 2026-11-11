# Routes (`src/routes.ts`)

Every endpoint lives in a single Express `Router` mounted at `/api`.

## Helpers at the top

- `upload`: multer that keeps files in memory, accepts only PDF and TXT, and caps size at 5MB.
- `ok(res, data)` and `fail(res, status, error)`: build the `ApiResponse<T>` shape.
- `publicUser(user)`: generic over the role; removes `password`.
- `getUser(id, role)`: generic; loads a user and returns it only if the role matches, typed as `User<R>`.

## Auth and profile routes (generated for both roles)

```ts
for (const role of ["employer", "candidate"] as const) { ... }
```

This one loop creates the same four routes for each role:

| Route | What it does |
| --- | --- |
| `POST /{role}s/register` | Checks fields (`companyName` for employers, `name` for candidates), rejects duplicate emails, hashes the password, returns a token and the user |
| `POST /{role}s/login` | Checks the password and returns a token |
| `GET /{role}s/me` | Returns your profile |
| `PUT /{role}s/me` | Merges the request body into your profile |

## Resume

`POST /candidates/me/resume` (candidate). Takes the `resume` file, extracts its text, parses it, merges the found skills into the profile (without duplicates), keeps the higher of the two experience values and stores the text for search. See [resume.md](resume.md).

## Jobs

| Route | Auth | Notes |
| --- | --- | --- |
| `POST /jobs` | employer | Needs `title`, `description`, `location`. Other fields have defaults |
| `GET /jobs` | public | Search with filters (below). Only open jobs |
| `GET /jobs/mine` | employer | Your jobs, including closed ones |
| `GET /jobs/:id` | public | |
| `PUT /jobs/:id` | employer (owner) | Partial update. `{"open": false}` closes the job |
| `DELETE /jobs/:id` | employer (owner) | |

`ownJob()` makes sure the job belongs to the logged-in employer. If not, it returns 404 rather than 403, so it doesn't reveal that the job exists.

### Job search filters

| Query | Meaning |
| --- | --- |
| `q` | Keyword search over title, description, skills and location (ranked) |
| `location` | Substring match, case-insensitive |
| `minSalary` | Job's `salaryMax` ≥ value |
| `maxSalary` | Job's `salaryMin` ≤ value |
| `experience` | Your years: shows jobs that need this many years or fewer |
| `skills` | Comma-separated. The job must have **all** of them |
| `type` | `full-time`, `part-time`, `contract` or `internship` |

## Applications

| Route | Auth | Notes |
| --- | --- | --- |
| `POST /jobs/:id/apply` | candidate | One application per job. Emails both sides |
| `GET /applications/mine` | candidate | Your applications, each with its job attached |
| `GET /jobs/:id/applications` | employer (owner) | Applicants with their profile and `matchScore` |
| `PATCH /applications/:id/status` | employer (owner) | Checks the status value and emails the candidate |

## Candidate search

`GET /candidates` (employer). Filters: `q`, `location`, `experience` (minimum years) and `skills` (must have all). The stored resume text is left out of the response.

## Recommendations

- `GET /recommendations/jobs` (candidate): the top 10 open jobs by match score.
- `GET /jobs/:id/recommended-candidates` (employer, owner): the top 10 candidates for that job.

Both use `matchScore` and `rank` from [search.md](search.md).
