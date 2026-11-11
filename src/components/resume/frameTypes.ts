import type { Ref } from 'react';
import type { ViewInstance } from 'react-native';

/** What the resume page reports after fitting itself to the page. */
export type FrameLayout = { fontSize: number; pages: number; height: number };

export type ResumeFrameProps = {
  html: string;
  /** Width of the frame in points; the page scales to fit it. */
  width: number;
  /** Show only the first page (thumbnails). */
  firstPageOnly?: boolean;
  onLayoutInfo?: (info: FrameLayout) => void;
  /** The view to snapshot for "Share as image". */
  captureRef?: Ref<ViewInstance>;
};

export const PAGE_RATIO = 11 / 8.5;

export function parseLayout(data: unknown): FrameLayout | null {
  try {
    const msg = typeof data === 'string' ? JSON.parse(data) : data;
    if (msg && msg.type === 'layout' && typeof msg.height === 'number') {
      return { fontSize: msg.fontSize, pages: msg.pages, height: msg.height };
    }
  } catch {
    // Not one of our messages.
  }
  return null;
}
