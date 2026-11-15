import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

// 色は src/styles/tokens.css にだけ書き、ほかでは変数（var(--…)）で参照する（DESIGN.md）
const TOKENS_FILE = join('src', 'styles', 'tokens.css');
const STYLED_FILE = /\.(astro|css)$/;
const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/;

const listFiles = (dir: string): readonly string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });

describe('デザイントークン', () => {
  test('tokens.css 以外の .astro と .css に色の値を直接書かない', () => {
    const offenders = listFiles('src')
      .filter((path) => STYLED_FILE.test(path) && path !== TOKENS_FILE)
      .flatMap((path) =>
        readFileSync(path, 'utf8')
          .split('\n')
          .map((line, i) => ({ path, line: i + 1, text: line.trim() }))
          .filter(({ text }) => COLOR_LITERAL.test(text)),
      )
      .map(({ path, line, text }) => `${path}:${line} ${text}`);
    expect(offenders).toEqual([]);
  });

  test('tokens.css がある', () => {
    expect(readFileSync(TOKENS_FILE, 'utf8')).toContain('--color-key');
  });
});
