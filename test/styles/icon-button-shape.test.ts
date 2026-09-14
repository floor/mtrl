import { beforeAll, describe, expect, test } from 'bun:test';
import { compileString } from 'sass';

// Compose XSmall..XLargeIconButtonTokens.kt: ContainerShapeRound and
// SelectedContainerShapeSquare are CornerFull; m3.material.io icon button
// specs: xs and s need a 48x48dp target.
let css: string;
const root = '.mtrl-icon-button';
const value = (selector: string, property: string) =>
  Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .filter(([, selectors]) => selectors.split(',').some(s => s.trim() === selector))
    .flatMap(([, , declarations]) => Array.from(declarations.matchAll(/([\w-]+):\s*([^;]+);/g)))
    .filter(([, name]) => name === property)
    .map(([, , result]) => result.trim()).pop();

beforeAll(() => {
  css = compileString("@use 'components/icon-button';", { loadPaths: ['src/styles'] }).css.replace(/\/\*[\s\S]*?\*\//g, '');
});

describe('icon button shape', () => {
  test('round is the full shape, a pill on any width, not an ellipse', () => {
    expect(value(root, 'border-radius')).toBe('var(--mtrl-button-shape, 9999px)');
    expect(value(`${root}--round`, 'border-radius')).toBe('var(--mtrl-button-shape, 9999px)');
    expect(value(`${root}--selected${root}--square:not(:active)`, 'border-radius')).toBe('var(--mtrl-button-shape-selected, 9999px)');
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
