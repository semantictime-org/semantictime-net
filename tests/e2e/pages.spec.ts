import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// テスト方針の画面幅（スマートフォンから大きな画面まで）
const WIDTHS = [320, 768, 1024, 1440] as const;
const PAGES = ['/'] as const;

for (const path of PAGES) {
  for (const width of WIDTHS) {
    test(`${path} は幅 ${width}px で横にはみ出さず、アクセシビリティの違反がない`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      // 書体の読み込み中は文字の幅が定まらず、狭い幅で一時的にはみ出すことがあるので待つ
      await page.evaluate(() => document.fonts.ready);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);

      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
}

test('書体は外部の /fonts.css から読み込み、見出しと本文に DESIGN.md の書体を使う', async ({
  page,
}) => {
  await page.goto('/');
  const families = await page.evaluate(() => ({
    heading: getComputedStyle(document.querySelector('h1') ?? document.body).fontFamily,
    body: getComputedStyle(document.body).fontFamily,
    inlineFontFaces: [...document.querySelectorAll('style')].filter((s) =>
      s.textContent.includes('@font-face'),
    ).length,
  }));
  expect(families.heading).toContain('Zen Kaku Gothic New');
  expect(families.body).toContain('BIZ UDPGothic');
  expect(families.inlineFontFaces).toBe(0);
});

test('共通のレイアウト：ヘッダー・本文・フッターがあり、本文へ移動できる', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'メイン' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '本文へ移動' })).toBeFocused();
});

test('test 環境のビルドは canonical と JSON-LD を持ち、noindex も計測も出さない', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://semantictime.net/',
  );
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('script[data-cf-beacon]')).toHaveCount(0);
});
