// 公開上限のチェック。git の2つの版（base と head）の記事を読み、判定は src/lib/publish-cap.ts に任せる。
// 使い方: node scripts/check-publish-cap.ts --base <ref> --head <ref> [--mode pull-request|deploy]
// 違反があれば内容を出力して exit 1。
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { SITE } from '../site.config.ts';
import {
  findPublishViolations,
  toJstDate,
  type PublishEntry,
  type PublishViolation,
} from '../src/lib/publish-cap.ts';

const ARTICLES_DIR = 'src/content/articles';
const ARTICLE_FILE = /\.(md|mdx)$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

const frontmatterSchema = z.object({
  publishedAt: z.coerce.date(),
  draft: z.boolean().default(false),
});

const git = (args: readonly string[]): string =>
  execFileSync('git', [...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const toId = (path: string): string =>
  path.slice(ARTICLES_DIR.length + 1).replace(ARTICLE_FILE, '');

const isArticle = (path: string): boolean => {
  const name = path.split('/').pop() ?? '';
  return ARTICLE_FILE.test(name) && !name.startsWith('_');
};

const readEntries = (ref: string): readonly PublishEntry[] =>
  git(['ls-tree', '-r', '--name-only', ref, '--', ARTICLES_DIR])
    .split('\n')
    .filter(isArticle)
    .map((path) => {
      const match = FRONTMATTER.exec(git(['show', `${ref}:${path}`]));
      if (!match?.[1]) throw new Error(`${path}: frontmatter が見つからない`);
      const fm = frontmatterSchema.parse(parse(match[1]));
      return { id: toId(path), publishedAt: fm.publishedAt, draft: fm.draft };
    });

// "R100\told\tnew" の行から、新しい ID → 古い ID の対応を作る
const readRenames = (base: string, head: string): ReadonlyMap<string, string> =>
  new Map(
    git(['diff', '--name-status', '-M', base, head, '--', ARTICLES_DIR])
      .split('\n')
      .map((line) => line.split('\t'))
      .filter(
        (cols): cols is [string, string, string] => cols.length === 3 && /^R/.test(cols[0] ?? ''),
      )
      .filter(([, from, to]) => isArticle(from) && isArticle(to))
      .map(([, from, to]) => [toId(to), toId(from)]),
  );

const describe = (v: PublishViolation): string => {
  switch (v.kind) {
    case 'cap-exceeded':
      return `${v.date} の公開が上限（${SITE.publishCapPerDay} 本）を超えている: ${v.ids.join(', ')}`;
    case 'future-date':
      return `${v.id}: 公開日 ${v.date} が未来の日付になっている`;
    case 'backdated':
      return `${v.id}: 公開日 ${v.date} が、既存の最新の公開日 ${v.latestExisting} より前になっている`;
    case 'too-many-in-change':
      return `1回の変更で新しく公開する記事が上限（${SITE.publishCapPerDay} 本）を超えている: ${v.ids.join(', ')}`;
  }
};

const { values } = parseArgs({
  options: {
    base: { type: 'string' },
    head: { type: 'string', default: 'HEAD' },
    mode: { type: 'string', default: 'pull-request' },
  },
});
const mode = z.enum(['pull-request', 'deploy']).parse(values.mode);
if (!values.base) {
  throw new Error('--base を指定する（PR なら base ブランチ、デプロイ前ならタグ deployed）');
}

const result = findPublishViolations({
  base: readEntries(values.base),
  head: readEntries(values.head),
  renames: readRenames(values.base, values.head),
  cap: SITE.publishCapPerDay,
  today: toJstDate(new Date()),
  mode,
});

for (const w of result.warnings) console.warn(`警告: ${w}`);
console.log(
  `新しく公開する記事: ${result.newlyPublished.length} 本${result.newlyPublished.length ? `（${result.newlyPublished.join(', ')}）` : ''}`,
);
if (result.violations.length > 0) {
  for (const v of result.violations) console.error(`違反: ${describe(v)}`);
  process.exit(1);
}
console.log('公開上限のチェック: 合格');
