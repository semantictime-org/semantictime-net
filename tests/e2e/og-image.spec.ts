import { expect, test } from '@playwright/test';

test('記事ページは記事ごとの OGP 画像を指し、その PNG が配信される', async ({ page, request }) => {
  await page.goto('/claude-code/hooks-format/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://semantictime.net/og/claude-code/hooks-format.png',
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  const res = await request.get('/og/claude-code/hooks-format.png');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/png');
});

test('記事以外のページはサイト共通の OGP 画像を指す', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://semantictime.net/og/site.png',
  );
  expect((await request.get('/og/site.png')).status()).toBe(200);
});

test('RSS の自動発見リンクがある', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
    'href',
    '/rss.xml',
  );
});
