// 検証期限（記事をいつまでに再検証するか）の判定。
import { SITE } from '../../site.config.ts';
import { daysBetween } from './dates.ts';
import type { Category, ContentType, Verification } from './taxonomy.ts';

export type Freshness = 'fresh' | 'due-soon' | 'stale';

/**
 * 鮮度（再検証の期限）を判定する記事か。ニュースは、その日付の記録として残し、期限切れにしない（T312）。
 * 出典で確かめた解説なども、2026-11-16 から期限を数える（解説は 180 日）。
 */
export const tracksFreshness = (verification: Verification, type: ContentType): boolean =>
  verification === 'hands-on' || type !== 'news';

/** 期限まで残りこの日数以下なら「まもなく期限」 */
export const DUE_SOON_DAYS = 7;

const byType: Partial<Record<ContentType, number>> = SITE.reviewIntervalDaysByType;

/**
 * 記事の検証期限（日数）。型に期限があればそれを使い、なければ製品の分野のうち最も短い期限を使う。
 */
export const reviewIntervalFor = (type: ContentType, categories: readonly Category[]): number =>
  byType[type] ?? Math.min(...categories.map((c) => SITE.reviewIntervalDaysByCategory[c]));

/** 検証日からの経過日数（JST の暦日）で、鮮度を判定する */
export const freshnessOf = (verifiedAt: Date, intervalDays: number, now: Date): Freshness => {
  const elapsed = daysBetween(verifiedAt, now);
  if (elapsed > intervalDays) return 'stale';
  if (intervalDays - elapsed <= DUE_SOON_DAYS) return 'due-soon';
  return 'fresh';
};
