// 公開するファイル（dist/ と追跡しているファイル）に、実名と雇用先のアカウント名が含まれていないかを調べる（T061）。
// 使い方: REAL_NAME_PATTERNS="（1行1パターン）" node scripts/check-real-name.ts [dist]
// 見つかったらファイルの名前だけを出して exit 1。パターンはログに出さない。
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findForbidden, parsePatterns } from '../src/lib/real-name.ts';
import { git } from './lib/git-content.ts';

const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf|zip|pf_[a-z]+)$/i;
const distDir = process.argv[2] ?? 'dist';

const listFiles = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });

const paths = [...listFiles(distDir), ...git(['ls-files']).split('\n').filter(Boolean)].filter(
  (path) => !BINARY.test(path),
);
const files = paths.map((path) => ({ path, text: readFileSync(path, 'utf8') }));
const found = findForbidden(files, parsePatterns(process.env['REAL_NAME_PATTERNS'] ?? ''));

if (found.length > 0) {
  console.error(`禁止パターンを含むファイルが ${found.length} 件あります:`);
  for (const path of found) console.error(`  ${path}`);
  process.exit(1);
}
console.log(`実名の検査: ${files.length} ファイルを確認、該当なし`);
