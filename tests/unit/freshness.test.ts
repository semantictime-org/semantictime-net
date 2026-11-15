import { describe, expect, test } from 'vitest';
import { freshnessOf, reviewIntervalFor, tracksFreshness } from '../../src/lib/freshness';
import { buildStaleReport, type StaleCandidate } from '../../src/lib/stale-report';

const NOW = new Date('2026-11-15T03:00:00+09:00');
// 今日（JST 11-15）から n 日前の日付
const daysAgo = (n: number): Date => new Date(Date.UTC(2026, 10, 15 - n));

describe('reviewIntervalFor（T313）', () => {
  test('T031: 分野の期限（coding は 60 日）', () => {
    expect(reviewIntervalFor('how-to', ['coding'])).toBe(60);
  });
  test('分野 api は 60 日', () => {
    expect(reviewIntervalFor('how-to', ['api'])).toBe(60);
  });
  test('T032: 型の期限が優先される（explanation は 180 日）', () => {
    expect(reviewIntervalFor('explanation', ['coding'])).toBe(180);
  });
  test('T033: 複数の分野では最も短い期限を使う', () => {
    expect(reviewIntervalFor('reference', ['api', 'coding'])).toBe(60);
  });
});

describe('tracksFreshness（T312）', () => {
  test('実機で検証した記事は鮮度を判定する', () => {
    expect(tracksFreshness('hands-on', 'how-to')).toBe(true);
  });
  test('ニュースは判定しない（日付つきの記録として残す）', () => {
    expect(tracksFreshness('sources', 'news')).toBe(false);
  });
  test('出典で確かめた解説も判定する（2026-11-16 決定。解説は 180 日）', () => {
    expect(tracksFreshness('sources', 'explanation')).toBe(true);
  });
});

describe('freshnessOf', () => {
  test('T031b: 14 日前に検証した claude-code の記事は fresh', () => {
    expect(freshnessOf(daysAgo(14), 30, NOW)).toBe('fresh');
  });
  test.each([
    [23, 'due-soon'], // 残り 7 日
    [22, 'fresh'], // 残り 8 日
  ] as const)('T233: %i 日経過（期限 30 日）は %s', (elapsed, expected) => {
    expect(freshnessOf(daysAgo(elapsed), 30, NOW)).toBe(expected);
  });
  test.each([
    [30, 'due-soon'], // 期限ちょうど
    [31, 'stale'],
  ] as const)('T234: %i 日経過（期限 30 日）は %s', (elapsed, expected) => {
    expect(freshnessOf(daysAgo(elapsed), 30, NOW)).toBe(expected);
  });
  test('JST の日付で数える（UTC では前日でも、JST で同じ日なら 0 日）', () => {
    expect(freshnessOf(new Date('2026-11-14T16:00:00Z'), 30, NOW)).toBe('fresh');
  });
});

const candidate = (id: string, verifiedDaysAgo: number): StaleCandidate => ({
  id,
  title: `記事 ${id}`,
  type: 'how-to',
  categories: ['coding'],
  verifiedAt: daysAgo(verifiedDaysAgo),
});

describe('buildStaleReport', () => {
  test('T038: 期限切れとまもなく期限の記事をまとめ、状態を区別する', () => {
    const report = buildStaleReport(
      [
        candidate('claude-code/a', 70),
        candidate('claude-code/b', 65),
        candidate('claude-code/c', 55),
        candidate('claude-code/d', 5),
      ],
      NOW,
    );
    expect(report.items.map((i) => [i.id, i.state])).toEqual([
      ['claude-code/a', 'stale'],
      ['claude-code/b', 'stale'],
      ['claude-code/c', 'due-soon'],
    ]);
    expect(report.body).toContain('claude-code/a');
    expect(report.body).toContain('期限切れ');
    expect(report.body).toContain('まもなく期限');
    expect(report.body).not.toContain('claude-code/d');
  });

  test('期限日（検証日 + 期限）を JST の日付で示す', () => {
    const report = buildStaleReport([candidate('claude-code/a', 70)], NOW);
    expect(report.items[0]?.dueDate).toBe('2026-11-05'); // 09-06 + 60 日
  });

  test('T040: 該当がなければ items は空', () => {
    expect(buildStaleReport([candidate('claude-code/d', 5)], NOW).items).toEqual([]);
  });
});
