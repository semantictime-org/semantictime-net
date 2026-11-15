import { describe, expect, test } from 'vitest';
import {
  findPublishViolations,
  toJstDate,
  type PublishEntry,
  type PublishCheckResult,
} from '../../src/lib/publish-dates';

const TODAY = '2026-11-15';

const entry = (id: string, date: string, draft = false): PublishEntry => ({
  id,
  publishedAt: new Date(date),
  draft,
});

// base の最新の公開日は 11-14（1本）
const BASE: readonly PublishEntry[] = [
  entry('claude-code/a', '2026-11-12'),
  entry('claude-code/b', '2026-11-14'),
];

const check = (
  head: readonly PublishEntry[],
  options: {
    base?: readonly PublishEntry[];
    renames?: ReadonlyMap<string, string>;
    mode?: 'pull-request' | 'deploy';
  } = {},
): PublishCheckResult =>
  findPublishViolations({
    base: options.base ?? BASE,
    head,
    renames: options.renames ?? new Map(),
    today: TODAY,
    mode: options.mode ?? 'pull-request',
  });

const kinds = (result: PublishCheckResult): readonly string[] =>
  result.violations.map((v) => v.kind).sort();

describe('toJstDate', () => {
  test('T201: UTC 14:59:59 は JST の同じ日', () => {
    expect(toJstDate(new Date('2026-11-15T14:59:59Z'))).toBe('2026-11-15');
  });
  test('T202: UTC 15:00 は JST の翌日', () => {
    expect(toJstDate(new Date('2026-11-15T15:00:00Z'))).toBe('2026-11-16');
  });
  test('T203: タイムゾーンのない日付は、その日付のまま', () => {
    expect(toJstDate(new Date('2026-11-15'))).toBe('2026-11-15');
  });
});

describe('正常系', () => {
  test('T001: 今日の日付で1本を公開する', () => {
    expect(check([...BASE, entry('claude-code/c', TODAY)]).violations).toEqual([]);
  });

  test('T002: 既存の記事の修正だけなら数えない', () => {
    expect(check([...BASE]).violations).toEqual([]);
  });

  test('T003: 下書きの追加は数えない', () => {
    expect(check([...BASE, entry('claude-code/c', TODAY, true)]).violations).toEqual([]);
  });

  test('T004: 下書きを公開に切り替えると1本と数える', () => {
    const base = [...BASE, entry('claude-code/c', TODAY, true)];
    const result = check([...BASE, entry('claude-code/c', TODAY)], { base });
    expect(result.violations).toEqual([]);
    expect(result.newlyPublished).toEqual(['claude-code/c']);
  });

  test('T005: 最新日付と同じ日付は遡りとして扱わない', () => {
    expect(check([...BASE, entry('claude-code/c', '2026-11-14')]).violations).toEqual([]);
  });

  test('T006: リネームは新しい公開に数えない', () => {
    const head = [
      entry('claude-code/a', '2026-11-12'),
      entry('claude-code/b-renamed', '2026-11-14'),
    ];
    const renames = new Map([['claude-code/b-renamed', 'claude-code/b']]);
    const result = check(head, { renames });
    expect(result.violations).toEqual([]);
    expect(result.newlyPublished).toEqual([]);
  });

  test('T007: 同じ日に何本公開しても違反にならない（本数の上限はない）', () => {
    const head = [...BASE, entry('claude-code/c', TODAY), entry('claude-code/d', TODAY)];
    const result = check(head);
    expect(result.violations).toEqual([]);
    expect(result.newlyPublished).toEqual(['claude-code/c', 'claude-code/d']);
  });
});

describe('異常系', () => {
  test('T104: 未来の日付', () => {
    expect(kinds(check([...BASE, entry('claude-code/c', '2026-11-16')]))).toEqual(['future-date']);
  });

  test('T105: 日付の遡り', () => {
    expect(kinds(check([...BASE, entry('claude-code/c', '2026-11-10')]))).toEqual(['backdated']);
  });

  test('T106: 下書きを古い日付のまま公開に切り替える', () => {
    const base = [...BASE, entry('claude-code/c', '2026-11-01', true)];
    const result = check([...BASE, entry('claude-code/c', '2026-11-01')], { base });
    expect(kinds(result)).toEqual(['backdated']);
  });

  test('T107: 違反が複数あれば、すべて返す', () => {
    const head = [
      ...BASE,
      entry('claude-code/d', '2026-11-10'),
      entry('claude-code/e', '2026-11-16'),
    ];
    expect(kinds(check(head))).toEqual(['backdated', 'future-date']);
  });

  test('T108b: デプロイ前でも未来の日付は判定する', () => {
    const head = [...BASE, entry('claude-code/c', '2026-11-16')];
    expect(kinds(check(head, { mode: 'deploy' }))).toEqual(['future-date']);
  });

  test('T109: リネームと同時に公開日を変えると警告（違反ではない）', () => {
    const head = [
      entry('claude-code/a', '2026-11-12'),
      entry('claude-code/b-renamed', '2026-11-01'),
    ];
    const renames = new Map([['claude-code/b-renamed', 'claude-code/b']]);
    const result = check(head, { renames });
    expect(result.violations).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });
});

describe('境界値', () => {
  test('T205: base に公開記事がなければ遡りの判定をしない', () => {
    expect(check([entry('claude-code/a', '2026-11-01')], { base: [] }).violations).toEqual([]);
  });

  test('base の並び順に関係なく、最新の公開日で遡りを判定する', () => {
    const base = [entry('claude-code/b', '2026-11-14'), entry('claude-code/a', '2026-11-12')];
    const result = check([...base, entry('claude-code/c', '2026-11-13')], { base });
    expect(result.violations).toEqual([
      { kind: 'backdated', id: 'claude-code/c', date: '2026-11-13', latestExisting: '2026-11-14' },
    ]);
  });
});
