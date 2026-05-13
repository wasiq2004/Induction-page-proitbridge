import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useScrollReveal } from '@hooks/useScrollReveal';
import { testimonialsData } from '@constants/testimonialsData';
import TestimonialCard from './TestimonialCard';
import styles from './TestimonialsSection.module.css';

function TestimonialsSection() {
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !gridRef.current) return;

    const cards = gridRef.current.querySelectorAll<HTMLDivElement>(`.${styles.card}`);
    const ctx = gsap.context(() => {
      gsap.from(cards, {
        y: 40,
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
        <h2 className={styles.heading}>What Our Alumni Say</h2>
        <div ref={gridRef} className={styles.grid}>
          {testimonialsData.map(item => (
            <TestimonialCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
