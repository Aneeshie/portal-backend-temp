import nodemailer from "nodemailer";

// Uses SMTP if configured, otherwise just logs the email
const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : nodemailer.createTransport({ jsonTransport: true });

export async function sendEmail(to: string, subject: string, text: string) {
  try {
    await transport.sendMail({ from: process.env.SMTP_FROM ?? "jobs@portal.local", to, subject, text });
    console.log(`[email] to=${to} subject="${subject}"`);
  } catch (e) {
    console.error("[email] failed", e);
  }
}
