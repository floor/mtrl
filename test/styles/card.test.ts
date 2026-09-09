// test/styles/card.test.ts
//
// The card stylesheet against the M3 tokens (Compose FilledCardTokens,
// ElevatedCardTokens and OutlinedCardTokens).
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

const LEVEL = {
  0: undefined,
  1: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
  2: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)'
};

beforeAll(() => {
  css = compileString(`@use 'components/card';`, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');
});

describe('card stylesheet', () => {
  test('a card has no width of its own', () => {
    // M3 cards are sized by their layout. A hard 344px meant every card in a
    // grid had to opt out of its own component.
    expect(value('.mtrl-card', 'width')).toBeUndefined();
    // the fixed sizes stay available as modifiers
    expect(value('.mtrl-card--small', 'width')).toBe('344px');
    expect(value('.mtrl-card--medium', 'width')).toBe('480px');
    expect(value('.mtrl-card--large', 'width')).toBe('624px');
    expect(value('.mtrl-card--full-width', 'width')).toBe('100%');
  });

  test('the corner is medium, as all three variants specify', () => {
    // ContainerShape is CornerMedium in every card token set
    expect(value('.mtrl-card', 'border-radius')).toBe('12px');
  });

  test('each variant takes its own container colour', () => {
    expect(value('.mtrl-card--elevated', 'background-color')).toBe('var(--mtrl-sys-color-surface-container-low)');
    expect(value('.mtrl-card--filled', 'background-color')).toBe('var(--mtrl-sys-color-surface-container-highest)');
    expect(value('.mtrl-card--outlined', 'background-color')).toBe('var(--mtrl-sys-color-surface)');
  });

  test('resting elevation differs by variant', () => {
    expect(value('.mtrl-card--elevated', 'box-shadow')).toBe(LEVEL[1]);
    expect(value('.mtrl-card--filled', 'box-shadow')).toBe('none');
    expect(value('.mtrl-card--outlined', 'box-shadow')).toBe('none');
  });

  test('every variant rises on hover, not only the elevated one', () => {
    // HoverContainerElevation: 2 for elevated, 1 for filled and outlined.
    // Filled and outlined used to take a state layer and no elevation at all.
    expect(value('.mtrl-card--elevated:hover.mtrl-card--interactive', 'box-shadow')).toBe(LEVEL[2]);
    expect(value('.mtrl-card--filled:hover.mtrl-card--interactive', 'box-shadow')).toBe(LEVEL[1]);
    expect(value('.mtrl-card--outlined:hover.mtrl-card--interactive', 'box-shadow')).toBe(LEVEL[1]);
  });

  test('the outline is outline-variant at rest and on-surface when focused', () => {
    // OutlineColor is OutlineVariant; the darker `outline` role was wrong, and
    // lightening it on hover was the wrong direction as well
    expect(value('.mtrl-card--outlined', 'border')).toBe('1px solid var(--mtrl-sys-color-outline-variant)');
    expect(value('.mtrl-card--outlined:hover.mtrl-card--interactive', 'border-color')).toBe('var(--mtrl-sys-color-outline-variant)');
    // FocusOutlineColor
    expect(value('.mtrl-card--outlined:focus-visible, .mtrl-card--outlined.mtrl-card--focused', 'border-color')).toBe('var(--mtrl-sys-color-on-surface)');
  });

  test('dragged elevation differs by variant', () => {
    // DraggedContainerElevation: 4 for elevated, 3 for the other two
    expect(value('.mtrl-card--elevated.mtrl-card--dragging', 'box-shadow')).toBeDefined();
    expect(value('.mtrl-card--filled.mtrl-card--dragging', 'box-shadow')).toBeDefined();
    expect(value('.mtrl-card--outlined.mtrl-card--dragging', 'box-shadow')).toBeDefined();
    expect(
      value('.mtrl-card--elevated.mtrl-card--dragging', 'box-shadow')
    ).not.toBe(value('.mtrl-card--filled.mtrl-card--dragging', 'box-shadow'));
    // and the opacity that was in no token is gone
    expect(value('.mtrl-card--dragging', 'opacity')).toBeUndefined();
  });

  test('disabled is treated per variant, not as one blanket fade', () => {
    // DisabledContainerColor differs: surface-variant for filled, surface for
    // elevated, and the outlined card fades its outline to 12%
    expect(value('.mtrl-card--filled.mtrl-card--state-disabled', 'background-color')).toBe('var(--mtrl-sys-color-surface-variant)');
    expect(value('.mtrl-card--elevated.mtrl-card--state-disabled', 'background-color')).toBe('var(--mtrl-sys-color-surface)');
    expect(value('.mtrl-card--outlined.mtrl-card--state-disabled', 'border-color')).toBe('color-mix(in srgb, var(--mtrl-sys-color-outline) 12%, transparent)');
    // the elevated card keeps its elevation while disabled
    expect(value('.mtrl-card--elevated.mtrl-card--state-disabled', 'box-shadow')).toBe(LEVEL[1]);
  });

  test('no corner is written as an unanimatable pill, and nothing shouts', () => {
    expect(css).not.toContain('9999px');
    expect(css).not.toContain('!important');
  });
});
