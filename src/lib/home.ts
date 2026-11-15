// ホームの新しい順の流れを組み立てる（AI Watch 型）。純粋関数。
import { toJstDate } from './dates.ts';

export const EMPTY_VENDOR = '記事は準備中です。';

export interface Dated {
  readonly id: string;
  readonly publishedAt: Date;
}

export interface FrontPage<T extends Dated> {
  /** 冒頭に大きく出す記事（新しい順の先頭から） */
  readonly top: readonly T[];
  /** 残りを公開日（JST）ごとに、新しい日から */
  readonly days: readonly { readonly date: string; readonly items: readonly T[] }[];
}

/** ホームの新しい順の流れ（AI Watch 型）。トップに出した記事は流れに重ねて出さない */
export const buildFrontPage = <T extends Dated>(
  items: readonly T[],
  topCount: number,
): FrontPage<T> => {
  const sorted = items.toSorted(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime() || a.id.localeCompare(b.id),
  );
  const byDate = Map.groupBy(sorted.slice(topCount), (i) => toJstDate(i.publishedAt));
  return {
    top: sorted.slice(0, topCount),
    days: [...byDate].map(([date, list]) => ({ date, items: list })),
  };
};
