// test/styles/split-button.test.ts
//
// The split button stylesheet against the M3 tokens (Compose
// SplitButtonXSmallTokens through SplitButtonXLargeTokens and
// m3.material.io/components/split-button/specs).
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
  css = compileString(`@use 'components/split-button';`, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');
});

describe('split button stylesheet', () => {
  test('the two halves sit 2dp apart in one inline row', () => {
    expect(value('.mtrl-split-button', 'display')).toBe('inline-flex');
    expect(value('.mtrl-split-button', 'gap')).toBe('2px');
    expect(value('.mtrl-split-button', 'align-items')).toBe('stretch');
  });

  test('heights follow the button scale', () => {
    const heights: Record<string, string> = { xs: '32px', s: '40px', m: '56px', l: '96px', xl: '136px' };
    for (const [size, height] of Object.entries(heights)) {
      expect(value(`.mtrl-split-button--${size} .mtrl-button`, 'height')).toBe(height);
    }
  });

  test('the outer corners are a pill and the inner ones follow the size', () => {
    expect(value('.mtrl-split-button .mtrl-button', 'border-start-start-radius')).toBe('9999px');
    const inner: Record<string, string> = { xs: '4px', s: '4px', m: '4px', l: '8px', xl: '12px' };
    for (const [size, corner] of Object.entries(inner)) {
      expect(value(`.mtrl-split-button--${size} .mtrl-split-button__leading`, 'border-start-end-radius')).toBe(corner);
      expect(value(`.mtrl-split-button--${size} .mtrl-split-button__trailing`, 'border-start-start-radius')).toBe(corner);
    }
  });

  test('the inner corners grow when the button is hovered, focused or pressed', () => {
    const active: Record<string, string> = { xs: '8px', s: '12px', m: '12px', l: '20px', xl: '20px' };
    for (const [size, corner] of Object.entries(active)) {
      const selector = `.mtrl-split-button--${size} .mtrl-split-button__leading:hover, .mtrl-split-button--${size} .mtrl-split-button__leading:focus-visible, .mtrl-split-button--${size} .mtrl-split-button__leading:active`;
      expect(value(selector, 'border-start-end-radius')).toBe(corner);
    }
  });

  test('the leading and trailing spaces come from the tokens', () => {
    const leading: Record<string, string> = { xs: '12px 10px', s: '16px 12px', m: '24px 24px', l: '48px 48px', xl: '64px 64px' };
    for (const [size, padding] of Object.entries(leading)) {
      expect(value(`.mtrl-split-button--${size} .mtrl-split-button__leading`, 'padding-inline')).toBe(padding);
    }
    const trailing: Record<string, string> = { xs: '13px', s: '13px', m: '15px', l: '29px', xl: '43px' };
    for (const [size, padding] of Object.entries(trailing)) {
      expect(value(`.mtrl-split-button--${size} .mtrl-split-button__trailing`, 'padding-inline')).toBe(padding);
    }
  });

  test('the chevron is sized per size and sits off centre until the menu opens', () => {
    const icons: Record<string, string> = { xs: '22px', s: '22px', m: '26px', l: '38px', xl: '50px' };
    for (const [size, icon] of Object.entries(icons)) {
      expect(value(`.mtrl-split-button--${size} .mtrl-split-button__trailing .mtrl-split-button__chevron`, 'width')).toBe(icon);
    }
    const offsets: Record<string, string> = { xs: '1px', s: '1px', m: '2px', l: '3px', xl: '6px' };
    for (const [size, offset] of Object.entries(offsets)) {
      expect(value(`.mtrl-split-button--${size} .mtrl-split-button__trailing .mtrl-split-button__chevron`, 'translate')).toBe(`calc(-1 * ${offset}) 0`);
      // and it mirrors in right-to-left
      expect(value(`[dir=rtl] .mtrl-split-button--${size} .mtrl-split-button__trailing .mtrl-split-button__chevron`, 'translate')).toBe(`${offset} 0`);
    }
  });

  test('open: the inner corner rounds off, the icon centres and the chevron turns over', () => {
    expect(value('.mtrl-split-button--expanded .mtrl-split-button__trailing', 'border-start-start-radius')).toBe('9999px');
    expect(value('.mtrl-split-button--expanded .mtrl-split-button__trailing .mtrl-split-button__chevron', 'rotate')).toBe('180deg');
    expect(value('.mtrl-split-button--expanded .mtrl-split-button__trailing .mtrl-split-button__chevron', 'translate')).toBe('0 0');
  });

  test('the short sizes still offer a 48dp target', () => {
    const selector = '.mtrl-split-button--xs .mtrl-button::after, .mtrl-split-button--s .mtrl-button::after';
    expect(value(selector, 'height')).toBe('48px');
    expect(value(selector, 'min-height')).toBe('100%');
    expect(value(selector, 'position')).toBe('absolute');
  });

  test('nothing hard-codes a colour: both halves are the library button', () => {
    expect(css).not.toMatch(/#[0-9a-f]{6}/i);
    expect(css).not.toMatch(/background-color:\s*(?!inherit|transparent)/);
  });
});
