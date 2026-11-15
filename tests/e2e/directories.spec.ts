import { expect, test } from '@playwright/test';

test('ナビの「製品」「連載」は専用の一覧ページへ移る', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'メイン' });
  await expect(nav.getByRole('link', { name: '製品' })).toHaveAttribute('href', '/products/');
  await expect(nav.getByRole('link', { name: '連載' })).toHaveAttribute('href', '/series/');
});

test('製品の一覧は全製品を会社ごとに並べ、記事のある製品だけハブへリンクする', async ({ page }) => {
  await page.goto('/products/');
  await expect(page.locator('h1')).toHaveText('製品から探す');
  await expect(page.locator('[data-vendor] h2')).toHaveText([
    '共通',
    'Anthropic',
    'OpenAI',
    'Google',
    'Midjourney',
    'Black Forest Labs',
  ]);
  const cc = page.getByRole('link', { name: /Claude Code/ });
  await expect(cc).toHaveAttribute('href', '/claude-code/');
  await expect(cc).toContainText('2 本');
  await expect(page.getByRole('link', { name: /Gemini$/ })).toHaveCount(0);
  await expect(page.locator('[data-vendor="google"]')).toContainText('準備中');
});

test('連載の一覧は説明と回数を出し、公開済みの回がある連載だけリンクする', async ({ page }) => {
  await page.goto('/series/');
  await expect(page.locator('h1')).toHaveText('連載');
  await expect(page.getByRole('link', { name: /はじめての Claude Code/ })).toHaveAttribute(
    'href',
    '/series/claude-code-first-steps/',
  );
  await expect(page.locator('[data-series="ai-glossary"]')).toContainText('準備中');
});

test('ホームの右の列から、一覧のページへ移れる', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.locator('#vendors').getByRole('link', { name: 'すべての製品 →' }),
  ).toHaveAttribute('href', '/products/');
  await expect(
    page.locator('#series').getByRole('link', { name: 'すべての連載 →' }),
  ).toHaveAttribute('href', '/series/');
});
