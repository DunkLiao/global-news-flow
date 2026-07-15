import type {
  AppError,
  Article,
  NewsApiResponse,
  NewsFetchResult,
  NewsQueryParams,
} from '../types/news';
import { fetchRssNews } from './rssNews';

const NEWS_API_BASE = 'https://newsapi.org/v2';
export const PAGE_SIZE = 20;

function getApiKey(provider: string = 'newsapi'): string {
  if (provider === 'gnews') {
    return (import.meta.env.VITE_GNEWS_API_KEY as string | undefined)?.trim() ?? '';
  }
  if (provider === 'mediastack') {
    return (import.meta.env.VITE_MEDIASTACK_API_KEY as string | undefined)?.trim() ?? '';
  }
  return (import.meta.env.VITE_NEWS_API_KEY as string | undefined)?.trim() ?? '';
}

/**
 * Wrap NewsAPI URL with CORS proxy (required for pure frontend).
 * @example
 * const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
 */
function toProxyUrl(apiUrl: string): string {
  return `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
}

const COUNTRY_KEYWORDS: Record<string, string> = {
  tw: '(台灣 OR 台北 OR 台中 OR 高雄 OR 台南)',
  cn: '(中國 OR 中国 OR 北京 OR 上海 OR 深圳 OR 廣州 OR 內地 OR 大陸)',
  jp: '(日本 OR 東京 OR 大阪 OR 京都)',
  kr: '(한국 OR 서울 OR 부산)',
};

const COUNTRY_LANGUAGES: Record<string, string> = {
  tw: 'zh',
  cn: 'zh',
};

const CN_EXCLUDE_DOMAINS = [
  'yahoo.com',
  'tw.news.yahoo.com',
  'techbang.com',
  'ithome.com.tw',
  'technews.tw',
  'thenewslens.com',
  'hkepc.com',
  'unwire.hk',
  'newmobilelife.com',
  'cna.com.tw',
  'udn.com',
  'ltn.com.tw',
  'chinatimes.com',
  'setn.com',
  'ebc.net.tw',
  'tvbs.com.tw',
  'storm.mg',
  'ftvnews.com.tw'
].join(',');

const CATEGORY_KEYWORDS: Record<string, string> = {
  business: '(商業 OR 財經 OR 經濟 OR 金融 OR business OR finance OR economy)',
  technology: '(科技 OR 技術 OR 3C OR technology OR tech OR IT)',
  science: '(科學 OR 研究 OR science OR research)',
  health: '(健康 OR 醫療 OR health OR medical)',
  entertainment: '(娛樂 OR 影劇 OR 電影 OR 明星 OR entertainment OR movie OR celebrity)',
  sports: '(體育 OR 運動 OR 賽事 OR sports OR game)',
};

function buildApiUrl(params: NewsQueryParams): string {
  const apiKey = getApiKey();
  const keyword = params.keyword.trim();

  if (keyword) {
    // Search mode → /everything (country/category not supported by this endpoint)
    const searchParams: Record<string, string> = {
      q: keyword,
      sortBy: 'publishedAt',
      pageSize: String(PAGE_SIZE),
      apiKey,
    };
    if (params.page) {
      searchParams.page = String(params.page);
    }
    const search = new URLSearchParams(searchParams);
    return `${NEWS_API_BASE}/everything?${search.toString()}`;
  }

  // If country is not 'us', fall back to /everything endpoint because non-US countries return 0 results in /top-headlines on free plans
  if (params.country && params.country !== 'us') {
    const countryKw = COUNTRY_KEYWORDS[params.country] || `(${params.country})`;
    const categoryKw = params.category ? ` AND ${CATEGORY_KEYWORDS[params.category] || `(${params.category})`}` : '';
    const q = `${countryKw}${categoryKw}`;

    const searchParams: Record<string, string> = {
      q,
      sortBy: 'publishedAt',
      pageSize: String(PAGE_SIZE),
      apiKey,
    };

    if (params.page) {
      searchParams.page = String(params.page);
    }

    // Limit language to Chinese for tw and cn to filter out English/foreign-language news
    const lang = COUNTRY_LANGUAGES[params.country];
    if (lang) {
      searchParams.language = lang;
    }

    // Exclude Taiwan / Hong Kong portals for China (cn) to keep results focused on mainland China
    if (params.country === 'cn') {
      searchParams.excludeDomains = CN_EXCLUDE_DOMAINS;
    }

    const search = new URLSearchParams(searchParams);
    return `${NEWS_API_BASE}/everything?${search.toString()}`;
  }

  // Headlines mode → /top-headlines
  const searchParams: Record<string, string> = {
    pageSize: String(PAGE_SIZE),
    apiKey,
  };

  if (params.page) {
    searchParams.page = String(params.page);
  }

  if (params.country) {
    searchParams.country = params.country;
  } else if (!params.category) {
    // If both country and category are missing, NewsAPI top-headlines will fail.
    // Fallback to 'us' as a default country.
    searchParams.country = 'us';
  }

  if (params.category) {
    searchParams.category = params.category;
  }

  const search = new URLSearchParams(searchParams);
  return `${NEWS_API_BASE}/top-headlines?${search.toString()}`;
}

function mapApiError(code?: string, message?: string): AppError {
  switch (code) {
    case 'apiKeyInvalid':
    case 'apiKeyMissing':
    case 'apiKeyDisabled':
      return {
        message: 'API Key 無效或已停用',
        hint: '請至專案根目錄 .env 檢查 VITE_NEWS_API_KEY，並至 newsapi.org 確認金鑰狀態後重新啟動開發伺服器。',
      };
    case 'rateLimited':
      return {
        message: 'API 配額已用盡',
        hint: 'NewsAPI 免費方案有每日請求上限，請稍後再試或升級方案。',
      };
    case 'parametersMissing':
    case 'parametersIncompatible':
      return {
        message: message || '請求參數不正確',
        hint: '請調整搜尋關鍵字、類別或地區後再試。',
      };
    case 'sourcesTooMany':
    case 'sourceDoesNotExist':
      return {
        message: message || '新聞來源參數錯誤',
        hint: '請重新整理頁面後再試。',
      };
    default:
      return {
        message: message || '無法取得新聞資料',
        hint: '請檢查網路連線與 API Key，稍後再試。',
      };
  }
}

export class NewsApiError extends Error {
  hint?: string;

  constructor(error: AppError) {
    super(error.message);
    this.name = 'NewsApiError';
    this.hint = error.hint;
  }
}

const GNEWS_LANGUAGES: Record<string, string> = {
  tw: 'zh',
  cn: 'zh',
  jp: 'ja',
  kr: 'ko',
  us: 'en',
};

const MEDIASTACK_LANGUAGES: Record<string, string> = {
  tw: 'zh',
  cn: 'zh',
  us: 'en',
};



async function fetchGNews(
  params: NewsQueryParams,
  apiKey: string,
  signal?: AbortSignal,
): Promise<NewsFetchResult> {
  const keyword = params.keyword.trim();
  const max = 10;

  const queryParams: Record<string, string> = {
    apikey: apiKey,
    max: String(max),
  };

  if (params.page) {
    queryParams.page = String(params.page);
  }

  if (params.country) {
    queryParams.country = params.country;
    const lang = GNEWS_LANGUAGES[params.country];
    if (lang) {
      queryParams.lang = lang;
    }
  }

  let endpoint = 'https://gnews.io/api/v4/top-headlines';
  if (keyword) {
    endpoint = 'https://gnews.io/api/v4/search';
    queryParams.q = keyword;
  } else if (params.category) {
    queryParams.category = params.category;
  }

  const searchParams = new URLSearchParams(queryParams);
  const apiUrl = `${endpoint}?${searchParams.toString()}`;
  const proxyUrl = toProxyUrl(apiUrl);

  let response: Response;
  try {
    response = await fetch(proxyUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new NewsApiError({
      message: '連線失敗',
      hint: '無法連線至 GNews 新聞服務。請檢查網路連線。',
    });
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new NewsApiError({
      message: response.ok ? '回應格式錯誤' : `伺服器錯誤（HTTP ${response.status}）`,
      hint: 'CORS 代理或 GNews 可能暫時不可用，請稍後再試。',
    });
  }

  if (!response.ok || data.errors) {
    const errorMsg = Array.isArray(data.errors)
      ? data.errors[0]
      : typeof data.errors === 'object'
        ? Object.values(data.errors).join(', ')
        : 'GNews API 請求失敗';

    if (response.status === 401) {
      throw new NewsApiError({
        message: 'GNews API Key 無效',
        hint: '請檢查 .env 中的 VITE_GNEWS_API_KEY 是否填寫正確，並重新啟動開發伺服器。',
      });
    }
    if (response.status === 403) {
      throw new NewsApiError({
        message: 'GNews 配額已用盡',
        hint: 'GNews 免費方案每日請求上限為 100 次，請稍後再試。',
      });
    }
    if (response.status === 429) {
      throw new NewsApiError({
        message: 'GNews 請求過於頻繁',
        hint: '免費方案有每秒請求次數限制，請稍候再試。',
      });
    }
    throw new NewsApiError({
      message: errorMsg,
      hint: '請檢查篩選條件或關鍵字後再試。',
    });
  }

  const gnewsArticles = data.articles ?? [];
  const articles: Article[] = gnewsArticles.map((art: any) => ({
    source: {
      id: null,
      name: art.source?.name?.trim() || 'GNews',
    },
    author: null,
    title: art.title || '',
    description: art.description || '',
    url: art.url || '',
    urlToImage: art.image || null,
    publishedAt: art.publishedAt || new Date().toISOString(),
    content: art.content || null,
  }));

  return {
    articles,
    totalResults: data.totalArticles ?? articles.length,
    pageSize: max,
  };
}

const CN_DOMAINS = [
  'xinhuanet.com',
  'people.com.cn',
  'chinanews.com',
  'sina.com.cn',
  'sohu.com',
  '163.com',
  'qq.com',
  'ifeng.com',
  'cctv.com',
  'huanqiu.com',
  'news.cn',
  'baidu.com',
  'toutiao.com',
  'china.com'
];

const TW_DOMAINS = [
  'yahoo.com',
  'techbang.com',
  'ithome.com.tw',
  'technews.tw',
  'thenewslens.com',
  'cna.com.tw',
  'udn.com',
  'ltn.com.tw',
  'chinatimes.com',
  'setn.com',
  'ebc.net.tw',
  'tvbs.com.tw',
  'storm.mg',
  'ftvnews.com.tw',
  'mirrorcontent.im',
  'report.tw',
  'cts.com.tw',
  'ttv.com.tw',
  'ftv.com.tw',
  'mnews.tw'
];

async function fetchMediaStack(
  params: NewsQueryParams,
  apiKey: string,
  signal?: AbortSignal,
): Promise<NewsFetchResult> {
  const keyword = params.keyword.trim();
  const limit = 20;

  // Request a larger batch for filtering if non-US country is selected
  const apiLimit = params.country && params.country !== 'us' ? 60 : limit;
  const offset = ((params.page ?? 1) - 1) * apiLimit;

  const queryParams: Record<string, string> = {
    access_key: apiKey,
    limit: String(apiLimit),
    offset: String(offset),
  };

  // Fallback to keyword search for non-US countries because MediaStack free tier lacks regional index coverage
  if (params.country && params.country !== 'us') {
    const countryLabels: Record<string, string> = {
      tw: '台灣',
      cn: '中國',
      jp: '日本',
      kr: '韓國',
    };
    const countryLabel = countryLabels[params.country] || '';
    
    // Combine existing keywords with the country keyword
    const combinedKeywords = keyword 
      ? `${keyword} ${countryLabel}` 
      : countryLabel;
    
    if (combinedKeywords) {
      queryParams.keywords = combinedKeywords;
    }

    const lang = MEDIASTACK_LANGUAGES[params.country];
    if (lang) {
      queryParams.languages = lang;
    }
    // We do NOT set queryParams.countries to search globally
  } else {
    // US region or no region selected: use normal country filter
    if (params.country) {
      queryParams.countries = params.country;
      const lang = MEDIASTACK_LANGUAGES[params.country];
      if (lang) {
        queryParams.languages = lang;
      }
    }
    if (keyword) {
      queryParams.keywords = keyword;
    }
  }

  if (params.category) {
    queryParams.categories = params.category;
  }

  const searchParams = new URLSearchParams(queryParams);
  const apiUrl = `http://api.mediastack.com/v1/news?${searchParams.toString()}`;
  const proxyUrl = toProxyUrl(apiUrl);

  let response: Response;
  try {
    response = await fetch(proxyUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new NewsApiError({
      message: '連線失敗',
      hint: '無法連線至 MediaStack 新聞服務。請檢查網路連線。',
    });
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new NewsApiError({
      message: response.ok ? '回應格式錯誤' : `伺服器錯誤（HTTP ${response.status}）`,
      hint: 'CORS 代理或 MediaStack 可能暫時不可用，請稍後再試。',
    });
  }

  if (!response.ok || data.success === false || data.error) {
    const errObj = data.error || {};
    const errorCode = errObj.code || '';
    const errorMsg = errObj.message || 'MediaStack API 請求失敗';

    if (errorCode === 'invalid_access_key') {
      throw new NewsApiError({
        message: 'MediaStack API Key 無效',
        hint: '請檢查 .env 中的 VITE_MEDIASTACK_API_KEY 是否填寫正確，並重新啟動開發伺服器。',
      });
    }
    if (errorCode === 'usage_limit_reached') {
      throw new NewsApiError({
        message: 'MediaStack 配額已用盡',
        hint: 'MediaStack 免費方案每月請求上限為 1,000 次，請稍後再試。',
      });
    }
    if (errorCode === 'rate_limit_reached') {
      throw new NewsApiError({
        message: 'MediaStack 請求過於頻繁',
        hint: '免費方案有請求頻率限制，請稍後再試。',
      });
    }
    throw new NewsApiError({
      message: errorMsg,
      hint: '請調整篩選條件或關鍵字後再試。',
    });
  }

  let mediastackArticles = data.data ?? [];

  // Filter articles to clearly separate regions
  if (params.country && params.country !== 'us') {
    mediastackArticles = mediastackArticles.filter((art: any) => {
      const url = (art.url || '').toLowerCase();
      const title = art.title || '';
      const source = (art.source || '').toLowerCase();

      try {
        const urlHost = new URL(url).hostname;
        
        if (params.country === 'tw') {
          const isCnDomain = urlHost.endsWith('.cn') || CN_DOMAINS.some(d => urlHost.includes(d));
          const isCnSource = ['新华', '人民网', '央视', '环球网', '中国新闻网', '新浪', '搜狐', '网易', '腾讯'].some(s => source.includes(s));
          return !isCnDomain && !isCnSource;
        }

        if (params.country === 'cn') {
          const isTwDomain = urlHost.endsWith('.tw') || TW_DOMAINS.some(d => urlHost.includes(d));
          const isTwSource = ['中央社', '聯合新聞網', '中時', '自由時報', '東森', 'tvbs', '三立', '風傳媒', 'yahoo'].some(s => source.includes(s));
          return !isTwDomain && !isTwSource;
        }

        if (params.country === 'jp') {
          // Hiragana or Katakana check
          return /[\u3040-\u309F\u30A0-\u30FF]/.test(title);
        }

        if (params.country === 'kr') {
          // Hangul check
          return /[\uAC00-\uD7AF]/.test(title);
        }
      } catch {
        return true;
      }
      return true;
    });
  }

  const articles: Article[] = mediastackArticles.slice(0, limit).map((art: any) => ({
    source: {
      id: null,
      name: art.source?.trim() || 'MediaStack',
    },
    author: art.author || null,
    title: art.title || '',
    description: art.description || '',
    url: art.url || '',
    urlToImage: art.image || null,
    publishedAt: art.published_at || new Date().toISOString(),
    content: art.description || null,
  }));

  return {
    articles,
    totalResults: Math.min(data.pagination?.total ?? articles.length, 100),
    pageSize: limit,
  };
}

/**
 * Fetch news from all configured API sources and merge results.
 */
export async function fetchNews(
  params: NewsQueryParams,
  signal?: AbortSignal,
): Promise<NewsFetchResult> {
  const providers = ['newsapi', 'gnews', 'mediastack'] as const;
  
  // Filter active providers that have configured API keys
  const activeProviders = providers.filter(p => !!getApiKey(p));

  // Fetch from all active providers concurrently
  const apiPromises = activeProviders.map(async (provider) => {
    const apiKey = getApiKey(provider);
    let result: NewsFetchResult;

    if (provider === 'gnews') {
      result = await fetchGNews(params, apiKey, signal);
    } else if (provider === 'mediastack') {
      result = await fetchMediaStack(params, apiKey, signal);
    } else {
      // newsapi
      const apiUrl = buildApiUrl(params);
      const proxyUrl = toProxyUrl(apiUrl);
      let response: Response;

      try {
        response = await fetch(proxyUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw err;
        }
        throw new NewsApiError({
          message: 'NewsAPI 連線失敗',
          hint: '無法連線至新聞服務或 CORS 代理。請檢查網路連線。',
        });
      }

      let data: NewsApiResponse;
      try {
        data = (await response.json()) as NewsApiResponse;
      } catch {
        throw new NewsApiError({
          message: response.ok ? '回應格式錯誤' : `伺服器錯誤（HTTP ${response.status}）`,
          hint: 'CORS 代理或 NewsAPI 可能暫時不可用，請稍後再試。',
        });
      }

      if (!response.ok || data.status === 'error') {
        const errBody = data as { code?: string; message?: string };
        if (response.status === 429 || errBody.code === 'rateLimited') {
          throw new NewsApiError(mapApiError('rateLimited', errBody.message));
        }
        if (response.status === 401 || response.status === 403) {
          throw new NewsApiError(
            mapApiError(errBody.code ?? 'apiKeyInvalid', errBody.message),
          );
        }
        throw new NewsApiError(mapApiError(errBody.code, errBody.message));
      }

      const articles = (data.articles ?? []).filter(
        (a) => a && a.title && a.title !== '[Removed]',
      );

      result = {
        articles,
        totalResults: data.totalResults ?? articles.length,
        pageSize: PAGE_SIZE,
      };
    }

    return { provider, result };
  });

  const promises: Promise<{ provider: string; result: NewsFetchResult }>[] = [
    ...apiPromises,
    fetchRssNews(params, signal).then((result) => ({ provider: 'rss', result })),
  ];

  const settledResults = await Promise.allSettled(promises);
  
  const successes: { provider: string; result: NewsFetchResult }[] = [];
  const errors: { provider: string; error: any }[] = [];

  for (const item of settledResults) {
    if (item.status === 'fulfilled') {
      successes.push(item.value);
    } else {
      if (item.reason instanceof DOMException && item.reason.name === 'AbortError') {
        throw item.reason;
      }
      errors.push({ provider: '', error: item.reason });
    }
  }

  // If all active providers failed, throw the primary error
  if (successes.length === 0) {
    const primaryError = errors[0]?.error;
    if (primaryError instanceof NewsApiError) {
      throw primaryError;
    }
    throw new NewsApiError({
      message: '所有新聞來源皆無法取得資料',
      hint: '請檢查網路連線、RSS 來源可用性，或確認各 API Key 額度與設定。',
    });
  }

  // Merge results
  let allArticles: Article[] = [];
  let totalResults = 0;
  let pageSize = 0;

  for (const success of successes) {
    allArticles = allArticles.concat(success.result.articles);
    totalResults += success.result.totalResults;
    pageSize += success.result.pageSize;
  }

  const uniqueArticles = dedupeAndSortArticles(allArticles);

  return {
    articles: uniqueArticles,
    totalResults,
    pageSize,
  };
}

export function dedupeAndSortArticles(articles: Article[]): Article[] {
  const seenUrls = new Set<string>();
  const uniqueArticles = articles.filter(art => {
    if (!art.url) return true;
    const normalizedUrl = art.url.trim().toLowerCase();
    if (seenUrls.has(normalizedUrl)) {
      return false;
    }
    seenUrls.add(normalizedUrl);
    return true;
  });

  // Sort by publishedAt DESC (newest first)
  uniqueArticles.sort((a, b) => {
    const timeA = new Date(a.publishedAt).getTime();
    const timeB = new Date(b.publishedAt).getTime();
    return timeB - timeA;
  });

  return uniqueArticles;
}
