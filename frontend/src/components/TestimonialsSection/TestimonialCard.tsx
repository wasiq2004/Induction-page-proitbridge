import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import gsap from 'gsap';
import type { Testimonial } from '@t/index';
import styles from './TestimonialsSection.module.css';

interface TestimonialCardProps {
  item: Testimonial;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function TestimonialCard({ item }: TestimonialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fullTextRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    event.currentTarget.style.transform =
      `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-8px)`;
    event.currentTarget.style.transition = 'transform 0.1s ease';
  };

  const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = '';
    event.currentTarget.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
  };

  const handleExpand = () => {
    const element = fullTextRef.current;
    if (!element) return;

    if (!isExpanded) {
      gsap.to(element, { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.inOut' });
    } else {
      gsap.to(element, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.inOut' });
    }

    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleExpand();
    }
  };

  return (
    <div
      ref={cardRef}
      className={styles.card}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleExpand}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
    >
      <div className={styles.profileRow}>
        <div className={styles.avatarFrame}>
          {!imageFailed ? (
            <img
              src={item.photoSrc}
              alt={item.name}
              className={styles.avatar}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className={styles.avatarFallback}>{getInitials(item.name)}</span>
          )}
        </div>

        <div className={styles.meta}>
          <span className={styles.name}>{item.name}</span>
          <span className={styles.roleCompany}>
            {item.role} | {item.company}
          </span>
        </div>
      </div>

      <blockquote className={styles.blockquote}>
        <p className={styles.quoteText}>"{item.quote}"</p>
      </blockquote>

      <div ref={fullTextRef} className={styles.fullText}>
        <p className={styles.fullTextContent}>{item.fullText}</p>
      </div>

      <p className={styles.hint}>Tap or click to {isExpanded ? 'collapse' : 'read more'}</p>
    </div>
  );
}

export default TestimonialCard;
