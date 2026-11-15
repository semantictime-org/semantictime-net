import { describe, expect, test } from 'vitest';
import {
  articleHref,
  breadcrumbsOf,
  CHANGE_LABEL,
  FEATURE_STATUS_LABEL,
  historyOf,
  TYPE_EN,
  TYPE_LABEL,
} from '../../src/lib/article-view';
import { CHANGE_CATEGORIES, CONTENT_TYPES, FEATURE_STATUS } from '../../src/lib/taxonomy';

describe('記事の型の表示名', () => {
  test('すべての型に日本語の名前と英字の見出しがある', () => {
    for (const type of CONTENT_TYPES) {
      expect(TYPE_LABEL[type]).toBeTruthy();
      expect(TYPE_EN[type]).toMatch(/^[A-Z-]+$/);
    }
  });
});

describe('articleHref', () => {
  test('記事の ID から末尾が / の URL を作る', () => {
    expect(articleHref('claude-code/hooks-format')).toBe('/claude-code/hooks-format/');
  });
});

describe('breadcrumbsOf', () => {
  test('ホーム → 製品 → 記事番号', () => {
    expect(breadcrumbsOf({ id: 'claude-code', name: 'Claude Code' }, 'CC07')).toEqual([
      { label: 'ホーム', href: '/' },
      { label: 'Claude Code', href: '/claude-code/' },
      { label: 'CC07' },
    ]);
  });

  test('製品がない記事（ニュース）は ホーム → ニュース', () => {
    expect(breadcrumbsOf(undefined, 'ニュース')).toEqual([
      { label: 'ホーム', href: '/' },
      { label: 'ニュース' },
    ]);
  });
});

describe('historyOf（検証の履歴）', () => {
  const published = new Date('2026-10-02T00:00:00+09:00');

  test('公開のあとに再検証していれば、新しい順に2行', () => {
    expect(historyOf('hands-on', published, new Date('2026-11-01T00:00:00+09:00'))).toEqual([
      { date: '2026-11-01', text: '手元で再検証した。' },
      { date: '2026-10-02', text: '公開した。' },
    ]);
  });

  test('公開前に検証した記事は、検証してから公開した順に2行', () => {
    expect(historyOf('hands-on', published, new Date('2026-09-20T00:00:00+09:00'))).toEqual([
      { date: '2026-10-02', text: '公開した。' },
      { date: '2026-09-20', text: '手元で検証した。' },
    ]);
  });

  test('同じ日なら1行', () => {
    expect(historyOf('hands-on', published, published)).toEqual([
      { date: '2026-10-02', text: '手元で検証して公開した。' },
    ]);
  });

  test('出典で確かめた記事は「出典を確かめた」と書く', () => {
    expect(historyOf('sources', published, published)).toEqual([
      { date: '2026-10-02', text: '一次情報の出典を確かめて公開した。' },
    ]);
  });
});

describe('変更の種類と機能の状態の表示名', () => {
  test('すべての値に日本語の名前がある', () => {
    for (const c of CHANGE_CATEGORIES) expect(CHANGE_LABEL[c]).toBeTruthy();
    for (const s of FEATURE_STATUS) expect(FEATURE_STATUS_LABEL[s]).toBeTruthy();
  });
});
