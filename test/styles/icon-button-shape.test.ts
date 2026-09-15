import { beforeAll, describe, expect, test } from 'bun:test';
import { compileString } from 'sass';

// Compose XSmall..XLargeIconButtonTokens.kt: ContainerShapeRound and
// SelectedContainerShapeSquare are CornerFull; m3.material.io icon button
// specs: xs and s need a 48x48dp target.
//
// CornerFull is written as half the container height, not 9999px. Both paint
// the same pill, but border-radius animates on the number in the stylesheet:
// from 9999px the press morph stays a pill and then snaps square, and inside a
// button group the spring overshoots below zero and paints square corners.
let css: string;
const root = '.mtrl-icon-button';
const value = (selector: string, property: string) =>
  Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .filter(([, selectors]) => selectors.split(',').some(s => s.trim() === selector))
    .flatMap(([, , declarations]) => Array.from(declarations.matchAll(/([\w-]+):\s*([^;]+);/g)))
    .filter(([, name]) => name === property)
    .map(([, , result]) => result.trim()).pop();

// Half of the container height per size: 32, 40, 56, 96 and 136dp
const round = { xs: '16px', s: '20px', m: '28px', l: '48px', xl: '68px' } as const;

beforeAll(() => {
  css = compileString("@use 'components/icon-button';", { loadPaths: ['src/styles'] }).css.replace(/\/\*[\s\S]*?\*\//g, '');
});

describe('icon button shape', () => {
  test('round is half the container height per size', () => {
    expect(value(root, 'border-radius')).toBe(`var(--mtrl-button-shape, ${round.s})`);
    expect(value(`${root}--round`, 'border-radius')).toBe(`var(--mtrl-button-shape, ${round.s})`);
    for (const size of ['xs', 'm', 'l', 'xl'] as const) {
      expect(value(`${root}--round${root}--${size}`, 'border-radius')).toBe(`var(--mtrl-button-shape, ${round[size]})`);
    }
  });

  test('a selected square button becomes round with the same real radius', () => {
    const selected = `${root}--selected${root}--square:not(:active)`;
    expect(value(selected, 'border-radius')).toBe(`var(--mtrl-button-shape-selected, ${round.s})`);
    for (const size of ['xs', 'm', 'l', 'xl'] as const) {
      expect(value(`${selected}${root}--${size}`, 'border-radius')).toBe(`var(--mtrl-button-shape-selected, ${round[size]})`);
    }
  });

  test('no shape animates from a 9999px or percentage radius', () => {
    expect(css).not.toMatch(/border-radius:[^;]*9999px/);
    expect(css).not.toMatch(/border-radius:[^;]*50%/);
  });

  test('the container does not clip: the state layer and ripple clip themselves, the 48dp target reaches outside', () => {
    expect(value(root, 'overflow')).toBe('visible');
    expect(value(`${root}::before`, 'border-radius')).toBe('inherit');
    for (const size of ['xs', 's']) {
      expect(value(`${root}--${size}::after`, 'width')).toBe('48px');
      expect(value(`${root}--${size}::after`, 'height')).toBe('48px');
    }
  });
});
