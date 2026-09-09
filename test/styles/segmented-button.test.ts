// test/styles/segmented-button.test.ts
//
// The segmented button stylesheet. Segments are buttons, so the point of most
// of these is that the segment shape is handed to the button through its own
// hooks rather than declared over the top of it.
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
  css = compileString(`@use 'components/segmented-button';`, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');
});

const segment = '.mtrl-segmented-button .mtrl-button';

describe('segmented button stylesheet', () => {
  test('it wins on specificity, never on !important', () => {
    // Every segment selector already carries the container class, so it
    // outranks the button stylesheet on its own. The corner rules used to be
    // restated for each state and each variant just to force the point.
    expect(css).not.toContain('!important');
  });

  test('segments are square, through the button shape hooks', () => {
    expect(value(segment, '--mtrl-button-shape')).toBe('0');
    expect(value(segment, '--mtrl-button-shape-pressed')).toBe('0');
    expect(value(segment, '--mtrl-button-shape-selected')).toBe('0');
    // and not by declaring the radius over the button
    expect(value(segment, 'border-radius')).toBeUndefined();
  });

  test('only the ends of the container round off', () => {
    const round = 'var(--segment-border-radius)';
    expect(value(`${segment}:first-child`, '--mtrl-button-shape')).toBe(`${round} 0 0 ${round}`);
    expect(value(`${segment}:last-child`, '--mtrl-button-shape')).toBe(`0 ${round} ${round} 0`);
    expect(value(`${segment}:only-child`, '--mtrl-button-shape')).toBe(round);
  });

  test('an end segment keeps its shape while pressed and while selected', () => {
    // The button morphs its corners on press, which would break the container
    // silhouette if the segment did not pin all three hooks
    const round = 'var(--segment-border-radius)';
    for (const hook of ['--mtrl-button-shape', '--mtrl-button-shape-pressed', '--mtrl-button-shape-selected']) {
      expect(value(`${segment}:first-child`, hook)).toBe(`${round} 0 0 ${round}`);
      expect(value(`${segment}:last-child`, hook)).toBe(`0 ${round} ${round} 0`);
    }
  });

  test('the container rounds to half its height, and density lowers both', () => {
    expect(value('.mtrl-segmented-button', 'border-radius')).toBe('calc(var(--segment-height) / 2)');
    expect(value('.mtrl-segmented-button', '--segment-height')).toBe('40px');
    expect(value('.mtrl-segmented-button--comfortable', '--segment-height')).toBe('36px');
    expect(value('.mtrl-segmented-button--comfortable', '--segment-border-radius')).toBe('18px');
    expect(value('.mtrl-segmented-button--compact', '--segment-height')).toBe('32px');
    expect(value('.mtrl-segmented-button--compact', '--segment-border-radius')).toBe('16px');
  });

  test('the segment takes over the state layer rather than fighting it', () => {
    // .mtrl-segmented-button .mtrl-button::before outranks .mtrl-button::before
    expect(value(`${segment}::before`, 'content')).toBe('none');
    expect(value(`${segment}:hover:not([disabled])`, 'background-color')).toContain('on-surface) 8%');
    expect(value(`${segment}:active:not([disabled])`, 'background-color')).toContain('on-surface) 12%');
  });

  test('a divider sits on every segment but the last', () => {
    expect(value(`${segment}:not(:last-child)::after`, 'width')).toBe('1px');
    expect(value(`${segment}:not(:last-child)::after`, 'background-color')).toBe('var(--mtrl-sys-color-outline)');
  });
});
