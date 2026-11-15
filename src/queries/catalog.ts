// 会社・製品・機能と公開記事をまとめて読む（ハブ・ホーム・ニュースの一覧で使う）。
import { getCollection, type CollectionEntry } from 'astro:content';
import { verificationRecordOf, type VerificationRecord } from '../lib/article-meta';
import { articleHref, LEVEL_LABEL } from '../lib/article-view';
import { stationLabel } from '../lib/catalog';
import { toJstDate } from '../lib/dates';
import { publishedArticles } from './articles';

export interface ArticleSummary {
  readonly id: string;
  readonly href: string;
  readonly title: string;
  readonly station: string | undefined;
  readonly productName: string | undefined;
  readonly levelLabel: string;
  readonly verifiedDate: string;
  readonly record: VerificationRecord;
  readonly entry: CollectionEntry<'articles'>;
}

export const loadCatalog = async () => {
  const [articles, products, vendors, features] = await Promise.all([
    publishedArticles(),
    getCollection('products'),
    getCollection('vendors'),
    getCollection('features'),
  ]);
  const productById = new Map(products.map((p) => [p.id, p]));
  const now = new Date();

  const summarize = (entry: CollectionEntry<'articles'>): ArticleSummary => {
    const product = productById.get(entry.data.products[0]?.id ?? '');
    return {
      id: entry.id,
      href: articleHref(entry.id),
      title: entry.data.title,
      station:
        product && entry.data.stationNo !== undefined
          ? stationLabel(product.data.code, entry.data.stationNo)
          : undefined,
      productName: product?.data.name,
      levelLabel: LEVEL_LABEL[entry.data.level],
      verifiedDate: toJstDate(entry.data.verifiedAt),
      record: verificationRecordOf(
        {
          verification: entry.data.verification,
          verifiedAt: entry.data.verifiedAt,
          type: entry.data.type,
          categories: product?.data.categories ?? [],
        },
        now,
      ),
      entry,
    };
  };

  /** 判定（resolveRoute など）に渡す形 */
  const catalogArticles = articles.map((a) => ({
    id: a.id,
    type: a.data.type,
    products: a.data.products.map((p) => p.id),
    ...(a.data.stationNo !== undefined ? { stationNo: a.data.stationNo } : {}),
  }));

  return {
    articles,
    catalogArticles,
    products,
    vendors,
    features,
    productById,
    summaryById: new Map(articles.map((a) => [a.id, summarize(a)])),
  };
};
