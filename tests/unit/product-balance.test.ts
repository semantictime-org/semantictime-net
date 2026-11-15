import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parse } from 'yaml';

// 製品は「読者が使い始めるときに選ぶ単位」（アプリ・コーディングツール・API など）。
// それより細かいもの（Cowork・Skills・Artifacts など）は features.yaml の機能として持つ（2026-11-16 決定）。
const MAX_PRODUCTS_PER_VENDOR = 4;

interface ProductRow {
  id: string;
  vendor?: string;
}

const products = parse(readFileSync('src/data/products.yaml', 'utf8')) as ProductRow[];

describe('製品の粒度（各社を同じ扱いにする）', () => {
  test(`1 社の製品は ${MAX_PRODUCTS_PER_VENDOR} つまで`, () => {
    const byVendor = Map.groupBy(
      products.filter((p) => p.vendor !== undefined),
      (p) => p.vendor ?? '',
    );
    const over = [...byVendor].filter(([, list]) => list.length > MAX_PRODUCTS_PER_VENDOR);
    expect(over.map(([vendor, list]) => `${vendor}: ${list.length}`)).toEqual([]);
  });

  test('主要 3 社は、アプリとコーディングツールと API をそろえて持つ', () => {
    const ids = new Set(products.map((p) => p.id));
    for (const id of [
      'claude-app',
      'claude-code',
      'claude-api',
      'chatgpt',
      'codex',
      'openai-api',
      'gemini',
      'gemini-cli',
      'gemini-api',
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});
