// 検証期限（記事をいつまでに再検証するか）の判定。
import { SITE } from '../../site.config.ts';
import { daysBetween } from './dates.ts';
import type { ContentType, Surface } from './taxonomy.ts';

export type Freshness = 'fresh' | 'due-soon' | 'stale';

/** 期限まで残りこの日数以下なら「まもなく期限」 */
export const DUE_SOON_DAYS = 7;

const byType: Partial<Record<ContentType, number>> = SITE.reviewIntervalDaysByType;

/**
 * 記事の検証期限（日数）。型に期限があればそれを使い、なければサーフェスのうち最も短い期限を使う。
 */
export const reviewIntervalFor = (type: ContentType, surfaces: readonly Surface[]): number =>
  byType[type] ?? Math.min(...surfaces.map((s) => SITE.reviewIntervalDaysBySurface[s]));

/** 検証日からの経過日数（JST の暦日）で、鮮度を判定する */
export const freshnessOf = (verifiedAt: Date, intervalDays: number, now: Date): Freshness => {
  const elapsed = daysBetween(verifiedAt, now);
  if (elapsed > intervalDays) return 'stale';
  if (intervalDays - elapsed <= DUE_SOON_DAYS) return 'due-soon';
  return 'fresh';
};
