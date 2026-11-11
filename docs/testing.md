# Testing (`bruno/`)

## Contents

```
bruno/
  bruno.json              collection config
  environments/local.bru  baseUrl = http://localhost:3000/api
  01 … 22 *.bru           requests, run in order
  sample-resume.txt       used by "09 Upload Resume"
```

## Chained variables

Some requests save values for later requests in a `script:post-response` block:

| Request | Saves |
| --- | --- |
| 02 Employer Login | `employerToken` |
| 04 Candidate Login | `candidateToken` |
| 10 Create Job | `jobId` |
| 15 Apply To Job | `applicationId` |

Each request also has a test that checks `res.body.ok === true`.

## Running

1. Start the server and leave it running:
   ```bash
   bun run dev
   ```
2. Run the collection, either:
   - **In the Bruno app**: open the `bruno/` folder, choose the `local` environment and run the collection, or
   - **From the command line**:
     ```bash
     cd bruno && bunx @usebruno/cli run --env local
     ```

## Troubleshooting

| What you see | Cause | Fix |
| --- | --- | --- |
| Every request fails with an empty status `()` | The server isn't running | Start `bun run dev` first |
| Register requests return 409 | Users from the last run are still in memory | Restart the server |
| A `.bru` file is skipped | Syntax error in that file | File uploads must use `body:multipart-form { ... }` |
