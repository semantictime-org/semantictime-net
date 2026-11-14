import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      reporter: ['text-summary'],
      // テスト設計 6.2 の合格基準: src/lib は 80% 以上、判定ロジックは分岐 100%
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
        'src/lib/publish-cap.ts': { branches: 100, lines: 100, functions: 100, statements: 100 },
      },
    },
  },
});
