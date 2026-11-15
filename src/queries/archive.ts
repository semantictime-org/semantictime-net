// バックナンバー（/archive/ と /archive/<年>/<月>/）に出す、月ごとの公開済み記事。
import { groupByMonth, type MonthGroup } from '../lib/home';
import { loadCatalog, type ArticleSummary } from './catalog';

export interface ArchiveItem {
  readonly id: string;
  readonly publishedAt: Date;
  readonly summary: ArticleSummary;
}

/** landing（製品のハブそのもの）は入れない。ホームの流れと同じ対象 */
export const loadArchive = async (): Promise<readonly MonthGroup<ArchiveItem>[]> => {
  const catalog = await loadCatalog();
  return groupByMonth(
    [...catalog.summaryById.values()]
      .filter((a) => a.entry.data.type !== 'landing')
      .map((a) => ({ id: a.id, publishedAt: a.entry.data.publishedAt, summary: a })),
  );
};

/** 2026年11月（月の頭の 0 は付けない） */
export const monthLabel = (m: Pick<MonthGroup<ArchiveItem>, 'year' | 'month'>): string =>
  `${m.year}年${Number(m.month)}月`;
