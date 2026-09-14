import { beforeAll, describe, expect, test } from 'bun:test';
import { compileString } from 'sass';
import {
  ICON_BUTTON_CONTAINER_SIZES, ICON_BUTTON_ICON_SIZES,
  ICON_BUTTON_WIDTH_VALUES, ICON_BUTTON_CORNER_RADIUS,
} from '../../src/components/icon-button/constants';

// Compose XSmall/Small/Medium/Large/XLargeIconButtonTokens.kt.
const sizes = [
  { size: 'xs', container: 32, icon: 20, widths: [28, 32, 40], outline: 1, square: 12, pressed: 8 },
  { size: 's', container: 40, icon: 24, widths: [32, 40, 52], outline: 1, square: 12, pressed: 8 },
  { size: 'm', container: 56, icon: 24, widths: [48, 56, 72], outline: 1, square: 16, pressed: 12 },
  { size: 'l', container: 96, icon: 32, widths: [64, 96, 128], outline: 2, square: 28, pressed: 16 },
  { size: 'xl', container: 136, icon: 40, widths: [104, 136, 184], outline: 3, square: 28, pressed: 16 },
] as const;
const root = '.mtrl-icon-button';
let css: string;
const value = (selector: string, property: string) =>
  Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .filter(([, selectors]) => selectors.split(',').some(s => s.trim() === selector))
    .flatMap(([, , declarations]) => Array.from(declarations.matchAll(/([\w-]+):\s*([^;]+);/g)))
    .filter(([, name]) => name === property)
    .map(([, , result]) => result.trim()).pop();

beforeAll(() => {
  css = compileString("@use 'components/icon-button';", { loadPaths: ['src/styles'] }).css.replace(/\/\*[\s\S]*?\*\//g, '');
});

describe('icon button geometry tokens', () => {
  for (const row of sizes) {
    const sizeSelector = row.size === 's' ? root : `${root}--${row.size}`;
    const suffix = row.size === 's' ? '' : `${root}--${row.size}`;
    const key = row.size.toUpperCase() as keyof typeof ICON_BUTTON_CONTAINER_SIZES;
    for (const shape of ['round', 'square']) {
      for (const [index, width] of ['narrow', 'default', 'wide'].entries()) {
        test(`${row.size} ${shape} ${width}: container, icon and outline dimensions`, () => {
          const widthSelector = width === 'default' ? sizeSelector : `${root}--${width}${suffix}`;
          expect(value(widthSelector, 'width')).toBe(`${row.widths[index]}px`);
          expect(value(sizeSelector, 'height')).toBe(`${row.container}px`);
          for (const iconSelector of ['.mtrl-icon', `${root}-icon`]) {
            expect(value(`${sizeSelector} ${iconSelector}`, 'width')).toBe(`${row.icon}px`);
            expect(value(`${sizeSelector} ${iconSelector}`, 'height')).toBe(`${row.icon}px`);
          }
          expect(value(`${root}--outlined${root}--${row.size}`, 'border-width')).toBe(`${row.outline}px`);
          // Shapes change only radii, preserving the shared size and width rules.
          const shapeSelector = `${root}--${shape}${shape === 'square' ? suffix : ''}`;
          expect(value(shapeSelector, 'border-radius')).toBe(`var(--mtrl-button-shape, ${shape === 'round' ? '50%' : `${row.square}px`})`);
          expect(value(shapeSelector, 'width')).toBeUndefined();
          expect(value(shapeSelector, 'height')).toBeUndefined();
        });
      }
      test(`${row.size} ${shape}: pressed and selected shape tokens remain unchanged`, () => {
        expect(value(`${root}:active${root}--${shape}${suffix}`, 'border-radius')).toBe(`var(--mtrl-button-shape-pressed, ${row.pressed}px)`);
        const selectedSelector = `${root}--selected${root}--${shape}:not(:active)${shape === 'round' ? suffix : ''}`;
        expect(value(selectedSelector, 'border-radius')).toBe(`var(--mtrl-button-shape-selected, ${shape === 'round' ? `${row.square}px` : '50%'})`);
      });
    }
    test(`${row.size}: public constants match the token dimensions`, () => {
      expect(ICON_BUTTON_CONTAINER_SIZES[key]).toBe(row.container);
      expect(ICON_BUTTON_ICON_SIZES[key]).toBe(row.icon);
      expect(ICON_BUTTON_WIDTH_VALUES[key]).toEqual({ narrow: row.widths[0], default: row.widths[1], wide: row.widths[2] });
      expect(ICON_BUTTON_CORNER_RADIUS[key]).toEqual({ square: row.square, pressed: row.pressed });
    });
  }

  for (const size of ['xs', 's']) {
    test(`${size}: centered 48dp pseudo-element target`, () => {
      const selector = `${root}--${size}::after`;
      expect(value(selector, 'content')).toBe('""');
      expect(value(selector, 'position')).toBe('absolute');
      expect(value(selector, 'width')).toBe('48px');
      expect(value(selector, 'height')).toBe('48px');
      expect(value(selector, 'top')).toBe('50%');
      expect(value(selector, 'left')).toBe('50%');
      expect(value(selector, 'transform')).toBe('translate(-50%, -50%)');
    });
  }
});
