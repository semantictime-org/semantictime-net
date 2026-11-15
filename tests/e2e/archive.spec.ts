import { expect, test } from '@playwright/test';

test('バックナンバーは月ごとに、新しい月から本数つきで並ぶ', async ({ page }) => {
  await page.goto('/archive/');
  await expect(page.locator('[data-months] a')).toHaveText([
    /2026年11月.*3 本/,
    /2026年10月.*1 本/,
    /2026年9月.*1 本/,
  ]);
  await expect(page.getByRole('link', { name: /2026年10月/ })).toHaveAttribute(
    'href',
    '/archive/2026/10/',
  );
});

test('月のページはその月の記事を新しい順に並べる', async ({ page }) => {
  await page.goto('/archive/2026/11/');
  await expect(page.locator('h1')).toHaveText('2026年11月の記事');
  await expect(page.locator('[data-month-list] .title')).toHaveText([
    '第46週の公式の変更',
    'Claude のプランの選び方',
    'Codex CLI を入れて最初の作業を頼む',
  ]);
});

test('ホームからバックナンバーへ行ける', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'バックナンバー →' })).toHaveAttribute(
    'href',
    '/archive/',
  );
});
