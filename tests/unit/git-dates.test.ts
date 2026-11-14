import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { assertNotShallow, lastCommitDate } from '../../src/lib/git-dates';

const git = (cwd: string, args: readonly string[], env: Record<string, string> = {}): string =>
  execFileSync('git', [...args], { cwd, encoding: 'utf8', env: { ...process.env, ...env } });

const commitAt = (cwd: string, iso: string, message: string): void => {
  git(cwd, ['add', '-A']);
  git(cwd, ['commit', '-q', '-m', message], {
    GIT_AUTHOR_DATE: iso,
    GIT_COMMITTER_DATE: iso,
  });
};

let repo = '';
let shallow = '';

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'git-dates-'));
  git(repo, ['init', '-q', '-b', 'main']);
  git(repo, ['config', 'user.name', 't']);
  git(repo, ['config', 'user.email', 't@example.com']);
  writeFileSync(join(repo, 'a.md'), '1');
  commitAt(repo, '2026-11-01T10:00:00+09:00', 'first');
  writeFileSync(join(repo, 'a.md'), '2');
  writeFileSync(join(repo, 'b.md'), '1');
  commitAt(repo, '2026-11-10T10:00:00+09:00', 'second');

  shallow = mkdtempSync(join(tmpdir(), 'git-dates-shallow-'));
  git(shallow, ['clone', '-q', '--depth', '1', `file://${repo}`, '.']);
});

afterAll(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(shallow, { recursive: true, force: true });
});

describe('lastCommitDate', () => {
  test('T035: 最後のコミットの日時を返す', () => {
    expect(lastCommitDate('a.md', repo)?.toISOString()).toBe('2026-11-10T01:00:00.000Z');
  });

  test('T037: まだコミットしていないファイルは undefined', () => {
    writeFileSync(join(repo, 'new.md'), 'x');
    expect(lastCommitDate('new.md', repo)).toBeUndefined();
  });
});

describe('assertNotShallow', () => {
  test('通常の clone では何もしない', () => {
    expect(() => assertNotShallow(repo)).not.toThrow();
  });

  test('T036: 浅い clone では失敗させる', () => {
    expect(() => assertNotShallow(shallow)).toThrow(/fetch-depth/);
  });
});
