// products.yaml を読む（scripts/ から使う）。
import { readFileSync } from 'node:fs';
import { z } from 'astro/zod';
import { parse } from 'yaml';
import { productSchema } from '../../src/lib/schemas.ts';

export const PRODUCTS_FILE = 'src/data/products.yaml';

export type Product = z.infer<typeof productSchema>;

export const readProducts = (): readonly Product[] =>
  z.array(productSchema).parse(parse(readFileSync(PRODUCTS_FILE, 'utf8')));
