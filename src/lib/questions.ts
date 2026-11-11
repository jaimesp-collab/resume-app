import {
  Answers,
  Availability,
  CertificateItem,
  EducationItem,
  emptyCertificate,
  emptyEducation,
  emptyJob,
  emptyLanguage,
  Job,
  LanguageItem,
  YesNo,
} from './answers';

export const TOTAL_QUESTIONS = 13;

type TextField = 'targetJob' | 'extra' | 'skills' | 'bestAt';
type JobTextField = 'dayToDay' | 'proudest';

type Base = { id: string; number: number; prompt: string; hint?: string };

export type Step =
  | (Base & { kind: 'text'; field: TextField; placeholder: string })
  | (Base & { kind: 'jobText'; job: number; field: JobTextField; placeholder: string })
  | (Base & { kind: 'jobInfo'; job: number })
  | (Base & { kind: 'hasJob' })
  | (Base & { kind: 'anotherJob'; job: number })
  | (Base & { kind: 'education' })
  | (Base & { kind: 'languages' })
  | (Base & { kind: 'certificates' })
  | (Base & { kind: 'availability' });

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
    kind: 'text',
    field: 'extra',
    prompt: 'Any volunteering, school projects or side work?',
    placeholder: 'Food bank volunteer on weekends, fixed bikes for neighbors…',
  },
  education: {
    number: 8,
    kind: 'education',
    prompt: 'What school or training have you done?',
    hint: 'High school, GED, college, trade school or job training all count.',
  },
  skills: {
    number: 9,
    kind: 'text',
    field: 'skills',
    prompt: 'What tools or skills are you good at?',
    hint: 'Separate them with commas.',
    placeholder: 'Forklift, inventory, cash register, Excel…',
  },
  languages: {
    number: 10,
    kind: 'languages',
    prompt: 'What languages do you speak, and how well?',
    hint: 'Add each language and pick a level.',
  },
  certificates: {
    number: 11,
    kind: 'certificates',
    prompt: 'Any certificates, licenses or awards?',
    hint: 'For example: food handler card, forklift license, CPR, employee of the month.',
  },
  availability: {
    number: 12,
    kind: 'availability',
    prompt: 'When can you work?',
    hint: 'Tap all that fit.',
  },
  bestAt: {
    number: 13,
    kind: 'text',
    field: 'bestAt',
    prompt: "What would a past boss or teacher say you're best at?",
    hint: 'We use this for the summary at the top of your resume.',
    placeholder: 'Keeping busy shifts running on time…',
  },
} as const;

/**
 * The questions to show, in order, given the answers so far.
 * - "No" (or skip) on "Have you had a job before?" jumps to the volunteering question.
 * - "Yes" on "Another job?" repeats the job questions for the next job.
 */
export function buildSteps(a: Answers): Step[] {
  const steps: Step[] = [
    { id: 'targetJob', ...q.targetJob },
    { id: 'hasJob', ...q.hasJob },
  ];

  const jobCount = a.hasJob === 'yes' ? countActiveJobs(a) : 0;
  for (let job = 0; job < jobCount; job++) {
    const n = job + 1;
    const later = job > 0;
    steps.push(
      {
        id: `job${n}:info`,
        kind: 'jobInfo',
        job,
        number: q.jobInfo.number,
        prompt: later ? 'What was the job title, where, and when did you start and finish?' : q.jobInfo.prompt,
        hint: later ? `Job ${n}` : 'Your most recent job title goes under your name.',
      },
      { id: `job${n}:dayToDay`, kind: 'jobText', job, ...q.dayToDay, hint: later ? `Job ${n}` : undefined },
      {
        id: `job${n}:proudest`,
        kind: 'jobText',
        job,
        ...q.proudest,
        hint: later ? `Job ${n} · ${q.proudest.hint}` : q.proudest.hint,
      },
      { id: `job${n}:another`, kind: 'anotherJob', job, ...q.anotherJob },
    );
  }

  steps.push(
    { id: 'extra', ...q.extra },
    { id: 'education', ...q.education },
    { id: 'skills', ...q.skills },
    { id: 'languages', ...q.languages },
    { id: 'certificates', ...q.certificates },
    { id: 'availability', ...q.availability },
    { id: 'bestAt', ...q.bestAt },
  );
  return steps;
}

function countActiveJobs(a: Answers): number {
  let n = 0;
  for (const job of a.jobs) {
    n++;
    if (job.addAnother !== 'yes') break;
  }
  return n;
}

const filled = (s: string) => s.trim().length > 0;

/** Whether the step has an answer, so "Next" can be enabled. */
export function isAnswered(a: Answers, step: Step): boolean {
  switch (step.kind) {
    case 'text':
      return filled(a[step.field]);
    case 'jobText':
      return filled(a.jobs[step.job]?.[step.field] ?? '');
    case 'jobInfo': {
      const j = a.jobs[step.job];
      return !!j && ([j.title, j.employer, j.city, j.start, j.end].some(filled) || j.current);
    }
    case 'hasJob':
      return a.hasJob !== null;
    case 'anotherJob':
      return a.jobs[step.job]?.addAnother != null;
    case 'education':
      return a.education.some((e) => filled(e.school) || filled(e.studied));
    case 'languages':
      return a.languages.some((l) => filled(l.name));
    case 'certificates':
      return a.certificates.some((c) => filled(c.name));
    case 'availability':
      return a.availability.times.length > 0 || a.availability.rightAway || filled(a.availability.startDate);
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

type ListKey = 'education' | 'languages' | 'certificates';
type ListItem = { education: EducationItem; languages: LanguageItem; certificates: CertificateItem };

const emptyItem: { [K in ListKey]: () => ListItem[K] } = {
  education: emptyEducation,
  languages: emptyLanguage,
  certificates: emptyCertificate,
};

export function setItem<K extends ListKey>(a: Answers, key: K, index: number, patch: Partial<ListItem[K]>): Answers {
  const list = (a[key] as ListItem[K][]).slice();
  list[index] = { ...list[index], ...patch };
  return { ...a, [key]: list };
}

export function addItem(a: Answers, key: ListKey): Answers {
  return { ...a, [key]: [...(a[key] as ListItem[typeof key][]), emptyItem[key]()] };
}

/** Removing the last item leaves one empty item, so there is always a box to type in. */
export function removeItem(a: Answers, key: ListKey, index: number): Answers {
  const list = (a[key] as ListItem[typeof key][]).filter((_, i) => i !== index);
  return { ...a, [key]: list.length ? list : [emptyItem[key]()] };
}

export function setAvailability(a: Answers, patch: Partial<Availability>): Answers {
  return { ...a, availability: { ...a.availability, ...patch } };
}
