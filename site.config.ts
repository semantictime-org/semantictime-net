import type { Category, ContentType } from './src/lib/taxonomy';

// サイトの定数はここだけで定義する。
export const SITE = {
  url: 'https://semantictime.net',
  name: 'semantictime.net',
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
