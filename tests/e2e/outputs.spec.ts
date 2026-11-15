import { expect, test, type Page } from '@playwright/test';

const TEMPLATES = [
  '/',
  '/claude-code/hooks-format/',
  '/claude-code/settings-reference/',
  '/claude-app/plans-compare/',
  '/news/week-46/',
  '/news/',
  '/claude-code/',
  '/about/editorial-policy/',
  '/no-such-page/',
] as const;

/** CSP の違反を集める（ページの securitypolicyviolation イベントとコンソール） */
const collectCspViolations = async (page: Page): Promise<string[]> => {
  const violations: string[] = [];
  page.on('console', (msg) => {
    if (/Content Security Policy/i.test(msg.text())) violations.push(msg.text());
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`Content Security Policy violation: ${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  return violations;
};

for (const path of TEMPLATES) {
  test(`T084: ${path} で CSP の違反が出ない`, async ({ page }) => {
    const violations = await collectCspViolations(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(violations).toEqual([]);
  });
}

test('T084: 検索（Pagefind の WebAssembly と Worker）で CSP の違反が出ない', async ({ page }) => {
  const violations = await collectCspViolations(page);
  await page.goto(`/search/?q=${encodeURIComponent('Hooks')}`);
  await expect(page.locator('pagefind-results a').first()).toBeVisible();
  await page
    .locator('pagefind-filter-pane')
    .getByLabel(/Claude Code/)
    .check();
  await page.waitForLoadState('networkidle');
  expect(violations).toEqual([]);
});

test('T053: .md 版は import の行がなく、Callout が blockquote になる', async ({ request }) => {
  const res = await request.get('/claude-code/hooks-format.md');
  expect(res.status()).toBe(200);
  const md = await res.text();
  expect(md).not.toContain('import ');
  expect(md).not.toContain('<Callout');
  expect(md).toContain('> **長い識別子の折り返し**');
  expect(md.startsWith('# Hooks で保存のたびに整形する')).toBe(true);
});

test('T054・T051: llms.txt は公開記事の .md を並べ、下書きを含まない', async ({ request }) => {
  const txt = await (await request.get('/llms.txt')).text();
  expect(txt).toContain('(https://semantictime.net/claude-code/hooks-format.md)');
  expect(txt).toContain('(https://semantictime.net/news/week-46.md)');
  expect(txt).not.toContain('draft-sample');
});

test('T064・T051: RSS は XML として正しく、下書きを含まない', async ({ page, request }) => {
  const xml = await (await request.get('/rss.xml')).text();
  await page.goto('/');
  const result = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    return {
      error: doc.querySelector('parsererror') !== null,
      items: [...doc.querySelectorAll('item > link')].map((l) => l.textContent),
    };
  }, xml);
  expect(result.error).toBe(false);
  expect(result.items).toContain('https://semantictime.net/claude-code/hooks-format/');
  expect(result.items.some((l) => l?.includes('draft-sample'))).toBe(false);
});

test('T064・T051: sitemap に 404 と下書きが含まれない', async ({ request }) => {
  const index = await (await request.get('/sitemap-index.xml')).text();
  expect(index).toContain('sitemap-0.xml');
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('https://semantictime.net/claude-code/hooks-format/');
  expect(sitemap).not.toContain('404');
  expect(sitemap).not.toContain('draft-sample');
});

test('T051: 下書きは .md 版も作らない', async ({ request }) => {
  expect((await request.get('/claude-code/draft-sample.md')).status()).toBe(404);
});

test('T060: robots.txt は AI のボットを許可し、sitemap を示す', async ({ request }) => {
  const txt = await (await request.get('/robots.txt')).text();
  expect(txt).toContain('User-agent: ClaudeBot\nAllow: /');
  expect(txt).toContain('Sitemap: https://semantictime.net/sitemap-index.xml');
});

test('T057: _headers（本番）にセキュリティのヘッダがあり、noindex はない', async ({ request }) => {
  const headers = (await (await request.get('/_headers')).text())
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');
  for (const name of [
    'Strict-Transport-Security',
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy',
    'Permissions-Policy',
    'X-Frame-Options: DENY',
  ]) {
    expect(headers).toContain(name);
  }
  expect(headers).not.toContain('X-Robots-Tag');
});

test('T063: _redirects の行き先はすべて実在する', async ({ request }) => {
  const text = await (await request.get('/_redirects')).text();
  const { parseRedirects } = await import('../../src/lib/redirects');
  for (const r of parseRedirects(text)) {
    expect((await request.get(r.to)).status(), r.to).toBe(200);
  }
});
