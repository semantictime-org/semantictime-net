import { describe, expect, test } from 'vitest';
import { ogCard, ogImagePath, readTokens, type OgNode } from '../../src/lib/og-image';

const COLORS = {
  band: '#0b0d12',
  onBand: '#ffffff',
  onBandFaint: '#9aa3b5',
  keyOnBand: '#8095ff',
};

const textOf = (node: OgNode | string): string =>
  typeof node === 'string' ? node : [node.props.children ?? []].flat().map(textOf).join(' ');

describe('ogImagePath', () => {
  test('記事 ID から /og/<id>.png', () => {
    expect(ogImagePath('claude-code/hooks-format')).toBe('/og/claude-code/hooks-format.png');
  });
});

describe('ogCard', () => {
  test('記号・題・補足・サイト名を載せる', () => {
    const card = ogCard(
      { mark: 'CC07', title: 'Hooks で保存のたびに整形する', sub: 'Claude Code · 検証 2026-11-01' },
      COLORS,
    );
    const text = textOf(card);
    expect(text).toContain('CC07');
    expect(text).toContain('Hooks で保存のたびに整形する');
    expect(text).toContain('Claude Code · 検証 2026-11-01');
    expect(text).toContain('semantictime.net');
  });

  test('検証の種類と日付を、補足とは別に大きく載せる', () => {
    const text = textOf(
      ogCard(
        {
          mark: 'CC07',
          title: 't',
          sub: 'Claude Code',
          verified: { label: '手元で検証', date: '2026.11.01' },
        },
        COLORS,
      ),
    );
    expect(text).toContain('手元で検証');
    expect(text).toContain('2026.11.01');
  });

  test('地の色はトークンの帯の色', () => {
    expect(
      ogCard({ mark: 'NEWS', title: 't', sub: 's' }, COLORS).props.style?.['backgroundColor'],
    ).toBe('#0b0d12');
  });
});

describe('readTokens', () => {
  const css = ':root {\n  --color-band: #0b0d12;\n  --color-on-band: #ffffff;\n}';

  test('指定した変数の値を読む', () => {
    expect(readTokens(css, ['--color-band', '--color-on-band'])).toEqual({
      '--color-band': '#0b0d12',
      '--color-on-band': '#ffffff',
    });
  });

  test('ない変数はエラーで止める（色を推測で埋めない）', () => {
    expect(() => readTokens(css, ['--color-missing'])).toThrow('--color-missing');
  });
});
