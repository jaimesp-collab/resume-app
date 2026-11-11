import { activeJobs, Answers } from './answers';

export type ResumeJob = {
  title: string;
  employer: string;
  city: string;
  dates: string;
  bullets: string[];
};

export type ResumeEducation = { school: string; studied: string; when: string };
export type ResumeCertificate = { name: string; year: string };
export type ResumeLanguage = { name: string; level: string };

/** Everything printed on the resume. Every format renders from this. */
export type Resume = {
  name: string;
  /** Most recent job title. Left out (null) when the user has no job. */
  headline: string | null;
  city: string;
  phone: string;
  email: string;
  link: string;
  summary: string;
  experience: ResumeJob[];
  education: ResumeEducation[];
  skills: string[];
  certificates: ResumeCertificate[];
  languages: ResumeLanguage[];
  other: string[];
  /** One line, e.g. "Part time, evenings and weekends. Can start right away." */
  availability: string;
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
  return rankByTargetWith(items, (s) => s, targetJob);
}

export function rankByTargetWith<T>(items: T[], text: (item: T) => string, targetJob: string): T[] {
  const target = stems(targetJob);
  if (target.size === 0) return items;
  return items
    .map((item, i) => ({ item, i, score: relevance(text(item), target) }))
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

function dates(start: string, end: string, current: boolean): string {
  const s = start.trim();
  const e = current ? 'Present' : end.trim();
  if (s && e) return `${s} to ${e}`;
  return s || e;
}

/** "a", "a and b", "a, b and c". */
export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function availabilityLine(a: Answers['availability']): string {
  const parts: string[] = [];
  if (a.times.length) {
    // Keep the chip order (Full time, Part time, Mornings…), lower-case after the first.
    const words = a.times.map((t, i) => (i === 0 ? t : t.toLowerCase()));
    parts.push(`${joinAnd(words)}.`);
  }
  const start = a.startDate.trim();
  if (a.rightAway) parts.push('Can start right away.');
  else if (start) parts.push(`Can start ${start.replace(/[.]+$/, '')}.`);
  return parts.join(' ');
}

export function buildResume(a: Answers): Resume {
  const jobs = activeJobs(a);
  const target = a.targetJob;

  const experience: ResumeJob[] = jobs
    .filter((j) => [j.title, j.employer, j.dayToDay, j.proudest].some((v) => v.trim()))
    .map((j) => ({
      title: j.title.trim(),
      employer: j.employer.trim(),
      city: j.city.trim(),
      dates: dates(j.start, j.end, j.current),
      // Results first, then day-to-day duties; within each, what matters for the target job first.
      bullets: [...rankByTarget(splitLines(j.proudest), target), ...rankByTarget(splitLines(j.dayToDay), target)],
    }));

  const headline = jobs[0]?.title.trim() || null;

  const certificates = a.certificates
    .filter((c) => c.name.trim())
    .map((c) => ({ name: capitalize(c.name.trim()), year: c.year.trim() }));

  return {
    name: a.contact.fullName.trim(),
    headline,
    city: a.contact.city.trim(),
    phone: a.contact.phone.trim(),
    email: a.contact.email.trim(),
    link: a.contact.link.trim(),
    summary: sentence(a.bestAt),
    experience,
    education: a.education
      .filter((e) => e.school.trim() || e.studied.trim())
      .map((e) => ({
        school: capitalize(e.school.trim()),
        studied: capitalize(e.studied.trim()),
        when: e.inProgress ? 'In progress' : e.year.trim(),
      })),
    skills: rankByTarget(splitList(a.skills), target),
    certificates: rankByTargetWith(certificates, (c) => c.name, target),
    languages: a.languages
      .filter((l) => l.name.trim())
      .map((l) => ({ name: capitalize(l.name.trim()), level: l.level ?? '' })),
    other: rankByTarget(splitLines(a.extra), target),
    availability: availabilityLine(a.availability),
  };
}
