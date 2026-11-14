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

const body = (mark: ' ' | 'x' | 'X'): string =>
  [
    '## 変更内容',
    '',
    '## 確認事項',
    '',
    '<!-- verification:start -->',
    `- [${mark}] 実機で検証した`,
    '<!-- verification:end -->',
    '',
    '- [x] 雇用先の情報を含まない',
  ].join('\n');

const published = (id: string): ChangedArticle => ({ id, headDraft: false });
const draft = (id: string): ChangedArticle => ({ id, headDraft: true });

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

describe('uncheckVerification（push があったら印を外す）', () => {
  test('T120: 節の中の印だけを外し、ほかのチェックは残す', () => {
    const result = uncheckVerification(body('x'));
    expect(result).toBe(body(' '));
    expect(result).toContain('- [x] 雇用先の情報を含まない');
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
