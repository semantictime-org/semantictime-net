// GitHub の PR 本文と最終編集者を扱う共通部品（gh CLI を使う。認証は GH_TOKEN）。
import { z } from 'astro/zod';
import { run } from './git-content.ts';

const QUERY = `query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) { body editor { login } }
  }
}`;

const responseSchema = z.object({
  data: z.object({
    repository: z.object({
      pullRequest: z.object({
        body: z.string(),
        editor: z.object({ login: z.string() }).nullable(),
      }),
    }),
  }),
});

export interface PullRequestBody {
  readonly body: string;
  /** 本文を最後に編集したユーザー。一度も編集されていなければ null */
  readonly editorLogin: string | null;
}

const splitRepo = (repo: string): { readonly owner: string; readonly name: string } => {
  const [owner, name] = repo.split('/');
  if (!owner || !name) throw new Error(`リポジトリは owner/name の形式で指定する: ${repo}`);
  return { owner, name };
};

export const fetchPullRequestBody = (repo: string, number: number): PullRequestBody => {
  const { owner, name } = splitRepo(repo);
  const raw = run('gh', [
    'api',
    'graphql',
    '-f',
    `query=${QUERY}`,
    '-F',
    `owner=${owner}`,
    '-F',
    `name=${name}`,
    '-F',
    `number=${number}`,
  ]);
  const pr = responseSchema.parse(JSON.parse(raw)).data.repository.pullRequest;
  return { body: pr.body, editorLogin: pr.editor?.login ?? null };
};

export const updatePullRequestBody = (repo: string, number: number, body: string): void => {
  run('gh', ['api', '-X', 'PATCH', `repos/${repo}/pulls/${number}`, '-f', `body=${body}`]);
};
