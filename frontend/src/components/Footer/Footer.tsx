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
        <button className={styles.ctaButton} onClick={() => onInductionClick?.()}>Get INDUCTION Session - Rs. 89</button>

        <nav className={styles.links} aria-label="Footer navigation">
          <a href="#" className={styles.link}>Terms &amp; Conditions</a>
          <span className={styles.divider} aria-hidden="true" />
          <a href="#" className={styles.link}>Privacy Policy</a>
          <span className={styles.divider} aria-hidden="true" />
          <a href="#" className={styles.link}>Cancellation &amp; Refund</a>
          <span className={styles.divider} aria-hidden="true" />
          <a href="#" className={styles.link}>Contact Us</a>
        </nav>

        <p className={styles.email}>info@proitbridge.com</p>
        <p className={styles.copyright}>Copyright 2026 ProITBridge. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
