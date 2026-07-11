import styles from './States.module.css';

interface EmptyStateProps {
  hasKeyword?: boolean;
}

export function EmptyState({ hasKeyword }: EmptyStateProps) {
  return (
    <div className={styles.stateBox} role="status">
      <div className={styles.iconCircle} data-tone="muted" aria-hidden>
        ∅
      </div>
      <h2 className={styles.stateTitle}>無符合條件的新聞</h2>
      <p className={styles.stateHint}>
        {hasKeyword
          ? '請嘗試其他關鍵字，或清空搜尋後以類別／地區瀏覽頭條。'
          : '此地區或類別目前沒有可用頭條。請切換其他地區、類別，或改用關鍵字搜尋。'}
      </p>
    </div>
  );
}
