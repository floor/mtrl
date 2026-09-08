// test/styles/menu.test.ts
//
// The menu stylesheet against the M3 tokens (Compose MenuTokens.kt) and the
// baseline measurements on m3.material.io/components/menus/specs.
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
  css = compileString(`@use 'components/menu';`, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');
});

describe('menu stylesheet', () => {
  test('the container is surface-container at level 2 with a 4dp corner', () => {
    expect(value('.mtrl-menu', 'background-color')).toBe('var(--mtrl-sys-color-surface-container)');
    expect(value('.mtrl-menu', 'border-radius')).toBe('4px');
    expect(value('.mtrl-menu', 'box-shadow')).toBe('0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)');
    expect(value('.mtrl-menu', 'min-width')).toBe('112px');
    expect(value('.mtrl-menu', 'max-width')).toBe('280px');
    expect(value('.mtrl-menu', 'padding')).toBe('8px 0');
  });

  test('an item is 48dp tall, label-large, inset 12dp', () => {
    expect(value('.mtrl-menu-item', 'min-height')).toBe('48px');
    expect(value('.mtrl-menu-item', 'padding')).toBe('12px');
    expect(value('.mtrl-menu-item', 'font-size')).toBe('14px');
    expect(value('.mtrl-menu-item', 'color')).toBe('var(--mtrl-sys-color-on-surface)');
  });

  test('leading icons are 24dp in on-surface-variant, 12dp from the label', () => {
    expect(value('.mtrl-menu-item-icon svg', 'width')).toBe('24px');
    expect(value('.mtrl-menu-item-icon svg', 'height')).toBe('24px');
    expect(value('.mtrl-menu-item-icon', 'color')).toBe('var(--mtrl-sys-color-on-surface-variant)');
    expect(value('.mtrl-menu-item-icon', 'margin-inline-end')).toBe('12px');
  });

  test('a selected item takes the secondary-container roles and keeps its check', () => {
    expect(value('.mtrl-menu-item--selected', 'background-color')).toBe('var(--mtrl-sys-color-secondary-container)');
    expect(value('.mtrl-menu-item--selected', 'color')).toBe('var(--mtrl-sys-color-on-secondary-container)');
    // the check is the second cue the accessibility guidance asks for
    expect(rules('.mtrl-menu-item--selected::after').length).toBeGreaterThan(0);
    expect(value('.mtrl-menu-item--selected:hover::before', 'background-color')).toBe('var(--mtrl-sys-color-on-secondary-container)');
  });

  test('a disabled item is dimmed but still reachable', () => {
    expect(value('.mtrl-menu-item--disabled', 'color')).toBe('color-mix(in srgb, var(--mtrl-sys-color-on-surface) 38%, transparent)');
    // it can be focused and read; it just does nothing, so no pointer block
    expect(value('.mtrl-menu-item--disabled', 'pointer-events')).toBeUndefined();
    expect(value('.mtrl-menu-item--disabled', 'cursor')).toBe('default');
    expect(value('.mtrl-menu-item--disabled:hover::before, .mtrl-menu-item--disabled:active::before', 'opacity')).toBe('0');
  });

  test('the divider is 1dp of outline-variant with 8dp above and below', () => {
    expect(value('.mtrl-menu-divider', 'height')).toBe('1px');
    expect(value('.mtrl-menu-divider', 'margin')).toBe('8px 0');
    expect(value('.mtrl-menu-divider', 'background-color')).toBe('var(--mtrl-sys-color-outline-variant)');
  });

  test('it fades in with a scale, and reduced motion drops the scale quietly', () => {
    expect(value('.mtrl-menu', 'transform')).toBe('scale(0.8)');
    expect(value('.mtrl-menu--visible', 'transform')).toBe('scale(1)');
    expect(css).not.toContain('scaleY(');
    expect(css).not.toContain('!important');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[\s\S]{0,300}?transform: none;/);
  });
});
