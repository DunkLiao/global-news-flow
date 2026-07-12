import { useCallback, useEffect, useState } from 'react';
import { fetchNews, NewsApiError } from '../services/newsApi';
import type { AppError, Article } from '../types/news';
import { useDebounce } from './useDebounce';

export interface UseNewsReturn {
  keyword: string;
  setKeyword: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  page: number;
  setPage: (value: number) => void;
  articles: Article[];
  totalResults: number;
  pageSize: number;
  loading: boolean;
  error: AppError | null;
  refetch: () => void;
}

export function useNews(): UseNewsReturn {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const debouncedKeyword = useDebounce(keyword, 400);

  const refetch = useCallback(() => {
    setReloadToken((n) => n + 1);
  }, []);

  const handleSetKeyword = useCallback((val: string) => {
    setKeyword(val);
    setPage(1);
  }, []);

  const handleSetCategory = useCallback((val: string) => {
    setCategory(val);
    setPage(1);
  }, []);

  const handleSetCountry = useCallback((val: string) => {
    setCountry(val);
    setPage(1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchNews(
          {
            keyword: debouncedKeyword,
            category,
            country,
            page,
          },
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setArticles(result.articles);
        setTotalResults(result.totalResults);
        setPageSize(result.pageSize);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        if (controller.signal.aborted) return;

        if (err instanceof NewsApiError) {
          setError({ message: err.message, hint: err.hint });
        } else {
          setError({
            message: '發生未預期的錯誤',
            hint: '請重新整理頁面，或稍後再試。',
          });
        }
        setArticles([]);
        setTotalResults(0);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [debouncedKeyword, category, country, page, reloadToken]);

  return {
    keyword,
    setKeyword: handleSetKeyword,
    category,
    setCategory: handleSetCategory,
    country,
    setCountry: handleSetCountry,
    page,
    setPage,
    articles,
    totalResults,
    pageSize,
    loading,
    error,
    refetch,
  };
}
