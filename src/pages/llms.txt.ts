// /llms.txt：公開記事の .md 版を、会社の順・製品ごとに並べる（T054）。下書きは含まない。
import type { APIRoute } from 'astro';
import { SITE } from '../../site.config';
import { buildLlmsTxt } from '../lib/llms';
import { loadCatalog } from '../queries/catalog';

const mdUrl = (id: string): string => `${SITE.url}/${id}.md`;

export const GET: APIRoute = async () => {
  const catalog = await loadCatalog();
  const summaries = [...catalog.summaryById.values()];
  const vendorOrder = new Map(catalog.vendors.map((v) => [v.id, v.data.order]));
  const products = catalog.products.toSorted(
    (a, b) =>
      (vendorOrder.get(a.data.vendor?.id ?? '') ?? 0) -
      (vendorOrder.get(b.data.vendor?.id ?? '') ?? 0),
  );
  const link = (a: (typeof summaries)[number]) => ({
    title: a.title,
    url: mdUrl(a.id),
    note: [a.station, `検証 ${a.verifiedDate}`].filter(Boolean).join('、'),
  });
  const txt = buildLlmsTxt({
    name: SITE.name,
    description: SITE.description,
    sections: [
      ...products.map((p) => ({
        name: p.data.name,
        links: summaries
          .filter((a) => a.entry.data.type !== 'news' && a.entry.data.products[0]?.id === p.id)
          .toSorted((a, b) => (a.entry.data.stationNo ?? 0) - (b.entry.data.stationNo ?? 0))
          .map(link),
      })),
      {
        name: 'ニュース',
        links: summaries
          .filter((a) => a.entry.data.type === 'news')
          .toSorted(
            (a, b) => b.entry.data.publishedAt.getTime() - a.entry.data.publishedAt.getTime(),
          )
          .map(link),
      },
    ],
  });
  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
