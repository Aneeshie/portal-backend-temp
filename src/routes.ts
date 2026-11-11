import { Router, type Response } from "express";
import multer from "multer";
import { db } from "./store";
import { sign, requireAuth, type AuthRequest } from "./auth";
import { sendEmail } from "./email";
import { resumeToText, parseResume } from "./resume";
import { textSearch, jobText, candidateText, matchScore, rank } from "./search";
import type {
  ApiResponse, Role, User, ProfileData, Candidate, Employer, Job, ApplicationStatus,
} from "./types";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ["application/pdf", "text/plain"].includes(file.mimetype)),
});

const ok = <T>(res: Response, data: T, status = 200) => res.status(status).json({ ok: true, data } as ApiResponse<T>);
const fail = (res: Response, status: number, error: string) => res.status(status).json({ ok: false, error } as ApiResponse<never>);

// Strip password before returning a user
const publicUser = <R extends Role>({ password, ...u }: User<R>) => u;

const getUser = <R extends Role>(id: string | undefined, role: R) => {
  const u = id ? db.users.get(id) : undefined;
  return u && u.role === role ? (u as User<R>) : undefined;
};

/* ---------- Auth (generic for both roles) ---------- */
for (const role of ["employer", "candidate"] as const) {
  router.post(`/${role}s/register`, async (req, res) => {
    const { email, password, ...profile } = req.body ?? {};
    if (!email || !password) return fail(res, 400, "email and password required");
    if (db.users.find((u) => u.email === email && u.role === role).length) return fail(res, 409, "Email already registered");
    if (role === "employer" && !profile.companyName) return fail(res, 400, "companyName required");
    if (role === "candidate" && !profile.name) return fail(res, 400, "name required");
    const data: ProfileData<typeof role> =
      role === "candidate" ? { skills: [], experience: 0, ...profile } : profile;
    const user = db.users.create({ role, email, password: await Bun.password.hash(password), profile: data } as any);
    ok(res, { token: sign(user.id, role), user: publicUser(user) }, 201);
  });

  router.post(`/${role}s/login`, async (req, res) => {
    const { email, password } = req.body ?? {};
    const user = db.users.find((u) => u.email === email && u.role === role)[0];
    if (!user || !(await Bun.password.verify(password ?? "", user.password))) return fail(res, 401, "Invalid credentials");
    ok(res, { token: sign(user.id, role), user: publicUser(user) });
  });

  router.get(`/${role}s/me`, requireAuth(role), (req: AuthRequest, res) => {
    const user = getUser(req.userId, role);
    user ? ok(res, publicUser(user)) : fail(res, 404, "Not found");
  });

  router.put(`/${role}s/me`, requireAuth(role), (req: AuthRequest, res) => {
    const user = getUser(req.userId, role);
    if (!user) return fail(res, 404, "Not found");
    const updated = db.users.update(user.id, { profile: { ...user.profile, ...req.body } } as any)!;
    ok(res, publicUser(updated));
  });
}

/* ---------- Resume upload + parsing ---------- */
router.post("/candidates/me/resume", requireAuth("candidate"), upload.single("resume"), async (req: AuthRequest, res) => {
  const user = getUser(req.userId, "candidate");
  if (!user) return fail(res, 404, "Not found");
  if (!req.file) return fail(res, 400, "Upload a PDF or TXT file in field 'resume'");
  const text = await resumeToText(req.file.buffer, req.file.mimetype);
  const parsed = parseResume(text);
  const skills = [...new Set([...user.profile.skills, ...parsed.skills])];
  const experience = Math.max(user.profile.experience, parsed.experience);
  const updated = db.users.update(user.id, { profile: { ...user.profile, skills, experience, resumeText: text } }) as Candidate;
  ok(res, { parsed, profile: publicUser(updated).profile });
});

/* ---------- Jobs ---------- */
router.post("/jobs", requireAuth("employer"), (req: AuthRequest, res) => {
  const { title, description, location, salaryMin = 0, salaryMax = 0, experience = 0, skills = [], type = "full-time" } = req.body ?? {};
  if (!title || !description || !location) return fail(res, 400, "title, description, location required");
  const job = db.jobs.create({
    employerId: req.userId!, title, description, location,
    salaryMin: Number(salaryMin), salaryMax: Number(salaryMax), experience: Number(experience),
    skills, type, open: true,
  });
  ok(res, job, 201);
});

// Search with filters: q, location, minSalary, maxSalary, experience, skills (comma separated), type
router.get("/jobs", (req, res) => {
  const { q, location, minSalary, maxSalary, experience, skills, type } = req.query as Record<string, string | undefined>;
  const wanted = skills?.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) ?? [];
  let jobs = db.jobs.find((j) =>
    j.open &&
    (!location || j.location.toLowerCase().includes(location.toLowerCase())) &&
    (!minSalary || j.salaryMax >= Number(minSalary)) &&
    (!maxSalary || j.salaryMin <= Number(maxSalary)) &&
    (!experience || j.experience <= Number(experience)) &&
    (!type || j.type === type) &&
    wanted.every((s) => j.skills.some((js) => js.toLowerCase() === s))
  );
  if (q) jobs = textSearch(jobs, q, jobText).map((r) => r.item);
  ok(res, jobs);
});

router.get("/jobs/mine", requireAuth("employer"), (req: AuthRequest, res) =>
  ok(res, db.jobs.find((j) => j.employerId === req.userId))
);

router.get("/jobs/:id", (req, res) => {
  const job = db.jobs.get(req.params.id);
  job ? ok(res, job) : fail(res, 404, "Job not found");
});

const ownJob = (req: AuthRequest, res: Response): Job | undefined => {
  const job = db.jobs.get(req.params.id as string);
  if (!job || job.employerId !== req.userId) { fail(res, 404, "Job not found"); return; }
  return job;
};

router.put("/jobs/:id", requireAuth("employer"), (req: AuthRequest, res) => {
  const job = ownJob(req, res);
  if (job) ok(res, db.jobs.update(job.id, { ...req.body, employerId: job.employerId }));
});

router.delete("/jobs/:id", requireAuth("employer"), (req: AuthRequest, res) => {
  const job = ownJob(req, res);
  if (job) { db.jobs.delete(job.id); ok(res, { deleted: true }); }
});

/* ---------- Applications ---------- */
router.post("/jobs/:id/apply", requireAuth("candidate"), async (req: AuthRequest, res) => {
  const job = db.jobs.get(req.params.id as string);
  if (!job || !job.open) return fail(res, 404, "Job not found");
  if (db.applications.find((a) => a.jobId === job.id && a.candidateId === req.userId).length) return fail(res, 409, "Already applied");
  const app = db.applications.create({ jobId: job.id, candidateId: req.userId!, coverLetter: req.body?.coverLetter, status: "applied" });
  const employer = getUser(job.employerId, "employer");
  const candidate = getUser(req.userId, "candidate")!;
  if (employer) sendEmail(employer.email, `New application: ${job.title}`, `${candidate.profile.name} applied for ${job.title}.`);
  sendEmail(candidate.email, `Application received: ${job.title}`, `Your application for ${job.title} was submitted.`);
  ok(res, app, 201);
});

router.get("/applications/mine", requireAuth("candidate"), (req: AuthRequest, res) =>
  ok(res, db.applications.find((a) => a.candidateId === req.userId).map((a) => ({ ...a, job: db.jobs.get(a.jobId) })))
);

router.get("/jobs/:id/applications", requireAuth("employer"), (req: AuthRequest, res) => {
  const job = ownJob(req, res);
  if (!job) return;
  ok(res, db.applications.find((a) => a.jobId === job.id).map((a) => {
    const c = getUser(a.candidateId, "candidate");
    return { ...a, candidate: c && publicUser(c), matchScore: c ? matchScore(c, job) : 0 };
  }));
});

const STATUSES: ApplicationStatus[] = ["applied", "reviewing", "interview", "rejected", "hired"];
router.patch("/applications/:id/status", requireAuth("employer"), (req: AuthRequest, res) => {
  const app = db.applications.get(req.params.id as string);
  const job = app && db.jobs.get(app.jobId);
  if (!app || !job || job.employerId !== req.userId) return fail(res, 404, "Application not found");
  const status = req.body?.status as ApplicationStatus;
  if (!STATUSES.includes(status)) return fail(res, 400, `status must be one of ${STATUSES.join(", ")}`);
  const updated = db.applications.update(app.id, { status })!;
  const candidate = getUser(app.candidateId, "candidate");
  if (candidate) sendEmail(candidate.email, `Application update: ${job.title}`, `Your application status is now "${status}".`);
  ok(res, updated);
});

/* ---------- Candidate search (employers) ---------- */
router.get("/candidates", requireAuth("employer"), (req, res) => {
  const { q, location, experience, skills } = req.query as Record<string, string | undefined>;
  const wanted = skills?.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) ?? [];
  let list = db.users.find((u) => u.role === "candidate") as Candidate[];
  list = list.filter((c) =>
    (!location || (c.profile.location ?? "").toLowerCase().includes(location.toLowerCase())) &&
    (!experience || c.profile.experience >= Number(experience)) &&
    wanted.every((s) => c.profile.skills.some((cs) => cs.toLowerCase() === s))
  );
  if (q) list = textSearch(list, q, candidateText).map((r) => r.item);
  ok(res, list.map((c) => { const { resumeText, ...profile } = c.profile; return { ...publicUser(c), profile }; }));
});

/* ---------- Recommendations ---------- */
router.get("/recommendations/jobs", requireAuth("candidate"), (req: AuthRequest, res) => {
  const c = getUser(req.userId, "candidate")!;
  ok(res, rank(db.jobs.find((j) => j.open), (j) => matchScore(c, j)));
});

router.get("/jobs/:id/recommended-candidates", requireAuth("employer"), (req: AuthRequest, res) => {
  const job = ownJob(req, res);
  if (!job) return;
  const candidates = db.users.find((u) => u.role === "candidate") as Candidate[];
  ok(res, rank(candidates, (c) => matchScore(c, job)).map((r) => ({ score: r.score, candidate: { id: r.item.id, ...r.item.profile, resumeText: undefined } })));
});

export default router;
