import * as Clipboard from 'expo-clipboard';
import type { RefObject } from 'react';
import type { ViewInstance } from 'react-native';

import { renderResumeHtml, RenderOptions } from './templates';
import type { Resume } from './resume';

type PrintOpts = Omit<RenderOptions, 'mode'>;

/** Web (testing only): open the print version and use the browser's "Save as PDF". */
export async function sharePdf(resume: Resume, opts: PrintOpts, fileBase: string) {
  const html = renderResumeHtml(resume, { ...opts, mode: 'print', cssMargins: true }).replace(
    '<head>',
    `<head><title>${fileBase}</title>`,
  );
  const w = window.open('', '_blank');
  if (!w) throw new Error('Allow pop-ups to save the PDF.');
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}

export async function sharePng(_preview: RefObject<ViewInstance | null>, _fileBase: string) {
  throw new Error('Sharing as an image works in the phone app.');
}

export async function copyText(text: string) {
  await Clipboard.setStringAsync(text);
}
