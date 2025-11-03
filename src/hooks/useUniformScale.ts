import { useCallback, useEffect, useRef, useState } from 'react';

type Options = {
  baseWidth: number;   // design width we target before scaling (e.g., 1440)
  baseHeight: number;  // design height for vertical fit (e.g., 900) including navbar offset logic handled by caller
  padding?: number;    // optional gutter inside container
};

export function useUniformScale({ baseWidth, baseHeight, padding = 0 }: Options) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [outerSize, setOuterSize] = useState({ width: baseWidth, height: baseHeight });

  const recompute = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const availW = Math.max(0, rect.width - padding * 2);
    const availH = Math.max(0, rect.height - padding * 2);
    const s = Math.min(availW / baseWidth, availH / baseHeight);
    setScale(Number.isFinite(s) ? s : 1);
    setOuterSize({ width: baseWidth, height: baseHeight });
  }, [baseWidth, baseHeight, padding]);

  useEffect(() => {
    recompute();
    const ro = new ResizeObserver(recompute);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [recompute]);

  return { containerRef, scale, outerSize, padding };
}
