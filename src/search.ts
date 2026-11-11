import type { Job, Candidate, Scored } from "./types";

const tokenize = (s: string) => s.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean);

// Generic full-text scoring: counts query-term hits in the item's text
export function textSearch<T>(items: T[], query: string, toText: (item: T) => string): Scored<T>[] {
  const terms = tokenize(query);
  if (!terms.length) return items.map((item) => ({ item, score: 0 }));
  return items
    .map((item) => {
      const words = tokenize(toText(item));
      const score = terms.reduce((sum, t) => sum + words.filter((w) => w === t).length, 0);
      return { item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

export const jobText = (j: Job) => `${j.title} ${j.description} ${j.skills.join(" ")} ${j.location}`;
export const candidateText = (c: Candidate) =>
  `${c.profile.name} ${c.profile.skills.join(" ")} ${c.profile.location ?? ""} ${c.profile.resumeText ?? ""}`;

// Match score 0-100: skills 70%, experience 20%, location 10%
export function matchScore(c: Candidate, j: Job): number {
  const cs = new Set(c.profile.skills.map((s) => s.toLowerCase()));
  const skill = j.skills.length ? j.skills.filter((s) => cs.has(s.toLowerCase())).length / j.skills.length : 0;
  const exp = j.experience === 0 ? 1 : Math.min(c.profile.experience / j.experience, 1);
  const loc =
    j.location.toLowerCase() === "remote" ||
    (c.profile.location ?? "").toLowerCase() === j.location.toLowerCase()
      ? 1
      : 0;
  return Math.round((skill * 0.7 + exp * 0.2 + loc * 0.1) * 100);
}

// Generic ranking helper used for both directions of recommendation
export function rank<T>(items: T[], score: (item: T) => number, limit = 10): Scored<T>[] {
  return items
    .map((item) => ({ item, score: score(item) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
