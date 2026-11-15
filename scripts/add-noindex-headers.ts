// プレビューのビルド（dist/_headers）に X-Robots-Tag: noindex を足す（T058）。
// 使い方: node scripts/add-noindex-headers.ts [dist/_headers]
import { readFileSync, writeFileSync } from 'node:fs';
import { addNoindexHeader } from '../src/lib/headers.ts';

const path = process.argv[2] ?? 'dist/_headers';
writeFileSync(path, addNoindexHeader(readFileSync(path, 'utf8')));
console.log(`${path} に X-Robots-Tag: noindex を足した`);
