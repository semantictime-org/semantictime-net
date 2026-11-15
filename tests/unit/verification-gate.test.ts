import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  evaluateGate,
  parseCodeOwners,
  uncheckVerification,
  type ChangedArticle,
} from '../../src/lib/verification-gate';
import { SITE } from '../../site.config';

const OWNER = 'semantictime';
const BOT = 'semantictime-bot';

type Mark = ' ' | 'x' | 'X';

const body = (mark: Mark, sourcesMark: Mark = ' '): string =>
  [
    '## 変更内容',
    '',
    '## 確認事項',
    '',
    '<!-- verification:start -->',
    `- [${mark}] 実機で検証した`,
    `- [${sourcesMark}] 一次情報の出典を確かめた`,
    '<!-- verification:end -->',
    '',
    '- [x] 雇用先の情報を含まない',
  ].join('\n');

const published = (id: string): ChangedArticle => ({
  id,
  headDraft: false,
  verification: 'hands-on',
});
const draft = (id: string): ChangedArticle => ({ id, headDraft: true, verification: 'hands-on' });
const news = (id: string): ChangedArticle => ({ id, headDraft: false, verification: 'sources' });

const gate = (changed: readonly ChangedArticle[], prBody: string, editorLogin: string | null) =>
  evaluateGate({ changedArticles: changed, body: prBody, editorLogin, codeOwner: OWNER });

describe('正常系', () => {
  test('T011: 人が印を付けていれば合格', () => {
    const r = gate([published('claude-code/a')], body('x'), OWNER);
    expect(r).toMatchObject({ required: true, passed: true });
  });

  test('T012: 記事に関係のない PR は対象外', () => {
    const r = gate([], body(' '), null);
    expect(r).toMatchObject({ required: false, passed: true });
  });

  test('T013: 下書きだけの変更は対象外', () => {
    const r = gate([draft('claude-code/a'), draft('claude-code/b')], body(' '), null);
    expect(r).toMatchObject({ required: false, passed: true });
  });

  test('T014: 大文字の X でも合格', () => {
    expect(gate([published('claude-code/a')], body('X'), OWNER).passed).toBe(true);
  });
});

describe('異常系', () => {
  test('T111: 印がなければ不合格', () => {
    expect(gate([published('claude-code/a')], body(' '), OWNER).passed).toBe(false);
  });

  test('T112: 本文が一度も編集されていなければ（editor が null）不合格', () => {
    expect(gate([published('claude-code/a')], body('x'), null).passed).toBe(false);
  });

  test('T113: 印を付けたのがボットなら不合格', () => {
    expect(gate([published('claude-code/a')], body('x'), BOT).passed).toBe(false);
  });

  test('T115: 公開済みの記事の本文だけを直す PR も対象になる', () => {
    const r = gate([published('claude-code/a')], body(' '), OWNER);
    expect(r).toMatchObject({ required: true, passed: false });
  });

  test('T116: 下書きを公開に切り替えた PR で印がなければ不合格', () => {
    expect(gate([published('claude-code/a')], body(' '), null).passed).toBe(false);
  });

  test('T117: チェックボックスの行がなければ不合格', () => {
    const noLine = body('x').replace('- [x] 実機で検証した', '');
    expect(gate([published('claude-code/a')], noLine, OWNER).passed).toBe(false);
  });

  test('T118: 下書きの追加と公開記事の修正を含めば対象になる', () => {
    const r = gate([draft('claude-code/a'), published('claude-code/b')], body(' '), OWNER);
    expect(r).toMatchObject({ required: true, passed: false });
  });

  test('T119: 決まった節の外の印は数えない', () => {
    const outside = ['- [x] 実機で検証した', body(' ')].join('\n');
    expect(gate([published('claude-code/a')], outside, OWNER).passed).toBe(false);
  });

  test('節の終わりの目印がなければ不合格', () => {
    const unclosed = body('x').replace('<!-- verification:end -->', '');
    expect(gate([published('claude-code/a')], unclosed, OWNER).passed).toBe(false);
  });

  test('不合格のときは理由を返す', () => {
    const r = gate([published('claude-code/a')], body('x'), BOT);
    expect(r.reason).toContain(BOT);
  });
});

describe('2 種類の印（T307〜T310）', () => {
  test('T307: 実機で検証した記事だけなら、実機の印で合格', () => {
    expect(gate([published('claude-code/a')], body('x'), OWNER).passed).toBe(true);
  });

  test('T308: ニュースだけなら、出典の印がなければ不合格（実機の印では代わらない）', () => {
    expect(gate([news('news/a')], body('x'), OWNER).passed).toBe(false);
  });

  test('T308b: ニュースだけなら、出典の印で合格', () => {
    expect(gate([news('news/a')], body(' ', 'x'), OWNER).passed).toBe(true);
  });

  test('T309: 両方の種類を含む PR は、実機の印だけでは不合格', () => {
    const r = gate([published('claude-code/a'), news('news/a')], body('x'), OWNER);
    expect(r.passed).toBe(false);
    expect(r.reason).toContain('一次情報の出典を確かめた');
  });

  test('T309b: 両方の種類を含む PR は、両方の印で合格', () => {
    const r = gate([published('claude-code/a'), news('news/a')], body('x', 'x'), OWNER);
    expect(r.passed).toBe(true);
  });

  test('下書きのニュースは出典の印を求めない', () => {
    const r = gate(
      [published('claude-code/a'), { ...news('news/a'), headDraft: true }],
      body('x'),
      OWNER,
    );
    expect(r.passed).toBe(true);
  });

  test('T310: 両方の印があっても、付けたのがボットなら不合格', () => {
    const r = gate([published('claude-code/a'), news('news/a')], body('x', 'x'), BOT);
    expect(r.passed).toBe(false);
  });
});

describe('uncheckVerification（push があったら印を外す）', () => {
  test('T120: 節の中の印だけを外し、ほかのチェックは残す', () => {
    const result = uncheckVerification(body('x'));
    expect(result).toBe(body(' '));
    expect(result).toContain('- [x] 雇用先の情報を含まない');
  });

  test('T311: 2 種類の印を両方外す', () => {
    expect(uncheckVerification(body('x', 'X'))).toBe(body(' ', ' '));
  });

  test('印がなければ本文を変えない', () => {
    expect(uncheckVerification(body(' '))).toBe(body(' '));
  });
});

describe('コードオーナー', () => {
  test('CODEOWNERS から全体のコードオーナーを読む', () => {
    expect(parseCodeOwners('# comment\n* @alice\n/docs/ @bob\n')).toEqual(['alice']);
  });

  test('T015: site.config.ts の codeOwner と .github/CODEOWNERS が一致する', () => {
    const codeowners = readFileSync('.github/CODEOWNERS', 'utf8');
    expect(parseCodeOwners(codeowners)).toEqual([SITE.codeOwner]);
  });
});
