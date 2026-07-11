import type {
  AppError,
  NewsApiResponse,
  NewsFetchResult,
  NewsQueryParams,
} from '../types/news';

const NEWS_API_BASE = 'https://newsapi.org/v2';
export const PAGE_SIZE = 20;

function getApiKey(): string {
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
    country: params.country,
    pageSize: String(PAGE_SIZE),
    apiKey,
  };

  if (params.page) {
    searchParams.page = String(params.page);
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

/**
 * Fetch news from NewsAPI via CORS proxy.
 * - With keyword → /v2/everything
 * - Without keyword → /v2/top-headlines
 */
export async function fetchNews(
  params: NewsQueryParams,
  signal?: AbortSignal,
): Promise<NewsFetchResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new NewsApiError({
      message: '尚未設定 API Key',
      hint: '請複製 .env.example 為 .env，填入 VITE_NEWS_API_KEY=你的金鑰，然後重新執行 npm run dev。金鑰可至 https://newsapi.org/register 免費申請。',
    });
  }

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
      message: '連線失敗',
      hint: '無法連線至新聞服務或 CORS 代理。請檢查網路連線，稍後再試。',
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

  return {
    articles,
    totalResults: data.totalResults ?? articles.length,
  };
}
