// 記事本文の検査（純粋関数）。ファイルの読み込みは scripts/lint-content.ts で行う。
// - 危険な HTML（AI の下書きに紛れ込むのを防ぐ）
// - 内部リンク切れ
// - .md 版で扱えない JSX コンポーネント
// - 置き場所と slug の規則
// - 段落の長さ（文字を減らし、図で見せる。DESIGN.md）
import { checkArticlePath } from './schemas.ts';
import type { Surface } from './taxonomy.ts';

/** .md 版で対応する Markdown に置き換えられるコンポーネント */
export const ALLOWED_COMPONENTS: readonly string[] = ['Callout'];

export interface LintTarget {
  readonly id: string;
  readonly surfaces: readonly Surface[];
  readonly body: string;
}

export type LintRule =
  'dangerous-html' | 'broken-link' | 'unsupported-jsx' | 'article-path' | 'long-paragraph';

/** 段落の上限（DESIGN.md「文字を減らし、図で見せる」） */
export const MAX_PARAGRAPH_SENTENCES = 2;
export const MAX_PARAGRAPH_CHARS = 80;

export interface LintViolation {
  readonly id: string;
  readonly rule: LintRule;
  readonly line?: number;
  readonly message: string;
}

const DANGEROUS: readonly { readonly pattern: RegExp; readonly label: string }[] = [
  { pattern: /<\s*script\b/i, label: '<script>' },
  { pattern: /<\s*iframe\b/i, label: '<iframe>' },
  { pattern: /<[^>]*\son[a-z]+\s*=[^>]*>/i, label: 'イベント属性（on*=）' },
  { pattern: /javascript:/i, label: 'javascript: の URL' },
];
const MARKDOWN_LINK = /\]\((\/[^)\s]*)\)/g;
const HTML_HREF = /href=["'](\/[^"']*)["']/g;
const COMPONENT = /<([A-Z][A-Za-z0-9]*)\b/g;

/** 記事 ID から URL を作る */
export const routeOf = (id: string): string => `/${id}/`;

const normalizeRoute = (href: string): string => {
  const path = href.replace(/[#?].*$/, '');
  return path.endsWith('/') ? path : `${path}/`;
};

/** コードブロックとインラインコードを、行数を保ったまま空白にする */
const maskCode = (body: string): string =>
  body
    .replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/`[^`\n]+`/g, (code) => ' '.repeat(code.length));

const lintLine = (
  id: string,
  text: string,
  line: number,
  routes: ReadonlySet<string>,
): readonly LintViolation[] => {
  const dangerous = DANGEROUS.filter((d) => d.pattern.test(text)).map((d): LintViolation => ({
    id,
    rule: 'dangerous-html',
    line,
    message: `${d.label} は本文に書けない`,
  }));
  const links = [...text.matchAll(MARKDOWN_LINK), ...text.matchAll(HTML_HREF)]
    .map((m) => m[1] ?? '')
    .filter((href) => !routes.has(normalizeRoute(href)))
    .map((href): LintViolation => ({
      id,
      rule: 'broken-link',
      line,
      message: `内部リンクの行き先がない: ${href}`,
    }));
  const components = [...text.matchAll(COMPONENT)]
    .map((m) => m[1] ?? '')
    .filter((name) => !ALLOWED_COMPONENTS.includes(name))
    .map((name): LintViolation => ({
      id,
      rule: 'unsupported-jsx',
      line,
      message: `<${name}> は .md 版に変換できない（使えるのは ${ALLOWED_COMPONENTS.join(', ')}）`,
    }));
  return [...dangerous, ...links, ...components];
};

/** 段落として数えない行（見出し、箇条書き、表、引用、HTML・JSX、import/export） */
const NOT_PROSE = /^\s*(#|[-*+]\s|\d+[.)]\s|\||>|<|import\s|export\s)/;
const SENTENCE_ENDS = /[。！？!?]/g;
const ENDS_WITH_SENTENCE_END = /[。！？!?]$/;

const visibleText = (text: string): string =>
  text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/\s/g, '');

interface Paragraph {
  readonly line: number;
  readonly text: string;
}

const paragraphsOf = (lines: readonly string[]): readonly Paragraph[] =>
  lines.reduce<readonly Paragraph[]>((acc, text, index) => {
    if (text.trim() === '' || NOT_PROSE.test(text)) return acc;
    const prev = lines[index - 1];
    const continues =
      index > 0 && prev !== undefined && prev.trim() !== '' && !NOT_PROSE.test(prev);
    const last = acc[acc.length - 1];
    return continues && last
      ? [...acc.slice(0, -1), { line: last.line, text: `${last.text}${text}` }]
      : [...acc, { line: index + 1, text }];
  }, []);

const sentenceCount = (text: string): number => {
  const ends = text.match(SENTENCE_ENDS)?.length ?? 0;
  return ENDS_WITH_SENTENCE_END.test(text) || text === '' ? ends : ends + 1;
};

const lintParagraphs = (id: string, lines: readonly string[]): readonly LintViolation[] =>
  paragraphsOf(lines)
    .map((p) => ({ line: p.line, text: visibleText(p.text) }))
    .filter(
      (p) =>
        sentenceCount(p.text) > MAX_PARAGRAPH_SENTENCES || [...p.text].length > MAX_PARAGRAPH_CHARS,
    )
    .map((p): LintViolation => ({
      id,
      rule: 'long-paragraph',
      line: p.line,
      message: `段落は ${MAX_PARAGRAPH_SENTENCES} 文・${MAX_PARAGRAPH_CHARS} 字まで（${sentenceCount(p.text)} 文・${[...p.text].length} 字）。図・箇条書き・表にできないか見直す`,
    }));

export const lintArticle = (
  target: LintTarget,
  routes: ReadonlySet<string>,
): readonly LintViolation[] => {
  const pathViolations = checkArticlePath(target.id, target.surfaces).map(
    (message): LintViolation => ({ id: target.id, rule: 'article-path', message }),
  );
  const lines = maskCode(target.body).split('\n');
  const bodyViolations = lines.flatMap((text, index) =>
    lintLine(target.id, text, index + 1, routes),
  );
  return [...pathViolations, ...bodyViolations, ...lintParagraphs(target.id, lines)];
};
