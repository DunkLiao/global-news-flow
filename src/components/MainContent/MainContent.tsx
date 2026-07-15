import type { AppError, Article } from '../../types/news';
import { getCategoryLabel } from '../../constants/categories';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { LoadingState } from '../ui/LoadingState';
import { NewsGrid } from '../NewsGrid/NewsGrid';
import { Pagination } from '../ui/Pagination';
import styles from './MainContent.module.css';

interface MainContentProps {
  category: string;
  keyword: string;
  articles: Article[];
  totalResults: number;
  loading: boolean;
  error: AppError | null;
  page: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  pageSize: number;
}

export function MainContent({
  category,
  keyword,
  articles,
  totalResults,
  loading,
  error,
  page,
  onPageChange,
  onRetry,
  pageSize,
}: MainContentProps) {
  const trimmedKeyword = keyword.trim();
  const isSearchMode = Boolean(trimmedKeyword);
  const heading = isSearchMode
    ? `搜尋「${trimmedKeyword}」`
    : getCategoryLabel(category);

  // API free plans and merged RSS results are capped to keep pagination predictable.
  const maxResults = Math.min(totalResults, 100);
  const totalPages = Math.ceil(maxResults / pageSize);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{heading}</h2>
          <p className={styles.subtitle}>
            {loading
              ? '載入中…'
              : error
                ? '無法顯示結果'
                : ''}
          </p>
        </div>
      </header>

      <div className={styles.content}>
        {loading && <LoadingState />}
        {!loading && error && <ErrorState error={error} onRetry={onRetry} />}
        {!loading && !error && articles.length === 0 && (
          <EmptyState hasKeyword={isSearchMode} />
        )}
        {!loading && !error && articles.length > 0 && (
          <>
            <NewsGrid articles={articles} />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </>
        )}
      </div>
    </main>
  );
}
