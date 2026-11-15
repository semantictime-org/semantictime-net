// 製品のハブ（/<product>/ と landing 型の記事）に出す値を組み立てる。
import { breadcrumbsOf, FEATURE_STATUS_LABEL, type Crumb } from '../lib/article-view';
import { resolveRoute } from '../lib/catalog';
import { toJstDate } from '../lib/dates';
import type { ArticleSummary, loadCatalog } from './catalog';

type Catalog = Awaited<ReturnType<typeof loadCatalog>>;

/** route が空の製品では「そのほか」ではなく、ただの一覧として見せる */
const ALL_ARTICLES = '記事';

export interface HubView {
  readonly crumbs: readonly Crumb[];
  readonly en: string;
  readonly title: string;
  readonly lead: string;
  readonly watermark: string;
  readonly stats: readonly { label: string; value: string }[];
  readonly sections: readonly { name: string; articles: readonly ArticleSummary[] }[];
  readonly routeUpdated: string | undefined;
  /** 注意が要る機能（ベータ版・非推奨・提供終了）だけ */
  readonly features: readonly { name: string; statusLabel: string }[];
  /** 提供中（ga）の機能の数 */
  readonly gaFeatureCount: number;
}

export const buildHub = (productId: string, catalog: Catalog): HubView => {
  const product = catalog.productById.get(productId);
  if (!product) throw new Error(`未登録の製品: ${productId}`);
  const vendor = catalog.vendors.find((v) => v.id === product.data.vendor.id);
  const resolved = resolveRoute(
    { id: product.id, route: product.data.route },
    // landing 型の記事は、ハブそのものなので一覧に入れない
    catalog.catalogArticles.filter((a) => a.type !== 'landing'),
  );
  const routeIsEmpty = product.data.route.length === 0;
  const sections = resolved.sections.map((s) => ({
    name: routeIsEmpty ? ALL_ARTICLES : s.name,
    articles: s.articles.flatMap((a) => catalog.summaryById.get(a.id) ?? []),
  }));
  const all = sections.flatMap((s) => s.articles);
  const needsReview = all.filter((a) => a.record.state !== 'ok').length;
  const latest = all
    .map((a) => a.verifiedDate)
    .toSorted()
    .at(-1);
  const productFeatures = catalog.features.filter((f) => f.data.product === product.id);

  return {
    crumbs: [
      ...breadcrumbsOf(undefined, product.data.name).slice(0, 1),
      ...(vendor ? [{ label: vendor.data.name }] : []),
      { label: product.data.name },
    ],
    en: product.data.name.toUpperCase(),
    title: `${product.data.name} の使い方`,
    lead: `${vendor?.data.name ?? ''} の ${product.data.name}。手元で動かして確かめた手順と、現行仕様をまとめています。`,
    watermark: product.data.code,
    stats: [
      { label: '記事', value: String(all.length) },
      { label: '見直しが必要', value: String(needsReview) },
      ...(latest ? [{ label: '最新の検証', value: latest }] : []),
    ],
    sections,
    routeUpdated: product.data.routeUpdated && toJstDate(product.data.routeUpdated),
    features: productFeatures
      .filter((f) => f.data.status !== 'ga')
      .map((f) => ({ name: f.data.name, statusLabel: FEATURE_STATUS_LABEL[f.data.status] })),
    gaFeatureCount: productFeatures.filter((f) => f.data.status === 'ga').length,
  };
};
