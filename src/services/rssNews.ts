import type { Article, NewsFetchResult, NewsQueryParams } from '../types/news';

const RSS_PAGE_SIZE = 20;

interface RssSourceConfig {
  id: string;
  name: string;
  url: string;
  countries: string[];
  categories: string[];
}

interface ParseRssOptions {
  sourceName: string;
  keyword: string;
}

const STATIC_RSS_SOURCES: RssSourceConfig[] = [
  {
    id: 'cna',
    name: '中央社',
    url: 'https://www.cna.com.tw/rss.aspx',
    countries: ['', 'tw'],
    categories: ['', 'business', 'technology', 'science', 'health', 'sports'],
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    countries: ['', 'us'],
    categories: ['', 'business', 'technology'],
  },
  {
    id: 'hacker-news',
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    countries: ['', 'us'],
    categories: ['', 'technology', 'science'],
  },
];

function toProxyUrl(url: string): string {
  return `https://corsproxy.io/?${encodeURIComponent(url)}`;
}

function textFrom(parent: Element, selectors: string[]): string {
  for (const selector of selectors) {
    const node = parent.querySelector(selector);
    const value = node?.textContent?.trim();
    if (value) return value;
  }
  return '';
}

function cleanText(value: string): string {
  const doc = new DOMParser().parseFromString(value, 'text/html');
  return (doc.body.textContent ?? value).replace(/\s+/g, ' ').trim();
}

function normalizeDate(value: string): string {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? new Date().toISOString() : new Date(timestamp).toISOString();
}

function matchesKeyword(article: Article, keyword: string): boolean {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;

  const haystack = `${article.title} ${article.description ?? ''}`.toLowerCase();
  return haystack.includes(normalizedKeyword);
}

function articleFromEntry(entry: Element, sourceName: string): Article | null {
  const title = cleanText(textFrom(entry, ['title']));
  const description = cleanText(
    textFrom(entry, ['description', 'summary', 'content\\:encoded', 'encoded']),
  );
  const linkNode = entry.querySelector('link');
  const atomHref = linkNode?.getAttribute('href')?.trim() ?? '';
  const url = atomHref || textFrom(entry, ['link', 'guid']);
  const publishedAt = normalizeDate(
    textFrom(entry, ['pubDate', 'published', 'updated', 'dc\\:date', 'date']),
  );

  if (!title || !url) return null;

  return {
    source: {
      id: null,
      name: sourceName,
    },
    author: textFrom(entry, ['author', 'dc\\:creator', 'creator']) || null,
    title,
    description: description || null,
    url,
    urlToImage: null,
    publishedAt,
    content: description || null,
  };
}

export function parseRssXml(xml: string, options: ParseRssOptions): Article[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('RSS XML 格式錯誤');
  }

  const entries = Array.from(doc.querySelectorAll('item, entry'));
  return entries
    .map((entry) => articleFromEntry(entry, options.sourceName))
    .filter((article): article is Article => Boolean(article))
    .filter((article) => matchesKeyword(article, options.keyword));
}

function buildGoogleNewsRssUrl(params: NewsQueryParams): string {
  const keyword = params.keyword.trim();
  const query = keyword || 'latest news';
  const searchParams = new URLSearchParams({
    q: query,
    hl: 'zh-TW',
    gl: params.country === 'us' ? 'US' : 'TW',
    ceid: params.country === 'us' ? 'US:en' : 'TW:zh-Hant',
  });
  return `https://news.google.com/rss/search?${searchParams.toString()}`;
}

function rssSourcesFor(params: NewsQueryParams): RssSourceConfig[] {
  return STATIC_RSS_SOURCES.filter((source) => {
    const countryMatches = !params.country || source.countries.includes(params.country);
    const categoryMatches = !params.category || source.categories.includes(params.category);
    return countryMatches && categoryMatches;
  });
}

async function fetchRssUrl(
  url: string,
  sourceName: string,
  keyword: string,
  signal?: AbortSignal,
): Promise<Article[]> {
  const response = await fetch(toProxyUrl(url), {
    method: 'GET',
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`${sourceName} RSS 請求失敗（HTTP ${response.status}）`);
  }

  const xml = await response.text();
  return parseRssXml(xml, { sourceName, keyword });
}

export async function fetchRssNews(
  params: NewsQueryParams,
  signal?: AbortSignal,
): Promise<NewsFetchResult> {
  const keyword = params.keyword.trim();
  const tasks = [
    fetchRssUrl(buildGoogleNewsRssUrl(params), 'Google News RSS', '', signal),
    ...rssSourcesFor(params).map((source) =>
      fetchRssUrl(source.url, source.name, keyword, signal),
    ),
  ];

  const settled = await Promise.allSettled(tasks);
  const articles = settled.flatMap((item) => {
    if (item.status === 'rejected') {
      if (item.reason instanceof DOMException && item.reason.name === 'AbortError') {
        throw item.reason;
      }
      return [];
    }
    return item.value;
  });

  return {
    articles: articles.slice(0, RSS_PAGE_SIZE),
    totalResults: articles.length,
    pageSize: RSS_PAGE_SIZE,
  };
}
