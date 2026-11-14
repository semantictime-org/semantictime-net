// 記事の検査（危険な HTML、内部リンク切れ、.md 版で扱えない JSX、置き場所）。
// 使い方: node scripts/lint-content.ts。違反があれば内容を出力して exit 1。
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { lintArticle, routeOf, type LintTarget } from '../src/lib/content-lint.ts';
import { SURFACES } from '../src/lib/taxonomy.ts';

const ARTICLES_DIR = 'src/content/articles';
const PAGES_DIR = 'src/pages';
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

const listFiles = (dir: string, pattern: RegExp): readonly string[] =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((path) => pattern.test(path))
    .map((path) => join(dir, path));

const frontmatterSchema = z.object({ surfaces: z.array(z.enum(SURFACES)).min(1) });

interface ArticleFile extends LintTarget {
  /** 本文の1行目が、ファイルの何行目の次にあたるか（frontmatter の行数） */
  readonly lineOffset: number;
}

const articles: readonly ArticleFile[] = listFiles(ARTICLES_DIR, /\.(md|mdx)$/)
  .filter((path) => !(path.split('/').pop() ?? '').startsWith('_'))
  .map((path) => {
    const source = readFileSync(path, 'utf8');
    const match = FRONTMATTER.exec(source);
    if (!match?.[1]) throw new Error(`${path}: frontmatter が見つからない`);
    return {
      id: relative(ARTICLES_DIR, path).replace(/\.(md|mdx)$/, ''),
      surfaces: frontmatterSchema.parse(parse(match[1])).surfaces,
      body: source.slice(match[0].length),
      lineOffset: match[0].split('\n').length - 1,
    };
  });

// 静的なページ（動的ルート [..] とエンドポイント .ts は除く）の URL
const staticPageRoutes = listFiles(PAGES_DIR, /\.(astro|md|mdx)$/)
  .map((path) => relative(PAGES_DIR, path).replace(/\.(astro|md|mdx)$/, ''))
  .filter((route) => !route.includes('['))
  .map((route) => (route === 'index' ? '/' : `/${route.replace(/\/index$/, '')}/`));

const routes = new Set([...staticPageRoutes, ...articles.map((a) => routeOf(a.id))]);
const violations = articles.flatMap((a) =>
  lintArticle(a, routes).map((v) => ({ ...v, line: v.line && v.line + a.lineOffset })),
);

// 表示はファイル上の行番号（エディタで開いたときの行）
for (const v of violations) {
  console.error(`${ARTICLES_DIR}/${v.id}${v.line ? `:${v.line}` : ''} [${v.rule}] ${v.message}`);
}
console.log(`コンテンツの検査: ${articles.length} 本、違反 ${violations.length} 件`);
if (violations.length > 0) process.exit(1);
