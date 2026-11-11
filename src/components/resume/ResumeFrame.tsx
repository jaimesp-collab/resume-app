import { useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { PAGE_RATIO, parseLayout, ResumeFrameProps } from './frameTypes';

/** Shows a rendered resume page (native: WebView). */
export function ResumeFrame({ html, width, firstPageOnly, onLayoutInfo, captureRef }: ResumeFrameProps) {
  const onePage = Math.ceil(width * PAGE_RATIO);
  const [height, setHeight] = useState(onePage);
  const shown = firstPageOnly ? onePage : height;

  return (
    <View
      ref={captureRef}
      collapsable={false}
      style={{ width, height: shown, overflow: 'hidden', backgroundColor: '#FFFFFF' }}
      pointerEvents={firstPageOnly ? 'none' : 'auto'}
    >
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        scrollEnabled={false}
        nestedScrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        setBuiltInZoomControls={false}
        textZoom={100}
        // Software drawing lets the preview be captured as an image on Android.
        androidLayerType={captureRef ? 'software' : undefined}
        style={{ width, height: Math.max(height, onePage), backgroundColor: '#FFFFFF' }}
        onMessage={(e) => {
          const info = parseLayout(e.nativeEvent.data);
          if (!info) return;
          setHeight(info.height);
          onLayoutInfo?.(info);
        }}
      />
    </View>
  );
}
