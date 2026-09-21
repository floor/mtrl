import { beforeAll, expect, test } from 'bun:test';
import { compileString } from 'sass';
import { FAB_SIZES, FAB_ICON_SIZES } from '../../src/components/fab/constants';
import { createBaseConfig, getElementConfig } from '../../src/components/fab/config';

// FabSmallTokens.kt, FabBaselineTokens.kt, FabMediumTokens.kt, FabLargeTokens.kt.
let css: string;
const value = (selector: string, property: string) =>
  Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .filter(([, selectors]) => selectors.split(',').some(s => s.trim() === selector))
    .flatMap(([, , declarations]) => Array.from(declarations.matchAll(/([\w-]+):\s*([^;]+);/g)))
    .filter(([, name]) => name === property).map(([, , result]) => result.trim()).pop();
beforeAll(() => { css = compileString("@use 'components/fab';", { loadPaths: ['src/styles'] }).css.replace(/\/\*[\s\S]*?\*\//g, ''); });
for (const [size, container, icon, radius] of [
  ['small', 40, 24, 12], ['default', 56, 24, 16], ['medium', 80, 28, 20], ['large', 96, 32, 28],
] as const) {
  test(`${size} FAB dimensions, icon, corner and constants`, () => {
    const root = size === 'default' ? '.mtrl-fab' : `.mtrl-fab--${size}`;
    expect(value(root, 'width')).toBe(`${container}px`);
    expect(value(root, 'height')).toBe(`${container}px`);
    expect(value(root, 'border-radius')).toBe(`${radius}px`);
    const iconRoot = size === 'default' ? '.mtrl-fab__icon' : `${root} .mtrl-fab__icon`;
    for (const selector of [iconRoot, `${iconRoot} svg`]) {
      expect(value(selector, 'width')).toBe(`${icon}px`);
      expect(value(selector, 'height')).toBe(`${icon}px`);
    }
    const key = size.toUpperCase() as keyof typeof FAB_SIZES;
    expect(FAB_SIZES[key]).toBe(size);
    expect(FAB_ICON_SIZES[key]).toBe(`${icon}px`);
    const config = createBaseConfig({ size, ariaLabel: 'Compose' });
    expect(JSON.stringify(getElementConfig(config))).toContain(`fab--${size}`);
  });
}
