// /rss.xml：公開記事（ニュースを含む）を新しい順に（T064）。下書きは含まない。
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../../site.config';
import { articleHref } from '../lib/article-view';
import { publishedArticles } from '../queries/articles';

const RSS_ITEMS = 50;

export const GET: APIRoute = async () => {
  const articles = (await publishedArticles())
    .toSorted((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
    .slice(0, RSS_ITEMS);
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: SITE.url,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.publishedAt,
      link: articleHref(a.id),
    })),
    customData: '<language>ja</language>',
  });
};
