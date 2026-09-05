// test/styles/button.test.ts
//
// Pins the compiled button stylesheet to the Material 3 button tokens
// (Compose Material 3 Button*Tokens.kt and ButtonDefaults).
import { describe, test, expect, beforeAll } from 'bun:test';
import { compileString } from 'sass';

let css = '';

/** Returns the declarations of the first rule whose selector list matches. */
const rule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[2] : '';
};

const rules = (selector: string): string[] => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(css.matchAll(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g')), (m) => m[2]);
};

const declaration = (block: string, property: string): string | undefined => {
  const match = block.match(new RegExp(`(?:^|;|\\n)\\s*${property}\\s*:\\s*([^;]+);`));
  return match?.[1].trim();
};

/** Last value declared for a property across every rule with that selector. */
const value = (selector: string, property: string): string | undefined =>
  rules(selector)
    .map((block) => declaration(block, property))
    .filter((v): v is string => v !== undefined)
    .pop();

beforeAll(() => {
  css = compileString(`@use 'components/button';`, {
    loadPaths: ['src/styles'],
    style: 'expanded',
  }).css.replace(/,\n/g, ', ');
});

describe('button stylesheet: sizes (ButtonXSmall…XLargeTokens.kt)', () => {
  const sizes: Record<string, { height: string; padding: string; gap: string; icon: string; font: string }> = {
    xs: { height: '32px', padding: '0 12px', gap: '8px', icon: '20px', font: '14px' },
    s: { height: '40px', padding: '0 16px', gap: '8px', icon: '20px', font: '14px' },
    m: { height: '56px', padding: '0 24px', gap: '8px', icon: '24px', font: '16px' },
    l: { height: '96px', padding: '0 48px', gap: '12px', icon: '32px', font: '24px' },
    xl: { height: '136px', padding: '0 64px', gap: '16px', icon: '40px', font: '32px' },
  };

  for (const [size, expected] of Object.entries(sizes)) {
    test(`${size}: container, spacing, icon and label`, () => {
      const block = rule(`.mtrl-button--${size}`);
      expect(declaration(block, 'height')).toBe(expected.height);
      expect(declaration(block, 'padding')).toBe(expected.padding);
      expect(declaration(block, 'gap')).toBe(expected.gap);
      expect(declaration(block, 'font-size')).toBe(expected.font);
      expect(value(`.mtrl-button--${size} .mtrl-button-icon, .mtrl-button--${size} .mtrl-button-progress, .mtrl-button--${size} .mtrl-button-progress.mtrl-progress`, 'width')).toBe(expected.icon);
    });
  }

  test('the default button is the s size', () => {
    const block = rule('.mtrl-button');
    expect(declaration(block, 'height')).toBe('40px');
    expect(declaration(block, 'padding')).toBe('0 16px');
    expect(declaration(block, 'min-width')).toBe('58px');
    expect(declaration(block, 'border-radius')).toBe('var(--mtrl-button-shape, 9999px)');
  });

  test('xs and s extend the hit area to a 48dp target', () => {
    const block = rule('.mtrl-button--xs::after, .mtrl-button--s::after');
    expect(declaration(block, 'height')).toBe('48px');
    expect(declaration(block, 'left')).toBe('0');
    expect(declaration(block, 'right')).toBe('0');
    expect(rule('.mtrl-button--m::after')).toBe('');
  });
});

describe('button stylesheet: shapes', () => {
  // Shapes read through the --mtrl-button-shape* hooks so a container can override them
  const shape = (v: string) => `var(--mtrl-button-shape, ${v})`;
  const pressedShape = (v: string) => `var(--mtrl-button-shape-pressed, ${v})`;
  const selectedShape = (v: string) => `var(--mtrl-button-shape-selected, ${v})`;

  test('square container shape per size', () => {
    expect(value('.mtrl-button--xs.mtrl-button--square', 'border-radius')).toBe(shape('12px'));
    expect(value('.mtrl-button--s.mtrl-button--square', 'border-radius')).toBe(shape('12px'));
    expect(value('.mtrl-button--m.mtrl-button--square', 'border-radius')).toBe(shape('16px'));
    expect(value('.mtrl-button--l.mtrl-button--square', 'border-radius')).toBe(shape('28px'));
    expect(value('.mtrl-button--xl.mtrl-button--square', 'border-radius')).toBe(shape('28px'));
  });

  test('pressed container shape per size', () => {
    const pressed = (size: string) =>
      value(`.mtrl-button--${size}:active, .mtrl-button--${size}.mtrl-button--active`, 'border-radius');
    expect(pressed('xs')).toBe(pressedShape('8px'));
    expect(pressed('s')).toBe(pressedShape('8px'));
    expect(pressed('m')).toBe(pressedShape('12px'));
    expect(pressed('l')).toBe(pressedShape('16px'));
    expect(pressed('xl')).toBe(pressedShape('16px'));
  });

  test('the pressed shape is declared after the square shape', () => {
    expect(css.indexOf('.mtrl-button--s:active')).toBeGreaterThan(css.indexOf('.mtrl-button--s.mtrl-button--square'));
  });
});

describe('button stylesheet: colour styles', () => {
  test('content colour per style', () => {
    expect(value('.mtrl-button--filled', 'color')).toBe('var(--mtrl-sys-color-on-primary)');
    expect(value('.mtrl-button--filled', 'background-color')).toBe('var(--mtrl-sys-color-primary)');
    expect(value('.mtrl-button--elevated', 'color')).toBe('var(--mtrl-sys-color-primary)');
    expect(value('.mtrl-button--elevated', 'background-color')).toBe('var(--mtrl-sys-color-surface-container-low)');
    expect(value('.mtrl-button--tonal', 'color')).toBe('var(--mtrl-sys-color-on-secondary-container)');
    expect(value('.mtrl-button--tonal', 'background-color')).toBe('var(--mtrl-sys-color-secondary-container)');
    expect(value('.mtrl-button--outlined', 'color')).toBe('var(--mtrl-sys-color-on-surface-variant)');
    expect(value('.mtrl-button--outlined', 'border')).toBe('1px solid var(--mtrl-sys-color-outline-variant)');
    expect(value('.mtrl-button--text', 'color')).toBe('var(--mtrl-sys-color-primary)');
  });

  test('outline width grows with the size', () => {
    expect(value('.mtrl-button--m.mtrl-button--outlined', 'border-width')).toBe('1px');
    expect(value('.mtrl-button--l.mtrl-button--outlined', 'border-width')).toBe('2px');
    expect(value('.mtrl-button--xl.mtrl-button--outlined', 'border-width')).toBe('3px');
  });

  test('state layers use the content colour at the hover, focus and pressed opacity', () => {
    const layer = (selector: string) => ({
      color: value(selector, 'background-color'),
      opacity: value(selector, 'opacity'),
    });
    expect(layer('.mtrl-button--filled:hover::before')).toEqual({ color: 'var(--mtrl-sys-color-on-primary)', opacity: '0.08' });
    expect(layer('.mtrl-button--outlined:focus-visible::before').color).toBe('var(--mtrl-sys-color-on-surface-variant)');
    expect(layer('.mtrl-button--text:active::before, .mtrl-button--text.mtrl-button--active::before').color).toBe('var(--mtrl-sys-color-primary)');
  });

  test('text button padding', () => {
    expect(value('.mtrl-button--text', 'padding')).toBe('0 12px');
    expect(value('.mtrl-button--text.mtrl-button--icon', 'padding')).toBe('0 16px 0 12px');
    expect(value('.mtrl-button--text.mtrl-button--m', 'padding')).toBe('0 24px');
  });

  test('small button keeps 12dp on the icon side', () => {
    expect(value('.mtrl-button--s.mtrl-button--icon', 'padding-left')).toBe('12px');
  });
});

describe('button stylesheet: states', () => {
  test('disabled uses on-surface roles', () => {
    const block = rule('.mtrl-button:disabled');
    expect(declaration(block, 'color')).toBe('color-mix(in srgb, var(--mtrl-sys-color-on-surface-variant) 38%, transparent)');
    expect(declaration(block, 'background-color')).toBe('color-mix(in srgb, var(--mtrl-sys-color-on-surface) 10%, transparent)');
    expect(value('.mtrl-button--outlined:disabled', 'background-color')).toBe('transparent');
    expect(value('.mtrl-button--text:disabled', 'background-color')).toBe('transparent');
    expect(css).not.toContain('on-surface-dim');
  });

  test('focus ring is 3px secondary, 2px outside the container', () => {
    const block = rule('.mtrl-button:focus-visible');
    expect(declaration(block, 'outline')).toBe('3px solid var(--mtrl-sys-color-secondary)');
    expect(declaration(block, 'outline-offset')).toBe('2px');
  });

  test('elevation: filled and tonal rise to level 1 on hover, elevated rests at 1 and rises to 2', () => {
    expect(value('.mtrl-button--filled:hover', 'box-shadow')).toContain('0px 1px 3px 1px');
    expect(value('.mtrl-button--tonal:hover', 'box-shadow')).toContain('0px 1px 3px 1px');
    expect(value('.mtrl-button--elevated', 'box-shadow')).toContain('0px 1px 3px 1px');
    expect(value('.mtrl-button--elevated:hover', 'box-shadow')).toContain('0px 2px 6px 2px');
  });

  test('progress no longer forces a shape or padding', () => {
    expect(css).not.toMatch(/--progress[^{]*\{[^}]*border-radius/);
  });
});

describe('button stylesheet: toggle buttons (ToggleButtonDefaults)', () => {
  test('unselected filled toggle drops to surface-container', () => {
    expect(value('.mtrl-button--toggle.mtrl-button--filled', 'background-color')).toBe('var(--mtrl-sys-color-surface-container)');
    expect(value('.mtrl-button--toggle.mtrl-button--filled', 'color')).toBe('var(--mtrl-sys-color-on-surface-variant)');
  });

  test('selected colours per style', () => {
    const selected = (variant: string, property: string) =>
      value(`.mtrl-button--toggle.mtrl-button--selected.mtrl-button--${variant}`, property);
    expect(selected('filled', 'background-color')).toBe('var(--mtrl-sys-color-primary)');
    expect(selected('filled', 'color')).toBe('var(--mtrl-sys-color-on-primary)');
    expect(selected('elevated', 'background-color')).toBe('var(--mtrl-sys-color-primary)');
    expect(selected('tonal', 'background-color')).toBe('var(--mtrl-sys-color-secondary)');
    expect(selected('tonal', 'color')).toBe('var(--mtrl-sys-color-on-secondary)');
    expect(selected('outlined', 'background-color')).toBe('var(--mtrl-sys-color-inverse-surface)');
    expect(selected('outlined', 'color')).toBe('var(--mtrl-sys-color-inverse-on-surface)');
    expect(selected('outlined', 'border-color')).toBe('transparent');
    expect(rule('.mtrl-button--toggle.mtrl-button--selected.mtrl-button--text')).toBe('');
  });

  test('selected swaps the resting shape', () => {
    expect(value('.mtrl-button--toggle.mtrl-button--selected.mtrl-button--s', 'border-radius')).toBe('var(--mtrl-button-shape-selected, 12px)');
    expect(value('.mtrl-button--toggle.mtrl-button--selected.mtrl-button--m', 'border-radius')).toBe('var(--mtrl-button-shape-selected, 16px)');
    expect(value('.mtrl-button--toggle.mtrl-button--selected.mtrl-button--xl', 'border-radius')).toBe('var(--mtrl-button-shape-selected, 28px)');
    expect(value('.mtrl-button--toggle.mtrl-button--selected.mtrl-button--square', 'border-radius')).toBe('var(--mtrl-button-shape-selected, 9999px)');
    expect(css.indexOf('.mtrl-button--toggle.mtrl-button--selected.mtrl-button--square')).toBeGreaterThan(
      css.indexOf('.mtrl-button--toggle.mtrl-button--selected.mtrl-button--xl'),
    );
  });

  test('selected buttons still take the pressed shape', () => {
    expect(value('.mtrl-button--toggle.mtrl-button--selected.mtrl-button--s:active, .mtrl-button--toggle.mtrl-button--selected.mtrl-button--s.mtrl-button--active', 'border-radius')).toBe('var(--mtrl-button-shape-pressed, 8px)');
  });

  test('disabled toggle buttons keep the disabled roles', () => {
    const block = rule('.mtrl-button--toggle:disabled, .mtrl-button--toggle.mtrl-button--selected:disabled');
    expect(declaration(block, 'background-color')).toBe('color-mix(in srgb, var(--mtrl-sys-color-on-surface) 10%, transparent)');
    expect(value('.mtrl-button--toggle.mtrl-button--outlined:disabled', 'background-color')).toBe('transparent');
  });
});
