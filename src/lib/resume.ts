import { activeJobs, Answers } from './answers';

export type ResumeJob = {
  title: string;
  employer: string;
  dates: string;
  bullets: string[];
};

export type Resume = {
  name: string;
  /** Most recent job title. Left out (null) when the user has no job. */
  headline: string | null;
  city: string;
  phone: string;
  email: string;
  summary: string;
  experience: ResumeJob[];
  other: string[];
  skills: string[];
  education: string[];
  certificates: string[];
};

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'job', 'jobs', 'work', 'role', 'position', 'any', 'kind', 'like', 'want',
  'something', 'some', 'that', 'this', 'from', 'into', 'are', 'was', 'were',
]);

/** Rough word stems so "managing" matches "manager" and "warehouses" matches "warehouse". */
function stems(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
      .map((w) => w.slice(0, 5)),
  );
}

function relevance(item: string, target: Set<string>): number {
  let score = 0;
  for (const s of stems(item)) if (target.has(s)) score++;
  return score;
}

/** Stable sort: items that match the target job come first, otherwise keep the user's order. */
export function rankByTarget(items: string[], targetJob: string): string[] {
  const target = stems(targetJob);
  if (target.size === 0) return items;
  return items
    .map((item, i) => ({ item, i, score: relevance(item, target) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.item);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Split free text into short lines: by line breaks, sentences and semicolons. */
export function splitLines(text: string): string[] {
  return text
    .split(/\n|;|(?<=[.!?])\s+/)
    .map((s) => s.trim().replace(/[.]+$/, '').trim())
    .filter(Boolean)
    .map(capitalize);
}

/** Split a list like "Forklift, inventory, Spanish" into items. */
export function splitList(text: string): string[] {
  return text
    .split(/\n|,|;|·|•/)
    .map((s) => s.trim().replace(/[.]+$/, ''))
    .filter(Boolean)
    .map(capitalize);
}

function sentence(text: string): string {
  const t = text.trim();
  if (!t) return '';
  return capitalize(/[.!?]$/.test(t) ? t : `${t}.`);
}

function dates(start: string, end: string): string {
  const s = start.trim();
  const e = end.trim();
  if (s && e) return `${s} to ${e}`;
  return s || e;
}

export function buildResume(a: Answers): Resume {
  const jobs = activeJobs(a);
  const target = a.targetJob;

  const experience: ResumeJob[] = jobs
    .filter((j) => [j.title, j.employer, j.dayToDay, j.proudest].some((v) => v.trim()))
    .map((j) => ({
      title: j.title.trim(),
      employer: j.employer.trim(),
      dates: dates(j.start, j.end),
      // Results first, then day-to-day duties; within each, what matters for the target job first.
      bullets: [...rankByTarget(splitLines(j.proudest), target), ...rankByTarget(splitLines(j.dayToDay), target)],
    }));

  const headline = jobs[0]?.title.trim() || null;

  return {
    name: a.contact.fullName.trim(),
    headline,
    city: a.contact.city.trim(),
    phone: a.contact.phone.trim(),
    email: a.contact.email.trim(),
    summary: sentence(a.bestAt),
    experience,
    other: rankByTarget(splitLines(a.extra), target),
    skills: rankByTarget(splitList(a.skills), target),
    education: splitLines(a.education),
    certificates: rankByTarget(splitLines(a.certificates), target),
  };
}
