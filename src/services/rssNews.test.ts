// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import type { Article } from '../types/news';
import { dedupeAndSortArticles, paginateArticles } from './newsApi';
import { parseRssXml } from './rssNews';

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <item>
      <title><![CDATA[AI 晶片需求升溫]]></title>
      <link>https://example.com/news/ai-chip</link>
      <description><![CDATA[<p>市場看好 AI 伺服器與晶片供應鏈。</p>]]></description>
      <pubDate>Wed, 15 Jul 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>金融市場震盪</title>
      <link>https://example.com/news/market</link>
      <description>債券與匯率波動加劇。</description>
      <pubDate>Wed, 15 Jul 2026 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

function makeArticle(index: number): Article {
  return {
    source: { id: null, name: 'Example' },
    author: null,
    title: `Article ${index}`,
    description: null,
    url: `https://example.com/news/${index}`,
    urlToImage: null,
    publishedAt: `2026-07-15T10:${String(index).padStart(2, '0')}:00.000Z`,
    content: null,
  };
}

function buildRssWithItems(count: number): string {
  const items = Array.from({ length: count }, (_, index) => {
    const itemNo = index + 1;
    return `
    <item>
      <title>News ${itemNo}</title>
      <link>https://example.com/rss/${itemNo}</link>
      <description>RSS item ${itemNo}</description>
      <pubDate>Wed, 15 Jul 2026 10:00:00 GMT</pubDate>
    </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Large Feed</title>${items}
  </channel>
</rss>`;
}

describe('parseRssXml', () => {
  it('normalizes RSS items to Article and strips HTML from descriptions', () => {
    const articles = parseRssXml(SAMPLE_RSS, {
      sourceName: 'Example RSS',
      keyword: '',
    });

    expect(articles).toHaveLength(2);
    expect(articles[0]).toMatchObject({
      source: { id: null, name: 'Example RSS' },
      title: 'AI 晶片需求升溫',
      description: '市場看好 AI 伺服器與晶片供應鏈。',
      url: 'https://example.com/news/ai-chip',
      publishedAt: '2026-07-15T10:00:00.000Z',
    });
  });

  it('filters static RSS items by keyword against title and description', () => {
    const articles = parseRssXml(SAMPLE_RSS, {
      sourceName: 'Example RSS',
      keyword: 'AI',
    });

    expect(articles.map((article) => article.title)).toEqual(['AI 晶片需求升溫']);
  });

  it('keeps more than 20 parsed RSS items as candidates', () => {
    const articles = parseRssXml(buildRssWithItems(25), {
      sourceName: 'Large RSS',
      keyword: '',
    });

    expect(articles).toHaveLength(25);
    expect(articles[24]).toMatchObject({
      source: { id: null, name: 'Large RSS' },
      title: 'News 25',
      url: 'https://example.com/rss/25',
    });
  });
});

describe('dedupeAndSortArticles', () => {
  it('deduplicates by URL and sorts newest articles first', () => {
    const articles: Article[] = [
      {
        source: { id: null, name: 'Older' },
        author: null,
        title: 'Older duplicate',
        description: null,
        url: 'https://example.com/same',
        urlToImage: null,
        publishedAt: '2026-07-15T08:00:00.000Z',
        content: null,
      },
      {
        source: { id: null, name: 'Newest' },
        author: null,
        title: 'Newest',
        description: null,
        url: 'https://example.com/new',
        urlToImage: null,
        publishedAt: '2026-07-15T11:00:00.000Z',
        content: null,
      },
      {
        source: { id: null, name: 'Duplicate' },
        author: null,
        title: 'Duplicate',
        description: null,
        url: 'https://example.com/same',
        urlToImage: null,
        publishedAt: '2026-07-15T09:00:00.000Z',
        content: null,
      },
    ];

    expect(dedupeAndSortArticles(articles).map((article) => article.title)).toEqual([
      'Newest',
      'Older duplicate',
    ]);
  });
});

describe('paginateArticles', () => {
  it('returns the first 20 articles for page 1', () => {
    const articles = Array.from({ length: 45 }, (_, index) => makeArticle(index + 1));

    expect(paginateArticles(articles, 1).map((article) => article.title)).toEqual(
      Array.from({ length: 20 }, (_, index) => `Article ${index + 1}`),
    );
  });

  it('returns articles 21 through 40 for page 2', () => {
    const articles = Array.from({ length: 45 }, (_, index) => makeArticle(index + 1));

    expect(paginateArticles(articles, 2).map((article) => article.title)).toEqual(
      Array.from({ length: 20 }, (_, index) => `Article ${index + 21}`),
    );
  });
});
