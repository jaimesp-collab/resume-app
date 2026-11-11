import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { Platform, ViewInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { MARGIN_IN, renderResumeHtml, RenderOptions } from './templates';
import type { Resume } from './resume';

type PrintOpts = Omit<RenderOptions, 'mode'>;

/** Give a temporary file a friendly name, like "Juan-Camanei-Resume.pdf". */
function named(uri: string, fileName: string): string {
  const dest = new File(Paths.cache, fileName);
  if (dest.exists) dest.delete();
  new File(uri).copySync(dest);
  return dest.uri;
}

async function share(uri: string, mimeType: string, UTI: string, title: string) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, { mimeType, UTI, dialogTitle: title });
}

/** PDF from the same HTML template as the preview, at the font size the preview chose. */
export async function sharePdf(resume: Resume, opts: PrintOpts, fileBase: string) {
  const ios = Platform.OS === 'ios';
  const pt = MARGIN_IN * 72;
  const html = renderResumeHtml(resume, { ...opts, mode: 'print', cssMargins: !ios });
  const { uri } = await Print.printToFileAsync({
    html,
    width: 612,
    height: 792,
    ...(ios ? { margins: { top: pt, right: pt, bottom: pt, left: pt } } : {}),
  });
  await share(named(uri, `${fileBase}.pdf`), 'application/pdf', 'com.adobe.pdf', 'Share your resume');
}

/** PNG snapshot of the preview itself, so it matches what is on screen. */
export async function sharePng(preview: RefObject<ViewInstance | null>, fileBase: string) {
  const uri = await captureRef(preview, { format: 'png', quality: 1, result: 'tmpfile' });
  await share(named(uri, `${fileBase}.png`), 'image/png', 'public.png', 'Share your resume');
}

export async function copyText(text: string) {
  await Clipboard.setStringAsync(text);
}
