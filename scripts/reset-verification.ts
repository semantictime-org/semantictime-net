// PR に新しい push があったときに、PR 本文の検証の節の印（実機で検証した・一次情報の出典を確かめた）を外す。
// 印を、人が確かめた版に結び付けるため（設計書 2.3 検証ゲート）。
// 使い方: node scripts/reset-verification.ts --repo <owner/name> --pr <number> [--dry-run]
// 必要なもの: GH_TOKEN（GitHub App のトークン。PR を編集できる権限）。
import { parseArgs } from 'node:util';
import { z } from 'astro/zod';
import { uncheckVerification } from '../src/lib/verification-gate.ts';
import { fetchPullRequestBody, updatePullRequestBody } from './lib/pull-request.ts';

const args = z
  .object({
    repo: z.string().min(1),
    pr: z.coerce.number().int().positive(),
    'dry-run': z.boolean().default(false),
  })
  .parse(
    parseArgs({
      options: {
        repo: { type: 'string' },
        pr: { type: 'string' },
        'dry-run': { type: 'boolean', default: false },
      },
    }).values,
  );

const { body } = fetchPullRequestBody(args.repo, args.pr);
const next = uncheckVerification(body);

if (next === body) {
  console.log('印は付いていないので、本文は変えない');
} else if (args['dry-run']) {
  console.log('（dry-run）印を外す必要がある。本文は更新していない');
} else {
  updatePullRequestBody(args.repo, args.pr, next);
  console.log('検証の節の印を外した');
}
