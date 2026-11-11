# Email notifications (`src/email.ts`)

Sent with nodemailer.

## Transport

- If `SMTP_HOST` is set, emails go out through that SMTP server (`SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
- If not, nodemailer's `jsonTransport` builds the email without sending it. It's only logged, which suits local development.

Each email is logged as:

```
[email] to=jane@mail.com subject="Application update: Backend Engineer"
```

## When emails are sent

| Event | Recipient | Subject |
| --- | --- | --- |
| Candidate applies | Employer | `New application: <job>` |
| Candidate applies | Candidate | `Application received: <job>` |
| Employer changes the status | Candidate | `Application update: <job>` |

## Failure handling

`sendEmail` catches and logs its own errors, and routes don't await it. A failed email never fails the API request.

## Testing real delivery

Use a free SMTP test inbox (for example Mailtrap or Ethereal) and set the `SMTP_*` variables.
