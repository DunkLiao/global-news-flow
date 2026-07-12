/** NewsAPI article source */
export interface NewsSource {
  id: string | null;
  name: string;
}

/** Single news article from NewsAPI */
export interface Article {
  source: NewsSource;
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

/** Successful NewsAPI response body */
export interface NewsApiSuccessResponse {
  status: 'ok';
  totalResults: number;
  articles: Article[];
}

/** Error NewsAPI response body */
export interface NewsApiErrorResponse {
  status: 'error';
  code?: string;
  message?: string;
}

export type NewsApiResponse = NewsApiSuccessResponse | NewsApiErrorResponse;

/** Query parameters for fetchNews */
export interface NewsQueryParams {
  keyword: string;
  category: string;
  country: string;
  page?: number;
}

/** Normalized fetch result */
export interface NewsFetchResult {
  articles: Article[];
  totalResults: number;
  pageSize: number;
}

/** App-level error with optional next-step hint */
export interface AppError {
  message: string;
  hint?: string;
}
