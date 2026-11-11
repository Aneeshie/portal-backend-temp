# Types (`src/types.ts`)

All the data models, written with generics so the same model works for both employers and candidates.

## Roles

```ts
type Role = "employer" | "candidate";
```

This union type drives the rest of the file.

## `Entity`

The base for every stored record: `id` and `createdAt`. The store generates both.

## Profiles: a conditional generic

```ts
type ProfileData<R extends Role> = R extends "employer" ? EmployerData : CandidateData;
```

Given a role, this returns the matching profile shape:

- `EmployerData`: `companyName`, `website?`, `description?`
- `CandidateData`: `name`, `location?`, `skills[]`, `experience` (in years), `resumeText?`

## `User<R>`: one model for both roles

```ts
interface User<R extends Role> extends Entity {
  role: R;
  email: string;
  password: string;      // hashed
  profile: ProfileData<R>;
}
type Employer = User<"employer">;
type Candidate = User<"candidate">;
type AnyUser = Employer | Candidate;
```

Because `profile` depends on `R`, TypeScript knows that `candidate.profile.skills` exists and `employer.profile.skills` doesn't. `AnyUser` is a union, so after checking `user.role === "candidate"`, TypeScript narrows it to `Candidate`.

## Jobs and applications

- `Job`: title, description, location, salary range, minimum experience, skills, `type` (`full-time | part-time | contract | internship`) and `open`.
- `Application`: `jobId`, `candidateId`, `coverLetter?` and `status`.
- `ApplicationStatus`: `applied | reviewing | interview | rejected | hired`.

## Generic helpers

```ts
type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };
interface Scored<T> { item: T; score: number }
```

- `ApiResponse<T>` is a discriminated union. Clients check `ok` to know whether to read `data` or `error`.
- `Scored<T>` pairs any item with a score. It's used for both job and candidate results.
