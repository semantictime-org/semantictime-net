import { describe, expect, test } from 'vitest';
import { z } from 'astro/zod';
import {
  buildArticleSchema,
  featureSchema,
  authorSchema,
  checkArticlePath,
  existingId,
  productSchema,
  vendorSchema,
} from '../../src/lib/schemas';
import { CONTENT_TYPES, LAYOUT_BY_TYPE } from '../../src/lib/taxonomy';

// 単体テストでは reference() の代わりに文字列を受け付ける（参照先の存在はビルドで検証する）
const articleSchema = buildArticleSchema(z.string(), z.string(), z.string());

const validArticle = {
  title: 'Remote Control の現行仕様',
  description:
    'Claude Code の Remote Control で、手元の PC のセッションを iPhone やブラウザから操作する方法と、使えない条件を検証日つきでまとめる。',
  type: 'reference',
  products: ['claude-code'],
  stationNo: 12,
  verification: 'hands-on',
  roles: ['developer'],
  level: 'intermediate',
  features: ['remote-control'],
  publishedAt: '2026-11-15',
  verifiedAt: '2026-11-15',
  verifiedWith: { claudeCode: '2.1.325', model: 'claude-opus-5-5' },
  sources: ['https://code.claude.com/docs/en/remote-control'],
  owner: 'shizukukai',
  aiAssisted: 'draft-and-edit',
};

const parse = (patch: Record<string, string | number | boolean | object | null | undefined>) =>
  articleSchema.safeParse({ ...validArticle, ...patch });

describe('article schema', () => {
  test('T021: 正しい記事は通る', () => {
    const result = articleSchema.safeParse(validArticle);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('current');
      expect(result.data.draft).toBe(false);
    }
  });

  test('ニュース以外で products が空なら失敗する', () => {
    expect(parse({ products: [] }).success).toBe(false);
  });

  test.each([
    [null, false],
    [0, false],
    [1, true],
    [99, true],
    [100, false],
    [7.5, false],
  ])('ニュース以外の stationNo が %s なら通るのは %s', (stationNo, ok) => {
    expect(parse({ stationNo }).success).toBe(ok);
  });

  test('verification が列挙型にないと失敗する', () => {
    expect(parse({ verification: 'unverified' }).success).toBe(false);
  });

  test('T123・T305: hands-on で verifiedWith がないと失敗する', () => {
    const withoutVerifiedWith = Object.fromEntries(
      Object.entries(validArticle).filter(([key]) => key !== 'verifiedWith'),
    );
    expect(articleSchema.safeParse(withoutVerifiedWith).success).toBe(false);
  });

  test('T124: 検証環境が空なら失敗する', () => {
    expect(parse({ verifiedWith: {} }).success).toBe(false);
  });

  test('T125: 検証日が公開日より前なら失敗する', () => {
    expect(parse({ verifiedAt: '2026-11-01' }).success).toBe(false);
  });

  const newsChanges = [
    {
      date: '2026-11-13',
      product: 'claude-code',
      breaking: false,
      category: 'feature',
      title: 'Remote Control の改善',
      url: 'https://code.claude.com/docs/en/changelog#2-1-325',
    },
  ];
  const news = { type: 'news', verification: 'sources', products: [], stationNo: undefined };

  test('T126: news なのに changes がないと失敗する', () => {
    expect(parse(news).success).toBe(false);
  });

  test('T126b: 出典で確かめた news は、製品も番号も検証環境もなくても通る', () => {
    expect(parse({ ...news, changes: newsChanges, verifiedWith: undefined }).success).toBe(true);
  });

  test('T304: news を hands-on にすると失敗する', () => {
    expect(parse({ ...news, changes: newsChanges, verification: 'hands-on' }).success).toBe(false);
  });

  test('T127: news 以外に changes があると失敗する', () => {
    const changes = [
      {
        date: '2026-11-13',
        product: 'claude-code',
        breaking: false,
        category: 'feature',
        title: 'x',
        url: 'https://example.com/',
      },
    ];
    expect(parse({ changes }).success).toBe(false);
  });

  test.each([
    [49, false],
    [50, true],
    [160, true],
    [161, false],
  ])('T231: description が %i 字なら通るのは %s', (length, ok) => {
    expect(parse({ description: 'あ'.repeat(length) }).success).toBe(ok);
  });

  test.each([
    ['2.1.325', true],
    ['v2.1.325', false],
    ['2.1', false],
  ])('T232: claudeCode のバージョン %s が通るのは %s', (version, ok) => {
    expect(parse({ verifiedWith: { claudeCode: version } }).success).toBe(ok);
  });

  test('sources は URL でなければ失敗する', () => {
    expect(parse({ sources: ['not-a-url'] }).success).toBe(false);
  });
});

describe('feature schema', () => {
  const validFeature = {
    id: 'remote-control',
    name: 'Remote Control',
    product: 'claude-code',
    status: 'ga',
    docs: 'https://code.claude.com/docs/en/remote-control',
  };

  test('正しい機能は通り、aliases の既定値は空配列', () => {
    const result = featureSchema.safeParse(validFeature);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.aliases).toEqual([]);
  });

  test('T131: status が列挙型にないと失敗する', () => {
    expect(featureSchema.safeParse({ ...validFeature, status: 'preview' }).success).toBe(false);
  });

  test('id に大文字や空白があると失敗する', () => {
    expect(featureSchema.safeParse({ ...validFeature, id: 'Remote Control' }).success).toBe(false);
  });
});

describe('author schema', () => {
  test('ペンネームの著者は通る', () => {
    const result = authorSchema.safeParse({
      name: 'shizukukai',
      bio: 'Claude の実務活用を検証して記録している。',
      credentials: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('vendor and product schema', () => {
  const validProduct = {
    id: 'claude-code',
    name: 'Claude Code',
    vendor: 'anthropic',
    code: 'CC',
    categories: ['coding', 'agent'],
  };

  test('正しい会社は通り、changelogs の既定値は空配列', () => {
    const result = vendorSchema.safeParse({ id: 'anthropic', name: 'Anthropic', order: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.changelogs).toEqual([]);
  });

  test('正しい製品は通り、route の既定値は空配列', () => {
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.route).toEqual([]);
  });

  test.each(['cc', 'CCC', 'C1'])('記号 %s は英大文字 2 字でないので失敗する', (code) => {
    expect(productSchema.safeParse({ ...validProduct, code }).success).toBe(false);
  });

  test('分野が空なら失敗する', () => {
    expect(productSchema.safeParse({ ...validProduct, categories: [] }).success).toBe(false);
  });

  test('route の slug に使えない文字があれば失敗する', () => {
    const route = [{ section: 'はじめる', articles: ['Install'] }];
    expect(productSchema.safeParse({ ...validProduct, route }).success).toBe(false);
  });
});

describe('existingId（T301）', () => {
  const productRef = existingId(['claude-code', 'codex'], '製品 ID');

  test('登録された ID は通る', () => {
    expect(productRef.safeParse('codex').success).toBe(true);
  });

  test('未登録の ID は失敗し、メッセージに ID を含む', () => {
    const result = productRef.safeParse('claude-desktop');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toContain('claude-desktop');
  });
});

describe('checkArticlePath', () => {
  test('置き場所と products[0] が一致すれば問題なし', () => {
    expect(checkArticlePath('claude-code/remote-control', ['claude-code'], 'how-to')).toEqual([]);
  });

  test('T128・T306: 置き場所と products[0] が違えば違反', () => {
    expect(checkArticlePath('claude-api/remote-control', ['claude-code'], 'how-to')).not.toEqual(
      [],
    );
  });

  test('T306: ニュースは news/ に置く', () => {
    expect(checkArticlePath('news/model-update', [], 'news')).toEqual([]);
    expect(checkArticlePath('claude-code/model-update', ['claude-code'], 'news')).not.toEqual([]);
  });

  test('ニュース以外を news/ に置くと違反', () => {
    expect(checkArticlePath('news/hooks', ['claude-code'], 'how-to')).not.toEqual([]);
  });

  test('T129: slug に使えない文字があれば違反', () => {
    expect(checkArticlePath('claude-code/Remote_Control', ['claude-code'], 'how-to')).not.toEqual(
      [],
    );
  });

  test('ディレクトリが1段でなければ違反', () => {
    expect(checkArticlePath('remote-control', ['claude-code'], 'how-to')).not.toEqual([]);
    expect(checkArticlePath('claude-code/a/b', ['claude-code'], 'how-to')).not.toEqual([]);
  });
});

describe('taxonomy', () => {
  test('T022: すべての型にテンプレートが対応している', () => {
    for (const type of CONTENT_TYPES) {
      expect(LAYOUT_BY_TYPE[type]).toBeDefined();
    }
    expect(LAYOUT_BY_TYPE.landing).toBe('hub');
    expect(LAYOUT_BY_TYPE.news).toBe('digest');
    expect(LAYOUT_BY_TYPE.reference).toBe('reference');
  });
});
