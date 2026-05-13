import { useEffect, useRef } from 'react';
import type { Prerequisite } from '@t/index';
import styles from './PrerequisitesSection.module.css';

interface PrerequisiteCardProps {
  item: Prerequisite;
  isVisible: boolean;
  index: number;
}

function PrerequisiteCard({ item, isVisible, index }: PrerequisiteCardProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !isVisible) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    const timeout = setTimeout(() => {
      path.style.transition = `stroke-dashoffset 0.8s ease ${index * 0.3}s`;
      path.style.strokeDashoffset = '0';
    }, 10);

    return () => clearTimeout(timeout);
  }, [isVisible, index]);

  return (
    <div className={styles.card}>
      <div className={styles.iconBox}>
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <path ref={pathRef} d={item.iconPath} />
        </svg>
      </div>
      <div>
        <p className={styles.cardTitle}>{item.title}</p>
        <p className={styles.cardSubtitle}>{item.subtitle}</p>
      </div>
    </div>
  );
}

export default PrerequisiteCard;
