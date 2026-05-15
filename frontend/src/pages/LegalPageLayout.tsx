import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import styles from './LegalPage.module.css';

interface LegalPageLayoutProps {
  kicker: string;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}

function LegalPageLayout({ kicker, title, meta, children }: LegalPageLayoutProps) {
  return (
    <main className={styles.page}>
      <span className={styles.ambientGlowLeft} aria-hidden />
      <span className={styles.ambientGlowRight} aria-hidden />

      <div className={styles.shell}>
        <header className={styles.header}>
          <Link to="/" className={styles.backLink}>
            <svg
              className={styles.backIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </header>

        <div className={styles.hero}>
          <span className={styles.kicker}>{kicker}</span>
          <h1 className={styles.title}>{title}</h1>
          {meta && <div className={styles.meta}>{meta}</div>}
        </div>

        <article className={styles.content}>{children}</article>
      </div>
    </main>
  );
}

export default LegalPageLayout;
export { styles as legalStyles };
