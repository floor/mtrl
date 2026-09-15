import { beforeAll, describe, expect, test } from 'bun:test';
import { compileString } from 'sass';

// A press moves a corner to the smallest shape of the group: the 4dp pressed
// corner of a connected group (ConnectedButtonGroupSmallTokens
// PressedInnerCornerCornerSize), from at most the 68dp selected pill of an xl
// button (half of 136dp). A spring that overshoots more than 4dp over that
// 64dp range paints the corner below zero, square for a few frames.
const LONGEST_PRESS_RANGE = 68 - 4;
const PRESSED_CORNER = 4;

let css: string;
const value = (selector: string, property: string) =>
  Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .filter(([, selectors]) => selectors.split(',').some(s => s.trim() === selector))
    .flatMap(([, , declarations]) => Array.from(declarations.matchAll(/([\w-]+):\s*([^;]+);/g)))
    .filter(([, name]) => name === property)
    .map(([, , result]) => result.trim()).pop();

/** The timing of one property in a transition list: [duration, easing] */
const timing = (transition: string, property: string) => {
  const parts = transition.split(/,\s*(?=[a-z-]+\s+\d)/);
  const part = parts.find(p => p.trim().startsWith(`${property} `));
  if (!part) throw new Error(`no ${property} in ${transition}`);
  const [, duration, easing] = part.trim().match(/^[a-z-]+\s+(\S+)\s+(.+)$/)!;
  return { duration, easing };
};

const overshoot = (easing: string) =>
  Math.max(...Array.from(easing.matchAll(/-?\d*\.?\d+/g)).map(([n]) => Number(n))) - 1;

beforeAll(() => {
  css = compileString("@use 'components/button-group';", { loadPaths: ['src/styles'] }).css.replace(/\/\*[\s\S]*?\*\//g, '');
});

describe('button group press motion', () => {
  for (const child of ['.mtrl-button', '.mtrl-icon-button']) {
    test(`${child}: the press takes a spring that cannot drive the corner below zero`, () => {
      const pressed = timing(value(`.mtrl-button-group > ${child}:active`, 'transition')!, 'border-radius');
      expect(pressed.duration).toBe('450ms');
      expect(overshoot(pressed.easing) * LONGEST_PRESS_RANGE).toBeLessThan(PRESSED_CORNER);
    });

    test(`${child}: release and selection keep the fast spatial spring, and every other timing is unchanged`, () => {
      const rest = value(`.mtrl-button-group > ${child}`, 'transition')!;
      const pressed = value(`.mtrl-button-group > ${child}:active`, 'transition')!;
      const radius = timing(rest, 'border-radius');
      expect(radius.duration).toBe('425ms');
      // the fast spring on its own would overshoot past the pressed corner
      expect(overshoot(radius.easing) * LONGEST_PRESS_RANGE).toBeGreaterThan(PRESSED_CORNER);
      for (const property of ['background-color', 'color', 'box-shadow', 'border-color', 'width', 'padding', 'gap']) {
        expect(timing(pressed, property)).toEqual(timing(rest, property));
      }
    });
  }
});
