// 各記事の .md 版（/claude-code/hooks-format.md）。エージェントが読むための版（T053）。
import type { APIRoute, GetStaticPaths } from 'astro';
import { getEntry, type CollectionEntry } from 'astro:content';
import { SITE } from '../../site.config';
import { verifiedWithLines } from '../lib/article-meta';
import { articleHref } from '../lib/article-view';
import { toJstDate } from '../lib/dates';
import { toMarkdownExport } from '../lib/markdown-export';
import { publishedArticles } from '../queries/articles';

export const getStaticPaths = (async () =>
  (await publishedArticles()).map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }))) satisfies GetStaticPaths;

interface Props {
  entry: CollectionEntry<'articles'>;
}

export const GET: APIRoute<Props> = async ({ props }) => {
  const { entry } = props;
  const { data } = entry;
  const product = data.products[0] ? await getEntry(data.products[0]) : undefined;
  const versions = [product?.data.name, ...verifiedWithLines(data.verifiedWith)].filter(Boolean);
  const how = data.verification === 'hands-on' ? '手元で検証' : '一次情報の出典を確認';
  const markdown = toMarkdownExport({
    title: data.title,
    description: data.description,
    url: `${SITE.url}${articleHref(entry.id)}`,
    verified: `${toJstDate(data.verifiedAt)} ${how}${versions.length > 0 ? `（${versions.join(' / ')}）` : ''}`,
    sources: data.sources,
    body: entry.body ?? '',
  });
  return new Response(markdown, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
