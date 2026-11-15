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

test('T317: 記事のある会社は order の順に並び、製品はハブへリンクする', async ({ page }) => {
  await page.goto('/');
  // 記事のある会社だけを order の順に。記事のない製品は「準備中」に 1 行でたたむ
  await expect(page.locator('#vendors h3')).toHaveText(['Anthropic', 'OpenAI']);
  await expect(page.locator('#vendors .pending summary')).toContainText('製品は準備中');
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

test('製品のハブの英字見出しは製品 ID から作る（日本語を英字の書体で出さない）', async ({
  page,
}) => {
  await page.goto('/claude-app/');
  await expect(page.locator('p.en').first()).toHaveText('CLAUDE APP');
});

test('ホームは検証日と状態を見せる（公開日ではなく）', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('[data-top] li').first();
  await expect(first).toContainText('出典確認 2026-11-14');
  await expect(page.locator('[data-top] li').nth(1)).toContainText('検証');
  await expect(page.locator('[data-top] li').nth(1).locator('.pill')).toBeVisible();
  await expect(page.getByRole('list', { name: '検証の状況' })).toContainText('見直しが必要');
});

test('ホームの冒頭は、各社の使い方と変化をまとめるサイトだと伝える', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('AI の使い方と変化を、ひとつの場所で。');
  await expect(page).toHaveTitle('AI の使い方と変化を、ひとつの場所で | semantictime.net');
});

test('製品のハブは読者向けの言葉で書き、作る側の決まりを出さない', async ({ page }) => {
  await page.goto('/claude-code/');
  await expect(page.locator('main')).not.toContainText('記事番号は固定');
  await expect(page.getByRole('heading', { name: '読む順に並べた記事' })).toBeVisible();
});

test('ニュースは本文（要点）を先に、変更の一覧を後に置く', async ({ page }) => {
  await page.goto('/news/week-46/');
  const summaryY = (await page.getByRole('heading', { name: '要するに' }).boundingBox())?.y ?? 0;
  const tableY = (await page.locator('[data-change-table]').boundingBox())?.y ?? 0;
  expect(summaryY).toBeLessThan(tableY);
});
