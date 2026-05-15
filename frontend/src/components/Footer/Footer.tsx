import { Link } from 'react-router-dom';
import BrandLogo from '@components/BrandLogo';
import styles from './Footer.module.css';

interface FooterProps {
  onInductionClick?: () => void;
}

function Footer({ onInductionClick }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.shell}>
        <div className={styles.brandWrap}>
          <BrandLogo compact showTagline />
        </div>

        <p className={styles.ctaHeading}>
          Get our INDUCTION Session now at <span className={styles.ctaPrice}>Rs. 89</span>
        </p>
        <button className={styles.ctaButton} onClick={() => onInductionClick?.()}>Let's Get Started</button>

        <nav className={styles.links} aria-label="Footer navigation">
          <Link to="/terms" className={styles.link}>Terms &amp; Conditions</Link>
          <span className={styles.divider} aria-hidden="true" />
          <Link to="/privacy" className={styles.link}>Privacy Policy</Link>
          <span className={styles.divider} aria-hidden="true" />
          <Link to="/refund" className={styles.link}>Cancellation &amp; Refund</Link>
          <span className={styles.divider} aria-hidden="true" />
          <Link to="/contact" className={styles.link}>Contact Us</Link>
        </nav>

        <p className={styles.email}>info@proitbridge.com</p>
        <p className={styles.copyright}>Copyright 2026 ProITBridge. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
