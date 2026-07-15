// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import type { Article } from '../types/news';
import { dedupeAndSortArticles } from './newsApi';
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
