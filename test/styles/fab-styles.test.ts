import { beforeAll, describe, expect, test } from 'bun:test';
import { compileString } from 'sass';
import { createBaseConfig as fabConfig } from '../../src/components/fab/config';
import { createBaseConfig as extendedConfig } from '../../src/components/extended-fab/config';
import { FAB_VARIANTS } from '../../src/components/fab/constants';
import { EXTENDED_FAB_VARIANTS } from '../../src/components/extended-fab/constants';

// FabPrimaryContainerTokens.kt, FabSecondaryContainerTokens.kt,
// ExtendedFabPrimaryTokens.kt; expressive colour names from the M3 specs.
let css: string;
const value = (selector: string, property: string) =>
  Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .filter(([, selectors]) => selectors.split(',').some(s => s.trim() === selector))
    .flatMap(([, , declarations]) => Array.from(declarations.matchAll(/([\w-]+):\s*([^;]+);/g)))
    .filter(([, name]) => name === property)
    .map(([, , result]) => result.trim()).pop();
const colour = (role: string) => `var(--mtrl-sys-color-${role})`;
const alpha = (opacity: number) => `color-mix(in srgb, ${colour('on-surface')} ${opacity}%, transparent)`;
const variants = ['primary-container', 'secondary-container', 'tertiary-container', 'primary', 'secondary', 'tertiary', 'surface'];

beforeAll(() => {
  css = compileString(`
    @use 'components/fab';
    @use 'components/extended-fab';
    @use 'abstract/mixins' as m;
    @for $level from 0 through 4 { .elevation-#{$level} { @include m.elevation($level); } }
  `, { loadPaths: ['src/styles'] }).css.replace(/\/\*[\s\S]*?\*\//g, '');
});

for (const component of ['fab', 'extended-fab']) {
  describe(`${component} expressive styles`, () => {
    const root = `.mtrl-${component}`;
    test('default configuration and base CSS use primary-container', () => {
      const config = component === 'fab' ? fabConfig : extendedConfig;
      const constants = component === 'fab' ? FAB_VARIANTS : EXTENDED_FAB_VARIANTS;
      expect(config({ ariaLabel: 'Compose' }).variant).toBe('primary-container');
      expect(Object.values(constants) as string[]).toEqual(variants);
      expect(value(root, 'background-color')).toBe(colour('primary-container'));
      expect(value(root, 'color')).toBe(colour('on-primary-container'));
      expect(value(root, 'box-shadow')).toBe(value('.elevation-3', 'box-shadow'));
    });
    for (const variant of variants) {
      test(`${variant} palette`, () => {
        expect(value(`${root}--${variant}`, 'background-color')).toBe(colour(variant));
        expect(value(`${root}--${variant}`, 'color')).toBe(colour(variant === 'surface' ? 'primary' : `on-${variant}`));
      });
    }
    for (const [state, level, opacity] of [['hover', 4, '0.08'], ['focus-visible', 3, '0.1'], ['active', 3, '0.1']] as const) {
      test(`${state} elevation and currentColor layer`, () => {
        expect(value(`${root}:${state}`, 'box-shadow')).toBe(value(`.elevation-${level}`, 'box-shadow'));
        expect(value(`${root}:${state}::before`, 'background-color')).toBe('currentColor');
        expect(value(`${root}:${state}::before`, 'opacity')).toBe(opacity);
      });
    }
    test('lowered rest/hover/focus/pressed use 1/2/1/1 and do not translate', () => {
      for (const [state, level] of [['', 1], [':hover', 2], [':focus-visible', 1], [':active', 1]]) {
        const selector = `${root}${root}--lowered${state}`;
        expect(value(selector, 'box-shadow')).toBe(value(`.elevation-${level}`, 'box-shadow'));
        expect(value(selector, 'transform')).toBeUndefined();
      }
      expect(css).not.toContain('translateY(1px)');
    });
    for (const disabled of [':disabled', `${root}--disabled`]) {
      test(`${disabled} uses the compatibility palette and zero elevation, including interactive states`, () => {
        const selector = `${root}${disabled}`;
        for (const state of ['', ':hover', ':focus-visible', ':active']) {
          expect(value(`${selector}${state}`, 'background-color')).toBe(alpha(12));
          expect(value(`${selector}${state}`, 'color')).toBe(alpha(38));
          expect(value(`${selector}${state}`, 'box-shadow')).toBe(value('.elevation-0', 'box-shadow'));
        }
        expect(value(`${selector}::before`, 'display')).toBe('none');
        expect(css.indexOf(selector)).toBeGreaterThan(css.indexOf(`${root}${root}--lowered:hover`));
      });
    }
  });
}
test('no fabricated dark roles, duplicate disabled scheme, or important overrides', () => {
  expect(css).not.toContain('on-surface-dim');
  expect(css).not.toContain('data-theme-mode');
  expect(css).not.toContain('!important');
});
