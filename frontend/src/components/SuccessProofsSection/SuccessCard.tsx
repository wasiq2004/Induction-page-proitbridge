import { type MouseEvent } from 'react';
import { useCountUp } from '@hooks/useCountUp';
import type { SuccessStory } from '@t/index';
import styles from './SuccessProofsSection.module.css';

interface SuccessCardProps {
  item: SuccessStory;
  isVisible: boolean;
  index: number;
}

function SuccessCard({ item, isVisible, index }: SuccessCardProps) {
  const count = useCountUp(
    item.packageLPA ?? 0,
    1500,
    isVisible && item.packageLPA !== null
  );

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty('--card-rotate-x', `${(-y * 6).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--card-rotate-y', `${(x * 8).toFixed(2)}deg`);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--card-rotate-x', '0deg');
    event.currentTarget.style.setProperty('--card-rotate-y', '0deg');
  };

  return (
    <article
      className={styles.card}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.cardGlow} aria-hidden="true" />

      <div className={styles.imageWrapper}>
        <img src={item.image} alt={item.title} className={styles.cardImg} />
        <div className={styles.imageOverlay} />

        <span className={styles.indexBadge}>0{index + 1}</span>

        {item.packageLPA !== null ? (
          <div className={styles.lpaBadge}>
            <span className={styles.lpaNumber}>{count}</span>
            <span className={styles.lpaUnit}>LPA</span>
          </div>
        ) : (
          <div className={styles.lpaBadge}>
            <svg viewBox="0 0 24 24" className={styles.trophyIcon} fill="currentColor">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.86 10.4 5 9.29 5 8zm14 0c0 1.29-.86 2.4-2 2.82V7h2v1z" />
            </svg>
            <span className={styles.lpaUnit}>Referral</span>
          </div>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.metaRow}>
          <span className={styles.cardCompany}>{item.company}</span>
        </div>
        <p className={styles.cardTitle}>{item.title}</p>
        <p className={styles.cardResult}>{item.result}</p>
      </div>
    </article>
  );
}

export default SuccessCard;
