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

  test('the focus layer is for keyboard navigation only', () => {
    // Focus moves into the menu however it was opened, so a plain `:focus`
    // marked the first item the moment the menu appeared under the pointer
    expect(value('.mtrl-menu-item:focus-visible::before', 'opacity')).toBe('0.1');
    expect(value('.mtrl-menu-item:focus::before', 'opacity')).toBeUndefined();
    expect(value('.mtrl-menu-item:focus', 'outline')).toBe('none');
    // the hover and pressed layers are unaffected
    expect(value('.mtrl-menu-item:hover::before', 'opacity')).toBe('0.08');
    expect(value('.mtrl-menu-item:active::before', 'opacity')).toBe('0.1');
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

  describe('the expressive vertical menu', () => {
    test('a 16dp container on surface-container-low, items 2dp apart', () => {
      expect(value('.mtrl-menu--vertical', 'border-radius')).toBe('16px');
      expect(value('.mtrl-menu--vertical', 'padding')).toBe('8px');
      expect(value('.mtrl-menu--vertical', 'background-color')).toBe('var(--mtrl-menu-container)');
      expect(value('.mtrl-menu--vertical', '--mtrl-menu-container')).toBe('var(--mtrl-sys-color-surface-container-low)');
      expect(value('.mtrl-menu--vertical .mtrl-menu-list', 'gap')).toBe('2px');
    });

    test('vibrant swaps the mapping to tertiary', () => {
      expect(value('.mtrl-menu--vertical.mtrl-menu--vibrant', '--mtrl-menu-container')).toBe('var(--mtrl-sys-color-tertiary-container)');
      expect(value('.mtrl-menu--vertical.mtrl-menu--vibrant', '--mtrl-menu-label')).toBe('var(--mtrl-sys-color-on-tertiary-container)');
      expect(value('.mtrl-menu--vertical.mtrl-menu--vibrant', '--mtrl-menu-selected-container')).toBe('var(--mtrl-sys-color-tertiary)');
      expect(value('.mtrl-menu--vertical.mtrl-menu--vibrant', '--mtrl-menu-selected-label')).toBe('var(--mtrl-sys-color-on-tertiary)');
    });

    test('an item is 44dp, body-large, and its shape is its state', () => {
      expect(value('.mtrl-menu--vertical .mtrl-menu-item', 'min-height')).toBe('44px');
      expect(value('.mtrl-menu--vertical .mtrl-menu-item', 'font-size')).toBe('16px');
      expect(value('.mtrl-menu--vertical .mtrl-menu-item', 'padding')).toBe('8px 16px');
      // 4dp at rest, 12dp once it is touched
      expect(value('.mtrl-menu--vertical .mtrl-menu-item', 'border-radius')).toBe('4px');
      const active = '.mtrl-menu--vertical .mtrl-menu-item:hover, .mtrl-menu--vertical .mtrl-menu-item:focus-visible, .mtrl-menu--vertical .mtrl-menu-item:active';
      expect(value(active, 'border-radius')).toBe('12px');
      expect(value('.mtrl-menu--vertical .mtrl-menu-item--selected', 'border-radius')).toBe('12px');
      // and the ends of the column round outwards
      expect(value('.mtrl-menu--vertical .mtrl-menu-item:first-child', 'border-start-start-radius')).toBe('12px');
      expect(value('.mtrl-menu--vertical .mtrl-menu-item:last-child', 'border-end-end-radius')).toBe('12px');
    });

    test('a selected item takes the tertiary roles; icons are 20dp', () => {
      expect(value('.mtrl-menu--vertical .mtrl-menu-item--selected', 'background-color')).toBe('var(--mtrl-menu-selected-container)');
      expect(value('.mtrl-menu--vertical .mtrl-menu-item--selected', 'color')).toBe('var(--mtrl-menu-selected-label)');
      expect(value('.mtrl-menu--vertical .mtrl-menu-item-icon svg', 'width')).toBe('20px');
      expect(value('.mtrl-menu--vertical .mtrl-menu-item-supporting', 'font-size')).toBe('14px');
      expect(value('.mtrl-menu--vertical .mtrl-menu-item-shortcut', 'font-size')).toBe('11px');
    });

    test('the container morphs to show which menu is active', () => {
      expect(value('.mtrl-menu--vertical.mtrl-menu--active', 'border-radius')).toBe('24px');
      expect(value('.mtrl-menu--vertical.mtrl-menu--inactive', 'border-radius')).toBe('8px');
    });
  });
});
