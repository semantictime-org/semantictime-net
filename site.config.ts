import type { Category, ContentType } from './src/lib/taxonomy';

// サイトの定数はここだけで定義する。
export const SITE = {
  url: 'https://semantictime.net',
  name: 'semantictime.net',
  description:
    '手元で動かした日と版をつけて公開する、AI の使い方の非公式ガイド。Claude・ChatGPT・Gemini などを同じ扱いで載せる。',
  // ホームの <title> に使う。サイト名だけでは何のサイトか伝わらないため
  tagline: 'AI の使い方を、手元で確かめて書く',
  // Cloudflare Web Analytics のトークン（公開値）。Task 4.4 で設定するまでは計測しない
  analyticsToken: undefined,
  timezone: 'Asia/Tokyo',
  // 検証期限（日数）。手順が変わりやすい分野ほど短くする
  reviewIntervalDaysByCategory: {
    coding: 30,
    agent: 30,
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
