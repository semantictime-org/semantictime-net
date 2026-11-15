import { z } from 'astro/zod';
import {
  AI_ASSISTED,
  ARTICLE_STATUS,
  CATEGORIES,
  CHANGE_CATEGORIES,
  CONTENT_TYPES,
  FEATURE_STATUS,
  LEVELS,
  ROLES,
  VERIFICATION,
  type ContentType,
} from './taxonomy.ts';

const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 160;
const TITLE_MAX = 80;
const STATION_MIN = 1;
const STATION_MAX = 99;
const SEMVER = /^\d+\.\d+\.\d+$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRODUCT_CODE = /^[A-Z]{2}$/;
/** ニュースの置き場所（製品のディレクトリではなく、ここに置く） */
export const NEWS_DIR = 'news';

/**
 * 登録済みの ID だけを通す。Astro の reference() は参照先がなくてもビルドを失敗させない
 * （2026-11-15 に astro 7.4.12 で確認）ため、先にこれで検査してスキーマ違反として止める。
 */
export const existingId = (ids: readonly string[], label: string) =>
  z.string().superRefine((id, ctx) => {
    if (!ids.includes(id)) {
      ctx.addIssue({ code: 'custom', message: `未登録の${label}: ${id}` });
    }
  });

const verifiedWithSchema = z
  .object({
    claudeCode: z.string().regex(SEMVER, 'claudeCode は 2.1.325 の形式で書く').optional(),
    model: z.string().min(1).optional(),
    apiVersion: z.string().min(1).optional(),
    // Claude Code 以外の製品の版（例: Codex CLI 0.48.0、Gemini アプリ 2026-11）
    version: z.string().min(1).optional(),
  })
  .refine((v) => Object.values(v).some(Boolean), '検証環境（verifiedWith）を最低1つ書く');

/**
 * 記事のスキーマを作る。features・owner・products の参照先は、本番では Astro の reference()、
 * 単体テストでは文字列を渡す（参照先が存在するかはビルドで検証される）。
 */
export const buildArticleSchema = <F extends z.ZodType, O extends z.ZodType, P extends z.ZodType>(
  featureRef: F,
  ownerRef: O,
  productRef: P,
) =>
  z
    .object({
      title: z.string().min(1).max(TITLE_MAX),
      description: z.string().min(DESCRIPTION_MIN).max(DESCRIPTION_MAX),
      type: z.enum(CONTENT_TYPES),
      // 先頭がその記事の路線（置き場所のディレクトリ）。ニュースは 0 件でもよい
      products: z.array(productRef).default([]),
      // 路線の中での固定の番号。作成時に一度だけ付け、読む順を入れ替えても変えない
      stationNo: z.number().int().min(STATION_MIN).max(STATION_MAX).optional(),
      verification: z.enum(VERIFICATION),
      roles: z.array(z.enum(ROLES)).min(1),
      level: z.enum(LEVELS),
      status: z.enum(ARTICLE_STATUS).default('current'),
      features: z.array(featureRef).default([]),
      draft: z.boolean().default(false),
      publishedAt: z.coerce.date(),
      verifiedAt: z.coerce.date(),
      verifiedWith: verifiedWithSchema.optional(),
      sources: z.array(z.url()).min(1),
      owner: ownerRef,
      aiAssisted: z.enum(AI_ASSISTED),
      changes: z
        .array(
          z.object({
            date: z.coerce.date(),
            product: productRef,
            breaking: z.boolean(),
            category: z.enum(CHANGE_CATEGORIES),
            title: z.string().min(1),
            url: z.url(),
          }),
        )
        .optional(),
    })
    .superRefine((a, ctx) => {
      const issue = (path: string, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });
      if (a.type === 'news') {
        if (!a.changes) issue('changes', 'news には changes が必要');
        if (a.verification !== 'sources') {
          issue('verification', 'news は実機で検証できないので verification: sources にする');
        }
      } else {
        if (a.changes) issue('changes', 'changes は news のときだけ書ける');
        if (a.products.length === 0) issue('products', 'news 以外は products を1つ以上書く');
        if (a.stationNo === undefined)
          issue('stationNo', 'news 以外は stationNo（記事番号）を書く');
      }
      if (a.verification === 'hands-on' && !a.verifiedWith) {
        issue('verifiedWith', '実機で検証した記事は verifiedWith（検証環境）を書く');
      }
    });

export const vendorSchema = z.object({
  id: z.string().regex(SLUG, '会社 ID は英小文字・数字・ハイフンだけ'),
  name: z.string().min(1),
  // ナビとホームで並べる順（固定。会社による特別扱いはしない）
  order: z.number().int().min(1),
  // 公式の変更履歴・リリースノート（上流の追跡に使う）
  changelogs: z.array(z.url()).default([]),
});

/** 製品のスキーマを作る。vendor の参照先は、本番では reference()、単体テストでは文字列 */
export const buildProductSchema = <V extends z.ZodType>(vendorRef: V) =>
  z.object({
    id: z.string().regex(SLUG, '製品 ID は英小文字・数字・ハイフンだけ'),
    name: z.string().min(1),
    vendor: vendorRef,
    // 記事番号の記号（例: CC07 の CC）。全製品で重複しない
    code: z.string().regex(PRODUCT_CODE, '記号は英大文字 2 字'),
    categories: z.array(z.enum(CATEGORIES)).min(1),
    // 読む順。入れ替えはここだけで行い、記事の番号は変えない
    route: z
      .array(
        z.object({
          section: z.string().min(1),
          articles: z.array(z.string().regex(SLUG, 'route の slug は英小文字・数字・ハイフンだけ')),
        }),
      )
      .default([]),
    routeUpdated: z.coerce.date().optional(),
  });

export const productSchema = buildProductSchema(z.string());

export const featureSchema = z.object({
  id: z.string().regex(SLUG, '機能 ID は英小文字・数字・ハイフンだけ'),
  name: z.string().min(1),
  product: z.string().regex(SLUG),
  status: z.enum(FEATURE_STATUS),
  since: z.coerce.date().optional(),
  deprecatedAt: z.coerce.date().optional(),
  docs: z.url(),
  // 上流の変更との照合に使う語。一般的すぎる語（hooks など）は入れない
  aliases: z.array(z.string().min(1)).default([]),
});

export const authorSchema = z.object({
  name: z.string().min(1),
  bio: z.string().min(1),
  credentials: z.array(z.string().min(1)),
  url: z.url().optional(),
});

/**
 * 記事の ID（`<product>/<slug>`、ニュースは `news/<slug>`）が置き場所の規則に合っているかを調べ、
 * 違反の説明を返す。違反がなければ空配列。
 */
export const checkArticlePath = (
  id: string,
  products: readonly string[],
  type: ContentType,
): readonly string[] => {
  const parts = id.split('/');
  if (parts.length !== 2) {
    return [`${id}: 記事は src/content/articles/<product>/<slug>.mdx に置く`];
  }
  const [dir, slug] = parts as [string, string];
  const violations: string[] = [];
  if (type === 'news' && dir !== NEWS_DIR) {
    violations.push(`${id}: ニュースは ${NEWS_DIR}/ に置く`);
  }
  if (type !== 'news' && dir !== products[0]) {
    violations.push(
      `${id}: ディレクトリ（${dir}）と products の先頭（${products[0] ?? '-'}）が違う`,
    );
  }
  if (!SLUG.test(slug)) {
    violations.push(`${id}: slug は英小文字・数字・ハイフンだけ`);
  }
  return violations;
};
