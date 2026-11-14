import { readdirSync, readFileSync } from 'node:fs';
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { authorSchema, buildArticleSchema, featureSchema } from './lib/schemas';

const FEATURES_FILE = 'src/data/features.yaml';
const AUTHORS_DIR = 'src/content/authors';

// 存在する ID の一覧を作る。Astro の reference() は参照先がなくてもビルドを失敗させない
// （2026-11-15 に astro 7.4.12 で確認）ため、先に列挙型で検査してスキーマ違反として止める。
const featureIds = z
  .array(z.object({ id: z.string() }))
  .parse(parse(readFileSync(FEATURES_FILE, 'utf8')))
  .map((f) => f.id);
const authorIds = readdirSync(AUTHORS_DIR)
  .filter((name) => name.endsWith('.yaml'))
  .map((name) => name.replace(/\.yaml$/, ''));

const existingId = (ids: readonly string[], label: string) =>
  z.string().superRefine((id, ctx) => {
    if (!ids.includes(id)) {
      ctx.addIssue({ code: 'custom', message: `未登録の${label}: ${id}` });
    }
  });

// 機能レジストリ（機能のステータスと日付の唯一の情報源）
const features = defineCollection({
  loader: file(FEATURES_FILE),
  schema: featureSchema,
});

const authors = defineCollection({
  loader: glob({ pattern: '*.yaml', base: `./${AUTHORS_DIR}` }),
  schema: authorSchema,
});

const articles = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/articles' }),
  schema: buildArticleSchema(
    existingId(featureIds, '機能 ID').pipe(reference('features')),
    existingId(authorIds, '著者').pipe(reference('authors')),
  ),
});

export const collections = { features, authors, articles };
