import { describe, expect, test } from 'vitest';
import { findForbidden, parsePatterns } from '../../src/lib/real-name';

describe('parsePatterns', () => {
  test('1行1パターンで、空行とコメントを除き、前後の空白を落とす', () => {
    expect(parsePatterns('  Taro Yamada \n\n# comment\nexample-corp\n')).toEqual([
      'Taro Yamada',
      'example-corp',
    ]);
  });
});

describe('findForbidden（T061）', () => {
  const patterns = ['Taro Yamada', 'example-corp'];

  test('含むファイルの名前だけを返す（大文字小文字を区別しない）', () => {
    const files = [
      { path: 'dist/index.html', text: '<p>EXAMPLE-CORP</p>' },
      { path: 'dist/a.html', text: 'shizukukai' },
      { path: 'README.md', text: 'by taro yamada' },
    ];
    expect(findForbidden(files, patterns)).toEqual(['dist/index.html', 'README.md']);
  });

  test('見つからなければ空', () => {
    expect(findForbidden([{ path: 'x', text: 'shizukukai' }], patterns)).toEqual([]);
  });

  test('パターンが空なら誤り（検査をしたことにならないため）', () => {
    expect(() => findForbidden([], [])).toThrow('パターン');
  });
});
