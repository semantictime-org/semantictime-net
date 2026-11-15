// 製品（路線）と記事（駅）の関係を検査し、読む順を解決する（純粋関数）。
// 記事番号（stationNo）は記事に固定し、読む順は products.yaml の route で決める。

const OTHERS_SECTION = 'そのほか';
const STATION_DIGITS = 2;

export interface CatalogArticle {
  /** `<product>/<slug>`（ニュースは `news/<slug>`） */
  readonly id: string;
  readonly type: string;
  readonly products: readonly string[];
  readonly stationNo?: number;
}

export interface RouteSection {
  readonly section: string;
  readonly articles: readonly string[];
}

export interface RouteProduct {
  readonly id: string;
  readonly route: readonly RouteSection[];
}

export interface ResolvedSection {
  readonly name: string;
  readonly articles: readonly CatalogArticle[];
}

export interface ResolvedRoute {
  readonly sections: readonly ResolvedSection[];
  readonly errors: readonly string[];
}

/** 記事番号の表示（例: CC と 7 → CC07） */
export const stationLabel = (code: string, stationNo: number): string =>
  `${code}${String(stationNo).padStart(STATION_DIGITS, '0')}`;

const lineOf = (article: CatalogArticle): string | undefined =>
  article.type === 'news' ? undefined : article.products[0];

const slugOf = (article: CatalogArticle): string => article.id.split('/')[1] ?? article.id;

/** 同じ記号を持つ製品を探す（T302） */
export const findDuplicateCodes = (
  products: readonly { readonly id: string; readonly code: string }[],
): readonly string[] => {
  const byCode = Map.groupBy(products, (p) => p.code);
  return [...byCode]
    .filter(([, list]) => list.length > 1)
    .map(([code, list]) => `記号 ${code} が重複している: ${list.map((p) => p.id).join(', ')}`);
};

/** 同じ連載で同じ回を持つ記事を探す */
export const findSeriesConflicts = (
  articles: readonly {
    readonly id: string;
    readonly series?: { readonly id: string; readonly no: number };
  }[],
): readonly string[] => {
  const inSeries = articles.flatMap((a) => (a.series ? [{ id: a.id, series: a.series }] : []));
  const byNo = Map.groupBy(inSeries, (a) => `${a.series.id}#${a.series.no}`);
  return [...byNo.values()]
    .filter((list) => list.length > 1)
    .map((list) => {
      const { id, no } = list[0]?.series ?? { id: '', no: 0 };
      return `連載 ${id} の第 ${no} 回が重複している: ${list.map((a) => a.id).join(', ')}`;
    });
};

/** 同じ路線で同じ記事番号を持つ記事を探す（T303）。ニュースは番号を持たないので対象外 */
export const findStationConflicts = (articles: readonly CatalogArticle[]): readonly string[] => {
  const numbered = articles.filter((a) => lineOf(a) !== undefined && a.stationNo !== undefined);
  const byStation = Map.groupBy(numbered, (a) => `${lineOf(a) ?? ''}#${a.stationNo ?? ''}`);
  return [...byStation.values()]
    .filter((list) => list.length > 1)
    .map(
      (list) =>
        `${lineOf(list[0] as CatalogArticle) ?? ''} の記事番号 ${list[0]?.stationNo ?? ''} が重複している: ${list.map((a) => a.id).join(', ')}`,
    );
};

/**
 * 製品の読む順を解決する（T314〜T316）。route に並んだ順に記事を並べ、route にない記事は
 * 最後の「そのほか」に記事番号の順で入れる（載せ忘れても記事は消えない）。
 * route にあって記事がない slug（別の製品の記事を含む）と、同じ slug の 2 回目は違反にする。
 */
export const resolveRoute = (
  product: RouteProduct,
  articles: readonly CatalogArticle[],
): ResolvedRoute => {
  const own = articles.filter((a) => lineOf(a) === product.id);
  const bySlug = new Map(own.map((a) => [slugOf(a), a]));
  const listed = product.route.flatMap((s) => s.articles);

  const errors = [
    ...listed
      .filter((slug) => !bySlug.has(slug))
      .map((slug) => `${product.id} の route にある ${slug} は、この製品に存在しない`),
    ...[...new Set(listed.filter((slug, i) => listed.indexOf(slug) !== i))].map(
      (slug) => `${product.id} の route に ${slug} が 2 回ある`,
    ),
  ];

  // route の各 slug を、最初に現れた位置だけ残す（2 回目以降と存在しないものは除く）
  const entries = product.route.flatMap((s, section) =>
    s.articles.map((slug) => ({ section, slug })),
  );
  const kept = entries.filter(
    (e, i) => bySlug.has(e.slug) && entries.findIndex((x) => x.slug === e.slug) === i,
  );
  const placed = new Set(kept.map((e) => e.slug));

  const sections = product.route
    .map((s, section) => ({
      name: s.section,
      articles: kept
        .filter((e) => e.section === section)
        .map((e) => bySlug.get(e.slug) as CatalogArticle),
    }))
    .filter((s) => s.articles.length > 0);

  const others = own
    .filter((a) => !placed.has(slugOf(a)))
    .toSorted((a, b) => (a.stationNo ?? 0) - (b.stationNo ?? 0));

  return {
    sections:
      others.length > 0 ? [...sections, { name: OTHERS_SECTION, articles: others }] : sections,
    errors,
  };
};
