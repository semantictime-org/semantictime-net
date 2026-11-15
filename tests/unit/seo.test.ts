import { describe, expect, test } from 'vitest';
import { buildSeo, parseDeployEnv, type SeoInput } from '../../src/lib/seo';

const SITE_URL = 'https://semantictime.net';
const TOKEN = 'public-beacon-token';

const article: SeoInput = {
  siteUrl: SITE_URL,
  siteName: 'semantictime.net',
  title: 'Hooks で保存のたびに整形する',
  description:
    '保存のたびに prettier を動かす Claude Code の Hooks の設定を、検証日つきでまとめる。',
  path: '/claude-code/hooks',
  analyticsToken: TOKEN,
  article: {
    author: 'shizukukai',
    publishedAt: new Date('2026-11-15T00:00:00Z'),
    modifiedAt: new Date('2026-11-20T00:00:00Z'),
    image: '/og/claude-code/hooks.png',
  },
};

describe('parseDeployEnv', () => {
  test.each(['preview', 'test', 'production'] as const)('%s はそのまま', (env) => {
    expect(parseDeployEnv(env)).toBe(env);
  });

  test('未設定なら test（noindex も計測もしない）', () => {
    expect(parseDeployEnv(undefined)).toBe('test');
  });

  test('知らない値はビルドを止める', () => {
    expect(() => parseDeployEnv('prod')).toThrow('PUBLIC_DEPLOY_ENV');
  });
});

describe('buildSeo', () => {
  test('OGP 画像は絶対 URL。記事は記事ごとの画像、記事以外はサイト共通の画像', () => {
    expect(buildSeo({ ...article, env: 'production' }).og.image).toBe(
      'https://semantictime.net/og/claude-code/hooks.png',
    );
    const { siteUrl, siteName, description, analyticsToken } = article;
    const page = {
      siteUrl,
      siteName,
      description,
      analyticsToken,
      title: 'ニュース',
      path: '/news/',
    };
    expect(buildSeo({ ...page, env: 'production' }).og.image).toBe(
      'https://semantictime.net/og/site.png',
    );
  });

  test('T055: 本番は canonical・OGP・JSON-LD（Article、著者 shizukukai）・計測があり、noindex はない', () => {
    const seo = buildSeo({ ...article, env: 'production' });
    expect(seo.canonical).toBe('https://semantictime.net/claude-code/hooks/');
    expect(seo.robots).toBeUndefined();
    expect(seo.analyticsToken).toBe(TOKEN);
    expect(seo.og).toMatchObject({
      type: 'article',
      url: 'https://semantictime.net/claude-code/hooks/',
      title: article.title,
      siteName: 'semantictime.net',
    });
    expect(seo.jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      author: { '@type': 'Person', name: 'shizukukai' },
      datePublished: '2026-11-15T00:00:00.000Z',
      dateModified: '2026-11-20T00:00:00.000Z',
      image: 'https://semantictime.net/og/claude-code/hooks.png',
    });
  });

  test('T056: プレビューは noindex,nofollow で、計測しない', () => {
    const seo = buildSeo({ ...article, env: 'preview' });
    expect(seo.robots).toBe('noindex,nofollow');
    expect(seo.analyticsToken).toBeUndefined();
  });

  test('test 環境は noindex も計測もしない（E2E と Lighthouse 用）', () => {
    const seo = buildSeo({ ...article, env: 'test' });
    expect(seo.robots).toBeUndefined();
    expect(seo.analyticsToken).toBeUndefined();
  });

  test('本番でもトークンが未設定なら計測しない', () => {
    const seo = buildSeo({ ...article, env: 'production', analyticsToken: undefined });
    expect(seo.analyticsToken).toBeUndefined();
  });

  test('記事以外は WebSite の JSON-LD と og:type website', () => {
    const page: SeoInput = { ...article, path: '/' };
    const seo = buildSeo({
      siteUrl: page.siteUrl,
      siteName: page.siteName,
      title: page.title,
      description: page.description,
      path: page.path,
      analyticsToken: page.analyticsToken,
      env: 'production',
    });
    expect(seo.canonical).toBe('https://semantictime.net/');
    expect(seo.og.type).toBe('website');
    expect(seo.jsonLd).toMatchObject({ '@type': 'WebSite', name: 'semantictime.net' });
  });

  test.each([
    ['/claude-code/hooks', '/claude-code/hooks/'],
    ['/claude-code/hooks/', '/claude-code/hooks/'],
    ['/claude-code/hooks/index.html', '/claude-code/hooks/'],
    ['/claude-code/hooks?ref=x#y', '/claude-code/hooks/'],
    ['/llms.txt', '/llms.txt'],
  ])('canonical のパス %s は %s に正規化する', (path, expected) => {
    expect(buildSeo({ ...article, path, env: 'production' }).canonical).toBe(
      `${SITE_URL}${expected}`,
    );
  });

  test('ページの題とサイト名から <title> を作る（ホームはサイト名だけ）', () => {
    expect(buildSeo({ ...article, env: 'test' }).documentTitle).toBe(
      'Hooks で保存のたびに整形する | semantictime.net',
    );
    expect(
      buildSeo({ ...article, title: 'semantictime.net', path: '/', env: 'test' }).documentTitle,
    ).toBe('semantictime.net');
  });
});
