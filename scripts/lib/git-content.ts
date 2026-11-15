// git の特定の版から記事を読むための共通部品（scripts/ から使う）。
import { execFileSync } from 'node:child_process';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { CONTENT_TYPES, VERIFICATION } from '../../src/lib/taxonomy.ts';

export const ARTICLES_DIR = 'src/content/articles';
const ARTICLE_FILE = /\.(md|mdx)$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const MAX_BUFFER = 64 * 1024 * 1024;

const frontmatterSchema = z.object({
  publishedAt: z.coerce.date(),
  draft: z.boolean().default(false),
  verification: z.enum(VERIFICATION),
});
export type ArticleFrontmatter = z.infer<typeof frontmatterSchema>;

export const run = (command: string, args: readonly string[]): string =>
  execFileSync(command, [...args], { encoding: 'utf8', maxBuffer: MAX_BUFFER });

export const git = (args: readonly string[]): string => run('git', args);

/** 記事のパスから ID（`<product>/<slug>`）を作る */
export const toId = (path: string): string =>
  path.slice(ARTICLES_DIR.length + 1).replace(ARTICLE_FILE, '');

/** 記事のファイルか（`_` で始まるファイルは content collections の対象外なので除く） */
export const isArticle = (path: string): boolean => {
  const name = path.split('/').pop() ?? '';
  return path.startsWith(`${ARTICLES_DIR}/`) && ARTICLE_FILE.test(name) && !name.startsWith('_');
};

const rawFrontmatter = (ref: string, path: string): string => {
  const match = FRONTMATTER.exec(git(['show', `${ref}:${path}`]));
  if (!match?.[1]) throw new Error(`${path}: frontmatter が見つからない`);
  return match[1];
};

export const readFrontmatter = (ref: string, path: string): ArticleFrontmatter =>
  frontmatterSchema.parse(parse(rawFrontmatter(ref, path)));

const metaSchema = z.object({
  title: z.string(),
  type: z.enum(CONTENT_TYPES),
  products: z.array(z.string()).default([]),
  verification: z.enum(VERIFICATION),
  verifiedAt: z.coerce.date(),
  draft: z.boolean().default(false),
});
export type ArticleMeta = z.infer<typeof metaSchema>;

/** 期限切れの判定に使う項目を読む */
export const readArticleMeta = (ref: string, path: string): ArticleMeta =>
  metaSchema.parse(parse(rawFrontmatter(ref, path)));

export const listArticles = (ref: string): readonly string[] =>
  git(['ls-tree', '-r', '--name-only', ref, '--', ARTICLES_DIR]).split('\n').filter(isArticle);

export interface FileChange {
  /** A（追加）、M（変更）、D（削除）、R（リネーム）など、git の状態の1文字目 */
  readonly status: string;
  readonly path: string;
  /** リネームのときだけ、元のパス */
  readonly from?: string;
}

/** base と head の間で変わった記事の一覧（リネームを検出する） */
export const diffArticles = (base: string, head: string): readonly FileChange[] =>
  git(['diff', '--name-status', '-M', base, head, '--', ARTICLES_DIR])
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'))
    .map((cols): FileChange => {
      const status = (cols[0] ?? '').charAt(0);
      return status === 'R' || status === 'C'
        ? { status, from: cols[1] ?? '', path: cols[2] ?? '' }
        : { status, path: cols[1] ?? '' };
    })
    .filter((change) => isArticle(change.path));
