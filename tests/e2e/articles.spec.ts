import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// 記事・現行仕様・比較のテンプレート（テスト用の記事 tests/fixtures/articles でビルドしたもの）
const TEMPLATES = [
  '/claude-code/hooks-format/',
  '/claude-code/settings-reference/',
  '/claude-app/plans-compare/',
  '/news/week-46/',
  '/news/',
  '/claude-code/',
  '/',
] as const;
const WIDTHS = [320, 768, 1024, 1440] as const;

for (const path of TEMPLATES) {
  for (const width of WIDTHS) {
    test(`${path} は幅 ${width}px で横にはみ出さず、axe の違反がない`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
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

test('T072: 375px で、検証票の日付がスクロールしなくても見える', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/claude-code/hooks-format/');
  await expect(page.getByLabel('この記事の検証記録').getByText('2026.11.01')).toBeInViewport();
});

test('T077: beta の機能を扱う記事に状態のバナーが出る', async ({ page }) => {
  await page.goto('/claude-code/settings-reference/');
  await expect(page.getByLabel('機能の状態')).toContainText('ベータ版の機能：Code Mode');
});

test('T079: 開示欄に執筆支援と検証・編集者が出る', async ({ page }) => {
  await page.goto('/claude-code/hooks-format/');
  const box = page.getByLabel('執筆と検証');
  await expect(box).toContainText('執筆支援：AI');
  await expect(box).toContainText('検証・編集：shizukukai／検証日 2026-11-01');
});

test('T051: test 環境のビルドに下書きのページはない', async ({ page }) => {
  const response = await page.goto('/claude-code/draft-sample/');
  expect(response?.status()).toBe(404);
});

test('現行仕様の一覧で、いまのページに印が付く', async ({ page }) => {
  await page.goto('/claude-code/settings-reference/');
  await expect(page.locator('a[aria-current="page"]', { hasText: 'settings.json' })).toBeVisible();
});
