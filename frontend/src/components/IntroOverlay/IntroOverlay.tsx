import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './IntroOverlay.module.css';

interface IntroOverlayProps {
  onComplete: () => void;
}

function IntroOverlay({ onComplete }: IntroOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<SVGTextElement | null>(null);
  const taglineRef = useRef<HTMLParagraphElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const overlayEl = overlayRef.current;
    const textEl = textRef.current;
    const taglineEl = taglineRef.current;
    if (!overlayEl || !textEl || !taglineEl) return;

    // SVGTextElement has no getTotalLength(); approximate the stroke-draw
    // length from the text's bounding box perimeter — generous enough that
    // the dash fully hides the glyphs at offset = length.
    const bbox = textEl.getBBox();
    const totalLength = Math.max((bbox.width + bbox.height) * 2.5, 800);

    gsap.set(textEl, {
      strokeDasharray: totalLength,
      strokeDashoffset: totalLength,
    });
    gsap.set(taglineEl, { opacity: 0 });
    gsap.set(overlayEl, { y: 0 });

    const tl = gsap.timeline({
      onComplete: () => onCompleteRef.current(),
    });

    tl.to(textEl, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: 'power2.inOut',
    })
      .to(
        taglineEl,
        {
          opacity: 1,
          duration: 0.6,
        },
        '+=0.5'
      )
      .to(
        overlayEl,
        {
          y: '-100vh',
          duration: 0.8,
          ease: 'power3.inOut',
        },
        2.5
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={overlayRef} className={styles.overlay} aria-hidden="true">
      <svg
        className={styles.brandSvg}
        viewBox="0 0 600 140"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="ProITBridge"
      >
        <text
          ref={textRef}
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className={styles.brandText}
        >
          ProITBridge
        </text>
      </svg>
      <p ref={taglineRef} className={styles.tagline}>
        AI Career Transformation
      </p>
    </div>
  );
}

export default IntroOverlay;
