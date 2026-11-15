// 記事ごとの OGP 画像（/og/<記事 ID>.png）。ビルドのときに作る。
import type { APIRoute, GetStaticPaths } from 'astro';
import type { OgCardInput } from '../../lib/og-image';
import { renderOgPng } from '../../lib/og-render';
import { loadCatalog, type ArticleSummary } from '../../queries/catalog';

// 右下には、検証票と同じ言葉と日付を出す（手元で検証／出典を確認）
const cardOf = (a: ArticleSummary): OgCardInput => {
  const verified = {
    label: a.entry.data.verification === 'hands-on' ? '手元で検証' : '出典を確認',
    date: a.record.date,
  };
  return a.entry.data.type === 'news'
    ? { mark: 'NEWS', title: a.title, sub: 'ニュース', verified }
    : { mark: a.station ?? '', title: a.title, sub: a.productName ?? '', verified };
};

export const getStaticPaths = (async () =>
  [...(await loadCatalog()).summaryById.values()].map((a) => ({
    params: { slug: a.id },
    props: { card: cardOf(a) },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ card: OgCardInput }> = async ({ props }) =>
  new Response(await renderOgPng(props.card), { headers: { 'Content-Type': 'image/png' } });
