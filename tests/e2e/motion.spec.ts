import { expect, test } from '@playwright/test';

// T085: 動きを減らす設定では、トランジションとアニメーションを止める（DESIGN.md の Motion）
const MOVING_STYLE = 'transition: opacity 1s; animation: none 2s';
const MAX_REDUCED_SECONDS = 0.001;

const durationsOf = async (page: import('@playwright/test').Page) =>
  page.evaluate((style) => {
    const probe = document.createElement('div');
    probe.setAttribute('style', style);
    document.body.append(probe);
    const computed = getComputedStyle(probe);
    return [
      Number.parseFloat(computed.transitionDuration),
      Number.parseFloat(computed.animationDuration),
    ];
  }, MOVING_STYLE);

test('T085: prefers-reduced-motion: reduce ではトランジションとアニメーションが止まる', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const seconds of await durationsOf(page)) {
    expect(seconds).toBeLessThan(MAX_REDUCED_SECONDS);
  }
});

test('動きを減らす設定がなければ、指定どおりに動く', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  expect(await durationsOf(page)).toEqual([1, 2]);
});
