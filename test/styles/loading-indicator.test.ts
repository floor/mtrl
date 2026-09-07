// test/styles/loading-indicator.test.ts
//
// The loading indicator stylesheet against LoadingIndicatorTokens.kt.
import { describe, test, expect, beforeAll } from 'bun:test';
import { compileString } from 'sass';

let css = '';

const rules = (selector: string): string[] => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(css.matchAll(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g')), (m) => m[2]);
};

const value = (selector: string, property: string): string | undefined =>
  rules(selector)
    .map((block) => block.match(new RegExp(`(?:^|;|\\n)\\s*${property}\\s*:\\s*([^;]+);`))?.[1].trim())
    .filter((v): v is string => v !== undefined)
    .pop();

beforeAll(() => {
  css = compileString(`@use 'components/loading-indicator';`, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');
});

describe('loading indicator stylesheet', () => {
  test('a 48dp round container by default, the indicator in primary', () => {
    expect(value('.mtrl-loading-indicator', '--mtrl-loading-indicator-size')).toBe('48px');
    expect(value('.mtrl-loading-indicator', 'width')).toBe('var(--mtrl-loading-indicator-size)');
    expect(value('.mtrl-loading-indicator', 'height')).toBe('var(--mtrl-loading-indicator-size)');
    expect(value('.mtrl-loading-indicator', 'color')).toBe('var(--mtrl-sys-color-primary)');
    expect(value('.mtrl-loading-indicator', 'border-radius')).toBe('9999px');
    expect(value('.mtrl-loading-indicator', 'background-color')).toBeUndefined();
  });

  test('contained: primary-container circle, indicator in on-primary-container', () => {
    expect(value('.mtrl-loading-indicator--contained', 'background-color')).toBe('var(--mtrl-sys-color-primary-container)');
    expect(value('.mtrl-loading-indicator--contained', 'color')).toBe('var(--mtrl-sys-color-on-primary-container)');
  });

  test('the canvas fills the container', () => {
    expect(value('.mtrl-loading-indicator__canvas', 'width')).toBe('100%');
    expect(value('.mtrl-loading-indicator__canvas', 'display')).toBe('block');
  });
});
