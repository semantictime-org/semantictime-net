// 期限切れ・まもなく期限の記事をまとめ、Issue の本文を作る（純粋関数）。
// Issue の作成・更新・クローズは scripts/stale-report.ts で行う。
import { addDays } from './dates.ts';
import { freshnessOf, reviewIntervalFor } from './freshness.ts';
import type { ContentType, Surface } from './taxonomy.ts';

export interface StaleCandidate {
  readonly id: string;
  readonly title: string;
  readonly type: ContentType;
  readonly surfaces: readonly Surface[];
  readonly verifiedAt: Date;
}

export interface StaleItem {
  readonly id: string;
  readonly title: string;
  readonly state: 'stale' | 'due-soon';
  /** 検証期限の日付（JST の 'YYYY-MM-DD'） */
  readonly dueDate: string;
}

export interface StaleReport {
  readonly items: readonly StaleItem[];
  readonly body: string;
}

const LABEL: Record<StaleItem['state'], string> = {
  stale: '期限切れ',
  'due-soon': 'まもなく期限',
};

export const buildStaleReport = (candidates: readonly StaleCandidate[], now: Date): StaleReport => {
  const items = candidates
    .map((c) => {
      const interval = reviewIntervalFor(c.type, c.surfaces);
      return {
        id: c.id,
        title: c.title,
        state: freshnessOf(c.verifiedAt, interval, now),
        dueDate: addDays(c.verifiedAt, interval),
      };
    })
    .filter((i): i is StaleItem => i.state !== 'fresh')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));

  const rows = items.map((i) => `| ${LABEL[i.state]} | ${i.dueDate} | \`${i.id}\` | ${i.title} |`);
  const body = [
    '再検証が必要な記事の一覧です（週次で自動更新）。実機で確かめ直し、`verifiedAt` と `verifiedWith` を更新してください。',
    '',
    '| 状態 | 期限 | 記事 | タイトル |',
    '| --- | --- | --- | --- |',
    ...rows,
  ].join('\n');

  return { items, body };
};
