// 記事ごとの OGP 画像（/og/<記事 ID>.png）。ビルドのときに作る。
import type { APIRoute, GetStaticPaths } from 'astro';
import type { OgCardInput } from '../../lib/og-image';
import { renderOgPng } from '../../lib/og-render';
import { loadCatalog, type ArticleSummary } from '../../queries/catalog';
import { toJstDate } from '../../lib/dates';

const cardOf = (a: ArticleSummary): OgCardInput =>
  a.entry.data.type === 'news'
    ? { mark: 'NEWS', title: a.title, sub: `ニュース · ${toJstDate(a.entry.data.publishedAt)}` }
    : {
        mark: a.station ?? '',
        title: a.title,
        sub: [a.productName, `検証 ${a.verifiedDate}`].filter(Boolean).join(' · '),
      };

export const getStaticPaths = (async () =>
  [...(await loadCatalog()).summaryById.values()].map((a) => ({
    params: { slug: a.id },
    props: { card: cardOf(a) },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ card: OgCardInput }> = async ({ props }) =>
  new Response(await renderOgPng(props.card), { headers: { 'Content-Type': 'image/png' } });
