import { describe, expect, test } from 'vitest';
import {
  findDuplicateCodes,
  findSeriesConflicts,
  findStationConflicts,
  resolveRoute,
  stationLabel,
  type CatalogArticle,
} from '../../src/lib/catalog';

const article = (id: string, stationNo: number, type = 'how-to'): CatalogArticle => ({
  id,
  type,
  products: [id.split('/')[0] ?? ''],
  stationNo,
});

describe('findDuplicateCodes（T302）', () => {
  test('記号が重ならなければ問題なし', () => {
    expect(
      findDuplicateCodes([
        { id: 'claude-code', code: 'CC' },
        { id: 'claude-api', code: 'AP' },
      ]),
    ).toEqual([]);
  });

  test('2 つの製品が同じ記号なら違反', () => {
    const errors = findDuplicateCodes([
      { id: 'claude-code', code: 'CC' },
      { id: 'codex', code: 'CC' },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('CC');
    expect(errors[0]).toContain('claude-code');
    expect(errors[0]).toContain('codex');
  });
});

describe('findStationConflicts（T303）', () => {
  test('同じ路線で番号が重ならなければ問題なし', () => {
    expect(
      findStationConflicts([article('claude-code/a', 1), article('claude-code/b', 2)]),
    ).toEqual([]);
  });

  test('別の路線なら同じ番号でもよい', () => {
    expect(findStationConflicts([article('claude-code/a', 1), article('codex/a', 1)])).toEqual([]);
  });

  test('同じ路線で同じ番号が 2 本あれば違反', () => {
    const errors = findStationConflicts([article('claude-code/a', 7), article('claude-code/b', 7)]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('claude-code/a');
    expect(errors[0]).toContain('claude-code/b');
  });

  test('ニュースは番号を持たないので対象外', () => {
    const news: CatalogArticle = { id: 'news/a', type: 'news', products: [] };
    expect(findStationConflicts([news, { ...news, id: 'news/b' }])).toEqual([]);
  });
});

describe('resolveRoute（T314〜T316）', () => {
  const articles = [
    article('claude-code/install', 1),
    article('claude-code/hooks', 7),
    article('claude-code/settings', 12),
    article('claude-code/remote', 15),
    article('codex/install', 1),
  ];
  const product = {
    id: 'claude-code',
    route: [
      { section: 'はじめる', articles: ['install'] },
      { section: '使いこなす', articles: ['hooks', 'settings'] },
    ],
  };

  test('T314: route の順に並べ、route にない記事は「そのほか」に番号順で入れる', () => {
    const result = resolveRoute(product, articles);
    expect(result.errors).toEqual([]);
    expect(result.sections.map((s) => [s.name, s.articles.map((a) => a.id)])).toEqual([
      ['はじめる', ['claude-code/install']],
      ['使いこなす', ['claude-code/hooks', 'claude-code/settings']],
      ['そのほか', ['claude-code/remote']],
    ]);
  });

  test('route がなければ、すべて「そのほか」に番号順で入る', () => {
    const result = resolveRoute({ id: 'claude-code', route: [] }, articles);
    expect(result.sections.map((s) => s.name)).toEqual(['そのほか']);
    expect(result.sections[0]?.articles.map((a) => a.stationNo)).toEqual([1, 7, 12, 15]);
  });

  test.each([
    ['存在しない slug', ['nothing'], '存在しない'],
    ['別の製品だけにある記事', ['missing-in-cc'], '存在しない'],
    ['同じ slug が 2 回', ['hooks', 'hooks'], '2 回'],
  ])('T315: %s は違反', (_, slugs, message) => {
    const result = resolveRoute(
      { id: 'claude-code', route: [{ section: 'はじめる', articles: slugs }] },
      [...articles, article('codex/missing-in-cc', 2)],
    );
    expect(result.errors.some((e) => e.includes(message))).toBe(true);
  });

  test('T316: 読む順を入れ替えても、記事の ID と番号は変わらない', () => {
    const reordered = {
      id: 'claude-code',
      route: [{ section: '使いこなす', articles: ['settings', 'install', 'hooks'] }],
    };
    const before = resolveRoute(product, articles).sections.flatMap((s) => s.articles);
    const after = resolveRoute(reordered, articles).sections.flatMap((s) => s.articles);
    const byId = (list: typeof before) => Object.fromEntries(list.map((a) => [a.id, a.stationNo]));
    expect(byId(after)).toEqual(byId(before));
    expect(after.map((a) => a.id)).toEqual([
      'claude-code/settings',
      'claude-code/install',
      'claude-code/hooks',
      'claude-code/remote',
    ]);
  });
});

describe('stationLabel', () => {
  test('記号と 2 桁の番号をつなぐ', () => {
    expect(stationLabel('CC', 7)).toBe('CC07');
    expect(stationLabel('AP', 12)).toBe('AP12');
  });
});

describe('findSeriesConflicts（連載の回の重複）', () => {
  test('同じ連載で回が重ならなければ問題なし', () => {
    expect(
      findSeriesConflicts([
        { id: 'mcp/what-is', series: { id: 'ai-glossary', no: 1 } },
        { id: 'claude-code/intro', series: { id: 'ai-glossary', no: 2 } },
        { id: 'codex/setup', series: { id: 'first-steps', no: 1 } },
        { id: 'codex/usage' },
      ]),
    ).toEqual([]);
  });
  test('同じ連載で同じ回があれば、記事 ID を並べて知らせる', () => {
    expect(
      findSeriesConflicts([
        { id: 'mcp/what-is', series: { id: 'ai-glossary', no: 1 } },
        { id: 'claude-code/intro', series: { id: 'ai-glossary', no: 1 } },
      ]),
    ).toEqual(['連載 ai-glossary の第 1 回が重複している: mcp/what-is, claude-code/intro']);
  });
});
