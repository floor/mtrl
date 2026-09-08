// test/styles/dialog.test.ts
//
// The dialog stylesheet against the M3 measurements (DialogTokens.kt and
// m3.material.io/components/dialogs/specs).
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
  css = compileString(`@use 'components/dialog';`, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');
});

describe('dialog stylesheet', () => {
  test('the container is surface-container-high at level 3 with a 28dp corner', () => {
    expect(value('.mtrl-dialog', 'background-color')).toBe('var(--mtrl-sys-color-surface-container-high)');
    expect(value('.mtrl-dialog', 'color')).toBe('var(--mtrl-sys-color-on-surface)');
    expect(value('.mtrl-dialog', 'border-radius')).toBe('28px');
    expect(value('.mtrl-dialog', 'box-shadow')).toBe('0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)');
    expect(value('.mtrl-dialog', 'min-width')).toBe('280px');
    expect(value('.mtrl-dialog', 'max-width')).toBe('560px');
  });

  test('no basic dialog is wider than 560dp', () => {
    expect(value('.mtrl-dialog--small', 'max-width')).toBe('360px');
    expect(value('.mtrl-dialog--medium', 'max-width')).toBe('560px');
    expect(value('.mtrl-dialog--large', 'max-width')).toBe('560px');
  });

  test('24dp round the edge, 16dp title to body, 24dp body to actions', () => {
    expect(value('.mtrl-dialog-header', 'padding')).toBe('24px 24px 16px 24px');
    expect(value('.mtrl-dialog-content', 'padding')).toBe('0 24px');
    expect(value('.mtrl-dialog-footer', 'padding')).toBe('24px 24px 24px 24px');
    // a dialog with no actions still keeps its 24dp underneath
    expect(value('.mtrl-dialog-content:last-child', 'padding-bottom')).toBe('24px');
    expect(value('.mtrl-dialog-footer', 'gap')).toBe('8px');
  });

  test('the headline, the supporting text and the icon take their roles', () => {
    expect(value('.mtrl-dialog-header-title', 'color')).toBe('var(--mtrl-sys-color-on-surface)');
    expect(value('.mtrl-dialog-header-title', 'font-size')).toBe('24px');
    expect(value('.mtrl-dialog-content', 'color')).toBe('var(--mtrl-sys-color-on-surface-variant)');
    expect(value('.mtrl-dialog-icon', 'color')).toBe('var(--mtrl-sys-color-secondary)');
    expect(value('.mtrl-dialog-icon svg, .mtrl-dialog-icon .mtrl-dialog-icon-content', 'width')).toBe('24px');
  });

  test('a full-screen dialog has a 56dp header and action bar and no corner', () => {
    expect(value('.mtrl-dialog--fullscreen', 'border-radius')).toBe('0');
    expect(value('.mtrl-dialog--fullscreen .mtrl-dialog-header', 'min-height')).toBe('56px');
    expect(value('.mtrl-dialog--fullscreen .mtrl-dialog-footer', 'min-height')).toBe('56px');
    // the close affordance leads
    expect(value('.mtrl-dialog--fullscreen .mtrl-dialog-header-close', 'order')).toBe('-1');
    expect(value('.mtrl-dialog--fullscreen .mtrl-dialog-header-title', 'text-align')).toBe('start');
  });

  test('it fades in with a scale, and reduced motion drops the scale without shouting', () => {
    expect(value('.mtrl-dialog', 'transform')).toBe('scale(0.8)');
    expect(value('.mtrl-dialog--visible', 'transform')).toBe('scale(1)');
    expect(css).not.toContain('scaleY(0)');
    expect(css).not.toContain('!important');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[\s\S]{0,400}?transform: none;/);
  });

  test('the scrim covers the window and sits under the modal layer', () => {
    expect(value('.mtrl-dialog-overlay', 'position')).toBe('fixed');
    expect(value('.mtrl-dialog-overlay', 'background-color')).toContain('var(--mtrl-sys-color-scrim');
    expect(value('.mtrl-dialog-overlay', 'z-index')).toBe('1000');
  });
});
