// /robots.txt を作る（T060）。要件 7.1 の決定どおり、検索用・学習用の AI のボットを両方とも許可する。

export const AI_BOTS = [
  'OAI-SearchBot',
  'GPTBot',
  'Claude-SearchBot',
  'Claude-User',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
] as const;

export const buildRobotsTxt = (siteUrl: string): string =>
  [
    ...AI_BOTS.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap-index.xml`,
    '',
  ].join('\n');
