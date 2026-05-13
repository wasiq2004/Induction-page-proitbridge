import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import BrandLogo from '@components/BrandLogo';
import EnrollmentForm from '@components/EnrollmentForm';
import styles from './EnrollmentPage.module.css';

const PROGRAM_BENEFITS = [
  {
    icon: 'curriculum',
    title: 'Expert-Led Curriculum',
    desc: 'Learn from industry practitioners with 15+ years of experience in AI transformation.',
  },
  {
    icon: 'target',
    title: 'Hands-On Projects',
    desc: 'Build real-world AI applications and agentic systems from day one.',
  },
  {
    icon: 'community',
    title: 'Peer Community',
    desc: 'Connect with 500+ working professionals transforming their careers.',
  },
  {
    icon: 'clock',
    title: 'Flexible Learning',
    desc: 'Choose between live, self-paced, or hybrid formats that fit your schedule.',
  },
  {
    icon: 'career',
    title: 'Career Support',
    desc: 'Get placement assistance, portfolio reviews, and job-ready certifications.',
  },
  {
    icon: 'shield',
    title: '100% Refund Guarantee',
    desc: 'If not satisfied within 14 days, get a full refund. Zero risk.',
  },
];

const COURSE_FEATURES = [
  {
    type: 'Online Live',
    features: [
      'Daily live sessions with instructors',
      'Real-time Q&A and doubt resolution',
      'Recorded lectures for future reference',
      'Live coding demonstrations',
      'Interactive peer discussions',
    ],
  },
  {
    type: 'Self-Paced',
    features: [
      'Learn at your own speed',
      'Access lifetime course materials',
      'Structured modules with milestones',
      'Email support from instructors',
      'Complete at your convenience',
    ],
  },
  {
    type: 'Hybrid',
    features: [
      'Mix of live sessions and self-paced modules',
      'Choose which sessions to attend live',
      'Flexible attendance options',
      'Community support groups',
      'Best of both worlds',
    ],
  },
];

function renderBenefitIcon(icon: string) {
  switch (icon) {
    case 'curriculum':
      return <path d="M6 4h9a3 3 0 0 1 3 3v13H9a3 3 0 0 0-3 3V4Zm0 0H5a2 2 0 0 0-2 2v13a3 3 0 0 1 3-3h12" />;
    case 'target':
      return <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.95-4.95-2.12 2.12M8.17 15.83l-2.12 2.12m0-10.9 2.12 2.12m7.66 7.66 2.12 2.12M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8Z" />;
    case 'community':
      return <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87m-4-7.13a4 4 0 1 0-8 0a4 4 0 0 0 8 0Zm7 4a4 4 0 0 1-3 3.87" />;
    case 'clock':
      return <path d="M12 8v5l3 2m6-3a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z" />;
    case 'career':
      return <path d="M4 20h16M6 20V9l6-5 6 5v11M10 20v-6h4v6" />;
    case 'shield':
      return <path d="M12 3 5 6v6c0 5 3.4 9.7 7 10 3.6-.3 7-5 7-10V6l-7-3Zm-2.3 9 1.6 1.6 3.8-3.8" />;
    default:
      return null;
  }
}

function EnrollmentPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-enroll-animate="top"]', {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
      });

      gsap.from('[data-enroll-animate="card"]', {
        y: 36,
        opacity: 0,
        duration: 0.75,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.25,
      });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.ambientGlowLeft} aria-hidden="true" />
      <div className={styles.ambientGlowRight} aria-hidden="true" />

      <div className={styles.shell}>
        <header className={styles.header} data-enroll-animate="top">
          <BrandLogo compact showTagline />
          <span className={styles.badge}>Enrollment Suite</span>
        </header>

        <section className={styles.hero} data-enroll-animate="top">
          <p className={styles.kicker}>Luxury career transformation</p>
          <h1>Transform your career with a premium AI learning experience.</h1>
          <p>
            Join thousands of working professionals mastering AI and building the skills that
            define the future. Limited spots are available for the next cohort.
          </p>
        </section>

        <section className={styles.benefitsSection} data-enroll-animate="card">
          <div className={styles.sectionHeader}>
            <h2>Why Join ProITBridge</h2>
            <p>Everything about the program is built to feel rigorous, modern, and worth the investment.</p>
          </div>

          <div className={styles.benefitsGrid}>
            {PROGRAM_BENEFITS.map((benefit) => (
              <article key={benefit.title} className={styles.benefitCard}>
                <div className={styles.iconShell}>
                  <svg viewBox="0 0 24 24" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {renderBenefitIcon(benefit.icon)}
                  </svg>
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.formatsSection} data-enroll-animate="card">
          <div className={styles.sectionHeader}>
            <h2>Choose Your Learning Format</h2>
            <p>Pick the path that matches your schedule without sacrificing depth or momentum.</p>
          </div>

          <div className={styles.formatsGrid}>
            {COURSE_FEATURES.map((course) => (
              <article key={course.type} className={styles.formatCard}>
                <h3>{course.type}</h3>
                <ul>
                  {course.features.map((feature) => (
                    <li key={feature}>
                      <span className={styles.tick}>+</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.formSection} data-enroll-animate="card">
          <div className={styles.formIntro}>
            <p className={styles.kicker}>Fast, secure, polished</p>
            <h2>Complete your enrollment in a luxury-grade flow.</h2>
            <p>
              The form below keeps everything structured, clear, and mobile-friendly so the final
              step feels confident instead of overwhelming.
            </p>
          </div>
          <EnrollmentForm />
        </section>

        <footer className={styles.support} data-enroll-animate="card">
          <p>Questions about the program? Our team is here to help.</p>
          <a href="mailto:rnd.proitbridge@gmail.com">rnd.proitbridge@gmail.com</a>
        </footer>
      </div>
    </div>
  );
}

export default EnrollmentPage;
