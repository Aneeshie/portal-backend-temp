# Resume parsing (`src/resume.ts`)

## Upload

Multer (in `routes.ts`) receives the `resume` field from the multipart form and keeps it in memory. Nothing is written to disk. Only `application/pdf` and `text/plain` files are accepted, up to 5MB.

## `resumeToText(buffer, mimetype)`

- PDF: uses `unpdf`'s `extractText`, with all pages merged into one string.
- TXT: decodes the file as UTF-8.

## `parseResume(text)`

A simple rule-based parser:

| Field | How it's found |
| --- | --- |
| `skills` | Matches against a fixed list (`KNOWN_SKILLS`: typescript, react, docker, aws and so on). The regex checks word boundaries, so "go" doesn't match "google" |
| `experience` | The first `N years` / `N+ yrs` pattern |
| `email` | The first email-looking string |

Example:

```
Input:  "3 years experience in TypeScript, Node and PostgreSQL, Docker"
Output: { skills: ["typescript","node","postgresql","docker"], experience: 3, email: ... }
```

## What happens after parsing

The route merges the results into the candidate profile:

- Skills are combined with the existing ones, without duplicates.
- Experience is set to whichever is higher, the existing value or the parsed one.
- The full text is saved as `resumeText`, so employers' keyword search can find words in it.

## Limitations

- Only skills on the list are found. Add more to `KNOWN_SKILLS` as needed.
- Scanned PDFs (images) have no text to extract.
