import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// T080：決めた検索語で、目当ての記事が上位3件に出る。旗艦記事が決まるまでは fixture の記事で確かめる
const QUERIES = [
  ['Hooks 設定', 'Hooks で保存のたびに整形する'],
  ['PostToolUse', 'Hooks で保存のたびに整形する'],
  ['設定項目', 'settings.json の設定項目'],
  ['プラン', 'Claude のプランの選び方'],
  ['公式の変更', '第46週の公式の変更'],
] as const;
const TOP = 3;

const results = (page: import('@playwright/test').Page) =>
  page.locator('pagefind-results a').filter({ hasNotText: /^$/ });

for (const [query, title] of QUERIES) {
  test(`T080: 「${query}」で「${title}」が上位${TOP}件に出る`, async ({ page }) => {
    await page.goto(`/search/?q=${encodeURIComponent(query)}`);
    await expect(results(page).first()).toBeVisible();
    const titles = await results(page).allInnerTexts();
    expect(titles.slice(0, TOP).some((t) => t.includes(title))).toBe(true);
  });
}

test('T081: 製品で絞り込める', async ({ page }) => {
  await page.goto(`/search/?q=${encodeURIComponent('記事')}`);
  await expect(results(page).first()).toBeVisible();
  await page.locator('pagefind-filter-pane').getByLabel(/Codex/).check();
  await expect(results(page).first()).toContainText('Codex CLI を入れて最初の作業を頼む');
  const titles = await results(page).allInnerTexts();
  expect(titles.every((t) => !t.includes('Hooks'))).toBe(true);
});

test('検索ページに axe の違反がない', async ({ page }) => {
  await page.goto(`/search/?q=${encodeURIComponent('Hooks')}`);
  await expect(results(page).first()).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
