import { beforeAll, expect, test } from 'bun:test';
import { compileString } from 'sass';
import { createBaseConfig } from '../../src/components/extended-fab/config';
import { EXTENDED_FAB_SIZES } from '../../src/components/extended-fab/constants';

// ExtendedFabSmall/Medium/LargeTokens.kt; Android efab_tokens.xml typography.
let css: string;
const value = (selector: string, property: string) =>
  Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .filter(([, selectors]) => selectors.split(',').some(s => s.trim() === selector))
    .flatMap(([, , declarations]) => Array.from(declarations.matchAll(/([\w-]+):\s*([^;]+);/g)))
    .filter(([, name]) => name === property).map(([, , result]) => result.trim()).pop();
const root = '.mtrl-extended-fab';
beforeAll(() => { css = compileString("@use 'components/extended-fab';", { loadPaths: ['src/styles'] }).css.replace(/\/\*[\s\S]*?\*\//g, ''); });
for (const [size, height, icon, padding, gap, radius, fontSize, lineHeight, weight] of [
  ['small',56,24,16,8,16,16,24,500],
  ['medium',80,28,26,16,20,22,28,400],
  ['large',96,32,28,20,28,24,32,400],
] as const) {
  test(`${size}: expressive dimensions and label type`, () => {
    const selector = `${root}--${size}`;
    for (const [name, expected] of [['height', height], ['icon-size', icon], ['padding', padding], ['gap', gap], ['radius', radius]]) {
      expect(value(selector, `--mtrl-extended-fab-${name}`)).toBe(`${expected}px`);
    }
    expect(value(`${selector} ${root}-text`, 'font-size')).toBe(`${fontSize}px`);
    expect(value(`${selector} ${root}-text`, 'line-height')).toBe(`${lineHeight}px`);
    expect(value(`${selector} ${root}-text`, 'font-weight')).toBe(String(weight));
    expect(EXTENDED_FAB_SIZES[size.toUpperCase() as keyof typeof EXTENDED_FAB_SIZES]).toBe(size);
  });
}
test('small is the configuration default and fallback geometry', () => {
  expect(createBaseConfig().size).toBe('small');
  expect(value(root, 'height')).toBe('var(--mtrl-extended-fab-height, 56px)');
  expect(value(root, 'padding')).toBe('0 var(--mtrl-extended-fab-padding, 16px)');
  expect(value(root, 'gap')).toBe('var(--mtrl-extended-fab-gap, 8px)');
  expect(value(`${root}-text`, 'font-size')).toBe('16px');
  expect(value(`${root}-text`, 'margin')).toBe('0');
  expect(css).not.toContain('margin-left: 12px');
});
test('icon wrapper and SVG follow the size without extra padding', () => {
  for (const selector of [`${root}-icon`, `${root}-icon svg`]) {
    expect(value(selector, 'width')).toBe('var(--mtrl-extended-fab-icon-size, 24px)');
    expect(value(selector, 'height')).toBe('var(--mtrl-extended-fab-icon-size, 24px)');
  }
  expect(value(`${root}-icon`, 'padding')).toBe('0');
});
test('collapsed uses the corresponding FAB box with no residual spacing or icon scaling', () => {
  const selector = `${root}--collapsed`;
  expect(value(selector, 'width')).toBe('var(--mtrl-extended-fab-height, 56px)');
  expect(value(selector, 'min-width')).toBe('var(--mtrl-extended-fab-height, 56px)');
  expect(value(selector, 'padding')).toBe('0');
  expect(value(selector, 'gap')).toBe('0');
  expect(value(`${selector} ${root}-icon`, 'transform')).toBe('scale(1)');
  expect(value(`${selector} ${root}-text`, 'width')).toBe('0');
  expect(value(`${selector} ${root}-text`, 'opacity')).toBe('0');
});
