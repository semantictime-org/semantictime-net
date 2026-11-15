import { describe, expect, test } from 'vitest';
import { isChangeVisible } from '../../src/lib/change-filter';
import { buildFrontPage, groupByMonth } from '../../src/lib/home';

describe('isChangeVisible（T078 の絞り込み）', () => {
  const row = { product: 'claude-code', breaking: false } as const;

  test('何も選ばなければ全件', () => {
    expect(isChangeVisible(row, { products: [], breakingOnly: false })).toBe(true);
  });
  test('選んだ製品だけ', () => {
    expect(isChangeVisible(row, { products: ['codex'], breakingOnly: false })).toBe(false);
    expect(isChangeVisible(row, { products: ['codex', 'claude-code'], breakingOnly: false })).toBe(
      true,
    );
  });
  test('破壊的な変更だけ', () => {
    expect(isChangeVisible(row, { products: [], breakingOnly: true })).toBe(false);
    expect(isChangeVisible({ ...row, breaking: true }, { products: [], breakingOnly: true })).toBe(
      true,
    );
  });
});

describe('buildFrontPage（ホームの新しい順の流れ）', () => {
  const item = (id: string, publishedAt: string) => ({ id, publishedAt: new Date(publishedAt) });
  const items = [
    item('a', '2026-11-13'),
    item('b', '2026-11-15'),
    item('c', '2026-11-14'),
    item('d', '2026-11-15'),
    item('e', '2026-11-12'),
  ];

  test('新しい順の先頭をトップに、残りを日付ごとに分ける（JST）', () => {
    const page = buildFrontPage(items, 2);
    expect(page.top.map((i) => i.id)).toEqual(['b', 'd']);
    expect(page.days.map((d) => [d.date, d.items.map((i) => i.id)])).toEqual([
      ['2026-11-14', ['c']],
      ['2026-11-13', ['a']],
      ['2026-11-12', ['e']],
    ]);
  });

  test('同じ日時なら ID の順で並びを固定する', () => {
    expect(
      buildFrontPage([item('z', '2026-11-15'), item('y', '2026-11-15')], 2).top.map((i) => i.id),
    ).toEqual(['y', 'z']);
  });

  test('記事が 0 本なら、トップも流れも空', () => {
    expect(buildFrontPage([], 3)).toEqual({ top: [], days: [] });
  });

  test('JST の日付で分ける（UTC では前日でも、JST で翌日なら翌日）', () => {
    const page = buildFrontPage([item('late', '2026-11-14T16:30:00Z')], 0);
    expect(page.days[0]?.date).toBe('2026-11-15');
  });
});

describe('groupByMonth（月ごとの一覧）', () => {
  const item = (id: string, publishedAt: string) => ({ id, publishedAt: new Date(publishedAt) });

  test('JST の年月ごとに、新しい月から。月の中も新しい順', () => {
    const months = groupByMonth([
      item('a', '2026-10-31'),
      item('b', '2026-11-02'),
      item('c', '2026-11-14'),
      item('d', '2026-10-31T15:30:00Z'),
    ]);
    expect(months.map((m) => [m.year, m.month, m.items.map((i) => i.id)])).toEqual([
      ['2026', '11', ['c', 'b', 'd']],
      ['2026', '10', ['a']],
    ]);
  });

  test('記事が 0 本なら空', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});
