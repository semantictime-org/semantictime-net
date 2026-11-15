// 記事ページの表示に必要な値をまとめた型。src/pages/[...slug].astro が作り、各レイアウトに渡す。
import type { MarkdownHeading } from 'astro';
import type { BannerStatus, Disclosure, VerificationRecord } from './article-meta.ts';
import type { Crumb, HistoryRow } from './article-view.ts';
import type { SeoArticle } from './seo.ts';

export interface ArticlePage {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly typeLabel: string;
  readonly typeEn: string;
  /** 手順のある記事（チュートリアル、ハウツー）は目次に番号を付ける */
  readonly numbered: boolean;
  readonly productName: string | undefined;
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
  readonly headings: readonly MarkdownHeading[];
  readonly seo: SeoArticle;
}
