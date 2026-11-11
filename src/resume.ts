import { extractText } from "unpdf";

const KNOWN_SKILLS = [
  "javascript", "typescript", "python", "java", "go", "rust", "c++", "c#", "ruby", "php",
  "react", "node", "express", "angular", "vue", "next.js", "django", "flask", "spring",
  "sql", "postgresql", "mysql", "mongodb", "redis", "aws", "azure", "gcp", "docker",
  "kubernetes", "git", "graphql", "html", "css", "machine learning", "figma",
];

export async function resumeToText(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === "application/pdf") {
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
    return text;
  }
  return buffer.toString("utf8");
}

export function parseResume(text: string) {
  const lower = text.toLowerCase();
  const skills = KNOWN_SKILLS.filter((s) =>
    new RegExp(`(^|[^a-z])${s.replace(/[.+#]/g, "\\$&")}([^a-z]|$)`).test(lower)
  );
  const exp = lower.match(/(\d+)\+?\s*(years|yrs)/);
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0];
  return { skills, experience: exp ? Number(exp[1]) : 0, email };
}
