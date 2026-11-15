import type { ContentType, Surface } from './src/lib/taxonomy';

// サイトの定数はここだけで定義する。
export const SITE = {
  url: 'https://semantictime.net',
  name: 'semantictime.net',
  timezone: 'Asia/Tokyo',
  reviewIntervalDaysBySurface: {
    'claude-code': 30,
    cowork: 30,
    skills: 30,
    mcp: 30,
    api: 60,
    'agent-sdk': 60,
    apps: 60,
    'artifacts-design': 60,
    models: 60,
  } satisfies Record<Surface, number>,
  reviewIntervalDaysByType: { explanation: 180 } satisfies Partial<Record<ContentType, number>>,
  reportEmail: 'semantictime@gmail.com',
  // 検証ゲートで比べるログイン名。.github/CODEOWNERS と同じ値にする（CI で一致を確かめる）
  codeOwner: 'semantictime',
} as const;
