// 期限切れ・まもなく期限の記事を、1つの Issue（ラベル stale-content）にまとめて作成・更新する。
// 該当がなくなったら Issue を閉じる。使い方:
//   node scripts/stale-report.ts --repo <owner/name> [--ref HEAD] [--dry-run]
// 必要なもの: GH_TOKEN（Issue を作成・編集できる権限）。
import { parseArgs } from 'node:util';
import { z } from 'astro/zod';
import { tracksFreshness } from '../src/lib/freshness.ts';
import { buildStaleReport, type StaleCandidate } from '../src/lib/stale-report.ts';
import { listArticles, readArticleMeta, run, toId } from './lib/git-content.ts';
import { readProducts } from './lib/products.ts';

const LABEL = 'stale-content';
const TITLE = '再検証が必要な記事';

const args = z
  .object({
    repo: z.string().min(1),
    ref: z.string().min(1),
    'dry-run': z.boolean(),
  })
  .parse(
    parseArgs({
      options: {
        repo: { type: 'string' },
        ref: { type: 'string', default: 'HEAD' },
        'dry-run': { type: 'boolean', default: false },
      },
    }).values,
  );

const categoriesOf = new Map(readProducts().map((p) => [p.id, p.categories]));

const candidates: readonly StaleCandidate[] = listArticles(args.ref)
  .map((path) => ({ id: toId(path), meta: readArticleMeta(args.ref, path) }))
  .filter(({ meta }) => !meta.draft && tracksFreshness(meta.verification, meta.type))
  .map(({ id, meta }) => ({
    id,
    title: meta.title,
    type: meta.type,
    verifiedAt: meta.verifiedAt,
    categories: meta.products.flatMap((p) => categoriesOf.get(p) ?? []),
  }));

const report = buildStaleReport(candidates, new Date());
console.log(`対象の記事: ${candidates.length} 本、再検証が必要: ${report.items.length} 本`);

const openIssue = z
  .array(z.object({ number: z.number() }))
  .parse(
    JSON.parse(
      run('gh', [
        'issue',
        'list',
        '--repo',
        args.repo,
        '--label',
        LABEL,
        '--state',
        'open',
        '--json',
        'number',
      ]),
    ),
  )[0];

const act = (description: string, command: readonly string[]): void => {
  console.log(args['dry-run'] ? `（dry-run）${description}` : description);
  if (!args['dry-run']) run('gh', command);
};

if (report.items.length === 0) {
  if (openIssue) {
    act(`Issue #${openIssue.number} を閉じる`, [
      'issue',
      'close',
      String(openIssue.number),
      '--repo',
      args.repo,
      '--comment',
      '再検証が必要な記事はなくなりました。',
    ]);
  }
} else if (openIssue) {
  act(`Issue #${openIssue.number} を更新する`, [
    'issue',
    'edit',
    String(openIssue.number),
    '--repo',
    args.repo,
    '--body',
    report.body,
  ]);
} else {
  act('Issue を作成する', [
    'issue',
    'create',
    '--repo',
    args.repo,
    '--title',
    TITLE,
    '--label',
    LABEL,
    '--body',
    report.body,
  ]);
}
