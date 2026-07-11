import type { Article } from '../../types/news';
import { NewsCard } from '../NewsCard/NewsCard';
import styles from './NewsGrid.module.css';

interface NewsGridProps {
  articles: Article[];
}

export function NewsGrid({ articles }: NewsGridProps) {
  return (
    <div className={styles.grid}>
      {articles.map((article, index) => (
        <NewsCard
          key={`${article.url || article.title}-${index}`}
          article={article}
        />
      ))}
    </div>
  );
}
