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

test('記事の最後に、連載の前後の回へのリンクを出す', async ({ page }) => {
  await page.goto('/claude-code/hooks-format/');
  const nav = page.getByRole('navigation', { name: '次に読む' });
  await expect(
    nav.getByRole('link', { name: /前の回.*settings\.json の設定項目/ }),
  ).toHaveAttribute('href', '/claude-code/settings-reference/');
  await expect(nav.getByRole('link', { name: /次の回/ })).toHaveCount(0);

  await page.goto('/claude-code/settings-reference/');
  await expect(
    page.getByRole('navigation', { name: '次に読む' }).getByRole('link', { name: /次の回.*Hooks/ }),
  ).toHaveAttribute('href', '/claude-code/hooks-format/');
});

test('案内する記事がなければ、案内の欄を出さない', async ({ page }) => {
  await page.goto('/codex/setup/');
  await expect(page.getByRole('navigation', { name: '次に読む' })).toHaveCount(0);
});
