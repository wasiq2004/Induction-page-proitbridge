import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import BrandLogo from '@components/BrandLogo';
import InductionPlayer from '@components/InductionPlayer';
import {
  checkAccess,
  clearAuthSession,
  getAuthSession,
  recordEnrollmentClick,
} from '@lib/googleSheets';
import styles from './CongratulationsPage.module.css';

interface LocationState {
  paymentVerified?: boolean;
  paymentId?: string;
  userName?: string;
}

const TRUST_BADGES = [
  '100% Secured Transaction',
  '100% Refund | Zero Risk',
];

const NEXT_STEPS = [
  {
    num: '1',
    title: 'Confirm Your Enrollment',
    desc: 'Complete your registration with payment to secure your spot in the program.',
  },
  {
    num: '2',
    title: 'Watch the Induction',
    desc: 'Access exclusive induction materials that introduce you to the program curriculum.',
  },
  {
    num: '3',
    title: 'Prepare Your Setup',
    desc: 'Install required tools and set up your learning environment with our quick-start guide.',
  },
  {
    num: '4',
    title: 'Join the Community',
    desc: 'Connect with peers, access exclusive Slack channel, and begin your transformation journey.',
  },
];

const CHECK_PATH = 'M4 12l6 6L20 6';

function CongratulationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageRef = useRef<HTMLDivElement>(null);
  const enrollBtnRef = useRef<HTMLButtonElement>(null);
  const [accessVerified, setAccessVerified] = useState(false);

  useEffect(() => {
    const state = (location.state ?? null) as LocationState | null;
    if (state?.paymentVerified) {
      setAccessVerified(true);
      return;
    }
    const session = getAuthSession();
    if (!session) {
      navigate('/', { replace: true });
      return;
    }
    let cancelled = false;
    checkAccess(session.mobile).then((result) => {
      if (cancelled) return;
      if (result.hasAccess) {
        setAccessVerified(true);
      } else {
        clearAuthSession();
        navigate('/', { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [location.state, navigate]);

  useEffect(() => {
    if (!accessVerified) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-animate="top"]', {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
      });

      gsap.from('[data-animate="card"]', {
        y: 36,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.25,
      });
    }, pageRef);

    return () => ctx.revert();
  }, [accessVerified]);

  useEffect(() => {
    if (!accessVerified) return;
    const button = enrollBtnRef.current;
    if (!button || !button.parentElement) return;
    const wrapper = button.parentElement;

    const onMove = (event: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) * 0.18;
      const dy = (event.clientY - (rect.top + rect.height / 2)) * 0.18;
      gsap.to(button, { x: dx, y: dy, duration: 0.28, ease: 'power2.out' });
    };

    const onLeave = () => {
      gsap.to(button, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.55)' });
    };

    wrapper.addEventListener('mousemove', onMove);
    wrapper.addEventListener('mouseleave', onLeave);

    return () => {
      wrapper.removeEventListener('mousemove', onMove);
      wrapper.removeEventListener('mouseleave', onLeave);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessVerified]);

  if (!accessVerified) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.7)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Verifying your access…
      </div>
    );
  }

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.ambientGlowLeft} aria-hidden="true" />
      <div className={styles.ambientGlowRight} aria-hidden="true" />

      <div className={styles.shell}>
        <header className={styles.header} data-animate="top">
          <BrandLogo compact showTagline />
          <span className={styles.badge}>Payment Successful</span>
        </header>

        <section className={styles.hero} data-animate="top">
          <p className={styles.kicker}>Enrollment Confirmed</p>
          <h1 className={styles.title}>Congratulations. Your AI career reset has begun.</h1>
          <p className={styles.description}>
            You have taken the first step toward transforming your AI career. Your enrollment is
            confirmed, and your journey into the world of Agentic AI begins now.
          </p>
          <p className={styles.subDescription}>
            A confirmation email has been sent to your registered email address with all enrollment
            details and next steps.
          </p>
        </section>

        <section className={styles.playerSection} data-animate="card">
          <div className={styles.sectionHeader}>
            <h2>Your Induction Video</h2>
            <p>
              Watch this exclusive overview to understand the program structure and what to expect.
            </p>
          </div>
          <InductionPlayer />
        </section>

        <section className={styles.stepsSection} data-animate="card">
          <div className={styles.sectionHeader}>
            <h2>What Happens Next</h2>
            <p>Each step is designed to move you from excitement into confident execution.</p>
          </div>

          <div className={styles.stepsGrid}>
            {NEXT_STEPS.map((step) => (
              <article key={step.num} className={styles.stepCard}>
                <span className={styles.stepNumber}>{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.trustSection} data-animate="card">
          {TRUST_BADGES.map((badge) => (
            <div key={badge} className={styles.trustBadge}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
                <path d={CHECK_PATH} />
              </svg>
              <span>{badge}</span>
            </div>
          ))}
        </section>

        <section className={styles.ctaSection} data-animate="card">
          <p className={styles.ctaEyebrow}>Luxury onboarding, real outcomes</p>
          <h2>Ready to complete your enrollment and unlock the full experience?</h2>
          <p>
            Finish the final step to access the program materials, connect with instructors, and
            enter the ProITBridge community with everything aligned from day one.
          </p>
          <div className={styles.buttonWrap}>
            <button
              ref={enrollBtnRef}
              className={styles.ctaButton}
              onClick={() => {
                const session = getAuthSession();
                recordEnrollmentClick({
                  mobile: session?.mobile ?? 'anonymous',
                  fullName: session?.name ?? 'anonymous',
                  videoId: 'congrats-induction-v1',
                });
                navigate('/enrollment');
              }}
            >
              Complete Enrollment | Rs.1000
            </button>
          </div>
        </section>

        <footer className={styles.support} data-animate="card">
          <p>Have questions? We are here to help.</p>
          <a href="mailto:rnd.proitbridge@gmail.com">rnd.proitbridge@gmail.com</a>
        </footer>
      </div>
    </div>
  );
}

export default CongratulationsPage;
