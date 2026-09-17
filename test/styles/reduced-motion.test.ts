// test/styles/reduced-motion.test.ts
//
// With reduced motion on, movement stops and fades stay (N43). The reset
// used to set every transition to 0.01ms with !important, so dialogs, sheets
// and menus cut in and out with no fade at all, and no component's own
// reduced-motion rule could say otherwise.
import { describe, test, expect, beforeAll } from 'bun:test';
import { compileString } from 'sass';

let block = '';

beforeAll(() => {
  const css = compileString(`@use 'base/reset';`, { loadPaths: ['src/styles'], style: 'expanded' }).css;
  block = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
});

describe('reduced motion', () => {
  test('transitions are limited to the properties that fade', () => {
    expect(block).toContain('transition-property: opacity, color, background-color, border-color, outline-color, box-shadow, visibility !important;');
    expect(block).not.toContain('transition-duration');
  });

  test('smooth scrolling still stops', () => {
    expect(block).toContain('scroll-behavior: auto !important;');
  });
});
