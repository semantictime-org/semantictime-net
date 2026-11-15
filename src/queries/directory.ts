// 製品と連載の一覧（/products/・/series/・ホームの右の列）に出す値を組み立てる。
import { getCollection } from 'astro:content';
import { seriesHref } from '../lib/article-view';
import type { loadCatalog } from './catalog';

type Catalog = Awaited<ReturnType<typeof loadCatalog>>;

/** 会社に属さない路線（AI の基本）をまとめる欄の名前。各社より先に置く */
const COMMON_GROUP = '共通';

export interface ProductEntry {
  readonly id: string;
  readonly name: string;
  /** 記事の本数（ニュースとハブそのものは数えない） */
  readonly count: number;
  /** 製品のハブ。記事がなければハブがないので undefined */
  readonly href: string | undefined;
}

export interface VendorGroup {
  /** 会社の ID。会社に属さない路線の欄は undefined */
  readonly id: string | undefined;
  readonly name: string;
  readonly products: readonly ProductEntry[];
}

/** 会社ごとの全製品（vendors.yaml の order の順）。製品のない会社の欄は出さない */
export const productDirectory = (catalog: Catalog): readonly VendorGroup[] => {
  const countByProduct = Map.groupBy(
    catalog.catalogArticles.filter((a) => a.type !== 'news' && a.type !== 'landing'),
    (a) => a.products[0] ?? '',
  );
  return [
    { id: undefined, name: COMMON_GROUP, order: 0 },
    ...catalog.vendors.map((v) => ({ id: v.id, name: v.data.name, order: v.data.order })),
  ]
    .toSorted((a, b) => a.order - b.order)
    .map((v) => ({
      id: v.id,
      name: v.name,
      products: catalog.products
        .filter((p) => p.data.vendor?.id === v.id)
        .map((p) => ({
          id: p.id,
          name: p.data.name,
          count: countByProduct.get(p.id)?.length ?? 0,
          href: catalog.hubProductIds.has(p.id) ? `/${p.id}/` : undefined,
        })),
    }))
    .filter((g) => g.products.length > 0);
};

export interface SeriesEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** 公開済みの回の数 */
  readonly count: number;
  /** 連載のページ。公開済みの回がなければページがないので undefined */
  readonly href: string | undefined;
}

/** 全連載（series.yaml の order の順） */
export const loadSeriesDirectory = async (catalog: Catalog): Promise<readonly SeriesEntry[]> =>
  (await getCollection('series'))
    .toSorted((a, b) => a.data.order - b.data.order)
    .map((s) => {
      const count = catalog.articles.filter((a) => a.data.series?.id.id === s.id).length;
      return {
        id: s.id,
        name: s.data.name,
        description: s.data.description,
        count,
        href: count > 0 ? seriesHref(s.id) : undefined,
      };
    });
