import { describe, expect, test } from 'vitest';
import { isChangeVisible } from '../../src/lib/change-filter';
import { buildVendorSections, type HomeArticle } from '../../src/lib/home';

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

describe('buildVendorSections（T317 全社同等のホーム）', () => {
  const vendors = [
    { id: 'openai', name: 'OpenAI', order: 2 },
    { id: 'anthropic', name: 'Anthropic', order: 1 },
    { id: 'google', name: 'Google', order: 3 },
    { id: 'midjourney', name: 'Midjourney', order: 4 },
  ];
  const products = [
    { id: 'claude-code', name: 'Claude Code', vendor: 'anthropic', code: 'CC', route: [] },
    { id: 'claude-api', name: 'Claude API', vendor: 'anthropic', code: 'AP', route: [] },
    {
      id: 'codex',
      name: 'Codex',
      vendor: 'openai',
      code: 'CX',
      route: [{ section: 'はじめる', articles: ['setup'] }],
    },
    { id: 'gemini', name: 'Gemini', vendor: 'google', code: 'GM', route: [] },
    { id: 'midjourney', name: 'Midjourney', vendor: 'midjourney', code: 'MJ', route: [] },
  ];
  const article = (id: string, stationNo: number): HomeArticle => ({
    id,
    type: 'how-to',
    products: [id.split('/')[0] ?? ''],
    stationNo,
  });
  const articles = [
    article('claude-code/a', 1),
    article('claude-code/b', 2),
    article('claude-code/c', 3),
    article('codex/usage', 2),
    article('codex/setup', 1),
    article('gemini/start', 1),
  ];

  const sections = buildVendorSections(vendors, products, articles);

  test('会社は order の順に、記事 0 本の会社も含めて全部出る', () => {
    expect(sections.map((s) => s.vendor.id)).toEqual([
      'anthropic',
      'openai',
      'google',
      'midjourney',
    ]);
  });

  test('記事 0 本の会社は「記事は準備中です。」', () => {
    const mj = sections.find((s) => s.vendor.id === 'midjourney');
    expect(mj?.products).toEqual([]);
    expect(mj?.emptyMessage).toBe('記事は準備中です。');
  });

  test('記事 0 本の製品は出さない', () => {
    const anthropic = sections.find((s) => s.vendor.id === 'anthropic');
    expect(anthropic?.products.map((p) => p.id)).toEqual(['claude-code']);
    expect(anthropic?.emptyMessage).toBeUndefined();
  });

  test('各製品は読む順の先頭から 2 本と、全体の本数', () => {
    const codex = sections.find((s) => s.vendor.id === 'openai')?.products[0];
    expect(codex?.top.map((a) => a.id)).toEqual(['codex/setup', 'codex/usage']);
    const cc = sections.find((s) => s.vendor.id === 'anthropic')?.products[0];
    expect(cc?.top.map((a) => a.id)).toEqual(['claude-code/a', 'claude-code/b']);
    expect(cc?.count).toBe(3);
  });
});
