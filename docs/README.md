# Documentation

How the Job Portal API is put together, one page per component.

| Doc | File(s) | What it covers |
| --- | --- | --- |
| [Architecture](architecture.md) | `index.ts` | How a request flows through the app |
| [Types](types.md) | `src/types.ts` | Data models and how generics are used |
| [Store](store.md) | `src/store.ts` | Generic in-memory storage |
| [Auth](auth.md) | `src/auth.ts` | Separate JWT auth for employers and candidates |
| [Routes](routes.md) | `src/routes.ts` | Every endpoint and what it does |
| [Resume parsing](resume.md) | `src/resume.ts` | Resume upload and parsing |
| [Search and recommendations](search.md) | `src/search.ts` | Full-text search, filters and match scoring |
| [Email](email.md) | `src/email.ts` | Application status notifications |
| [Testing](testing.md) | `bruno/` | Running the Bruno collection |
