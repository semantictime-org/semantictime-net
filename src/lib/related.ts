// 記事の最後に出す案内（連載の前後の回と、同じ製品の記事）を決める（純粋関数）。

/** 同じ製品の記事を何本まで出すか */
export const RELATED_LIMIT = 3;

export interface NavArticle {
  readonly id: string;
  readonly type: string;
  /** 先頭がその記事の路線（製品） */
  readonly products: readonly string[];
  readonly stationNo?: number;
  readonly series?: { readonly id: string; readonly no: number };
}

export interface ArticleNav {
  /** 連載の前の回（記事 ID） */
  readonly prev: string | undefined;
  /** 連載の次の回（記事 ID） */
  readonly next: string | undefined;
  /** 同じ製品の記事（記事 ID、記事番号の順） */
  readonly related: readonly string[];
}

const seriesNeighbors = (current: NavArticle, all: readonly NavArticle[]) => {
  const series = current.series;
  if (!series) return { prev: undefined, next: undefined };
  const episodes = all
    .flatMap((a) => (a.series?.id === series.id ? [{ id: a.id, no: a.series.no }] : []))
    .toSorted((x, y) => x.no - y.no);
  const index = episodes.findIndex((e) => e.id === current.id);
  return { prev: episodes[index - 1]?.id, next: episodes[index + 1]?.id };
};

export const articleNav = (current: NavArticle, all: readonly NavArticle[]): ArticleNav => {
  const { prev, next } = seriesNeighbors(current, all);
  const line = current.type === 'news' ? undefined : current.products[0];
  const shown = new Set([current.id, prev, next]);
  const related =
    line === undefined
      ? []
      : all
          .filter((a) => a.type !== 'news' && a.products[0] === line && !shown.has(a.id))
          .toSorted((x, y) => (x.stationNo ?? 0) - (y.stationNo ?? 0))
          .slice(0, RELATED_LIMIT)
          .map((a) => a.id);
  return { prev, next, related };
};
