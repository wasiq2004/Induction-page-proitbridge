import { useState, useEffect, useRef } from 'react';

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

export function useCountUp(
  target: number,
  duration = 1500,
  trigger: boolean
): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;

    startTimeRef.current = null;
    setCount(0);

    const tick = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const t = Math.min((timestamp - startTimeRef.current) / duration, 1);
      setCount(Math.round(easeOut(t) * target));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, trigger]);

  return count;
}
