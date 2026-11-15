// ホームの「会社と製品」の欄を組み立てる（設計書 11.6、T317）。純粋関数。
import { resolveRoute, type CatalogArticle, type RouteSection } from './catalog.ts';

/** 製品ごとにホームに出す記事の本数（読む順の先頭から） */
export const HOME_ARTICLES_PER_PRODUCT = 2;
const EMPTY_VENDOR = 'まだ公開した記事がありません。';

export type HomeArticle = CatalogArticle;

export interface HomeVendor {
  readonly id: string;
  readonly name: string;
  readonly order: number;
}

export interface HomeProduct {
  readonly id: string;
  readonly name: string;
  readonly vendor: string;
  readonly code: string;
  readonly route: readonly RouteSection[];
}

export interface VendorSection {
  readonly vendor: HomeVendor;
  readonly products: readonly {
    readonly id: string;
    readonly name: string;
    readonly code: string;
    readonly count: number;
    readonly top: readonly HomeArticle[];
  }[];
  /** 記事 0 本の会社に出す一文 */
  readonly emptyMessage: string | undefined;
}

export const buildVendorSections = (
  vendors: readonly HomeVendor[],
  products: readonly HomeProduct[],
  articles: readonly HomeArticle[],
): readonly VendorSection[] =>
  vendors
    .toSorted((a, b) => a.order - b.order)
    .map((vendor) => {
      const items = products
        .filter((p) => p.vendor === vendor.id)
        .map((p) => {
          const ordered = resolveRoute(p, articles).sections.flatMap((s) => s.articles);
          return {
            id: p.id,
            name: p.name,
            code: p.code,
            count: ordered.length,
            top: ordered.slice(0, HOME_ARTICLES_PER_PRODUCT),
          };
        })
        .filter((p) => p.count > 0);
      return {
        vendor,
        products: items,
        emptyMessage: items.length === 0 ? EMPTY_VENDOR : undefined,
      };
    });
