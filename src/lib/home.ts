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

export interface MonthGroup<T extends Dated> {
  readonly year: string;
  readonly month: string;
  readonly items: readonly T[];
}

/** 月ごとの一覧（バックナンバー）。JST の年月で分け、新しい月から。月の中も新しい順 */
export const groupByMonth = <T extends Dated>(items: readonly T[]): readonly MonthGroup<T>[] => {
  const { top } = buildFrontPage(items, items.length);
  const byMonth = Map.groupBy(top, (i) => toJstDate(i.publishedAt).slice(0, 7));
  return [...byMonth].map(([ym, list]) => {
    const [year = '', month = ''] = ym.split('-');
    return { year, month, items: list };
  });
};

export interface VerificationStats {
  readonly count: number;
  /** 状態が「検証済み」以外（まもなく見直し・期限切れ）の本数 */
  readonly needsReview: number;
  /** いちばん新しい検証日（YYYY-MM-DD） */
  readonly latest: string | undefined;
}

/** ホームの帯と製品のハブに出す数字の段 */
export const verificationStats = (
  items: readonly { readonly state: string; readonly verifiedDate: string }[],
): VerificationStats => ({
  count: items.length,
  needsReview: items.filter((i) => i.state !== 'ok').length,
  latest: items
    .map((i) => i.verifiedDate)
    .toSorted()
    .at(-1),
});
