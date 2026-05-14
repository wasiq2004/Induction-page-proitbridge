import { Link } from 'react-router-dom';
import styles from './BrandLogo.module.css';

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
  showTagline?: boolean;
}

function BrandLogo({
  compact = false,
  className = '',
  showTagline = false,
}: BrandLogoProps) {
  return (
    <Link
      to="/"
      className={`${styles.logo} ${compact ? styles.compact : ''} ${className}`.trim()}
      aria-label="ProITBridge home"
    >
      {/* <span className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 64 64" className={styles.markSvg}>
          <defs>
            <linearGradient id="brand-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#B8EAF7" />
              <stop offset="45%" stopColor="#6FD3F2" />
              <stop offset="100%" stopColor="#2E7DE8" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="56" height="56" rx="18" fill="rgba(9,14,31,0.92)" />
          <path
            d="M18 42V22h13.5c6 0 10.5 3.4 10.5 9.2 0 5.9-4.5 10.8-11.9 10.8H18zm8.8-7h2.5c3.4 0 5.4-1.4 5.4-4.1 0-2.4-1.8-3.9-4.9-3.9h-3v8z"
            fill="url(#brand-gradient)"
          />
          <path
            d="M46 18 28 46"
            stroke="url(#brand-gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>
      </span> */}

      <span className={styles.wordmark}>
        <img
          src="/assets/proitbridge-logo-new.png"
          alt="ProITBridge"
          className={styles.logoImg}
        />
      </span>
    </Link>
  );
}

export default BrandLogo;
