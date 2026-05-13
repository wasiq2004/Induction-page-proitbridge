import styles from './BlobDivider.module.css';

interface BlobDividerProps {
  nextBg?: string;
}

function BlobDivider({ nextBg = '#0A0F2C' }: BlobDividerProps) {
  return (
    <div
      className={styles.divider}
      style={{ background: nextBg }}
      aria-hidden="true"
    />
  );
}

export default BlobDivider;
