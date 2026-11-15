import { describe, expect, test } from 'vitest';
import { lintArticle, routeOf, type LintTarget } from '../../src/lib/content-lint';

const ROUTES = new Set(['/', '/about/editorial-policy/', '/claude-code/remote-control/']);

const target = (body: string, id = 'claude-code/hooks'): LintTarget => ({
  id,
  type: 'how-to',
  products: ['claude-code'],
  body,
});

const rules = (body: string, id?: string): readonly string[] =>
  lintArticle(target(body, id), ROUTES).map((v) => v.rule);

describe('危険な HTML（T133）', () => {
  test.each([
    ['<script>alert(1)</script>', 'dangerous-html'],
    ['<iframe src="https://example.com"></iframe>', 'dangerous-html'],
    ['<img src="x.png" onerror="alert(1)">', 'dangerous-html'],
    ['[リンク](javascript:alert(1))', 'dangerous-html'],
    ['<a href="JavaScript:alert(1)">x</a>', 'dangerous-html'],
  ])('%s は違反', (body, rule) => {
    expect(rules(body)).toContain(rule);
  });

  test('コードブロックの中は検査しない', () => {
    expect(rules('```html\n<script>alert(1)</script>\n```')).toEqual([]);
  });

  test('インラインコードの中は検査しない', () => {
    expect(rules('`<iframe>` は使わない。`onclick=` も同様。')).toEqual([]);
  });

  test('ふつうの文章は違反にならない', () => {
    expect(rules('Hooks の PostToolUse で整形を自動化する。')).toEqual([]);
  });
});

describe('内部リンク（T134）', () => {
  test('存在するページへのリンクは通る（アンカー付きも）', () => {
    expect(
      rules('[RC](/claude-code/remote-control/#requirements) と [方針](/about/editorial-policy/)'),
    ).toEqual([]);
  });

  test('末尾のスラッシュがなくても同じページとみなす', () => {
    expect(rules('[RC](/claude-code/remote-control)')).toEqual([]);
  });

  test('存在しないページへのリンクは違反', () => {
    expect(rules('[x](/claude-code/no-such-page/)')).toEqual(['broken-link']);
  });

  test('HTML の href も検査する', () => {
    expect(rules('<a href="/no-such/">x</a>')).toEqual(['broken-link']);
  });

  test('外部リンクと、ページ内のアンカーは検査しない', () => {
    expect(rules('[公式](https://code.claude.com/docs/) と [上へ](#top)')).toEqual([]);
  });
});

describe('.md 版で扱えない JSX（T151）', () => {
  test('許可したコンポーネント（Callout）は通る', () => {
    expect(rules('<Callout type="note">注意</Callout>')).toEqual([]);
  });

  test('許可していないコンポーネントは違反', () => {
    expect(rules('<Foo bar="1" />')).toEqual(['unsupported-jsx']);
  });

  test('コードブロックの中のコンポーネントは検査しない', () => {
    expect(rules('```tsx\n<Foo />\n```')).toEqual([]);
  });
});

describe('置き場所（T128・T129）', () => {
  test('ディレクトリと products の先頭が違えば違反', () => {
    expect(rules('本文', 'api/hooks')).toEqual(['article-path']);
  });

  test('slug に使えない文字があれば違反', () => {
    expect(rules('本文', 'claude-code/Hooks_Guide')).toEqual(['article-path']);
  });
});

describe('routeOf', () => {
  test('記事 ID から URL を作る', () => {
    expect(routeOf('claude-code/remote-control')).toBe('/claude-code/remote-control/');
  });
});

describe('違反の情報', () => {
  test('記事 ID と、行番号を含む説明を返す', () => {
    const [v] = lintArticle(target('一行目\n<script>x</script>'), ROUTES);
    expect(v).toMatchObject({ id: 'claude-code/hooks', rule: 'dangerous-html', line: 2 });
  });
});

// T318：段落の長さ（DESIGN.md「文字を減らし、図で見せる」）
describe('段落の長さ（T318）', () => {
  test('2文・80字までの段落は通る', () => {
    expect(rules('保存のたびに整形する。設定は1か所だけ。')).toEqual([]);
  });

  test('3文の段落は違反', () => {
    expect(rules('一つ目。二つ目。三つ目。')).toContain('long-paragraph');
  });

  test('80字を超える段落は違反', () => {
    expect(rules('あ'.repeat(81))).toContain('long-paragraph');
  });

  test('改行で続く行は1つの段落として数える', () => {
    expect(rules('一つ目。\n二つ目。\n三つ目。')).toContain('long-paragraph');
  });

  test('空行で分かれた段落は別々に数える', () => {
    expect(rules('一つ目。二つ目。\n\n三つ目。四つ目。')).toEqual([]);
  });

  test('見出し・箇条書き・表・引用は段落として数えない', () => {
    const body = [
      `## ${'見'.repeat(90)}`,
      `- ${'項'.repeat(90)}。二。三。`,
      `| ${'表'.repeat(90)} |`,
      `> ${'引'.repeat(90)}`,
    ].join('\n');
    expect(rules(body)).toEqual([]);
  });

  test('リンクの URL とインラインコードは字数に入れない', () => {
    const body = `[公式の説明](/about/editorial-policy/)を読む。\`${'x'.repeat(90)}\` を使う。`;
    expect(rules(body)).toEqual([]);
  });

  test('コードブロックは数えない', () => {
    expect(rules(`\`\`\`text\n${'あ'.repeat(200)}\n\`\`\``)).toEqual([]);
  });

  test('違反には段落の始まりの行を付ける', () => {
    const violation = lintArticle(target('短い。\n\n一つ目。二つ目。三つ目。'), ROUTES).find(
      (v) => v.rule === 'long-paragraph',
    );
    expect(violation?.line).toBe(3);
  });
});
