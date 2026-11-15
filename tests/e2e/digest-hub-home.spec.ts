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

test('ホームは新しい順：トップに 3 本、残りは公開日ごとに並ぶ', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-top] .title')).toHaveText([
    '第46週の公式の変更',
    'Claude のプランの選び方',
    'Codex CLI を入れて最初の作業を頼む',
  ]);
  await expect(page.locator('[data-river] h3')).toHaveText(['10月2日(金)', '9月1日(火)']);
  await expect(page.locator('[data-river] li').first()).toContainText('CC07');
  await expect(page.locator('[data-river] li').first()).toContainText(
    'Hooks で保存のたびに整形する',
  );
});

test('T317: 会社は order の順に並び、記事のある製品だけハブへリンクする', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#vendors h3')).toHaveText([
    'Anthropic',
    'OpenAI',
    'Google',
    'Midjourney',
    'Black Forest Labs',
  ]);
  const vendors = page.locator('#vendors');
  await expect(vendors.getByRole('link', { name: /Claude Code/ })).toHaveAttribute(
    'href',
    '/claude-code/',
  );
  await expect(vendors.getByRole('link', { name: /Gemini/ })).toHaveCount(0);
});

test('連載の欄から連載のページへ行ける', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.locator('#series').getByRole('link', { name: /はじめての Claude Code/ }),
  ).toHaveAttribute('href', '/series/claude-code-first-steps/');
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
