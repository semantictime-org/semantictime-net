import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// 本番のサイト設定。コンテンツ・CSP・統合は Task 2.2 以降で足していく。
// 書体は DESIGN.md の4書体。ビルド時に取得して自前で配信する（外部へのリクエストを出さない）。
export default defineConfig({
  site: 'https://semantictime.net',
  output: 'static',
  build: { inlineStylesheets: 'never' },
  // 404 は sitemap に入れない（T064）。下書きは本番では作らないので入らない（T051）
  integrations: [mdx(), sitemap({ filter: (page) => !page.endsWith('/404/') })],
  // CSP は <meta> で出す（設計書 6.2）。frame-ancestors は <meta> で使えないので _headers の X-Frame-Options で代える
  security: {
    csp: {
      scriptDirective: {
        // Pagefind は WebAssembly を使う。計測は Cloudflare Web Analytics のビーコン
        resources: ["'self'", "'wasm-unsafe-eval'", 'https://static.cloudflareinsights.com'],
      },
      directives: [
        "default-src 'self'",
        "connect-src 'self' https://cloudflareinsights.com",
        "img-src 'self' data:",
        "font-src 'self'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
  // コードの色付けは Prism（クラスで色を付ける。Shiki のインラインスタイルは CSP に合わないため。設計書 1.2）
  markdown: { syntaxHighlight: 'prism' },
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
