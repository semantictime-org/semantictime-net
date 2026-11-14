import { describe, expect, test } from 'vitest';

describe('test runner', () => {
  test('runs unit tests', () => {
    // Arrange
    const value = 1 + 1;
    // Act & Assert
    expect(value).toBe(2);
  });
});
