'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // 初期値を設定
    setMatches(media.matches);

    // リスナーを追加
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 新しいブラウザ
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // 古いブラウザ対応
      media.addListener(listener);
    }

    // クリーンアップ
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}