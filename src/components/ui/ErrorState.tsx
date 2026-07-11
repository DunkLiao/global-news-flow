import type { AppError } from '../../types/news';
import styles from './States.module.css';

interface ErrorStateProps {
  error: AppError;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.stateBox} role="alert">
      <div className={styles.iconCircle} data-tone="error" aria-hidden>
        !
      </div>
      <h2 className={styles.stateTitle}>{error.message}</h2>
      {error.hint && <p className={styles.stateHint}>{error.hint}</p>}
      {onRetry && (
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          重新嘗試
        </button>
      )}
    </div>
  );
}
