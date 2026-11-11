/**
 * Resume formats. Each format is a render function that takes the resume data and
 * returns an HTML page. The on-screen preview, the thumbnails, the PDF and the PNG
 * are all made from this same HTML, so they always match.
 */
import type { ResumeFormat } from './answers';
import type { Resume } from './resume';

// US Letter at 96 CSS px per inch.
export const PAGE_W = 816;
export const PAGE_H = 1056;
export const MARGIN_IN = 0.6;
const MARGIN = MARGIN_IN * 96;
const CONTENT_H = PAGE_H - 2 * MARGIN;

/** Body font sizes (pt) tried, largest first, to fit one page. */
export const FONT_STEPS = [11, 10.5, 10, 9.5];
export const DEFAULT_FONT = FONT_STEPS[0];

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certificates'
  | 'languages'
  | 'other'
  | 'availability';

export const SECTION_TITLES: Record<SectionKey, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  certificates: 'Certifications & Awards',
  languages: 'Languages',
  other: 'Volunteering & Projects',
  availability: 'Availability',
};

export const STANDARD_ORDER: SectionKey[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'certificates',
  'languages',
  'other',
  'availability',
];

const SKILLS_FIRST_ORDER: SectionKey[] = [
  'summary',
  'skills',
  'certificates',
  'other',
  'education',
  'experience',
  'languages',
  'availability',
];

const SIDEBAR: SectionKey[] = ['skills', 'languages', 'certificates', 'availability'];
const MAIN: SectionKey[] = ['summary', 'experience', 'education', 'other'];

export const FORMAT_LABELS: Record<ResumeFormat, string> = {
  classic: 'Classic',
  modern: 'Modern',
  skillsFirst: 'Skills first',
  twoColumn: 'Two column',
};

/** Whether a section has anything to show. Empty sections are never rendered. */
export function hasSection(r: Resume, key: SectionKey): boolean {
  switch (key) {
    case 'summary':
      return !!r.summary;
    case 'availability':
      return !!r.availability;
    default:
      return r[key].length > 0;
  }
}

export type RenderOptions = {
  format: ResumeFormat;
  accent: string;
  /** Body font size in pt. Used as is for print; screen mode searches for the best fit. */
  fontSize: number;
  /**
   * screen: a white sheet scaled to the view's width, which reports its layout
   *         (chosen font size, pages, height) to the app.
   * print:  a page for expo-print with US Letter page rules.
   */
  mode: 'screen' | 'print';
  /** Print only: put the 0.6in margins in CSS (Android) or leave them to the printer (iOS). */
  cssMargins?: boolean;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  const n = m ? parseInt(m[1], 16) : 0x2563eb;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The accent mixed with white: amount 0 = white, 1 = accent. */
function tint(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(255 + (c - 255) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

const contactParts = (r: Resume) => [r.city, r.phone, r.email, r.link].filter(Boolean);

// ---------- Section bodies (shared by all formats) ----------

function jobHtml(j: Resume['experience'][number]): string {
  const head = [j.title, j.employer].filter(Boolean).map(esc).join(', ');
  const meta = [j.city, j.dates].filter(Boolean).map(esc).join(' · ');
  return `<div class="item">
    <div class="item-head"><span class="item-title">${head}</span>${meta ? `<span class="item-meta">${meta}</span>` : ''}</div>
    ${j.bullets.length ? `<ul>${j.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
  </div>`;
}

function sectionBody(r: Resume, key: SectionKey, o: { pills: boolean; stacked: boolean }): string {
  switch (key) {
    case 'summary':
      return `<p>${esc(r.summary)}</p>`;
    case 'experience':
      return r.experience.map(jobHtml).join('');
    case 'education':
      return r.education
        .map((e) => {
          const head = [e.school, e.studied].filter(Boolean).map(esc).join(', ');
          return `<div class="item"><div class="item-head"><span class="item-title">${head}</span>${
            e.when ? `<span class="item-meta">${esc(e.when)}</span>` : ''
          }</div></div>`;
        })
        .join('');
    case 'skills':
      if (o.pills) return `<div class="pills">${r.skills.map((s) => `<span class="pill">${esc(s)}</span>`).join('')}</div>`;
      if (o.stacked) return `<ul class="plain">${r.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`;
      return `<p>${r.skills.map(esc).join(', ')}</p>`;
    case 'certificates':
      return `<ul class="${o.stacked ? 'plain' : ''}">${r.certificates
        .map((c) => `<li>${esc(c.name)}${c.year ? `, ${esc(c.year)}` : ''}</li>`)
        .join('')}</ul>`;
    case 'languages': {
      const items = r.languages.map((l) => `${esc(l.name)}${l.level ? ` (${esc(l.level)})` : ''}`);
      return o.stacked
        ? `<ul class="plain">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`
        : `<p>${items.join(', ')}</p>`;
    }
    case 'other':
      return `<ul>${r.other.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    case 'availability':
      return `<p>${esc(r.availability)}</p>`;
  }
}

function sections(r: Resume, keys: SectionKey[], o: { pills: boolean; stacked: boolean }): string {
  return keys
    .filter((k) => hasSection(r, k))
    .map((k) => `<section><h2>${SECTION_TITLES[k]}</h2>${sectionBody(r, k, o)}</section>`)
    .join('');
}

// ---------- Formats ----------

type Template = { body: (r: Resume) => string; css: (accent: string) => string };

const BASE_CSS = `
  #content { font-size: var(--fs); line-height: 1.35; color: #111827; }
  h1 { margin: 0; line-height: 1.15; }
  h2 { margin: 0 0 0.4em; }
  p { margin: 0; }
  section { margin-top: 1.05em; break-inside: avoid; }
  ul { margin: 0.25em 0 0; padding-left: 1.2em; }
  li { margin: 0.12em 0; }
  ul.plain { list-style: none; padding-left: 0; }
  .item { margin-top: 0.55em; break-inside: avoid; }
  section > h2 + .item { margin-top: 0; }
  .item-head { display: flex; justify-content: space-between; gap: 1em; align-items: baseline; }
  .item-title { font-weight: 600; }
  .item-meta { white-space: nowrap; color: #4B5563; font-size: 0.92em; }
  .contact { margin-top: 0.35em; color: #374151; }
  .headline { margin-top: 0.2em; font-size: 1.15em; }
  .pills { display: flex; flex-wrap: wrap; gap: 0.35em; }
  .pill { padding: 0.18em 0.7em; border-radius: 999px; font-size: 0.95em; }
`;

const classic: Template = {
  body: (r) => `
    <header>
      <h1>${esc(r.name)}</h1>
      ${r.headline ? `<div class="headline">${esc(r.headline)}</div>` : ''}
      ${contactParts(r).length ? `<div class="contact">${contactParts(r).map(esc).join(' | ')}</div>` : ''}
    </header>
    ${sections(r, STANDARD_ORDER, { pills: false, stacked: false })}`,
  css: () => `
    #content, #content * { color: #000 !important; }
    h1 { font-size: 2em; font-weight: 700; }
    h2 { font-size: 1.12em; font-weight: 600; font-variant: small-caps; letter-spacing: 0.06em;
         padding-bottom: 0.15em; border-bottom: 0.75pt solid #000; }
    .item-meta { color: #000; }`,
};

const modernCss = (accent: string) => `
    h1 { font-size: 2.4em; font-weight: 800; letter-spacing: -0.01em; }
    .headline { color: ${accent}; font-weight: 600; }
    h2 { font-size: 0.95em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${accent}; }
    .pill { background: ${tint(accent, 0.12)}; color: ${accent}; }`;

const modernHeader = (r: Resume) => `
    <header>
      <h1>${esc(r.name)}</h1>
      ${r.headline ? `<div class="headline">${esc(r.headline)}</div>` : ''}
      ${contactParts(r).length ? `<div class="contact">${contactParts(r).map(esc).join('  ·  ')}</div>` : ''}
    </header>`;

const modern: Template = {
  body: (r) => `${modernHeader(r)}${sections(r, STANDARD_ORDER, { pills: true, stacked: false })}`,
  css: modernCss,
};

const skillsFirst: Template = {
  body: (r) => `${modernHeader(r)}${sections(r, SKILLS_FIRST_ORDER, { pills: true, stacked: false })}`,
  css: modernCss,
};

const twoColumn: Template = {
  body: (r) => {
    const contact = contactParts(r);
    return `
    <div class="cols">
      <aside>
        ${contact.length ? `<section><h2>Contact</h2><ul class="plain">${contact.map((c) => `<li class="wrap">${esc(c)}</li>`).join('')}</ul></section>` : ''}
        ${sections(r, SIDEBAR, { pills: false, stacked: true })}
      </aside>
      <main>
        <header>
          <h1>${esc(r.name)}</h1>
          ${r.headline ? `<div class="headline">${esc(r.headline)}</div>` : ''}
        </header>
        ${sections(r, MAIN, { pills: false, stacked: false })}
      </main>
    </div>`;
  },
  css: (accent) => `
    .cols { display: flex; gap: 1.6em; align-items: stretch; }
    aside { width: 32%; flex: none; background: ${tint(accent, 0.09)}; border-radius: 0.6em; padding: 0.4em 1em 1.1em; }
    aside section:first-child { margin-top: 0.7em; }
    main { flex: 1; min-width: 0; padding-top: 0.3em; }
    .wrap { overflow-wrap: anywhere; }
    h1 { font-size: 2.2em; font-weight: 800; }
    .headline { color: ${accent}; font-weight: 600; }
    h2 { font-size: 0.92em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${accent}; }
    aside ul.plain li { margin: 0.25em 0; }`,
};

const TEMPLATES: Record<ResumeFormat, Template> = { classic, modern, skillsFirst, twoColumn };

// ---------- Page wrapper ----------

/** Runs inside the screen-mode page: fits the font to one page, scales the sheet to the view, reports back. */
const FIT_SCRIPT = `
(function () {
  var STEPS = ${JSON.stringify(FONT_STEPS)}, AVAIL = ${CONTENT_H}, PAGE_W = ${PAGE_W}, PAGE_H = ${PAGE_H}, MARGIN = ${MARGIN};
  function post(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent && window.parent !== window) window.parent.postMessage(s, '*');
  }
  function layout() {
    var root = document.documentElement, content = document.getElementById('content');
    var sheet = document.getElementById('sheet'), wrap = document.getElementById('wrap');
    var chosen = STEPS[STEPS.length - 1];
    for (var i = 0; i < STEPS.length; i++) {
      root.style.setProperty('--fs', STEPS[i] + 'pt');
      if (content.offsetHeight <= AVAIL) { chosen = STEPS[i]; break; }
    }
    root.style.setProperty('--fs', chosen + 'pt');
    var pages = Math.max(1, Math.ceil(content.offsetHeight / AVAIL - 0.001));
    sheet.style.height = (pages * PAGE_H) + 'px';
    var old = document.querySelectorAll('.page-break');
    for (var j = 0; j < old.length; j++) old[j].remove();
    for (var p = 1; p < pages; p++) {
      var line = document.createElement('div');
      line.className = 'page-break';
      line.style.top = (MARGIN + p * AVAIL) + 'px';
      line.textContent = 'Page ' + (p + 1);
      sheet.appendChild(line);
    }
    var scale = window.innerWidth / PAGE_W;
    wrap.style.transform = 'scale(' + scale + ')';
    var height = Math.ceil(pages * PAGE_H * scale);
    document.body.style.height = height + 'px';
    post({ type: 'layout', fontSize: chosen, pages: pages, height: height });
  }
  window.addEventListener('resize', layout);
  if (document.readyState === 'complete') layout(); else window.addEventListener('load', layout);
})();`;

export function renderResumeHtml(r: Resume, o: RenderOptions): string {
  const t = TEMPLATES[o.format];
  const accent = o.format === 'classic' ? '#000000' : o.accent;
  const inner = `<div id="content">${t.body(r)}</div>`;

  if (o.mode === 'print') {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { size: 8.5in 11in; margin: ${o.cssMargins === false ? 0 : `${MARGIN_IN}in`}; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: ${FONT_STACK}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  :root { --fs: ${o.fontSize}pt; }
  ${BASE_CSS}
  ${t.css(accent)}
</style></head><body>${inner}</body></html>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body { margin: 0; padding: 0; background: #fff; overflow: hidden; }
  body { font-family: ${FONT_STACK}; -webkit-text-size-adjust: 100%; }
  :root { --fs: ${o.fontSize}pt; }
  #wrap { width: ${PAGE_W}px; transform-origin: 0 0; }
  #sheet { position: relative; width: ${PAGE_W}px; height: ${PAGE_H}px; padding: ${MARGIN}px; box-sizing: border-box; background: #fff; }
  .page-break { position: absolute; left: 0; right: 0; border-top: 2px dashed #CBD5E1; color: #94A3B8;
                font: 600 14px ${FONT_STACK}; text-align: right; padding: 4px 12px 0; }
  ${BASE_CSS}
  ${t.css(accent)}
</style></head><body><div id="wrap"><div id="sheet">${inner}</div></div>
<script>${FIT_SCRIPT}</script></body></html>`;
}

// ---------- Plain text (for pasting into online job forms) ----------

export function renderResumeText(r: Resume): string {
  const out: string[] = [];
  if (r.name) out.push(r.name.toUpperCase());
  if (r.headline) out.push(r.headline);
  const contact = contactParts(r);
  if (contact.length) out.push(contact.join(' | '));

  for (const key of STANDARD_ORDER) {
    if (!hasSection(r, key)) continue;
    out.push('', SECTION_TITLES[key].toUpperCase());
    switch (key) {
      case 'summary':
        out.push(r.summary);
        break;
      case 'experience':
        r.experience.forEach((j, i) => {
          if (i > 0) out.push('');
          out.push([j.title, j.employer].filter(Boolean).join(', '));
          const meta = [j.city, j.dates].filter(Boolean).join(' | ');
          if (meta) out.push(meta);
          j.bullets.forEach((b) => out.push(`- ${b}`));
        });
        break;
      case 'education':
        r.education.forEach((e) => out.push([[e.school, e.studied].filter(Boolean).join(', '), e.when].filter(Boolean).join(' | ')));
        break;
      case 'skills':
        out.push(r.skills.join(', '));
        break;
      case 'certificates':
        r.certificates.forEach((c) => out.push(`- ${c.name}${c.year ? `, ${c.year}` : ''}`));
        break;
      case 'languages':
        r.languages.forEach((l) => out.push(`- ${l.name}${l.level ? ` (${l.level})` : ''}`));
        break;
      case 'other':
        r.other.forEach((x) => out.push(`- ${x}`));
        break;
      case 'availability':
        out.push(r.availability);
        break;
    }
  }
  return out.join('\n') + '\n';
}

/** "Juan Camanei" -> "Juan-Camanei-Resume". */
export function resumeFileBase(name: string): string {
  let plain = name;
  try {
    plain = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    // normalize() can be missing on some JS engines; the next step drops accented letters instead.
  }
  const clean = plain.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${clean || 'My'}-Resume`;
}
