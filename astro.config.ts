import { defineConfig } from 'astro/config';

// 本番のサイト設定。コンテンツ・CSP・統合は Task 2.2 以降で足していく。
export default defineConfig({
  site: 'https://semantictime.net',
  output: 'static',
  build: { inlineStylesheets: 'never' },
});
