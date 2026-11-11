export type YesNo = 'yes' | 'no' | null;

export type Contact = {
  fullName: string;
  city: string;
  phone: string;
  email: string;
  /** Optional LinkedIn or personal website. */
  link: string;
};

export type Job = {
  title: string;
  employer: string;
  city: string;
  start: string;
  end: string;
  /** "I still work here": the end date shows as "Present". */
  current: boolean;
  dayToDay: string;
  proudest: string;
  /** Answer to "Do you have another job to add?" asked after this job. */
  addAnother: YesNo;
};

export type EducationItem = {
  school: string;
  studied: string;
  year: string;
  inProgress: boolean;
};

export const LANGUAGE_LEVELS = ['Native', 'Fluent', 'Conversational', 'Basic'] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

export type LanguageItem = { name: string; level: LanguageLevel | null };

export type CertificateItem = { name: string; year: string };

export const WORK_TIMES = ['Full time', 'Part time', 'Mornings', 'Evenings', 'Nights', 'Weekends'] as const;
export type WorkTime = (typeof WORK_TIMES)[number];

export type Availability = {
  times: WorkTime[];
  rightAway: boolean;
  /** Free text like "June 1". Ignored when rightAway is on. */
  startDate: string;
};

export const FORMATS = ['classic', 'modern', 'skillsFirst', 'twoColumn'] as const;
export type ResumeFormat = (typeof FORMATS)[number];

export const ACCENTS = ['#2563EB', '#0D9488', '#16A34A', '#9F1239', '#374151'] as const;

export type Answers = {
  contact: Contact;
  /** Not printed on the resume: used to order skills and results. */
  targetJob: string;
  hasJob: YesNo;
  /** Most recent job first. Only the "active" jobs are used, see activeJobs(). */
  jobs: Job[];
  extra: string;
  education: EducationItem[];
  skills: string;
  languages: LanguageItem[];
  certificates: CertificateItem[];
  availability: Availability;
  /** Used for the summary. */
  bestAt: string;
  /** Resume look chosen on the result screen. */
  format: ResumeFormat;
  accent: string;
  /** Id of the question the user was on, so they can pick up where they left off. */
  currentStepId: string | null;
  started: boolean;
};

export const emptyJob = (): Job => ({
  title: '',
  employer: '',
  city: '',
  start: '',
  end: '',
  current: false,
  dayToDay: '',
  proudest: '',
  addAnother: null,
});

export const emptyEducation = (): EducationItem => ({ school: '', studied: '', year: '', inProgress: false });
export const emptyLanguage = (): LanguageItem => ({ name: '', level: null });
export const emptyCertificate = (): CertificateItem => ({ name: '', year: '' });

export const emptyAnswers = (): Answers => ({
  contact: { fullName: '', city: '', phone: '', email: '', link: '' },
  targetJob: '',
  hasJob: null,
  jobs: [emptyJob()],
  extra: '',
  education: [emptyEducation()],
  skills: '',
  languages: [emptyLanguage()],
  certificates: [emptyCertificate()],
  availability: { times: [], rightAway: false, startDate: '' },
  bestAt: '',
  format: 'classic',
  accent: ACCENTS[0],
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

function nonEmptyList<T>(items: T[] | undefined, empty: () => T): T[] {
  return Array.isArray(items) && items.length > 0 ? items : [empty()];
}

/** Lines of an old free-text answer, used to migrate answers saved by earlier versions. */
function lines(text: string): string[] {
  return text
    .split(/\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Fill in defaults for anything missing, so data saved by older versions still loads. */
export function normalizeAnswers(raw: unknown): Answers {
  const base = emptyAnswers();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown> & Partial<Answers>;

  // Older versions stored education and certificates as free text.
  const education: EducationItem[] =
    typeof r.education === 'string'
      ? lines(r.education).map((school) => ({ ...emptyEducation(), school }))
      : (r.education ?? []).map((e) => ({ ...emptyEducation(), ...e }));
  const certificates: CertificateItem[] =
    typeof r.certificates === 'string'
      ? lines(r.certificates).map((name) => ({ name, year: '' }))
      : (r.certificates ?? []).map((c) => ({ ...emptyCertificate(), ...c }));

  return {
    ...base,
    ...r,
    contact: { ...base.contact, ...(r.contact ?? {}) },
    jobs: nonEmptyList(r.jobs, emptyJob).map((j) => ({ ...emptyJob(), ...j })),
    education: nonEmptyList(education, emptyEducation),
    certificates: nonEmptyList(certificates, emptyCertificate),
    languages: nonEmptyList(r.languages, emptyLanguage).map((l) => ({ ...emptyLanguage(), ...l })),
    availability: { ...base.availability, ...(r.availability ?? {}) },
    format: FORMATS.includes(r.format as ResumeFormat) ? (r.format as ResumeFormat) : base.format,
    accent: typeof r.accent === 'string' ? r.accent : base.accent,
  };
}
