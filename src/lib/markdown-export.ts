// 記事の .md 版（エージェントが読むための版）を作る（T053）。純粋関数。
// import の行を消し、本文で使える唯一のコンポーネント Callout を blockquote にする。
// それ以外の JSX は content-lint（scripts/lint-content.ts）がビルドの前に止める。

const IMPORT_LINE = /^import\s.+$\n?/gm;
const CALLOUT = /<Callout\b([^>]*)>([\s\S]*?)<\/Callout>/g;
const TITLE_ATTR = /\btitle="([^"]*)"/;
const EXTRA_BLANK_LINES = /\n{3,}/g;

const quote = (lines: readonly string[]): string =>
  lines.map((l) => (l ? `> ${l}` : '>')).join('\n');

const calloutToQuote = (_: string, attrs: string, inner: string): string => {
  const title = TITLE_ATTR.exec(attrs)?.[1];
  const lines = inner
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return quote(title ? [`**${title}**`, '', ...lines] : lines);
};

export interface MarkdownExportInput {
  readonly title: string;
  readonly description: string;
  readonly url: string;
  /** 検証の記録（例: 2026-11-01（Claude Code 2.1.325）） */
  readonly verified: string;
  readonly sources: readonly string[];
  /** MDX の本文（frontmatter を除いたもの） */
  readonly body: string;
}

export const toMarkdownExport = (input: MarkdownExportInput): string => {
  const body = input.body
    .replace(IMPORT_LINE, '')
    .replace(CALLOUT, calloutToQuote)
    .replace(EXTRA_BLANK_LINES, '\n\n')
    .trim();
  return [
    `# ${input.title}`,
    '',
    `> ${input.description}`,
    '',
    `- URL: ${input.url}`,
    `- 検証: ${input.verified}`,
    ...input.sources.map((s) => `- 出典: ${s}`),
    '',
    body,
    '',
  ].join('\n');
};
