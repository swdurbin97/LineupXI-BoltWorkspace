import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function useFitFieldHeight() {
  const headerRef = useRef<HTMLElement | null>(null);
  const availRef = useRef<HTMLDivElement | null>(null);
  const fieldFrameRef = useRef<HTMLDivElement | null>(null); // the outer field card before AR box
  const [fitH, setFitH] = useState<number>(560); // sensible default

  useLayoutEffect(() => { recalc(); }, []);
  useEffect(() => {
    const h = () => recalc();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  function recalc() {
    const vh = window.innerHeight;
    const headerH = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
    const availH = availRef.current?.getBoundingClientRect().height ?? 0;
    const rolesH = 0; // roles below; we don't include it for fit
    const margins = 48; // breathing room
    const max = vh - headerH - availH - margins - 8;
    const clamped = Math.max(420, Math.min(760, Math.floor(max))); // clamp
    setFitH(clamped);
  }

  return { headerRef, availRef, fieldFrameRef, fitH };
}