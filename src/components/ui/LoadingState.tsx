import styles from './States.module.css';

const SKELETON_COUNT = 6;

export function LoadingState() {
  return (
    <div className={styles.skeletonGrid} role="status" aria-live="polite" aria-busy="true">
      <span className={styles.srOnly}>載入新聞中…</span>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonBody}>
            <div className={styles.skeletonLine} style={{ width: '40%' }} />
            <div className={styles.skeletonLine} style={{ width: '90%' }} />
            <div className={styles.skeletonLine} style={{ width: '75%' }} />
            <div className={styles.skeletonLine} style={{ width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
