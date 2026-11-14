// 公開上限（1日あたりの本数）の判定。副作用を持たない純粋関数だけを置く。
// git からの読み込みは scripts/check-publish-cap.ts で行う。
import { toJstDate } from './dates.ts';

export interface PublishEntry {
  readonly id: string;
  readonly publishedAt: Date;
  readonly draft: boolean;
}

export type CheckMode = 'pull-request' | 'deploy';

export type PublishViolation =
  | { readonly kind: 'cap-exceeded'; readonly date: string; readonly ids: readonly string[] }
  | { readonly kind: 'future-date'; readonly id: string; readonly date: string }
  | {
      readonly kind: 'backdated';
      readonly id: string;
      readonly date: string;
      readonly latestExisting: string;
    }
  | { readonly kind: 'too-many-in-change'; readonly ids: readonly string[] };

export interface PublishCheckInput {
  readonly base: readonly PublishEntry[];
  readonly head: readonly PublishEntry[];
  /** head の記事 ID → base の記事 ID（git の rename 検出の結果） */
  readonly renames: ReadonlyMap<string, string>;
  readonly cap: number;
  /** JST の 'YYYY-MM-DD' */
  readonly today: string;
  readonly mode: CheckMode;
}

export interface PublishCheckResult {
  readonly violations: readonly PublishViolation[];
  readonly warnings: readonly string[];
  readonly newlyPublished: readonly string[];
}

export { toJstDate };

const isPublished = (e: PublishEntry): boolean => !e.draft;

const groupByDate = (entries: readonly PublishEntry[]): ReadonlyMap<string, readonly string[]> =>
  entries.reduce((map, e) => {
    const date = toJstDate(e.publishedAt);
    return new Map(map).set(date, [...(map.get(date) ?? []), e.id]);
  }, new Map<string, readonly string[]>());

export const findPublishViolations = (input: PublishCheckInput): PublishCheckResult => {
  const { base, head, renames, cap, today, mode } = input;
  const baseById = new Map(base.map((e) => [e.id, e]));

  const newlyPublished = head.filter((e) => {
    if (!isPublished(e)) return false;
    const before = baseById.get(renames.get(e.id) ?? e.id);
    return before === undefined || before.draft;
  });

  const warnings = head.flatMap((e) => {
    const before = baseById.get(renames.get(e.id) ?? e.id);
    if (before === undefined || before.draft || !isPublished(e)) return [];
    const from = toJstDate(before.publishedAt);
    const to = toJstDate(e.publishedAt);
    return from === to ? [] : [`${e.id}: 公開済みの記事の公開日が ${from} から ${to} に変わった`];
  });

  const capExceeded: PublishViolation[] = [...groupByDate(head.filter(isPublished))]
    .filter(([, ids]) => ids.length > cap)
    .map(([date, ids]) => ({ kind: 'cap-exceeded', date, ids: [...ids].sort() }));

  const futureDates: PublishViolation[] = newlyPublished
    .map((e) => ({ id: e.id, date: toJstDate(e.publishedAt) }))
    .filter(({ date }) => date > today)
    .map(({ id, date }) => ({ kind: 'future-date', id, date }));

  // 遡りと1回の変更での本数は、PR のときだけ判定する。デプロイ前に判定すると、
  // 一時停止中に正当な PR が溜まったときに、以後ずっとデプロイできなくなるため（設計書 2.3）。
  const latestExisting = base
    .filter(isPublished)
    .map((e) => toJstDate(e.publishedAt))
    .reduce<string | undefined>((max, d) => (max === undefined || d > max ? d : max), undefined);

  const backdated: PublishViolation[] =
    mode === 'pull-request' && latestExisting !== undefined
      ? newlyPublished
          .map((e) => ({ id: e.id, date: toJstDate(e.publishedAt) }))
          .filter(({ date }) => date < latestExisting)
          .map(({ id, date }) => ({ kind: 'backdated', id, date, latestExisting }))
      : [];

  const tooMany: PublishViolation[] =
    mode === 'pull-request' && newlyPublished.length > cap
      ? [{ kind: 'too-many-in-change', ids: newlyPublished.map((e) => e.id).sort() }]
      : [];

  return {
    violations: [...capExceeded, ...futureDates, ...backdated, ...tooMany],
    warnings,
    newlyPublished: newlyPublished.map((e) => e.id).sort(),
  };
};
