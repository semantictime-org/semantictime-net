import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

// 画面の確認（E2E）。本番と同じ静的ビルドを astro preview で配信して確かめる。
export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: Boolean(process.env['CI']),
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // CONTENT_FIXTURES=1: テスト用の記事（tests/fixtures/articles）でビルドする
    // --ignore-lock: Astro は AI エージェントの中だと preview を自動で常駐させるので、それを止めて前面で動かす
    command: `CONTENT_FIXTURES=1 npm run build && npx astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
  },
});
