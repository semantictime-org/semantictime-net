// 検証ゲートのチェック。PR で変わった記事を git から調べ、PR 本文と最終編集者を GitHub から取得して判定する。
// 使い方: node scripts/check-verification-gate.ts --base <ref> --head <ref> --repo <owner/name> --pr <number>
// 必要なもの: GH_TOKEN（PR を読める権限）。不合格なら理由を出力して exit 1。
import { parseArgs } from 'node:util';
import { z } from 'astro/zod';
import { SITE } from '../site.config.ts';
import { evaluateGate, type ChangedArticle } from '../src/lib/verification-gate.ts';
import { diffArticles, readFrontmatter, toId } from './lib/git-content.ts';
import { fetchPullRequestBody } from './lib/pull-request.ts';

const args = z
  .object({
    base: z.string().min(1),
    head: z.string().min(1),
    repo: z.string().min(1),
    pr: z.coerce.number().int().positive(),
  })
  .parse(
    parseArgs({
      options: {
        base: { type: 'string' },
        head: { type: 'string', default: 'HEAD' },
        repo: { type: 'string' },
        pr: { type: 'string' },
      },
    }).values,
  );

// 削除された記事は head に存在しないので、base の版を読み、下書きではない（公開記事の変更）として扱う
const changedArticles: readonly ChangedArticle[] = diffArticles(args.base, args.head).map(
  (change) => {
    const deleted = change.status === 'D';
    const meta = readFrontmatter(deleted ? args.base : args.head, change.path);
    return {
      id: toId(change.path),
      headDraft: deleted ? false : meta.draft,
      verification: meta.verification,
    };
  },
);

const result = changedArticles.every((a) => a.headDraft)
  ? evaluateGate({ changedArticles, body: '', editorLogin: null, codeOwner: SITE.codeOwner })
  : evaluateGate({
      changedArticles,
      ...fetchPullRequestBody(args.repo, args.pr),
      codeOwner: SITE.codeOwner,
    });

console.log(`変更された記事: ${changedArticles.map((a) => a.id).join(', ') || 'なし'}`);
console.log(`検証ゲート: ${result.passed ? '合格' : '不合格'}（${result.reason}）`);
if (!result.passed) {
  console.error(
    'PR テンプレートの検証の節で、必要な印（実機で検証した／一次情報の出典を確かめた）をコードオーナーが付けてください（push すると印は外れます）。',
  );
  process.exit(1);
}
