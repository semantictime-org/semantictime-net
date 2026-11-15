// 記事ページの表示に必要な値をまとめた型。src/pages/[...slug].astro が作り、各レイアウトに渡す。
import type { MarkdownHeading } from 'astro';
import type { BannerStatus, Disclosure, VerificationRecord } from './article-meta.ts';
import type { Crumb, HistoryRow } from './article-view.ts';
import type { SeoArticle } from './seo.ts';

/** 記事の最後の案内に出す1本 */
export interface NavLink {
  readonly href: string;
  readonly title: string;
  /** 記事番号（CC07） */
  readonly station: string | undefined;
}

export interface ArticlePage {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly typeLabel: string;
  readonly typeEn: string;
  /** 手順のある記事（チュートリアル、ハウツー）は目次に番号を付ける */
  readonly numbered: boolean;
  readonly productName: string | undefined;
  /** 連載の何回目か（連載「はじめての Claude Code」第 2 回） */
  readonly series:
    { readonly name: string; readonly label: string; readonly href: string } | undefined;
  /** 記事番号（CC07） */
  readonly stationLabel: string | undefined;
  /** 冒頭の帯の透かし（記事番号、ニュースは日付） */
  readonly watermark: string | undefined;
  readonly levelLabel: string;
  /** 検索の絞り込み（Pagefind の filter）。キーは表示名 */
  readonly searchFilters: readonly { readonly key: string; readonly value: string }[];
  readonly publishedDate: string;
  readonly crumbs: readonly Crumb[];
  readonly record: VerificationRecord;
  readonly versions: readonly string[];
  readonly disclosure: Disclosure;
  readonly banner:
    { readonly status: BannerStatus; readonly features: readonly string[] } | undefined;
  readonly history: readonly HistoryRow[];
  readonly sources: readonly string[];
  /** 記事の最後の案内（連載の前後と同じ製品の記事） */
  readonly nav: {
    readonly prev: NavLink | undefined;
    readonly next: NavLink | undefined;
    readonly related: readonly NavLink[];
  };
  readonly headings: readonly MarkdownHeading[];
  readonly seo: SeoArticle;
}
