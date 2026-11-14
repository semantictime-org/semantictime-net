import { z } from 'astro/zod';
import {
  AI_ASSISTED,
  ARTICLE_STATUS,
  CHANGE_CATEGORIES,
  CONTENT_TYPES,
  FEATURE_STATUS,
  LEVELS,
  ROLES,
  SURFACES,
  type Surface,
} from './taxonomy.ts';

const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 160;
const TITLE_MAX = 80;
const SEMVER = /^\d+\.\d+\.\d+$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const changeSchema = z.object({
  date: z.coerce.date(),
  surface: z.enum(SURFACES),
  breaking: z.boolean(),
  category: z.enum(CHANGE_CATEGORIES),
  title: z.string().min(1),
  url: z.url(),
});

const verifiedWithSchema = z
  .object({
    claudeCode: z.string().regex(SEMVER, 'claudeCode は 2.1.325 の形式で書く').optional(),
    model: z.string().min(1).optional(),
    apiVersion: z.string().min(1).optional(),
  })
  .refine((v) => Object.values(v).some(Boolean), '検証環境（verifiedWith）を最低1つ書く');

/**
 * 記事のスキーマを作る。features と owner の参照先は、本番では Astro の reference()、
 * 単体テストでは文字列を渡す（参照先が存在するかはビルドで検証される）。
 */
export const buildArticleSchema = <F extends z.ZodType, O extends z.ZodType>(
  featureRef: F,
  ownerRef: O,
) =>
  z
    .object({
      title: z.string().min(1).max(TITLE_MAX),
      description: z.string().min(DESCRIPTION_MIN).max(DESCRIPTION_MAX),
      type: z.enum(CONTENT_TYPES),
      surfaces: z.array(z.enum(SURFACES)).min(1),
      roles: z.array(z.enum(ROLES)).min(1),
      level: z.enum(LEVELS),
      status: z.enum(ARTICLE_STATUS).default('current'),
      features: z.array(featureRef).default([]),
      draft: z.boolean().default(false),
      publishedAt: z.coerce.date(),
      verifiedAt: z.coerce.date(),
      verifiedWith: verifiedWithSchema,
      sources: z.array(z.url()).min(1),
      owner: ownerRef,
      aiAssisted: z.enum(AI_ASSISTED),
      changes: z.array(changeSchema).optional(),
    })
    .superRefine((a, ctx) => {
      if (a.verifiedAt < a.publishedAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['verifiedAt'],
          message: 'verifiedAt は publishedAt 以降の日付にする',
        });
      }
      if (a.type === 'news' && !a.changes) {
        ctx.addIssue({ code: 'custom', path: ['changes'], message: 'news には changes が必要' });
      }
      if (a.type !== 'news' && a.changes) {
        ctx.addIssue({
          code: 'custom',
          path: ['changes'],
          message: 'changes は news のときだけ書ける',
        });
      }
    });

export const featureSchema = z.object({
  id: z.string().regex(SLUG, '機能 ID は英小文字・数字・ハイフンだけ'),
  name: z.string().min(1),
  surface: z.enum(SURFACES),
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
 * 記事の ID（`<surface>/<slug>`）が置き場所の規則に合っているかを調べ、違反の説明を返す。
 * 違反がなければ空配列。
 */
export const checkArticlePath = (id: string, surfaces: readonly Surface[]): readonly string[] => {
  const parts = id.split('/');
  if (parts.length !== 2) {
    return [`${id}: 記事は src/content/articles/<surface>/<slug>.mdx に置く`];
  }
  const [dir, slug] = parts as [string, string];
  const violations: string[] = [];
  if (dir !== surfaces[0]) {
    violations.push(
      `${id}: ディレクトリ（${dir}）と surfaces の先頭（${surfaces[0] ?? '-'}）が違う`,
    );
  }
  if (!SLUG.test(slug)) {
    violations.push(`${id}: slug は英小文字・数字・ハイフンだけ`);
  }
  return violations;
};
