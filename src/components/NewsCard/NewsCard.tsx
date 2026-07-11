import { useState } from 'react';
import type { Article } from '../../types/news';
import { formatAbsoluteTime, formatRelativeTime } from '../../utils/formatTime';
import styles from './NewsCard.module.css';

const PLACEHOLDER = '/placeholder-news.svg';

interface NewsCardProps {
  article: Article;
}

export function NewsCard({ article }: NewsCardProps) {
  const [imgSrc, setImgSrc] = useState(article.urlToImage || PLACEHOLDER);
  const sourceName = article.source?.name?.trim() || '未知來源';
  const title = article.title?.trim() || '（無標題）';
  const description = article.description?.trim() || '暫無摘要';
  const absoluteTime = formatAbsoluteTime(article.publishedAt);
  const relativeTime = formatRelativeTime(article.publishedAt);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <img
          className={styles.image}
          src={imgSrc}
          alt=""
          loading="lazy"
          onError={() => {
            if (imgSrc !== PLACEHOLDER) {
              setImgSrc(PLACEHOLDER);
            }
          }}
        />
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.source}>{sourceName}</span>
          <time className={styles.time} dateTime={article.publishedAt} title={absoluteTime}>
            {relativeTime}
          </time>
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        {article.url ? (
          <a
            className={styles.readMore}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            閱讀全文
            <span aria-hidden> →</span>
          </a>
        ) : (
          <span className={styles.readMoreDisabled}>連結不可用</span>
        )}
      </div>
    </article>
  );
}
