import { describe, expect, test } from 'vitest';
import {
  disclosureOf,
  strongestFeatureStatus,
  verificationRecordOf,
  verifiedWithLines,
} from '../../src/lib/article-meta';

const NOW = new Date('2026-11-15T03:00:00+09:00');
const daysAgo = (n: number): Date => new Date(Date.UTC(2026, 10, 15 - n));

describe('strongestFeatureStatus（T077）', () => {
  test('beta の機能があればバナーを出す', () => {
    expect(strongestFeatureStatus(['ga', 'beta'])).toBe('beta');
  });
  test('removed と beta の両方なら removed だけ', () => {
    expect(strongestFeatureStatus(['beta', 'removed'])).toBe('removed');
  });
  test('deprecated は beta より重い', () => {
    expect(strongestFeatureStatus(['beta', 'deprecated'])).toBe('deprecated');
  });
  test('ga だけ、または機能なしならバナーなし', () => {
    expect(strongestFeatureStatus(['ga'])).toBeUndefined();
    expect(strongestFeatureStatus([])).toBeUndefined();
  });
});

describe('disclosureOf（T079）', () => {
  const base = { author: 'shizukukai', verifiedAt: daysAgo(14), versions: ['Claude Code 2.1.325'] };

  test.each(['draft', 'draft-and-edit'] as const)('%s は「執筆支援：AI」', (aiAssisted) => {
    expect(disclosureOf({ ...base, aiAssisted }).assistance).toBe('執筆支援：AI');
  });

  test('none は「AI 不使用」', () => {
    expect(disclosureOf({ ...base, aiAssisted: 'none' }).assistance).toBe('AI 不使用');
  });

  test('どちらも検証・編集者と検証日・バージョンを出す', () => {
    expect(disclosureOf({ ...base, aiAssisted: 'none' }).verification).toBe(
      '検証・編集：shizukukai／検証日 2026-11-01・Claude Code 2.1.325',
    );
  });

  test('バージョンがなければ検証日だけ', () => {
    expect(disclosureOf({ ...base, versions: [], aiAssisted: 'draft' }).verification).toBe(
      '検証・編集：shizukukai／検証日 2026-11-01',
    );
  });
});

describe('verifiedWithLines', () => {
  test('製品の版、モデル、API の版、ほかの製品の版の順に並べる', () => {
    expect(
      verifiedWithLines({
        version: 'Codex CLI 0.169.0',
        apiVersion: '2023-06-01',
        model: 'claude-opus-5-5',
        claudeCode: '2.1.325',
      }),
    ).toEqual(['Claude Code 2.1.325', 'claude-opus-5-5', 'API 2023-06-01', 'Codex CLI 0.169.0']);
  });
  test('未指定なら空', () => {
    expect(verifiedWithLines(undefined)).toEqual([]);
  });
});

describe('verificationRecordOf（検証票）', () => {
  const handsOn = {
    verification: 'hands-on',
    verifiedAt: daysAgo(14),
    type: 'how-to',
    categories: ['coding'],
  } as const;

  test('期限内なら「検証済み」と次の見直し日', () => {
    expect(verificationRecordOf(handsOn, NOW)).toEqual({
      label: '手元で確かめた日',
      date: '2026.11.01',
      state: 'ok',
      stateLabel: '検証済み',
      nextReview: '2026.12.31', // 11-01 + 60 日（coding）
    });
  });

  test.each([
    [53, 'review', 'まもなく見直し'],
    [61, 'stale', '期限切れ'],
  ] as const)('%i 日経過は %s（%s）', (days, state, stateLabel) => {
    expect(verificationRecordOf({ ...handsOn, verifiedAt: daysAgo(days) }, NOW)).toMatchObject({
      state,
      stateLabel,
    });
  });

  test('出典で確かめた解説は 180 日で見直し、ラベルは「出典を確かめた日」', () => {
    const record = verificationRecordOf(
      { ...handsOn, verification: 'sources', type: 'explanation' },
      NOW,
    );
    expect(record).toMatchObject({
      label: '出典を確かめた日',
      state: 'ok',
      stateLabel: '出典を確認',
      nextReview: '2027.04.30', // 11-01 + 180 日
    });
    expect(
      verificationRecordOf(
        { ...handsOn, verification: 'sources', type: 'explanation', verifiedAt: daysAgo(181) },
        NOW,
      ).state,
    ).toBe('stale');
  });

  test('ニュースは鮮度を判定せず、見直し日も出さない', () => {
    expect(
      verificationRecordOf({ ...handsOn, verification: 'sources', type: 'news' }, NOW),
    ).toEqual({
      label: '出典を確かめた日',
      date: '2026.11.01',
      state: 'ok',
      stateLabel: '出典を確認',
      nextReview: undefined,
    });
  });
});
