import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useScrollReveal } from '@hooks/useScrollReveal';
import { prerequisitesData } from '@constants/prerequisitesData';
import styles from './AdmissionsSection.module.css';

function AdmissionsSection() {
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !gridRef.current) return;

    const cards = gridRef.current.children;
    const ctx = gsap.context(() => {
      gsap.from(cards, {
        y: 28,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power3.out',
      });
    });

    return () => ctx.revert();
  }, [isVisible]);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.headingBlock}>
          <span className={styles.eyebrow}>Admissions Readiness</span>
          <h2 className={styles.heading}>What You Need to Join ProITBridge</h2>
          <p className={styles.intro}>
            No coding background required. If you're a working professional with the drive to grow, you already qualify.
          </p>
        </div>

        <div ref={gridRef} className={styles.grid}>
          {prerequisitesData.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.iconBox}>
                <svg viewBox="0 0 24 24" className={styles.icon} fill="currentColor">
                  <path d={item.iconPath} />
                </svg>
              </div>
              <div>
                <p className={styles.cardTitle}>{item.title}</p>
                <p className={styles.cardSubtitle}>{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AdmissionsSection;
