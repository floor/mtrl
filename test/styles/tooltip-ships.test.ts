// test/styles/tooltip-ships.test.ts
//
// `createTooltip` is exported from the package, but `_tooltip.scss` was registered in
// neither `main.scss` nor the selective manifest, so no tooltip CSS was emitted in any
// bundle: every consumer got a working component with no styling whatsoever. Nothing in
// the suite noticed, because no test compiled the full bundle and looked for it.
import { describe, test, expect, beforeAll } from 'bun:test';
import { compileString } from 'sass';
import { componentStyles } from '../../scripts/style-manifest';

let css = '';

beforeAll(() => {
  css = compileString(`@use 'main';`, { loadPaths: ['src/styles'], style: 'expanded' }).css;
});

describe('tooltip styles reach a bundle', () => {
  // Assert on booleans and counts rather than on the bundle itself: a `toContain`
  // against the whole compiled CSS prints ~65KB into the log on failure, which buries
  // every other result in the run.
  test('the full bundle emits tooltip rules', () => {
    expect(css.includes('.mtrl-tooltip')).toBe(true);
  });

  test('the full bundle carries the tooltip container, not just a stray modifier', () => {
    expect(new RegExp('(^|\\n)\\.mtrl-tooltip\\s*\\{').test(css)).toBe(true);
  });

  test('a selective entry exists, so consumers importing per component get it too', () => {
    expect(Object.keys(componentStyles)).toContain('tooltip');
  });

  test('every component stylesheet that ships JS also ships CSS somewhere', () => {
    // Guards the general case this bug was an instance of.
    const registered = new Set(Object.values(componentStyles).map((entry) => entry.source));
    expect(registered.has('components/tooltip')).toBe(true);
  });
});
