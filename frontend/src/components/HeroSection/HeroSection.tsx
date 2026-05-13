import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useMouseParallax } from '@hooks/useMouseParallax';
import BrandLogo from '@components/BrandLogo';
import styles from './HeroSection.module.css';
import { heroData } from '@constants/heroData';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

const PARTICLE_COLORS = [
  'rgba(133, 184, 255, 0.35)',
  'rgba(122, 107, 255, 0.28)',
  'rgba(243, 201, 107, 0.22)',
];

interface HeroSectionProps {
  onInductionClick?: () => void;
}

function HeroSection({ onInductionClick }: HeroSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const priceRef = useRef<HTMLSpanElement>(null);
  const shellRef = useMouseParallax<HTMLElement>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      canvasCtx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = Array.from({ length: 36 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: 1 + Math.random() * 2.2,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    }));

    let rafId = 0;

    const draw = () => {
      canvasCtx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x > canvas.offsetWidth) particle.x = 0;
        else if (particle.x < 0) particle.x = canvas.offsetWidth;

        if (particle.y > canvas.offsetHeight) particle.y = 0;
        else if (particle.y < 0) particle.y = canvas.offsetHeight;

        canvasCtx.beginPath();
        canvasCtx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        canvasCtx.fillStyle = particle.color;
        canvasCtx.fill();
      }

      rafId = window.requestAnimationFrame(draw);
    };

    rafId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const headlineEl = headlineRef.current;
    const buttonEl = buttonRef.current;
    const priceEl = priceRef.current;
    const shellEl = shellRef.current;
    if (!headlineEl || !buttonEl || !priceEl || !shellEl) return;

    const words = headlineEl.querySelectorAll<HTMLSpanElement>(`.${styles.word}`);
    const pills = shellEl.querySelectorAll<HTMLElement>(`.${styles.pill}`);

    const gsapCtx = gsap.context(() => {
      gsap.from(words, {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.07,
        ease: 'power3.out',
        delay: 0.2,
      });

      gsap.from(buttonEl, {
        scale: 0.9,
        opacity: 0,
        ease: 'elastic.out(1, 0.55)',
        duration: 0.85,
        delay: 0.75,
      });

      gsap.from(priceEl, {
        y: -12,
        opacity: 0,
        ease: 'power3.out',
        duration: 0.6,
        delay: 0.95,
      });

      gsap.from(pills, {
        y: 12,
        opacity: 0,
        duration: 0.5,
        stagger: 0.07,
        ease: 'power2.out',
        delay: 1.0,
      });
    }, shellEl);

    return () => gsapCtx.revert();
  }, [shellRef]);

  return (
    <section ref={shellRef} className={styles.section}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.noise} aria-hidden="true" />
      <div className={styles.auroraOne} aria-hidden="true" />
      <div className={styles.auroraTwo} aria-hidden="true" />

      <div className={styles.shell}>
        <div className={styles.content}>
          <div className={styles.brandRow}>
            <BrandLogo compact showTagline />
          </div>
          <span className={styles.badge}>{heroData.badge}</span>

          <div ref={headlineRef} className={styles.headline}>
            {heroData.headline.map((line, i) => (
              <div key={i}>
                {line.split(' ').map((word, j) => (
                  <span key={j} className={styles.word}>
                    {word}&nbsp;
                  </span>
                ))}
              </div>
            ))}
          </div>

          <p className={styles.subQuestion}>{heroData.subQuestion}</p>

          <p className={styles.supportingLine}>
            {heroData.supportingLine}{' '}
            <span className={styles.accentWord}>{heroData.accentWord}</span>
          </p>

          <div className={styles.ctaCluster}>
            <button
              ref={buttonRef}
              className={styles.ctaButton}
              onClick={() => {
                console.log('Button clicked', onInductionClick);
                onInductionClick?.();
              }}
            >
              <span>{heroData.ctaLabel}</span>
              <strong>{heroData.ctaPrice}</strong>
            </button>

            <div className={styles.priceWrapper}>
              <span className={styles.originalPrice}>{heroData.originalPrice}</span>
              <span ref={priceRef} className={styles.currentPrice}>
                Premium access for {heroData.ctaPrice}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.visualStage}>
          <div className={styles.visualFrame}>
            <img src="/assets/hero-image.jpg" alt="ProITBridge" className={styles.heroImage} />
            <div className={styles.heroGradient} />
            <div className={styles.heroBadge}>
              <span className={styles.badgeDot} />
              Agentic AI · Career Transformation
            </div>
            <span className={styles.cornerTR} aria-hidden="true" />
            <span className={styles.cornerBL} aria-hidden="true" />
          </div>

          <div className={styles.pillRow}>
            <span className={styles.pill}>Weekend-first cohort</span>
            <span className={styles.pill}>Live mentorship</span>
            <span className={styles.pill}>Placement support</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
