// test/styles/carousel.test.ts
//
// The carousel stylesheet against the component's DOM and the M3 specs.
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
  css = compileString(`@use 'components/carousel';`, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');
});

describe('carousel stylesheet', () => {
  test('styles the current DOM only', () => {
    expect(css).toContain('.mtrl-carousel__scroller');
    expect(css).toContain('.mtrl-carousel__item');
    expect(css).toContain('.mtrl-carousel__snap');
    expect(css).not.toContain('.mtrl-carousel-slide');
    expect(css).not.toContain('.mtrl-carousel-show-all');
    expect(css).not.toMatch(/#1967d2/i);
  });

  test('the scroller scrolls natively with the scrollbar hidden; snap points align to the start', () => {
    expect(value('.mtrl-carousel__scroller', 'overflow-x')).toBe('auto');
    expect(value('.mtrl-carousel__scroller', 'scrollbar-width')).toBe('none');
    expect(value('.mtrl-carousel__snap', 'scroll-snap-align')).toBe('start');
    expect(value('.mtrl-carousel--vertical .mtrl-carousel__scroller', 'overflow-y')).toBe('auto');
  });

  test('items take the 28dp corner and a secondary focus ring', () => {
    expect(value('.mtrl-carousel__item', 'border-radius')).toBe('var(--mtrl-carousel-corner, 28px)');
    expect(value('.mtrl-carousel__item:focus-visible', 'outline')).toBe('3px solid var(--mtrl-sys-color-secondary)');
  });

  test('text over the image fades with the item size', () => {
    expect(value('.mtrl-carousel__content', 'opacity')).toBe('var(--mtrl-carousel-fade, 1)');
    expect(value('.mtrl-carousel__content', 'background')).toContain('var(--mtrl-sys-color-scrim)');
  });
});
