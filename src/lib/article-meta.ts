// 記事の冒頭に出す検証票・状態のバナー・AI 利用の開示欄の中身を決める（純粋関数）。
// 表示は src/components/{verification,status,disclosure}/ で行う。
import { addDays, toJstDate } from './dates.ts';
import { freshnessOf, reviewIntervalFor, tracksFreshness, type Freshness } from './freshness.ts';
import type { AiAssisted, Category, ContentType, FeatureStatus, Verification } from './taxonomy.ts';

/** バナーに出す状態。重いものから並べる（removed > deprecated > beta） */
const BANNER_ORDER = ['removed', 'deprecated', 'beta'] as const;
export type BannerStatus = (typeof BANNER_ORDER)[number];

/** 記事が参照する機能のうち、最も重い状態を1つだけ返す。ga だけならバナーを出さない（T077） */
export const strongestFeatureStatus = (
  statuses: readonly FeatureStatus[],
): BannerStatus | undefined => BANNER_ORDER.find((s) => statuses.includes(s));

export interface VerifiedWith {
  readonly claudeCode?: string | undefined;
  readonly model?: string | undefined;
  readonly apiVersion?: string | undefined;
  readonly version?: string | undefined;
}

/** 検証環境を表示用の行に並べる（製品の版 → モデル → API の版 → ほかの製品の版） */
export const verifiedWithLines = (v: VerifiedWith | undefined): readonly string[] =>
  v
    ? [
        v.claudeCode && `Claude Code ${v.claudeCode}`,
        v.model,
        v.apiVersion && `API ${v.apiVersion}`,
        v.version,
      ].filter((line): line is string => Boolean(line))
    : [];

export interface Disclosure {
  readonly assistance: string;
  readonly verification: string;
}

/** AI 利用の開示（T079） */
export const disclosureOf = (input: {
  readonly aiAssisted: AiAssisted;
  readonly author: string;
  readonly verifiedAt: Date;
  readonly versions: readonly string[];
}): Disclosure => ({
  assistance: input.aiAssisted === 'none' ? 'AI 不使用' : '執筆支援：AI',
  verification: `検証・編集：${input.author}／${[`検証日 ${toJstDate(input.verifiedAt)}`, ...input.versions].join('・')}`,
});

export type RecordState = 'ok' | 'review' | 'stale';

export interface VerificationRecord {
  readonly label: string;
  /** 検証票に大きく出す日付（2026.11.01） */
  readonly date: string;
  readonly state: RecordState;
  readonly stateLabel: string;
  /** 次の見直し日。出典で確かめた記事は見直さないので undefined */
  readonly nextReview: string | undefined;
}

const STATE_OF: Record<Freshness, RecordState> = {
  fresh: 'ok',
  'due-soon': 'review',
  stale: 'stale',
};
const STATE_LABEL: Record<RecordState, string> = {
  ok: '検証済み',
  review: 'まもなく見直し',
  stale: '期限切れ',
};

const SOURCES_OK = '出典を確認';

const dotted = (isoDate: string): string => isoDate.replaceAll('-', '.');

/** 検証票の中身。状態はビルドした時点で判定する（静的サイトのため） */
export const verificationRecordOf = (
  article: {
    readonly verification: Verification;
    readonly verifiedAt: Date;
    readonly type: ContentType;
    readonly categories: readonly Category[];
  },
  now: Date,
): VerificationRecord => {
  const date = dotted(toJstDate(article.verifiedAt));
  const bySources = article.verification === 'sources';
  const label = bySources ? '出典を確かめた日' : '手元で確かめた日';
  if (!tracksFreshness(article.verification, article.type)) {
    return { label, date, state: 'ok', stateLabel: SOURCES_OK, nextReview: undefined };
  }
  const interval = reviewIntervalFor(article.type, article.categories);
  const state = STATE_OF[freshnessOf(article.verifiedAt, interval, now)];
  return {
    label,
    date,
    state,
    // 期限内なら確かめ方を示す（出典を確認／検証済み）。見直しが近い・過ぎたときは共通の言葉
    stateLabel: bySources && state === 'ok' ? SOURCES_OK : STATE_LABEL[state],
    nextReview: dotted(addDays(article.verifiedAt, interval)),
  };
};
