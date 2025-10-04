import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { UI_SCALE } from './sizes';

export function useFieldFit() {
  const availRef  = useRef<HTMLDivElement|null>(null);
  const fieldRef  = useRef<HTMLDivElement|null>(null);
  const [fitH, setFitH] = useState(560);

  function recalc() {
    const vh   = window.innerHeight;
    const cw   = fieldRef.current?.getBoundingClientRect().width ?? 1200;
    const headerH = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
    const availH  = availRef.current?.getBoundingClientRect().height ?? 0;

    // keep 105:68 aspect; shrink via UI_SCALE so full pitch fits under Available row
    const pitchFromWidth = Math.floor(cw * (68/105) * UI_SCALE);
    const room           = Math.floor(vh - headerH - availH - 56); // 56 = breathing room
    const h              = Math.max(380, Math.min(pitchFromWidth, room, 680)); // clamp
    setFitH(h);
  }

  useLayoutEffect(() => { recalc(); }, []);
  useEffect(() => {
    const h = () => recalc();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return { availRef, fieldRef, fitH, recalc };
}