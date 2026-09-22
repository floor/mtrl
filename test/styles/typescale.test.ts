import { beforeAll, expect, test } from 'bun:test';
import { compileString } from 'sass';

// Compose TypeScaleTokens.kt v0_103 supplies baseline sizes, heights and weights.
// Preserve web tracking precision; this is not a rounding change.
const scale = [
  ['display-large', 57, 64, '-0.25px', 400],
  ['display-medium', 45, 52, '0', 400],
  ['display-small', 36, 44, '0', 400],
  ['headline-large', 32, 40, '0', 400],
  ['headline-medium', 28, 36, '0', 400],
  ['headline-small', 24, 32, '0', 400],
  ['title-large', 22, 28, '0', 400],
  ['title-medium', 16, 24, '0.15px', 500],
  ['title-small', 14, 20, '0.1px', 500],
  ['body-large', 16, 24, '0.5px', 400],
  ['body-medium', 14, 20, '0.25px', 400],
  ['body-small', 12, 16, '0.4px', 400],
  ['label-large', 14, 20, '0.1px', 500],
  ['label-medium', 12, 16, '0.5px', 500],
  ['label-small', 11, 16, '0.5px', 500],
] as const;
let css: string;
const value = (selector: string, property: string) =>
  Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .filter(([, selectors]) => selectors.split(',').some(s => s.trim() === selector))
    .flatMap(([, , declarations]) => Array.from(declarations.matchAll(/([\w-]+):\s*([^;]+);/g)))
    .filter(([, name]) => name === property).map(([, , result]) => result.trim()).pop();
beforeAll(() => { css = compileString("@use 'main';", { loadPaths: ['src/styles'] }).css.replace(/\/\*[\s\S]*?\*\//g, ''); });

for (const [role, size, height, tracking, weight] of scale) {
  test(`${role}: utility class and emitted system tokens agree with the baseline type scale`, () => {
    for (const [property, expected] of [
      ['font-size', `${size}px`], ['line-height', `${height}px`],
      ['letter-spacing', tracking], ['font-weight', String(weight)],
    ]) {
      expect(value(`.mtrl-${role}`, property)).toBe(expected);
      expect(value(':root', `--mtrl-sys-typescale-${role}-${property}`)).toBe(expected);
    }
    expect(value(`.mtrl-${role}`, 'font-family')).toBe('"Roboto", sans-serif');
    const face = /^(display|headline|title)-/.test(role) ? 'brand' : 'plain';
    expect(value(':root', `--mtrl-sys-typescale-${role}-font`)).toBe(`var(--mtrl-ref-typeface-${face})`);
  });
}

for (const selector of [
  'h4', '.mtrl-card__header-title', '.mtrl-dialog--fullscreen .mtrl-dialog__header-title',
  '.mtrl-extended-fab--medium .mtrl-extended-fab__text', '.mtrl-side-sheet__title',
  '.mtrl-top-app-bar__headline',
  '.mtrl-top-app-bar--scrolled.mtrl-top-app-bar--medium.mtrl-top-app-bar--compressible .mtrl-top-app-bar__headline',
  '.mtrl-top-app-bar--scrolled.mtrl-top-app-bar--large.mtrl-top-app-bar--compressible .mtrl-top-app-bar__headline',
]) {
  test(`${selector}: title-large consumers use regular 22px/28px`, () => {
    expect(value(selector, 'font-weight')).toBe('400');
    expect(value(selector, 'font-size')).toBe('22px');
    expect(value(selector, 'line-height')).toBe('28px');
  });
}
