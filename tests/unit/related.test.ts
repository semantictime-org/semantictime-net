import { describe, expect, test } from 'vitest';
import { articleNav, type NavArticle } from '../../src/lib/related';

const a = (id: string, stationNo: number, series?: { id: string; no: number }): NavArticle => ({
  id,
  type: 'how-to',
  products: [id.split('/')[0] ?? ''],
  stationNo,
  ...(series ? { series } : {}),
});

const first = 'claude-code-first-steps';
const all: readonly NavArticle[] = [
  a('claude-code/install', 1, { id: first, no: 1 }),
  a('claude-code/claude-md', 2, { id: first, no: 2 }),
  a('claude-code/hooks', 3, { id: first, no: 3 }),
  a('claude-code/skills', 4),
  a('claude-code/mcp', 5),
  a('claude-code/plugins', 6),
  a('claude-code/routines', 7),
  a('codex/setup', 1),
  { id: 'news/week-46', type: 'news', products: [] },
];
const byId = (id: string): NavArticle => {
  const found = all.find((x) => x.id === id);
  if (!found) throw new Error(`テストの記事がない: ${id}`);
  return found;
};

describe('articleNav（記事の最後の案内）', () => {
  test('連載の前の回と次の回', () => {
    const nav = articleNav(byId('claude-code/claude-md'), all);
    expect(nav.prev).toBe('claude-code/install');
    expect(nav.next).toBe('claude-code/hooks');
  });

  test('第 1 回に前はなく、最終回に次はない', () => {
    expect(articleNav(byId('claude-code/install'), all).prev).toBeUndefined();
    expect(articleNav(byId('claude-code/hooks'), all).next).toBeUndefined();
  });

  test('連載でない記事は前後を出さない', () => {
    const nav = articleNav(byId('claude-code/mcp'), all);
    expect(nav.prev).toBeUndefined();
    expect(nav.next).toBeUndefined();
  });

  test('同じ製品の記事を 3 本まで、記事番号の順に。自分と連載の前後は除く', () => {
    expect(articleNav(byId('claude-code/claude-md'), all).related).toEqual([
      'claude-code/skills',
      'claude-code/mcp',
      'claude-code/plugins',
    ]);
  });

  test('ほかの製品とニュースは関連に入れない', () => {
    expect(articleNav(byId('codex/setup'), all).related).toEqual([]);
    expect(articleNav(byId('news/week-46'), all).related).toEqual([]);
  });
});
