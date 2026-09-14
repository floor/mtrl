import { beforeAll, describe, expect, test } from 'bun:test';
import { compileString } from 'sass';

// Compose IconButtonTokens.kt, FilledIconButtonTokens.kt,
// FilledTonalIconButtonTokens.kt and OutlinedIconButtonTokens.kt.
let css: string;
const root = '.mtrl-icon-button';
const value = (selector: string, property: string) =>
  Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .filter(([, selectors]) => selectors.split(',').some(s => s.trim() === selector))
    .flatMap(([, , declarations]) => Array.from(declarations.matchAll(/([\w-]+):\s*([^;]+);/g)))
    .filter(([, name]) => name === property)
    .map(([, , result]) => result.trim()).pop();
const colour = (token: string) => `var(--mtrl-sys-color-${token})`;
const alpha = (opacity: number) => `color-mix(in srgb, ${colour('on-surface')} ${opacity}%, transparent)`;

beforeAll(() => {
  css = compileString("@use 'components/icon-button';", { loadPaths: ['src/styles'] }).css;
});

describe('icon button colour tokens', () => {
  for (const [variant, container, icon] of [
    ['standard', 'transparent', 'on-surface-variant'],
    ['filled', 'primary', 'on-primary'],
    ['tonal', 'secondary-container', 'on-secondary-container'],
    ['outlined', 'transparent', 'on-surface-variant'],
  ]) {
    test(`${variant}: plain palette is also the toggle fallback`, () => {
      expect(value(`${root}--${variant}`, 'background-color')).toBe(container === 'transparent' ? container : colour(container));
      expect(value(`${root}--${variant}`, 'color')).toBe(colour(icon));
    });
    for (const disabled of [':disabled', `${root}--disabled`]) {
      test(`${variant}: ${disabled} overrides selected and unselected colours`, () => {
        const selector = `${root}${disabled}${root}--${variant}`;
        expect(value(selector, 'color')).toBe(alpha(38));
        if (variant === 'filled' || variant === 'tonal') {
          expect(value(selector, 'background-color')).toBe(alpha(10));
        }
        if (variant === 'outlined') {
          expect(value(selector, 'border-color')).toBe(colour('outline-variant'));
          expect(value(`${selector}${root}--selected`, 'background-color')).toBe(alpha(10));
          expect(value(`${selector}${root}--selected`, 'border-color')).toBe('transparent');
        }
        // Disabled variant rules have three class/pseudo-class selectors and
        // follow the equally specific filled unselected selector in source order.
        expect(css.indexOf(selector)).toBeGreaterThan(css.indexOf(`${root}--filled${root}--toggle:not(${root}--selected)`));
      });
    }
  }

  test('filled unselected toggle uses the surface container palette', () => {
    const selector = `${root}--filled${root}--toggle:not(${root}--selected)`;
    expect(value(selector, 'background-color')).toBe(colour('surface-container'));
    expect(value(selector, 'color')).toBe(colour('on-surface-variant'));
  });

  test('tonal selected toggle uses secondary; unselected inherits the plain palette', () => {
    expect(value(`${root}--tonal${root}--selected`, 'background-color')).toBe(colour('secondary'));
    expect(value(`${root}--tonal${root}--selected`, 'color')).toBe(colour('on-secondary'));
    expect(css).not.toContain(`${root}--tonal${root}--toggle:not(`);
  });

  test('outlined uses outline-variant and a selected inverse container with no visible outline', () => {
    expect(value(`${root}--outlined`, 'border')).toBe(`1px solid ${colour('outline-variant')}`);
    expect(value(`${root}--outlined${root}--selected`, 'background-color')).toBe(colour('inverse-surface'));
    expect(value(`${root}--outlined${root}--selected`, 'color')).toBe(colour('inverse-on-surface'));
    expect(value(`${root}--outlined${root}--selected`, 'border-color')).toBe('transparent');
  });

  test('standard selected stays primary even on hover', () => {
    expect(value(`${root}--standard${root}--selected`, 'color')).toBe(colour('primary'));
    expect(value(`${root}--standard:hover`, 'color')).toBeUndefined();
  });

  test('all state layers follow the icon colour with unchanged opacities', () => {
    expect(value(`${root}::before`, 'background-color')).toBe('currentColor');
    for (const [state, opacity] of [['hover', '0.08'], ['focus-visible', '0.1'], ['active', '0.1']]) {
      expect(value(`${root}:${state}::before`, 'opacity')).toBe(opacity);
    }
    for (const disabled of [':disabled', `${root}--disabled`]) {
      expect(value(`${root}${disabled}::before`, 'display')).toBe('none');
    }
    expect(css.match(/background-color: currentColor;/g)).toHaveLength(1);
    expect(css).not.toMatch(/--(?:filled|tonal|outlined)[^{]*::before/);
    expect(css).not.toContain('!important');
    expect(css).not.toContain('data-theme-mode');
  });
});
