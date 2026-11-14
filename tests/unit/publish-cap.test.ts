import { describe, expect, test } from 'vitest';
import {
  findPublishViolations,
  toJstDate,
  type PublishEntry,
  type PublishCheckResult,
} from '../../src/lib/publish-cap';

const TODAY = '2026-11-15';
const CAP = 1;

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
    cap?: number;
    mode?: 'pull-request' | 'deploy';
  } = {},
): PublishCheckResult =>
  findPublishViolations({
    base: options.base ?? BASE,
    head,
    renames: options.renames ?? new Map(),
    cap: options.cap ?? CAP,
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

  test('T005: 最新日付と同じ日付は遡りとして扱わない（同じ日の2本目なので上限超過）', () => {
    const result = check([...BASE, entry('claude-code/c', '2026-11-14')]);
    expect(kinds(result)).toEqual(['cap-exceeded']);
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

  test('T007: デプロイ前は、止めていた間の2日分（11-14 と 11-15）を通す', () => {
    const base = [entry('claude-code/a', '2026-11-13')];
    const head = [...base, entry('claude-code/b', '2026-11-14'), entry('claude-code/c', TODAY)];
    expect(check(head, { base, mode: 'deploy' }).violations).toEqual([]);
  });
});

describe('異常系', () => {
  test('T101: 同じ日に2本目', () => {
    const base = [...BASE, entry('claude-code/c', TODAY)];
    const result = check([...base, entry('claude-code/d', TODAY)], { base });
    expect(kinds(result)).toEqual(['cap-exceeded']);
    expect(result.violations[0]).toMatchObject({ kind: 'cap-exceeded', date: TODAY });
  });

  test('T102: 1本の PR で同じ日に2本', () => {
    const result = check([...BASE, entry('claude-code/c', TODAY), entry('claude-code/d', TODAY)]);
    expect(kinds(result)).toEqual(['cap-exceeded', 'too-many-in-change']);
  });

  test('T103: 空いた日付を使って1本の PR で2本（日付ごとには1本）', () => {
    const base = [entry('claude-code/a', '2026-11-13')];
    const head = [...base, entry('claude-code/b', '2026-11-14'), entry('claude-code/c', TODAY)];
    expect(kinds(check(head, { base }))).toEqual(['too-many-in-change']);
  });

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
    const base = [...BASE, entry('claude-code/c', TODAY)];
    const head = [...base, entry('claude-code/d', TODAY), entry('claude-code/e', '2026-11-16')];
    expect(kinds(check(head, { base }))).toEqual([
      'cap-exceeded',
      'future-date',
      'too-many-in-change',
    ]);
  });

  test('T108: デプロイ前でも日付ごとの上限は判定する', () => {
    const head = [...BASE, entry('claude-code/c', TODAY), entry('claude-code/d', TODAY)];
    expect(kinds(check(head, { mode: 'deploy' }))).toEqual(['cap-exceeded']);
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
  test('T204: 上限を2にすると同じ日の2本は通り、3本目で違反', () => {
    const two = [...BASE, entry('claude-code/c', TODAY), entry('claude-code/d', TODAY)];
    expect(check(two, { cap: 2 }).violations).toEqual([]);
    const three = [...two, entry('claude-code/e', TODAY)];
    expect(kinds(check(three, { cap: 2 }))).toEqual(['cap-exceeded', 'too-many-in-change']);
  });

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

  test('下書きは日付ごとの本数にも数えない', () => {
    const head = [...BASE, entry('claude-code/c', '2026-11-14', true)];
    expect(check(head).violations).toEqual([]);
  });
});
