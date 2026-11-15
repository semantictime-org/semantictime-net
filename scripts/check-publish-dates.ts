// 公開日のチェック（未来の日付、日付の遡り）。git の2つの版（base と head）の記事を読み、判定は src/lib/publish-dates.ts に任せる。
// 使い方: node scripts/check-publish-dates.ts --base <ref> --head <ref> [--mode pull-request|deploy]
// 違反があれば内容を出力して exit 1。
import { parseArgs } from 'node:util';
import { z } from 'astro/zod';
import {
  findPublishViolations,
  toJstDate,
  type PublishEntry,
  type PublishViolation,
} from '../src/lib/publish-dates.ts';
import { diffArticles, isArticle, listArticles, readFrontmatter, toId } from './lib/git-content.ts';

const readEntries = (ref: string): readonly PublishEntry[] =>
  listArticles(ref).map((path) => {
    const fm = readFrontmatter(ref, path);
    return { id: toId(path), publishedAt: fm.publishedAt, draft: fm.draft };
  });

// リネームされた記事について、新しい ID → 古い ID の対応を作る
const readRenames = (base: string, head: string): ReadonlyMap<string, string> =>
  new Map(
    diffArticles(base, head)
      .filter((c) => c.status === 'R' && c.from !== undefined && isArticle(c.from))
      .map((c) => [toId(c.path), toId(c.from ?? '')]),
  );

const describe = (v: PublishViolation): string => {
  switch (v.kind) {
    case 'future-date':
      return `${v.id}: 公開日 ${v.date} が未来の日付になっている`;
    case 'backdated':
      return `${v.id}: 公開日 ${v.date} が、既存の最新の公開日 ${v.latestExisting} より前になっている`;
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
console.log('公開日のチェック: 合格');
