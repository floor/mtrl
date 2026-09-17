// test/styles/tooltip-hover.test.ts
//
// WCAG 1.4.13 asks that a pointer can rest on a tooltip's content. The tooltip
// ignored the pointer in every state, so it could not be hovered at all; hidden,
// it must still let clicks through to what lies beneath (F20).
import { describe, test, expect, beforeAll } from 'bun:test';
import { compileString } from 'sass';

let css = '';

const value = (selector: string, property: string): string | undefined => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(css.matchAll(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g')), (m) => m[2])
    .map((block) => block.match(new RegExp(`(?:^|;|\\n)\\s*${property}\\s*:\\s*([^;]+);`))?.[1].trim())
    .filter((v): v is string => v !== undefined)
    .pop();
};

beforeAll(() => {
  css = compileString(`@use 'components/tooltip';`, { loadPaths: ['src/styles'], style: 'expanded' }).css;
});

describe('tooltip pointer events', () => {
  test('a hidden tooltip lets the pointer through; a shown one can be hovered', () => {
    expect(value('.mtrl-tooltip', 'pointer-events')).toBe('none');
    expect(value('.mtrl-tooltip--visible', 'pointer-events')).toBe('auto');
  });
});
