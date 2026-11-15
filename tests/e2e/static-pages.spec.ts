import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = [
  '/about/editorial-policy/',
  '/about/authors/',
  '/about/report/',
  '/about/privacy/',
  '/about/disclaimer/',
] as const;
const WIDTHS = [320, 1440] as const;

for (const path of PAGES) {
  for (const width of WIDTHS) {
    test(`T062: ${path} があり、幅 ${width}px で崩れず axe の違反がない`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
}

test('T062: 免責のページに「非公式」と商標の表記がある', async ({ page }) => {
  await page.goto('/about/disclaimer/');
  await expect(page.locator('main')).toContainText('非公式');
  await expect(page.locator('main')).toContainText('商標または登録商標');
  await expect(page.locator('main')).toContainText('Claude Code');
});

test('T062: 報告のページに Issue へのリンクとメールアドレスがある', async ({ page }) => {
  await page.goto('/about/report/');
  await expect(page.getByRole('link', { name: 'GitHub の Issue' })).toHaveAttribute(
    'href',
    'https://github.com/semantictime-org/semantictime-net/issues/new',
  );
  await expect(page.locator('main')).toContainText('semantictime@gmail.com');
});

test('T062: フッターから固定ページにたどれる', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await footer.getByRole('link', { name: 'プライバシーポリシー' }).click();
  await expect(page).toHaveURL(/\/about\/privacy\/$/);
});

test('T082: 存在しない URL では 404 のページを、ステータス 404 で返す', async ({ page }) => {
  const response = await page.goto('/no-such-page/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('お探しのページは見つかりませんでした');
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test('404 の検索フォームは /search/?q= に送る', async ({ page }) => {
  await page.goto('/no-such-page/');
  await page.getByLabel('サイト内を検索').fill('Hooks');
  await page.getByRole('button', { name: '検索' }).click();
  await expect(page).toHaveURL(/\/search\/\?q=Hooks$/);
});
