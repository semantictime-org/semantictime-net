import { expect, test } from '@playwright/test';

const ITEMS = ['製品', '連載', 'ニュース', 'バックナンバー', '記事検索'];

test('ヘッダーのナビは、製品・連載・ニュース・バックナンバー・記事検索', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'メイン' });
  for (const label of ITEMS) {
    await expect(nav.getByRole('link', { name: label })).toBeVisible();
  }
  await expect(nav.getByRole('link', { name: 'バックナンバー' })).toHaveAttribute(
    'href',
    '/archive/',
  );
});

test('スマホ幅でもナビの項目を隠さない', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'メイン' });
  for (const label of ITEMS) {
    await expect(nav.getByRole('link', { name: label })).toBeVisible();
  }
  // ページ全体は横にはみ出さない（ナビの帯の中だけで横に送る）
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
