import { describe, expect, test } from 'vitest';
import { unconfirmedLabel } from '../../src/lib/unconfirmed';

describe('unconfirmedLabel（［要確認］は本番に出さない）', () => {
  test.each(['preview', 'test'] as const)('%s では［要確認：…］として表示する', (env) => {
    expect(unconfirmedLabel('経歴を一文で', env)).toBe('［要確認：経歴を一文で］');
  });

  test('本番ではビルドを止める', () => {
    expect(() => unconfirmedLabel('経歴を一文で', 'production')).toThrow('経歴を一文で');
  });
});
