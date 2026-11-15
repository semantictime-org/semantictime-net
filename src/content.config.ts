import { readdirSync, readFileSync } from 'node:fs';
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { findDuplicateCodes } from './lib/catalog';
import {
  authorSchema,
  buildArticleSchema,
  buildProductSchema,
  existingId,
  featureSchema,
  vendorSchema,
} from './lib/schemas';

const FEATURES_FILE = 'src/data/features.yaml';
const VENDORS_FILE = 'src/data/vendors.yaml';
const PRODUCTS_FILE = 'src/data/products.yaml';
const AUTHORS_DIR = 'src/content/authors';
// CONTENT_FIXTURES=1 のときは、テスト用の記事（tests/fixtures/articles）を読む。本番のビルドには入らない
const ARTICLES_DIR =
  process.env['CONTENT_FIXTURES'] === '1' ? './tests/fixtures/articles' : './src/content/articles';

const readIds = (path: string): readonly string[] =>
  z
    .array(z.object({ id: z.string() }))
    .parse(parse(readFileSync(path, 'utf8')))
    .map((entry) => entry.id);

// 存在する ID の一覧（参照先がない記事・製品・機能を、スキーマ違反としてビルドで止めるため）
const featureIds = readIds(FEATURES_FILE);
const vendorIds = readIds(VENDORS_FILE);
const productIds = readIds(PRODUCTS_FILE);
const authorIds = readdirSync(AUTHORS_DIR)
  .filter((name) => name.endsWith('.yaml'))
  .map((name) => name.replace(/\.yaml$/, ''));

// 記号の重複（CC が 2 つの製品にある、など）は記事番号が衝突するので、ビルドを止める（T302）
const codeConflicts = findDuplicateCodes(
  z
    .array(z.object({ id: z.string(), code: z.string() }))
    .parse(parse(readFileSync(PRODUCTS_FILE, 'utf8'))),
);
if (codeConflicts.length > 0) {
  throw new Error(`${PRODUCTS_FILE}: ${codeConflicts.join(' / ')}`);
}

const productRef = existingId(productIds, '製品 ID').pipe(reference('products'));

// 機能レジストリ（機能のステータスと日付の唯一の情報源）
const features = defineCollection({
  loader: file(FEATURES_FILE),
  schema: featureSchema.extend({ product: existingId(productIds, '製品 ID') }),
});

const vendors = defineCollection({
  loader: file(VENDORS_FILE),
  schema: vendorSchema,
});

const products = defineCollection({
  loader: file(PRODUCTS_FILE),
  schema: buildProductSchema(existingId(vendorIds, '会社 ID').pipe(reference('vendors'))),
});

const authors = defineCollection({
  loader: glob({ pattern: '*.yaml', base: `./${AUTHORS_DIR}` }),
  schema: authorSchema,
});

const articles = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: ARTICLES_DIR }),
  schema: buildArticleSchema(
    existingId(featureIds, '機能 ID').pipe(reference('features')),
    existingId(authorIds, '著者').pipe(reference('authors')),
    productRef,
  ),
});

export const collections = { features, vendors, products, authors, articles };
