export type YesNo = 'yes' | 'no' | null;

export type Contact = {
  fullName: string;
  city: string;
  phone: string;
  email: string;
};

export type Job = {
  title: string;
  employer: string;
  start: string;
  end: string;
  dayToDay: string;
  proudest: string;
  /** Answer to "Do you have another job to add?" asked after this job. */
  addAnother: YesNo;
};

export type Answers = {
  contact: Contact;
  /** Q1. Never printed on the resume: used to order skills and results. */
  targetJob: string;
  /** Q2. */
  hasJob: YesNo;
  /** Q3–Q6, most recent job first. Only the "active" jobs are used, see activeJobs(). */
  jobs: Job[];
  /** Q7. */
  extra: string;
  /** Q8. */
  education: string;
  /** Q9. */
  skills: string;
  /** Q10. */
  certificates: string;
  /** Q11. Used for the summary. */
  bestAt: string;
  /** Id of the question the user was on, so they can pick up where they left off. */
  currentStepId: string | null;
  started: boolean;
};

export const emptyJob = (): Job => ({
  title: '',
  employer: '',
  start: '',
  end: '',
  dayToDay: '',
  proudest: '',
  addAnother: null,
});

export const emptyAnswers = (): Answers => ({
  contact: { fullName: '', city: '', phone: '', email: '' },
  targetJob: '',
  hasJob: null,
  jobs: [emptyJob()],
  extra: '',
  education: '',
  skills: '',
  certificates: '',
  bestAt: '',
  currentStepId: null,
  started: false,
});

/**
 * The jobs the user is still adding. Jobs stay stored if the user later answers
 * "No" to "another job?", so going back and forth never loses typed text, but
 * only the jobs reached through a chain of "Yes" answers count.
 */
export function activeJobs(a: Answers): Job[] {
  if (a.hasJob !== 'yes') return [];
  const out: Job[] = [];
  for (const job of a.jobs) {
    out.push(job);
    if (job.addAnother !== 'yes') break;
  }
  return out;
}

/** Fill in defaults for anything missing, so older saved data still loads. */
export function normalizeAnswers(raw: unknown): Answers {
  const base = emptyAnswers();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Answers>;
  const jobs =
    Array.isArray(r.jobs) && r.jobs.length > 0
      ? r.jobs.map((j) => ({ ...emptyJob(), ...j }))
      : base.jobs;
  return {
    ...base,
    ...r,
    contact: { ...base.contact, ...(r.contact ?? {}) },
    jobs,
  };
}
