// test/styles/snackbar.test.ts
//
// The snackbar stylesheet against the M3 tokens (Compose SnackbarTokens.kt,
// Snackbar.kt) and the component's DOM.
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
  css = compileString(`@use 'components/snackbar';`, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');
});

describe('snackbar stylesheet', () => {
  test('container: inverse surface, level 3, extra-small corner, 48dp for one line', () => {
    expect(value('.mtrl-snackbar', 'background-color')).toBe('var(--mtrl-sys-color-inverse-surface)');
    expect(value('.mtrl-snackbar', 'color')).toBe('var(--mtrl-sys-color-inverse-on-surface)');
    expect(value('.mtrl-snackbar', 'box-shadow')).toBe('0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)');
    expect(value('.mtrl-snackbar', 'border-radius')).toBe('4px');
    expect(value('.mtrl-snackbar', 'min-height')).toBe('48px');
    expect(value('.mtrl-snackbar', 'max-width')).toBe('600px');
    expect(value('.mtrl-snackbar', 'padding')).toBe('0 16px');
    expect(css).not.toContain('backdrop-filter');
    expect(css).not.toMatch(/rgba\(32, 33, 36/);
  });

  test('text: body-medium, two lines at most, 14dp above and below', () => {
    expect(value('.mtrl-snackbar', 'font-size')).toBe('14px');
    expect(value('.mtrl-snackbar', 'line-height')).toBe('20px');
    expect(value('.mtrl-snackbar-text', 'margin')).toBe('14px 0');
    expect(value('.mtrl-snackbar-text', 'overflow')).toBe('hidden');
    expect(value('.mtrl-snackbar-text', '-webkit-line-clamp')).toBe('2');
  });

  test('action: inverse-primary text button, 8dp from the text and from the edge, no case change', () => {
    expect(value('.mtrl-snackbar .mtrl-button.mtrl-snackbar-action', 'color')).toBe('var(--mtrl-sys-color-inverse-primary)');
    expect(value('.mtrl-snackbar .mtrl-button.mtrl-snackbar-action:hover::before', 'background-color')).toBe('var(--mtrl-sys-color-inverse-primary)');
    expect(value('.mtrl-snackbar .mtrl-button.mtrl-snackbar-action:hover::before', 'opacity')).toBe('0.08');
    expect(value('.mtrl-snackbar--with-action', 'padding-inline-end')).toBe('8px');
    expect(value('.mtrl-snackbar--with-action .mtrl-snackbar-text, .mtrl-snackbar--dismissible .mtrl-snackbar-text', 'padding-inline-end')).toBe('8px');
    expect(css).not.toContain('text-transform');
    expect(css).not.toMatch(/rgb\(138, 180, 248\)/);
  });

  test('close icon: inverse-on-surface, flush with the edge', () => {
    expect(value('.mtrl-snackbar .mtrl-icon-button.mtrl-snackbar-close', 'color')).toBe('var(--mtrl-sys-color-inverse-on-surface)');
    expect(value('.mtrl-snackbar--dismissible', 'padding-inline-end')).toBe('0');
  });

  test('a long action goes below the text, aligned to the end', () => {
    expect(value('.mtrl-snackbar--action-below', 'flex-wrap')).toBe('wrap');
    expect(value('.mtrl-snackbar--action-below .mtrl-snackbar-text', 'flex-basis')).toBe('100%');
    expect(value('.mtrl-snackbar--action-below .mtrl-snackbar-action', 'margin-inline-start')).toBe('auto');
  });

  test('enters with a fade and a scale on the fast springs; reduced motion keeps the fade', () => {
    expect(value('.mtrl-snackbar', 'scale')).toBe('0.8');
    expect(value('.mtrl-snackbar--visible', 'scale')).toBe('1');
    const transition = value('.mtrl-snackbar', 'transition') ?? '';
    expect(transition).toMatch(/opacity 175ms linear\(/);
    expect(transition).toMatch(/scale 425ms linear\(/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.mtrl-snackbar\s*\{[^}]*scale: none/);
  });

  test('positions are classes with logical insets; compact windows keep a fixed 16px from every edge', () => {
    expect(value('.mtrl-snackbar--center', 'translate')).toBe('-50% 0');
    expect(value('.mtrl-snackbar--start', 'inset-inline-start')).toBe('16px');
    expect(value('.mtrl-snackbar--end', 'inset-inline-end')).toBe('16px');
    expect(css).toMatch(/max-width: 599px\)\s*\{\s*\.mtrl-snackbar\s*\{[^}]*width: calc\(100% - 32px\)/);
    expect(css).not.toContain('.mtrl-snackbar--primary');
    expect(css).not.toContain('.mtrl-snackbar--multiline');
  });
});
