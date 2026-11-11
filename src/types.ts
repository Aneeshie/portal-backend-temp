// Roles
export type Role = "employer" | "candidate";

// Generic base entity
export interface Entity {
  id: string;
  createdAt: string;
}

// Role-specific profile data
export interface EmployerData {
  companyName: string;
  website?: string;
  description?: string;
}

export interface CandidateData {
  name: string;
  location?: string;
  skills: string[];
  experience: number; // years
  resumeText?: string;
}

// Maps a role to its profile data
export type ProfileData<R extends Role> = R extends "employer" ? EmployerData : CandidateData;

// Generic user model that works for both employers and candidates
export interface User<R extends Role> extends Entity {
  role: R;
  email: string;
  password: string;
  profile: ProfileData<R>;
}

export type Employer = User<"employer">;
export type Candidate = User<"candidate">;
export type AnyUser = Employer | Candidate;

export type JobType = "full-time" | "part-time" | "contract" | "internship";

export interface Job extends Entity {
  employerId: string;
  title: string;
  description: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  experience: number; // min years
  skills: string[];
  type: JobType;
  open: boolean;
}

export type ApplicationStatus = "applied" | "reviewing" | "interview" | "rejected" | "hired";

export interface Application extends Entity {
  jobId: string;
  candidateId: string;
  coverLetter?: string;
  status: ApplicationStatus;
}

// Generic API response
export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

// Generic scored result (search + recommendations)
export interface Scored<T> {
  item: T;
  score: number;
}
