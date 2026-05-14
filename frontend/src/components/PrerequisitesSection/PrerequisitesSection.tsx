import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useScrollReveal } from '@hooks/useScrollReveal';
import styles from './PrerequisitesSection.module.css';

const MOTIVATION = 'Your Career Transformation in AI Begins Here.';
const VIDEO_PATH = '/assets/landing-page-video.mp4';

interface PrerequisitesSectionProps {
  onInductionClick?: () => void;
}

function PrerequisitesSection({ onInductionClick }: PrerequisitesSectionProps) {
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();
  const showcaseRef = useRef<HTMLDivElement>(null);

  const [displayed, setDisplayed] = useState('');
  const [cursorHide, setCursorHide] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const typingStarted = useRef(false);

  useEffect(() => {
    if (!isVisible || typingStarted.current) return;
    typingStarted.current = true;

    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setDisplayed(MOTIVATION.slice(0, index));

      if (index >= MOTIVATION.length) {
        window.clearInterval(interval);
        window.setTimeout(() => setCursorHide(true), 1800);
      }
    }, 34);

    return () => window.clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const showcaseEl = showcaseRef.current;
    if (!showcaseEl) return;

    const ctx = gsap.context(() => {
      gsap.from(showcaseEl, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    });

    return () => ctx.revert();
  }, [isVisible]);

  const showVideoFallback = hasVideoError;

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.inner}>
        <div ref={showcaseRef} className={styles.showcase}>
          <div className={styles.showcaseLeft}>
            <span className={styles.showcaseKicker}>Induction Preview</span>
            <h3 className={styles.showcaseHeading}>Get a first look at what awaits you inside.</h3>
            <p className={styles.showcaseText}>
              A curated session walkthrough designed for working professionals. See the curriculum, mentors, and live project structure before you enroll.
            </p>

            <div className={styles.showcasePoints}>
              <div className={styles.point}>
                <span className={styles.pointIcon}>01</span>
                <div>
                  <strong>Live weekend sessions</strong>
                  <p>Attend without disrupting your current job schedule.</p>
                </div>
              </div>
              <div className={styles.point}>
                <span className={styles.pointIcon}>02</span>
                <div>
                  <strong>Agentic AI projects</strong>
                  <p>Build real autonomous pipelines from week one.</p>
                </div>
              </div>
              <div className={styles.point}>
                <span className={styles.pointIcon}>03</span>
                <div>
                  <strong>Placement-ready outcome</strong>
                  <p>Portfolio, mock interviews, and referral network included.</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.showcaseRight}>
            <div className={styles.inlineVideoWrap}>
              <video
                className={styles.inlineVideo}
                controls
                playsInline
                muted
                loop
                preload="auto"
                src={VIDEO_PATH}
                onError={() => { setHasVideoError(true); setIsVideoReady(false); }}
              />
              {hasVideoError && (
                <div className={styles.inlineFallback}>
                  <span className={styles.fallbackBadge}>Preview video</span>
                  <p>Add <code>landing-page-video.mp4</code> to <code>/public/assets</code></p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.motivationWrapper}>
          <span className={styles.motivationText}>{displayed}</span>
          <span className={`${styles.cursor} ${cursorHide ? styles.cursorHide : ''}`} />
        </div>

        <div className={styles.ctaWrapper}>
          <p className={styles.ctaOriginal}>Usual Price Rs. 299</p>
          <button className={styles.ctaButton} onClick={() => onInductionClick?.()}>Get Now Rs. 89</button>
        </div>
      </div>
    </section>
  );
}

export default PrerequisitesSection;
