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

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);

      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
}
