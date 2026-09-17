// test/styles/sheet-motion.test.ts
//
// Drawer, side sheet, bottom sheet and dialog move on the M3 Expressive
// springs, not the fixed durations and cubic curves that preceded them.
//
// Sources: Compose ModalNavigationDrawer and DismissibleNavigationDrawer open
// on MotionSchemeKeyTokens.DefaultSpatial and close on FastEffects, with the
// scrim's alpha following the sheet; Compose BottomSheet shows on the default
// spatial spring and hides on fast effects, and ModalBottomSheet fades its
// scrim on DefaultEffects. Compose has no side sheet, so it follows the drawer,
// the surface it shares a shape with; m3.material.io names the default spatial
// spring for surfaces that partly cover the screen. Compose dialogs take their
// motion from the window, so the dialog keeps MDC-Android's shape of motion
// (grow from 0.8 and fade in, fade out) on the matching springs, fading as one
// with its overlay: in on default effects, as ModalBottomSheet fades its scrim,
// out on MDC-Android's own dialog exit curve.
//
// The springs overshoot, so every sliding sheet carries a solid shadow of its
// own colour past the edge it docks to, where the overshoot would open a gap.
import { describe, test, expect, beforeAll } from 'bun:test';
import { compileString } from 'sass';

const compile = (source: string) =>
  compileString(source, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');

const sheets: Record<string, string> = {};
let spring: Record<string, string> = {};

const rules = (css: string, selector: string): string[] => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(css.matchAll(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g')), (m) => m[2]);
};

// The last declaration outside any media query
const value = (component: string, selector: string, property: string): string | undefined => {
  const outside = sheets[component].replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, '');
  return rules(outside, selector)
    .map((block) => block.match(new RegExp(`(?:^|;|\\n)\\s*${property}\\s*:\\s*([^;]+);`))?.[1].trim())
    .filter((v): v is string => v !== undefined)
    .pop();
};

const reducedMotion = (component: string): string =>
  sheets[component].match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

beforeAll(() => {
  for (const name of ['drawer', 'side-sheet', 'bottom-sheet', 'dialog']) {
    sheets[name] = compile(`@use 'components/${name}';`);
  }
  // The transitions each token produces, from the helper the stylesheets use
  const tokens = ['default-spatial', 'default-effects', 'fast-effects'];
  const probe = compile(`@use 'abstract/mixins' as m;\n${tokens.map((t, i) => `.t${i} { transition: m.spring(P, ${t}); }`).join('\n')}`);
  spring = Object.fromEntries(tokens.map((t, i) => [t, rules(probe, `.t${i}`)[0].match(/transition:\s*P ([^;]+);/)![1]]));
});

const on = (property: string, token: string) => `${property} ${spring[token]}`;

describe('spring tokens', () => {
  test('are the Compose expressive springs: 450ms spatial, 250ms effects, 175ms fast effects', () => {
    expect(spring['default-spatial']).toStartWith('450ms linear(');
    expect(spring['default-effects']).toStartWith('250ms linear(');
    expect(spring['fast-effects']).toStartWith('175ms linear(');
    // spatial overshoots, effects do not
    expect(spring['default-spatial']).toContain('1.015');
    expect(spring['fast-effects']).not.toMatch(/1\.0[0-9]*[1-9]/);
  });
});

describe('drawer', () => {
  test('the modal sheet opens on the spatial spring and closes on fast effects', () => {
    expect(value('drawer', '.mtrl-drawer--open .mtrl-drawer__sheet', 'transition')).toBe(on('transform', 'default-spatial'));
    expect(value('drawer', '.mtrl-drawer__sheet', 'transition')).toBe(on('transform', 'fast-effects'));
  });

  test('the scrim rides with the sheet', () => {
    expect(value('drawer', '.mtrl-drawer--open .mtrl-drawer__scrim--visible', 'transition')).toBe(on('opacity', 'default-spatial'));
    expect(value('drawer', '.mtrl-drawer__scrim', 'transition')).toBe(on('opacity', 'fast-effects'));
  });

  test('the standard drawer pushes the page on the same springs, and its sheet stretches over the overshoot', () => {
    expect(value('drawer', '.mtrl-drawer--standard.mtrl-drawer--open', 'transition')).toBe(on('width', 'default-spatial'));
    expect(value('drawer', '.mtrl-drawer--standard', 'transition')).toBe(on('width', 'fast-effects'));
    expect(value('drawer', '.mtrl-drawer--standard .mtrl-drawer__sheet', 'min-width')).toBe('100%');
  });

  test('the standard sheet slides by hanging from the edge facing the page, with no transform of its own', () => {
    // A transform on the same spring carried the sheet 5.5px off the screen
    // edge at the overshoot, measured in Chromium, where the root clips any cover
    expect(value('drawer', '.mtrl-drawer--standard.mtrl-drawer--start .mtrl-drawer__sheet', 'align-self')).toBe('flex-end');
    expect(value('drawer', '.mtrl-drawer--standard.mtrl-drawer--end .mtrl-drawer__sheet', 'align-self')).toBe('flex-start');
    expect(value('drawer', '.mtrl-drawer--standard.mtrl-drawer .mtrl-drawer__sheet, .mtrl-drawer--standard.mtrl-drawer--open .mtrl-drawer__sheet', 'transform')).toBe('none');
  });

  test('the modal sheet covers the overshoot gap at the edge it docks to, in either direction', () => {
    const colour = 'var(--mtrl-sys-color-surface-container-low)';
    expect(value('drawer', '.mtrl-drawer--modal.mtrl-drawer--start .mtrl-drawer__sheet', 'box-shadow')).toEndWith(`, -32px 0 0 0 ${colour}`);
    expect(value('drawer', '.mtrl-drawer--modal.mtrl-drawer--end .mtrl-drawer__sheet', 'box-shadow')).toEndWith(`, 32px 0 0 0 ${colour}`);
    expect(value('drawer', '[dir=rtl] .mtrl-drawer--modal.mtrl-drawer--start .mtrl-drawer__sheet', 'box-shadow')).toEndWith(`, 32px 0 0 0 ${colour}`);
    expect(value('drawer', '[dir=rtl] .mtrl-drawer--modal.mtrl-drawer--end .mtrl-drawer__sheet', 'box-shadow')).toEndWith(`, -32px 0 0 0 ${colour}`);
  });

  test('reduced motion stops the open transitions too, not only the closed ones', () => {
    const block = reducedMotion('drawer');
    for (const selector of ['.mtrl-drawer--open .mtrl-drawer__sheet', '.mtrl-drawer--open .mtrl-drawer__scrim--visible', '.mtrl-drawer--standard.mtrl-drawer--open']) {
      expect(block).toMatch(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{\\s*transition: none;`));
    }
  });
});

describe('side sheet', () => {
  test('opens on the spatial spring and closes on fast effects, scrim with it', () => {
    expect(value('side-sheet', '.mtrl-side-sheet--open .mtrl-side-sheet-container', 'transition')).toBe(on('transform', 'default-spatial'));
    expect(value('side-sheet', '.mtrl-side-sheet-container', 'transition')).toBe(on('transform', 'fast-effects'));
    expect(value('side-sheet', '.mtrl-side-sheet--open .mtrl-side-sheet-scrim', 'transition')).toBe(`${on('opacity', 'default-spatial')}, visibility 0s`);
    expect(value('side-sheet', '.mtrl-side-sheet-scrim', 'transition')).toBe(`${on('opacity', 'fast-effects')}, visibility 0s linear 175ms`);
  });

  test('both variants cover the overshoot gap at their edge', () => {
    expect(value('side-sheet', '.mtrl-side-sheet--standard.mtrl-side-sheet--end .mtrl-side-sheet-container', 'box-shadow')).toBe('32px 0 0 0 var(--mtrl-sys-color-surface)');
    expect(value('side-sheet', '.mtrl-side-sheet--standard.mtrl-side-sheet--start .mtrl-side-sheet-container', 'box-shadow')).toBe('-32px 0 0 0 var(--mtrl-sys-color-surface)');
    expect(value('side-sheet', '.mtrl-side-sheet--modal.mtrl-side-sheet--end .mtrl-side-sheet-container', 'box-shadow')).toEndWith(', 32px 0 0 0 var(--mtrl-sys-color-surface-container-low)');
    expect(value('side-sheet', '.mtrl-side-sheet--modal.mtrl-side-sheet--start .mtrl-side-sheet-container', 'box-shadow')).toEndWith(', -32px 0 0 0 var(--mtrl-sys-color-surface-container-low)');
  });

  test('reduced motion stops the open transitions too', () => {
    expect(reducedMotion('side-sheet')).toMatch(/\.mtrl-side-sheet--open \.mtrl-side-sheet-container[^{]*\{\s*transition: none;/);
  });
});

describe('bottom sheet', () => {
  test('shows on the spatial spring in either open state and hides on fast effects', () => {
    for (const state of ['partial', 'expanded']) {
      expect(value('bottom-sheet', `.mtrl-bottom-sheet--${state} .mtrl-bottom-sheet-container`, 'transition')).toBe(on('transform', 'default-spatial'));
      expect(value('bottom-sheet', `.mtrl-bottom-sheet--${state} .mtrl-bottom-sheet-scrim`, 'transition')).toBe(`${on('opacity', 'default-effects')}, visibility 0s`);
    }
    expect(value('bottom-sheet', '.mtrl-bottom-sheet-container', 'transition')).toBe(on('transform', 'fast-effects'));
    expect(value('bottom-sheet', '.mtrl-bottom-sheet-scrim', 'transition')).toBe(`${on('opacity', 'default-effects')}, visibility 0s linear 250ms`);
  });

  test('reduced motion stops the open transitions too', () => {
    expect(reducedMotion('bottom-sheet')).toMatch(/\.mtrl-bottom-sheet--expanded \.mtrl-bottom-sheet-container[^{]*\{\s*transition: none;/);
  });
});

describe('dialog', () => {
  // The overlay holds the dialog, so the overlay's fade is the dialog's. Both
  // fading multiplied the two opacities: a closing dialog was at 4% within
  // 42ms, measured in Chromium on mtrl.app.
  test('grows on the spatial spring and takes its fade from the overlay', () => {
    expect(value('dialog', '.mtrl-dialog--visible', 'transition')).toBe(`${on('transform', 'default-spatial')}, opacity 0s`);
  });

  test('closing, it holds its opacity and scale until the overlay has faded out', () => {
    expect(value('dialog', '.mtrl-dialog', 'transition')).toBe('opacity 0s linear 200ms, transform 0s linear 200ms');
  });

  // An effects spring is fastest in its first frames: the dialog was at 40% two
  // frames into the fade and read as a cut. MDC-Android's dialog exit holds and
  // then goes.
  test('the overlay fades in on default effects and out on emphasized accelerate', () => {
    expect(value('dialog', '.mtrl-dialog-overlay--visible', 'transition')).toBe(`${on('opacity', 'default-effects')}, visibility 0s`);
    expect(value('dialog', '.mtrl-dialog-overlay', 'transition')).toBe('opacity 200ms cubic-bezier(0.3, 0, 0.8, 0.15), visibility 0s linear 200ms');
  });
});

describe('the sheets keep no fixed-duration curve', () => {
  test('drawer, side sheet and bottom sheet move only on springs', () => {
    for (const name of ['drawer', 'side-sheet', 'bottom-sheet']) {
      const transitions = Array.from(sheets[name].matchAll(/transition:\s*([^;]+);/g), (m) => m[1])
        .filter((t) => /\b(transform|opacity|width|visibility)\b/.test(t));
      for (const transition of transitions) {
        expect(transition, `${name}: ${transition.slice(0, 60)}`).not.toContain('cubic-bezier');
      }
    }
  });

  // The dialog is the exception, and only when it closes: Compose has no dialog
  // motion, and MDC-Android's exit curve is what makes the fade read as a fade
  test('the dialog springs everywhere except its exit', () => {
    const transitions = Array.from(sheets.dialog.matchAll(/transition:\s*([^;]+);/g), (m) => m[1])
      .filter((t) => /\b(transform|opacity|visibility)\b/.test(t));
    const eased = transitions.filter((t) => t.includes('cubic-bezier'));
    expect(eased).toEqual(['opacity 200ms cubic-bezier(0.3, 0, 0.8, 0.15), visibility 0s linear 200ms']);
  });
});
