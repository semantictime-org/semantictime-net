// git の履歴から更新日を取る。ビルド時と scripts/ から使う。
import { execFileSync } from 'node:child_process';

const git = (args: readonly string[], cwd: string): string =>
  execFileSync('git', [...args], { cwd, encoding: 'utf8' }).trim();

/** ファイルの最後のコミットの日時。まだコミットされていなければ undefined */
export const lastCommitDate = (path: string, cwd = process.cwd()): Date | undefined => {
  const iso = git(['log', '-1', '--format=%cI', '--', path], cwd);
  return iso ? new Date(iso) : undefined;
};

/**
 * 浅い clone（履歴が途中までしかない）なら失敗させる。浅い clone では、すべての記事が
 * 同じ更新日になってしまうため（CI では actions/checkout の fetch-depth: 0 が必要）。
 */
export const assertNotShallow = (cwd = process.cwd()): void => {
  if (git(['rev-parse', '--is-shallow-repository'], cwd) === 'true') {
    throw new Error(
      '浅い clone では更新日を正しく取れない。CI では actions/checkout に fetch-depth: 0 を指定する',
    );
  }
};
