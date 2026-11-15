import { defineConfig, fontProviders } from 'astro/config';

// 本番のサイト設定。コンテンツ・CSP・統合は Task 2.2 以降で足していく。
// 書体は DESIGN.md の4書体。ビルド時に取得して自前で配信する（外部へのリクエストを出さない）。
export default defineConfig({
  site: 'https://semantictime.net',
  output: 'static',
  build: { inlineStylesheets: 'never' },
  fonts: [
    {
      name: 'Anton',
      cssVariable: '--font-anton-face',
      provider: fontProviders.google(),
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Impact', 'sans-serif'],
    },
    {
      name: 'Zen Kaku Gothic New',
      cssVariable: '--font-zen-kaku-face',
      provider: fontProviders.google(),
      weights: [900],
      styles: ['normal'],
      subsets: ['japanese', 'latin'],
      fallbacks: ['sans-serif'],
    },
    {
      name: 'BIZ UDPGothic',
      cssVariable: '--font-biz-ud-face',
      provider: fontProviders.google(),
      weights: [400, 700],
      styles: ['normal'],
      subsets: ['japanese', 'latin'],
      fallbacks: ['sans-serif'],
    },
    {
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono-face',
      provider: fontProviders.google(),
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
});
