import { useRef, useState, useEffect, type RefObject } from 'react';

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(): {
  ref: RefObject<T>;
  isVisible: boolean;
} {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
