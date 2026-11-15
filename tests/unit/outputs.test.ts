import { describe, expect, test } from 'vitest';
import { addNoindexHeader } from '../../src/lib/headers';
import { buildLlmsTxt } from '../../src/lib/llms';
import { toMarkdownExport } from '../../src/lib/markdown-export';
import { parseRedirects } from '../../src/lib/redirects';
import { AI_BOTS, buildRobotsTxt } from '../../src/lib/robots';

describe('toMarkdownExport（T053 .md 版）', () => {
  const body = [
    "import Callout from '../../../src/components/mdx/Callout.astro';",
    '',
    '## 設定を書く',
    '',
    '<Callout type="warning" title="注意">',
    '  保存のたびに動く。',
    '  二行目。',
    '</Callout>',
    '',
    '<Callout>題のない注記</Callout>',
  ].join('\n');
  const md = toMarkdownExport({
    title: 'Hooks で保存のたびに整形する',
    description: '説明',
    url: 'https://semantictime.net/claude-code/hooks-format/',
    verified: '2026-11-01（Claude Code 2.1.325）',
    sources: ['https://code.claude.com/docs/en/hooks'],
    body,
  });

  test('import の行を消す', () => {
    expect(md).not.toContain('import ');
  });

  test('Callout は blockquote になる（題は太字）', () => {
    expect(md).toContain('> **注意**\n>\n> 保存のたびに動く。\n> 二行目。');
    expect(md).toContain('> 題のない注記');
    expect(md).not.toContain('<Callout');
  });

  test('題・URL・検証・出典を先頭に置く', () => {
    expect(md.startsWith('# Hooks で保存のたびに整形する\n')).toBe(true);
    expect(md).toContain('- URL: https://semantictime.net/claude-code/hooks-format/');
    expect(md).toContain('- 検証: 2026-11-01（Claude Code 2.1.325）');
    expect(md).toContain('- 出典: https://code.claude.com/docs/en/hooks');
  });
});

describe('buildLlmsTxt（T054）', () => {
  test('サイトの説明と、節ごとに .md へのリンクを並べる', () => {
    const txt = buildLlmsTxt({
      name: 'semantictime.net',
      description: '説明',
      sections: [
        {
          name: 'Claude Code',
          links: [
            { title: 'Hooks', url: 'https://semantictime.net/claude-code/hooks.md', note: 'CC07' },
          ],
        },
        { name: '空の節', links: [] },
      ],
    });
    expect(txt.startsWith('# semantictime.net\n\n> 説明\n')).toBe(true);
    expect(txt).toContain(
      '## Claude Code\n\n- [Hooks](https://semantictime.net/claude-code/hooks.md): CC07',
    );
    expect(txt).not.toContain('空の節');
  });
});

describe('buildRobotsTxt（T060）', () => {
  const robots = buildRobotsTxt('https://semantictime.net');

  test.each(AI_BOTS)('%s を許可する', (bot) => {
    expect(robots).toContain(`User-agent: ${bot}\nAllow: /`);
  });

  test('sitemap の場所を示す', () => {
    expect(robots).toContain('Sitemap: https://semantictime.net/sitemap-index.xml');
  });

  test('決めたボットがそろっている', () => {
    expect(AI_BOTS).toEqual(
      expect.arrayContaining([
        'OAI-SearchBot',
        'Claude-SearchBot',
        'Claude-User',
        'PerplexityBot',
        'ClaudeBot',
        'GPTBot',
        'Google-Extended',
      ]),
    );
  });
});

describe('addNoindexHeader（T058 プレビュー）', () => {
  const base = '/*\n  X-Frame-Options: DENY\n';

  test('全ページに X-Robots-Tag: noindex を足す', () => {
    expect(addNoindexHeader(base)).toContain('/*\n  X-Robots-Tag: noindex');
  });

  test('コメントに同じ語があっても、ヘッダとして足す', () => {
    const withComment = `# プレビューでは X-Robots-Tag: noindex を足す\n${base}`;
    expect(addNoindexHeader(withComment)).toContain('/*\n  X-Robots-Tag: noindex');
  });

  test('二度かけても一度だけ', () => {
    const once = addNoindexHeader(base);
    expect(addNoindexHeader(once)).toBe(once);
  });
});

describe('parseRedirects（T063）', () => {
  test('コメントと空行を除いて、元・先・ステータスを読む', () => {
    expect(parseRedirects('# comment\n\n/old/ /new/ 301\n')).toEqual([
      { from: '/old/', to: '/new/', status: 301 },
    ]);
  });

  test('301 以外は誤り', () => {
    expect(() => parseRedirects('/old/ /new/ 302')).toThrow('301');
    expect(() => parseRedirects('/old/ /new/')).toThrow('301');
  });
});
