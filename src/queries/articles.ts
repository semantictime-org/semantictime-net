// 記事のコレクションを読む（astro:content に依存するので src/lib の純粋関数と分けて置く）。
import { getCollection, type CollectionEntry } from 'astro:content';
import { parseDeployEnv } from '../lib/seo';

/** 公開する記事。下書きは PUBLIC_DEPLOY_ENV=preview のときだけ含める（T051・T052） */
export const publishedArticles = async (): Promise<CollectionEntry<'articles'>[]> => {
  const env = parseDeployEnv(import.meta.env.PUBLIC_DEPLOY_ENV);
  return getCollection('articles', ({ data }) => env === 'preview' || !data.draft);
};
