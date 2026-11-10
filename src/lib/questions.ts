import { activeJobs, Answers, emptyJob, Job, YesNo } from './answers';

export const TOTAL_QUESTIONS = 11;

type TextField = 'targetJob' | 'extra' | 'education' | 'skills' | 'certificates' | 'bestAt';
type JobTextField = 'dayToDay' | 'proudest';

export type Step =
  | { id: string; number: number; kind: 'text'; field: TextField; prompt: string; hint?: string; placeholder: string }
  | { id: string; number: number; kind: 'jobText'; job: number; field: JobTextField; prompt: string; hint?: string; placeholder: string }
  | { id: string; number: number; kind: 'jobInfo'; job: number; prompt: string; hint?: string }
  | { id: string; number: number; kind: 'hasJob'; prompt: string; hint?: string }
  | { id: string; number: number; kind: 'anotherJob'; job: number; prompt: string; hint?: string };

const q = {
  targetJob: {
    number: 1,
    kind: 'text',
    field: 'targetJob',
    prompt: 'What kind of job are you applying for?',
    hint: "We won't print this. It helps us put your best skills and results first.",
    placeholder: 'For example: warehouse supervisor, cashier, home health aide…',
  },
  hasJob: {
    number: 2,
    kind: 'hasJob',
    prompt: 'Have you had a job before?',
    hint: 'Any paid work counts, even part-time or short jobs.',
  },
  jobInfo: {
    number: 3,
    prompt: 'What was your most recent job title, where, and when did you start and finish?',
  },
  dayToDay: {
    number: 4,
    field: 'dayToDay',
    prompt: 'What did you do there day to day?',
    placeholder: 'I ran a team of six on the night shift, checked orders and trained new people…',
  },
  proudest: {
    number: 5,
    field: 'proudest',
    prompt: 'What are you proudest of from that job?',
    hint: 'A number helps: people, money, time.',
    placeholder: 'Cut order errors by 30%. Trained 12 new hires…',
  },
  anotherJob: {
    number: 6,
    prompt: 'Do you have another job to add?',
  },
  extra: {
    number: 7,
    field: 'extra',
    prompt: 'Any volunteering, school projects or side work?',
    placeholder: 'Food bank volunteer on weekends, fixed bikes for neighbors…',
  },
  education: {
    number: 8,
    field: 'education',
    prompt: 'What school or training have you done?',
    placeholder: 'Lincoln High School, 2018. Forklift training at…',
  },
  skills: {
    number: 9,
    field: 'skills',
    prompt: 'What tools, skills or languages are you good at?',
    hint: 'Separate them with commas.',
    placeholder: 'Forklift, inventory, Excel, Spanish…',
  },
  certificates: {
    number: 10,
    field: 'certificates',
    prompt: 'Any certificates or licenses?',
    placeholder: "OSHA 10, food handler card, driver's license…",
  },
  bestAt: {
    number: 11,
    field: 'bestAt',
    prompt: "What would a past boss or teacher say you're best at?",
    hint: 'We use this for the summary at the top of your resume.',
    placeholder: 'Keeping busy shifts running on time…',
  },
} as const;

/**
 * The questions to show, in order, given the answers so far.
 * - "No" (or skip) on "Have you had a job before?" jumps to question 7.
 * - "Yes" on "Another job?" repeats questions 3 to 5 for the next job.
 */
export function buildSteps(a: Answers): Step[] {
  const steps: Step[] = [
    { id: 'targetJob', ...q.targetJob },
    { id: 'hasJob', ...q.hasJob },
  ];

  activeJobs(a).forEach((_, job) => {
    const n = job + 1;
    const later = job > 0;
    steps.push(
      {
        id: `job${n}:info`,
        kind: 'jobInfo',
        job,
        number: q.jobInfo.number,
        prompt: later
          ? 'What was the job title, where, and when did you start and finish?'
          : q.jobInfo.prompt,
        hint: later ? `Job ${n}` : 'Your most recent job title goes under your name.',
      },
      { id: `job${n}:dayToDay`, kind: 'jobText', job, ...q.dayToDay, hint: later ? `Job ${n}` : undefined },
      { id: `job${n}:proudest`, kind: 'jobText', job, ...q.proudest, hint: later ? `Job ${n} · ${q.proudest.hint}` : q.proudest.hint },
      { id: `job${n}:another`, kind: 'anotherJob', job, ...q.anotherJob },
    );
  });

  steps.push(
    { id: 'extra', ...q.extra, kind: 'text' },
    { id: 'education', ...q.education, kind: 'text' },
    { id: 'skills', ...q.skills, kind: 'text' },
    { id: 'certificates', ...q.certificates, kind: 'text' },
    { id: 'bestAt', ...q.bestAt, kind: 'text' },
  );
  return steps;
}

/** Whether the step has an answer, so "Next" can be enabled. */
export function isAnswered(a: Answers, step: Step): boolean {
  switch (step.kind) {
    case 'text':
      return a[step.field].trim().length > 0;
    case 'jobText':
      return (a.jobs[step.job]?.[step.field] ?? '').trim().length > 0;
    case 'jobInfo': {
      const j = a.jobs[step.job];
      return !!j && [j.title, j.employer, j.start, j.end].some((v) => v.trim().length > 0);
    }
    case 'hasJob':
      return a.hasJob !== null;
    case 'anotherJob':
      return a.jobs[step.job]?.addAnother != null;
  }
}

export function setText(a: Answers, field: TextField, value: string): Answers {
  return { ...a, [field]: value };
}

export function setJob(a: Answers, job: number, patch: Partial<Job>): Answers {
  const jobs = a.jobs.slice();
  while (jobs.length <= job) jobs.push(emptyJob());
  jobs[job] = { ...jobs[job], ...patch };
  return { ...a, jobs };
}

export function setHasJob(a: Answers, value: YesNo): Answers {
  return { ...a, hasJob: value };
}

/** Answering "Yes" makes sure there is a slot for the next job. */
export function setAnotherJob(a: Answers, job: number, value: YesNo): Answers {
  let next = setJob(a, job, { addAnother: value });
  if (value === 'yes') next = setJob(next, job + 1, {});
  return next;
}
