// test/styles/side-sheet.test.ts
//
// The stylesheet against the M3 side sheet specs and the Android
// implementation, since Compose has no side sheet tokens.
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
  css = compileString(`@use 'components/side-sheet';`, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');
});

describe('side sheet stylesheet', () => {
  test('the two variants differ in colour, not only behaviour', () => {
    // standard sits on surface, modal on surface-container-low
    expect(value('.mtrl-side-sheet--standard .mtrl-side-sheet-container', 'background-color')).toBe('var(--mtrl-sys-color-surface)');
    expect(value('.mtrl-side-sheet--modal .mtrl-side-sheet-container', 'background-color')).toBe('var(--mtrl-sys-color-surface-container-low)');
    // only the modal one floats
    expect(value('.mtrl-side-sheet--modal .mtrl-side-sheet-container', 'box-shadow')).toBe('0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)');
    expect(value('.mtrl-side-sheet--standard .mtrl-side-sheet-container', 'box-shadow')).toBeUndefined();
  });

  test('only the corners facing the page round, at CornerLarge', () => {
    // docked to the trailing edge: the leading corners round
    expect(value('.mtrl-side-sheet--end .mtrl-side-sheet-container', 'border-start-start-radius')).toBe('16px');
    expect(value('.mtrl-side-sheet--end .mtrl-side-sheet-container', 'border-end-start-radius')).toBe('16px');
    // and the mirror image when docked to the leading edge
    expect(value('.mtrl-side-sheet--start .mtrl-side-sheet-container', 'border-start-end-radius')).toBe('16px');
    expect(value('.mtrl-side-sheet--start .mtrl-side-sheet-container', 'border-end-end-radius')).toBe('16px');
  });

  test('positions are logical, so they follow the writing direction', () => {
    // no physical left/right anywhere: the radii and the slide are logical
    expect(css).not.toContain('border-top-left-radius');
    expect(css).not.toContain('border-bottom-right-radius');
    expect(value('.mtrl-side-sheet--end', 'justify-content')).toBe('flex-end');
    expect(value('.mtrl-side-sheet--start', 'justify-content')).toBe('flex-start');
  });

  test('it stops at 400dp', () => {
    // side sheet specs, container maximum width
    expect(value('.mtrl-side-sheet-container', 'max-width')).toBe('400px');
  });

  test('the header is 72dp with 24dp either side and 12dp between elements', () => {
    expect(value('.mtrl-side-sheet-header', 'min-height')).toBe('72px');
    expect(value('.mtrl-side-sheet-header', 'padding')).toBe('16px 24px');
    expect(value('.mtrl-side-sheet-header', 'gap')).toBe('12px');
    expect(value('.mtrl-side-sheet-content', 'padding')).toBe('0 24px 24px');
  });

  test('the scrim is 32% of the scrim role and hidden until it opens', () => {
    expect(value('.mtrl-side-sheet-scrim', 'background-color')).toBe('color-mix(in srgb, var(--mtrl-sys-color-scrim) 32%, transparent)');
    expect(value('.mtrl-side-sheet-scrim', 'opacity')).toBe('0');
    expect(value('.mtrl-side-sheet--open .mtrl-side-sheet-scrim', 'opacity')).toBe('1');
  });

  test('a closed sheet lets clicks through to the page behind it', () => {
    expect(value('.mtrl-side-sheet', 'pointer-events')).toBe('none');
    expect(value('.mtrl-side-sheet--open', 'pointer-events')).toBe('auto');
    // a standard sheet never blocks the page, open or not
    expect(value('.mtrl-side-sheet--standard', 'pointer-events')).toBe('none');
  });

  test('it slides in from its own edge, and stops for reduced motion', () => {
    expect(value('.mtrl-side-sheet--end .mtrl-side-sheet-container', 'transform')).toBe('translateX(100%)');
    expect(value('.mtrl-side-sheet--start .mtrl-side-sheet-container', 'transform')).toBe('translateX(-100%)');
    expect(value('.mtrl-side-sheet--open .mtrl-side-sheet-container', 'transform')).toBe('translateX(0)');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[\s\S]{0,300}?transition: none;/);
  });

  test('the close button is a 40dp target with a focus ring', () => {
    expect(value('.mtrl-side-sheet-close', 'width')).toBe('40px');
    expect(value('.mtrl-side-sheet-close', 'height')).toBe('40px');
    expect(value('.mtrl-side-sheet-close:focus-visible', 'outline')).toBe('3px solid var(--mtrl-sys-color-secondary)');
  });

  test('no corner is written as an unanimatable pill', () => {
    expect(css).not.toContain('9999px');
    expect(css).not.toContain('!important');
  });
});
