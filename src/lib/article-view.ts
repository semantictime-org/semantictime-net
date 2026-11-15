// 記事ページの表示に使う値（型の名前、パンくず、検証の履歴）を決める（純粋関数）。
import { toJstDate } from './dates.ts';
import type {
  ChangeCategory,
  ContentType,
  FeatureStatus,
  Level,
  Role,
  Verification,
} from './taxonomy.ts';

export const TYPE_LABEL: Readonly<Record<ContentType, string>> = {
  tutorial: 'チュートリアル',
  'how-to': 'ハウツー',
  explanation: '解説',
  reference: '現行仕様',
  troubleshooting: 'トラブル対処',
  comparison: '比較',
  news: 'ニュース',
  landing: 'まとめ',
};

/** 冒頭の帯に大きく出す英字（読み上げからは隠す） */
export const TYPE_EN: Readonly<Record<ContentType, string>> = {
  tutorial: 'TUTORIAL',
  'how-to': 'HOW-TO',
  explanation: 'EXPLAIN',
  reference: 'SPEC',
  troubleshooting: 'FIX',
  comparison: 'COMPARE',
  news: 'NEWS',
  landing: 'GUIDE',
};

export const ROLE_LABEL: Readonly<Record<Role, string>> = {
  developer: '開発者',
  business: 'ビジネス',
};

export const LEVEL_LABEL: Readonly<Record<Level, string>> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
};

/** サイト内の固定のページ（ヘッダー・フッター・ホームから参照する） */
export const ROUTES = {
  home: '/',
  news: '/news/',
  search: '/search/',
  archive: '/archive/',
  editorialPolicy: '/about/editorial-policy/',
  authors: '/about/authors/',
  report: '/about/report/',
  privacy: '/about/privacy/',
  disclaimer: '/about/disclaimer/',
} as const;

/** 連載のページ */
export const seriesHref = (id: string): string => `/series/${id}/`;

/** このサイトについてのページ（フッターと各ページの末尾に並べる） */
export const ABOUT_PAGES = [
  { href: ROUTES.editorialPolicy, label: '編集方針' },
  { href: ROUTES.authors, label: '著者' },
  { href: ROUTES.report, label: '誤りの報告' },
  { href: ROUTES.privacy, label: 'プライバシーポリシー' },
  { href: ROUTES.disclaimer, label: '免責と商標' },
] as const;

export const articleHref = (id: string): string => `/${id}/`;

export interface Crumb {
  readonly label: string;
  readonly href?: string;
}

/** ホーム → 製品（ハブ）→ 現在のページ */
export const breadcrumbsOf = (
  product: { readonly id: string; readonly name: string } | undefined,
  current: string,
): readonly Crumb[] => [
  { label: 'ホーム', href: ROUTES.home },
  ...(product ? [{ label: product.name, href: `/${product.id}/` }] : []),
  { label: current },
];

export interface HistoryRow {
  readonly date: string;
  readonly text: string;
}

/** 検証の履歴（新しい順）。フェーズ1は frontmatter の公開日と検証日から作る */
/** 記事の frontmatter の history（確かめ直した日と、そのとき何をしたか） */
export interface HistoryEntry {
  readonly date: Date;
  readonly note: string;
}

export const historyOf = (
  verification: Verification,
  publishedAt: Date,
  verifiedAt: Date,
  entries: readonly HistoryEntry[] = [],
): readonly HistoryRow[] => {
  const published = toJstDate(publishedAt);
  // 記事に履歴が書いてあれば、それを新しい順に並べ、最後に公開の行を置く
  if (entries.length > 0) {
    return [
      ...entries
        .toSorted((a, b) => b.date.getTime() - a.date.getTime())
        .map((e) => ({ date: toJstDate(e.date), text: e.note })),
      { date: published, text: '公開した。' },
    ];
  }
  const verified = toJstDate(verifiedAt);
  if (verification === 'sources') {
    return [{ date: published, text: '一次情報の出典を確かめて公開した。' }];
  }
  if (published === verified) return [{ date: published, text: '手元で検証して公開した。' }];
  return verified > published
    ? [
        { date: verified, text: '手元で再検証した。' },
        { date: published, text: '公開した。' },
      ]
    : [
        { date: published, text: '公開した。' },
        { date: verified, text: '手元で検証した。' },
      ];
};

export const CHANGE_LABEL: Readonly<Record<ChangeCategory, string>> = {
  feature: '新機能',
  change: '変更',
  deprecation: '非推奨',
  removal: '削除',
  fix: '修正',
};

export const FEATURE_STATUS_LABEL: Readonly<Record<FeatureStatus, string>> = {
  beta: 'ベータ版',
  ga: '提供中',
  deprecated: '非推奨',
  removed: '提供終了',
};
