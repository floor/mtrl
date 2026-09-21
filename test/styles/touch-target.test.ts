// test/styles/touch-target.test.ts
//
// M3 asks for a 48dp minimum interactive size (MDC minTouchTargetSize, Compose
// minimumInteractiveComponentSize()). Compose defines no checkbox token for it, so the
// figure comes from those two.
//
// The checkbox shipped a 40px root with no min-width at all, which leaves an unlabelled
// checkbox about as wide as its 18px icon. Its input is absolutely positioned at
// 100%/100%, so the hit area is exactly the root box and raising the box is the whole
// fix — a pseudo-element overlay would add nothing.
//
// The `touch-target` mixin is also covered here. It has no live callers, but it is
// reachable from abstract/mixins, and it emitted an over-constrained box: `inset: 50%`
// together with width and height. CSS resolves that by dropping one offset — right in
// LTR, which happens to centre correctly, but the inline-start one under RTL, which
// does not.
import { describe, test, expect, beforeAll } from 'bun:test';
import { compileString } from 'sass';

let checkboxCss = '';
let mixinCss = '';

// Strip comments before parsing: the compiled output opens with a block comment, and a
// naive rule pattern glues it onto the first selector, so an exact match for
// `.mtrl-checkbox` would silently find nothing.
const compile = (source: string) =>
  compileString(source, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );

beforeAll(() => {
  checkboxCss = compile(`@use 'components/checkbox';`);
  mixinCss = compile(`@use 'abstract/mixins' as m;\n.probe { @include m.touch-target; }`);
});

const rule = (css: string, selector: string): string | undefined =>
  Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .find((m) => m[1].replace(/\s+/g, ' ').trim() === selector)?.[2];

const declaration = (body: string | undefined, property: string): string | undefined =>
  body?.match(new RegExp(`(?:^|;|\\n)\\s*${property}\\s*:\\s*([^;]+);`))?.[1].trim();

describe('the checkbox meets the 48dp interactive size', () => {
  test('the root is at least 48px tall', () => {
    expect(declaration(rule(checkboxCss, '.mtrl-checkbox'), 'min-height')).toBe('48px');
  });

  test('the root is at least 48px wide, so an unlabelled checkbox still has a target', () => {
    expect(declaration(rule(checkboxCss, '.mtrl-checkbox'), 'min-width')).toBe('48px');
  });

  test('the input still spans the root, so the hit area is the whole box', () => {
    const input = rule(checkboxCss, '.mtrl-checkbox__input');
    expect(declaration(input, 'position')).toBe('absolute');
    expect(declaration(input, 'width')).toBe('100%');
    expect(declaration(input, 'height')).toBe('100%');
  });
});

describe('the touch-target mixin states its offsets unambiguously', () => {
  test('it no longer emits an over-constrained inset', () => {
    expect(mixinCss).not.toContain('inset: 50%');
  });

  test('it anchors with a block and an inline-start offset', () => {
    const probe = rule(mixinCss, '.probe::after');
    expect(declaration(probe, 'top')).toBe('50%');
    expect(declaration(probe, 'inset-inline-start')).toBe('50%');
  });

  test('it still centres a box of the requested size', () => {
    const probe = rule(mixinCss, '.probe::after');
    expect(declaration(probe, 'width')).toBe('48px');
    expect(declaration(probe, 'height')).toBe('48px');
    expect(declaration(probe, 'transform')).toBe('translate(-50%, -50%)');
  });

  test('the host is positioned, or the absolute child would escape it', () => {
    expect(declaration(rule(mixinCss, '.probe'), 'position')).toBe('relative');
  });
});
