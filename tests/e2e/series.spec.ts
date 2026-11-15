import { expect, test } from '@playwright/test';

test('記事の冒頭に連載と回を出し、連載のページへリンクする', async ({ page }) => {
  await page.goto('/claude-code/hooks-format/');
  const link = page.getByRole('link', { name: '連載「はじめての Claude Code」第 2 回' });
  await expect(link).toHaveAttribute('href', '/series/claude-code-first-steps/');
});

test('連載のページは回の順に並べる', async ({ page }) => {
  await page.goto('/series/claude-code-first-steps/');
  await expect(page.locator('h1')).toHaveText('はじめての Claude Code');
  await expect(page.locator('[data-series-list] li .title')).toHaveText([
    'settings.json の設定項目',
    'Hooks で保存のたびに整形する',
  ]);
  await expect(page.locator('[data-series-list] li .no').first()).toHaveText('第 1 回');
});

test('公開済みの記事がない連載のページは作らない', async ({ page }) => {
  const res = await page.goto('/series/ai-glossary/');
  expect(res?.status()).toBe(404);
});
