import type { Category, ContentType } from './src/lib/taxonomy';

// サイトの定数はここだけで定義する。
export const SITE = {
  url: 'https://semantictime.net',
  name: 'semantictime.net',
  description:
    'Claude・ChatGPT・Gemini など各社の AI の使い方と変更を、同じ扱いで整理する日本語の非公式ガイド。手順には、手元で確かめた日と版を載せています。',
  // ホームの <title> に使う。サイト名だけでは何のサイトか伝わらないため
  tagline: 'AI の使い方と変化を、ひとつの場所で',
  // Cloudflare Web Analytics のトークン（公開値）。Task 4.4 で設定するまでは計測しない
  analyticsToken: undefined,
  timezone: 'Asia/Tokyo',
  // 検証期限（日数）。手順が変わりやすい分野ほど短くする
  reviewIntervalDaysByCategory: {
    // 2026-11-16 ユーザーの判断で 30 → 60 日（1人で全記事を 30 日ごとに見直すのは現実的でない）
    coding: 60,
    agent: 60,
    api: 60,
    chat: 60,
    image: 60,
    video: 60,
    audio: 60,
  } satisfies Record<Category, number>,
  reviewIntervalDaysByType: { explanation: 180 } satisfies Partial<Record<ContentType, number>>,
  reportEmail: 'semantictime@gmail.com',
  // 検証ゲートで比べるログイン名。.github/CODEOWNERS と同じ値にする（CI で一致を確かめる）
  codeOwner: 'semantictime',
} as const;
