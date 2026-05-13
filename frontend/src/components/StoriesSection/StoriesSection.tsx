import { useRef } from 'react';
import { storiesData } from '@constants/storiesData';
import StoryCard from './StoryCard';
import styles from './StoriesSection.module.css';

function StoriesSection() {
  const stackRef = useRef<HTMLDivElement>(null);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.headingBlock}>
          <span className={styles.eyebrow}>Success Through Stories</span>
          <h2 className={styles.heading}>Stories That Inspire</h2>
          <p className={styles.intro}>
            Real professionals, real transformations. See how others like you landed their dream roles.
          </p>
        </div>

        <div ref={stackRef} className={styles.stack}>
          {storiesData.map((item, index) => (
            <StoryCard
              key={item.id}
              item={item}
              index={index}
              total={storiesData.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default StoriesSection;
