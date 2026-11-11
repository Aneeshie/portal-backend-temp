# Search and recommendations (`src/search.ts`)

## Full-text search: `textSearch<T>(items, query, toText)`

Generic, so the same function searches both jobs and candidates.

1. `tokenize` lowercases the text and splits it on anything that isn't a letter, a digit or `+#.`. That keeps terms like `c++`, `c#` and `next.js` whole.
2. Each item is turned into text with `toText`:
   - `jobText`: title + description + skills + location
   - `candidateText`: name + skills + location + resume text
3. The score is the total number of times the query terms appear in that text.
4. Items with a score of 0 are dropped, and the rest are sorted highest first.

In the routes, the filters run first and `q` then ranks what's left.

## Matching: `matchScore(candidate, job)` → 0–100

| Part | Weight | How |
| --- | --- | --- |
| Skills | 70% | Share of the job's skills the candidate has (case-insensitive) |
| Experience | 20% | `candidate years / required years`, capped at 1. Counts as 1 if the job needs 0 years |
| Location | 10% | 1 if the job is `remote` or in the candidate's location |

Example: the job needs `[typescript, node, postgresql]` and 2 years in Bangalore. The candidate has all three skills and 3 years in Bangalore: `0.7 + 0.2 + 0.1 = 100`.

The same score is used in both directions:

- Candidate → jobs (`/recommendations/jobs`)
- Job → candidates (`/jobs/:id/recommended-candidates`)
- Shown as `matchScore` on each application in `/jobs/:id/applications`

## `rank<T>(items, score, limit = 10)`

Generic: scores every item, removes zeros, sorts highest first, keeps the top `limit` and returns `Scored<T>[]`.
