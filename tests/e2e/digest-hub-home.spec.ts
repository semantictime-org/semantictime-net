import { expect, test } from '@playwright/test';

test.describe('T078: 変更表の絞り込み', () => {
  test('製品と破壊的な変更で絞り込める', async ({ page }) => {
    await page.goto('/news/week-46/');
    const rows = page.locator('[data-change-table] tbody tr:visible');
    await expect(rows).toHaveCount(3);
    await page.getByLabel('Codex').check();
    await expect(rows).toHaveCount(1);
    await page.getByLabel('Codex').uncheck();
    await page.getByLabel('破壊的な変更だけ').check();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('旧セッション API が削除された');
    await expect(page.locator('[data-change-count]')).toHaveText('3 件中 1 件を表示');
  });
});

test.describe('JS が無効のとき', () => {
  test.use({ javaScriptEnabled: false });

  test('T078: 絞り込みの欄は出さず、全件が見える', async ({ page }) => {
    await page.goto('/news/week-46/');
    await expect(page.locator('[data-change-table] tbody tr:visible')).toHaveCount(3);
    await expect(page.locator('[data-change-filter]')).toBeHidden();
  });
});

test('T317: ホームの会社は order の順で、記事 0 本の会社には一文を出す', async ({ page }) => {
  await page.goto('/');
  const vendors = page.locator('#vendors .vendor h3');
  await expect(vendors).toHaveText([
    'Anthropic',
    'OpenAI',
    'Google',
    'Midjourney',
    'Black Forest Labs',
  ]);
  await expect(page.getByRole('region', { name: 'Google' })).toContainText(
    '記事は準備中です。',
  );
  await expect(page.getByRole('region', { name: 'Anthropic' })).toContainText('すべて見る（2 本）');
});

test('製品のハブは記事を並べ、記事番号でリンクする', async ({ page }) => {
  await page.goto('/claude-code/');
  await expect(page.locator('h1')).toHaveText('Claude Code の使い方');
  await expect(page.getByRole('link', { name: /CC07/ })).toHaveAttribute(
    'href',
    '/claude-code/hooks-format/',
  );
});

test('ニュースの一覧は新しい順で、破壊的な変更を示す', async ({ page }) => {
  await page.goto('/news/');
  await expect(page.getByRole('link', { name: /第46週の公式の変更/ })).toContainText(
    '破壊的な変更を含む',
  );
});
