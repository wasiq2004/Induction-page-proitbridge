import { useEffect, useRef, type RefObject } from 'react';

export function useMouseParallax<T extends HTMLElement = HTMLDivElement>(): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const mediaQuery = window.matchMedia('(pointer: coarse)');
    if (mediaQuery.matches) {
      element.style.setProperty('--pointer-x', '0');
      element.style.setProperty('--pointer-y', '0');
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      element.style.setProperty('--pointer-x', x.toFixed(3));
      element.style.setProperty('--pointer-y', y.toFixed(3));
    };

    const reset = () => {
      element.style.setProperty('--pointer-x', '0');
      element.style.setProperty('--pointer-y', '0');
    };

    reset();
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerleave', reset);

    return () => {
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerleave', reset);
    };
  }, []);

  return ref;
}
