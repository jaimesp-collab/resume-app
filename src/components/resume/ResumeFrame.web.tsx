import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { PAGE_RATIO, parseLayout, ResumeFrameProps } from './frameTypes';

/** Shows a rendered resume page (web: iframe). Used for testing in a browser. */
export function ResumeFrame({ html, width, firstPageOnly, onLayoutInfo, captureRef }: ResumeFrameProps) {
  const onePage = Math.ceil(width * PAGE_RATIO);
  const [height, setHeight] = useState(onePage);
  const frame = useRef<HTMLIFrameElement>(null);
  const shown = firstPageOnly ? onePage : height;

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const info = parseLayout(e.data);
      if (!info) return;
      setHeight(info.height);
      onLayoutInfo?.(info);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onLayoutInfo]);

  return (
    <View
      ref={captureRef}
      style={{ width, height: shown, overflow: 'hidden', backgroundColor: '#FFFFFF' }}
      pointerEvents={firstPageOnly ? 'none' : 'auto'}
    >
      <iframe
        ref={frame}
        srcDoc={html}
        title="Resume preview"
        scrolling="no"
        style={{ width, height: Math.max(height, onePage), border: 0, display: 'block' }}
      />
    </View>
  );
}
