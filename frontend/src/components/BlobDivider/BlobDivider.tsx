import styles from './BlobDivider.module.css';

function BlobDivider() {
  return (
    <div
      className={styles.divider}
      aria-hidden="true"
    />
  );
}

export default BlobDivider;
