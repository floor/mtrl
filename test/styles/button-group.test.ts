// test/styles/button-group.test.ts
//
// Pins the compiled button group stylesheet to the Material 3 button group
// specs (m3.material.io, Compose ButtonGroupDefaults).
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
  css = compileString(`@use 'components/button-group';`, {
    loadPaths: ['src/styles'],
    style: 'expanded',
  }).css.replace(/,\n/g, ', ');
});

describe('button group stylesheet', () => {
  test('the group is a flex row spaced by the size gap; buttons follow the container height', () => {
    expect(value('.mtrl-button-group', 'gap')).toBe('var(--button-group-gap, 12px)');
    expect(value('.mtrl-button-group > .mtrl-button, .mtrl-button-group > .mtrl-icon-button', 'height')).toBe('var(--button-group-height)');
  });

  test('buttons keep their own colours: the group paints no containers, borders or dividers', () => {
    expect(css).not.toMatch(/background-color:/);
    expect(css).not.toMatch(/border(-right|-bottom|-color)?:/);
    expect(css).not.toMatch(/box-shadow:/);
    expect(css).not.toContain('opacity: 0.38');
  });

  test('connected: square inner corners, round outer corners, 4dp pressed inner corners, pill when selected', () => {
    const all = '.mtrl-button-group--connected > .mtrl-button, .mtrl-button-group--connected > .mtrl-icon-button';
    expect(value(all, '--mtrl-button-shape')).toBe('var(--button-group-inner-corner)');
    expect(value(all, '--mtrl-button-shape-pressed')).toBe('var(--button-group-pressed-corner)');
    expect(value(all, '--mtrl-button-shape-selected')).toBe('var(--button-group-radius)');
    expect(value('.mtrl-button-group--connected > .mtrl-button-group__button--first', '--mtrl-button-shape'))
      .toBe('var(--button-group-radius) var(--button-group-inner-corner) var(--button-group-inner-corner) var(--button-group-radius)');
    expect(value('.mtrl-button-group--connected > .mtrl-button-group__button--last', '--mtrl-button-shape-pressed'))
      .toBe('var(--button-group-pressed-corner) var(--button-group-radius) var(--button-group-radius) var(--button-group-pressed-corner)');
    expect(value('.mtrl-button-group--connected.mtrl-button-group--vertical > .mtrl-button-group__button--first', '--mtrl-button-shape'))
      .toBe('var(--button-group-radius) var(--button-group-radius) var(--button-group-inner-corner) var(--button-group-inner-corner)');
  });

  test('square connected groups use the inner corner size outside too', () => {
    const outer = '.mtrl-button-group--connected.mtrl-button-group--square > .mtrl-button-group__button--first, .mtrl-button-group--connected.mtrl-button-group--square > .mtrl-button-group__button--last, .mtrl-button-group--connected.mtrl-button-group--square > .mtrl-button-group__button--single';
    expect(value(outer, '--mtrl-button-shape')).toBe('var(--button-group-inner-corner)');
  });

  test('xs and s connected groups keep a 48dp minimum width', () => {
    const sel = '.mtrl-button-group--connected.mtrl-button-group--size-xs > .mtrl-button, .mtrl-button-group--connected.mtrl-button-group--size-xs > .mtrl-icon-button, .mtrl-button-group--connected.mtrl-button-group--size-s > .mtrl-button, .mtrl-button-group--connected.mtrl-button-group--size-s > .mtrl-icon-button';
    expect(value(sel, 'min-width')).toBe('48px');
  });

  test('standard groups leave the shape to the buttons', () => {
    expect(rules('.mtrl-button-group--standard > .mtrl-button')).toHaveLength(0);
    expect(css).not.toContain('.mtrl-button-group--standard');
  });

  test('labels shown on the selected button only', () => {
    expect(value('.mtrl-button-group--labels-selected > .mtrl-button', 'gap')).toBe('0');
    expect(value('.mtrl-button-group--labels-selected > .mtrl-button .mtrl-button-text', 'max-width')).toBe('0');
    expect(value('.mtrl-button-group--labels-selected > .mtrl-button-group__button--selected', 'gap')).toBe('8px');
    expect(value('.mtrl-button-group--labels-selected > .mtrl-button-group__button--selected .mtrl-button-text', 'max-width')).toBe('12em');
  });
});
