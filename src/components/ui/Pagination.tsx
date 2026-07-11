import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className={styles.pagination} aria-label="分頁導航">
      <button
        type="button"
        className={styles.navBtn}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="上一頁"
      >
        &larr; 上一頁
      </button>

      <div className={styles.pageNumbers}>
        {pages.map((p) => {
          const active = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${active ? styles.active : ''}`}
              aria-pressed={active}
              aria-label={`第 ${p} 頁`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.navBtn}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="下一頁"
      >
        下一頁 &rarr;
      </button>
    </nav>
  );
}
