import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useScrollReveal } from '@hooks/useScrollReveal';
import { successData } from '@constants/successData';
import SuccessCard from './SuccessCard';
import styles from './SuccessProofsSection.module.css';

function SuccessProofsSection() {
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !gridRef.current) return;

    const cards = gridRef.current.children;
    const ctx = gsap.context(() => {
      gsap.from(cards, {
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
      });
    });

    return () => ctx.revert();
  }, [isVisible]);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Placements That Speak for Themselves</h2>
        <div ref={gridRef} className={styles.grid}>
          {successData.map((item, i) => (
            <SuccessCard key={item.id} item={item} isVisible={isVisible} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default SuccessProofsSection;
