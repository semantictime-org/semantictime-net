// 記事の文章の検査（textlint）。Windows の npm は cmd でスクリプトを動かすので、find や sh を使わず Node で探す。
// 使い方: node scripts/lint-text.ts。違反があれば内容を出力して exit 1。
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createLinter, loadLinterFormatter, loadTextlintrc } from 'textlint';

const ARTICLES_DIR = 'src/content/articles';
const ARTICLE_FILE = /\.mdx?$/;

const files = readdirSync(ARTICLES_DIR, { recursive: true, encoding: 'utf8' })
  .filter((path) => ARTICLE_FILE.test(path))
  .map((path) => join(ARTICLES_DIR, path));

if (files.length === 0) {
  console.log('文章の検査: 対象の記事なし');
} else {
  const linter = createLinter({ descriptor: await loadTextlintrc() });
  const results = await linter.lintFiles(files);
  const formatter = await loadLinterFormatter({ formatterName: 'stylish' });
  const output = formatter.format(results);
  if (output) console.log(output);
  if (results.some((r) => r.messages.length > 0)) process.exitCode = 1;
}
