// サイト全体で使う分類の定義。値を増やすときはここだけを変える。

export const SURFACES = [
  'apps',
  'cowork',
  'claude-code',
  'api',
  'agent-sdk',
  'mcp',
  'skills',
  'artifacts-design',
  'models',
] as const;
export type Surface = (typeof SURFACES)[number];

// Diátaxis の4型に、troubleshooting・comparison・news・landing を加えた8型
export const CONTENT_TYPES = [
  'tutorial',
  'how-to',
  'reference',
  'explanation',
  'troubleshooting',
  'comparison',
  'news',
  'landing',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const ROLES = ['developer', 'business'] as const;
export type Role = (typeof ROLES)[number];

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

export const ARTICLE_STATUS = ['current', 'needs-review', 'deprecated'] as const;
export type ArticleStatus = (typeof ARTICLE_STATUS)[number];

export const FEATURE_STATUS = ['beta', 'ga', 'deprecated', 'removed'] as const;
export type FeatureStatus = (typeof FEATURE_STATUS)[number];

export const AI_ASSISTED = ['none', 'draft', 'draft-and-edit'] as const;
export type AiAssisted = (typeof AI_ASSISTED)[number];

export const CHANGE_CATEGORIES = ['feature', 'change', 'deprecation', 'removal', 'fix'] as const;
export type ChangeCategory = (typeof CHANGE_CATEGORIES)[number];

export type Layout = 'article' | 'reference' | 'comparison' | 'digest' | 'hub';

// 記事の型と6種類のテンプレートの対応（ホームは専用テンプレートなので含まない）
export const LAYOUT_BY_TYPE = {
  tutorial: 'article',
  'how-to': 'article',
  explanation: 'article',
  troubleshooting: 'article',
  reference: 'reference',
  comparison: 'comparison',
  news: 'digest',
  landing: 'hub',
} as const satisfies Record<ContentType, Layout>;
