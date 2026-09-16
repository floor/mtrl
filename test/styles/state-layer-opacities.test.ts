// test/styles/state-layer-opacities.test.ts
//
// M3 fixes the state layer opacities: 0.08 hover, 0.10 focus, 0.10 pressed. The library
// already holds those in $state (`src/styles/abstract/_variables.scss`), but several
// components had hardcoded 0.12 — the Material 2 figure — directly in their rules.
//
// This guards the property rather than a list of selectors, in both directions, because
// 0.12 is not simply wrong: M3 uses it for disabled containers and for selected
// container fills. An earlier sweep of this very change "fixed" a disabled FAB container
// and a selected suggestion item down to 10%, which was wrong both times.
import { describe, test, expect } from 'bun:test';
import { compileString } from 'sass';

const components = [
  'datepicker', 'dialog', 'radios', 'tabs', 'timepicker',
  'fab', 'extended-fab', 'search', 'select', 'checkbox', 'switch', 'chips',
];

type Rule = { selector: string; body: string };

const rulesOf = (component: string): Rule[] => {
  const css = compileString(`@use 'components/${component}';`, {
    loadPaths: ['src/styles'],
    style: 'expanded',
  }).css;
  return Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g), (m) => ({
    selector: m[1].replace(/\s+/g, ' ').trim(),
    body: m[2],
  }));
};

// A selector that negates a state (:not(...--disabled)) is not in that state.
const withoutNegations = (selector: string) => selector.replace(/:not\([^)]*\)/g, '');

const isInteractiveState = (selector: string) =>
  /(:hover|:focus-visible|:focus|:active|--pressed)/.test(withoutNegations(selector));

const isContainerFill = (selector: string) =>
  /(disabled|--selected|--activated|--checked)/.test(withoutNegations(selector));

const alphaPercents = (body: string): number[] =>
  Array.from(body.matchAll(/color-mix\(in srgb, var\([^)]*\) ([\d.]+)%, transparent\)/g), (m) =>
    Number(m[1]),
  );

// Some components express the state layer as the opacity of a ::after overlay rather
// than as an alpha on the colour. Chips does this for all thirteen of its pressed
// layers, so a matcher that only understood color-mix passed them in silence.
const opacityPercents = (body: string): number[] =>
  Array.from(body.matchAll(/(?:^|[;{\s])opacity:\s*([\d.]+)/g), (m) => Number(m[1]) * 100);

const statePercents = (body: string): number[] => [...alphaPercents(body), ...opacityPercents(body)];

describe('state layer opacities follow M3', () => {
  for (const component of components) {
    test(`${component}: no interactive state uses the Material 2 12%`, () => {
      const offenders = rulesOf(component)
        .filter((rule) => isInteractiveState(rule.selector) && !isContainerFill(rule.selector))
        .filter((rule) => statePercents(rule.body).includes(12))
        .map((rule) => rule.selector.slice(0, 80));
      expect(offenders).toEqual([]);
    });
  }

  test('a disabled container keeps 12%: that is the spec, not drift', () => {
    // The counter-check. Lowering these to 10% is the mistake this file exists to catch.
    for (const component of ['fab', 'extended-fab']) {
      const disabled = rulesOf(component).filter((rule) => /disabled/.test(withoutNegations(rule.selector)));
      const percents = disabled.flatMap((rule) => alphaPercents(rule.body));
      // alpha only here: a disabled rule legitimately carries opacity: 0.38 as well.
      expect(percents).toContain(12);
      expect(percents).not.toContain(10);
    }
  });

  test('a selected container fill keeps 12% as well', () => {
    for (const component of ['search', 'select']) {
      const selected = rulesOf(component).filter((rule) => /--selected/.test(withoutNegations(rule.selector)));
      expect(selected.flatMap((rule) => alphaPercents(rule.body))).toContain(12);
    }
  });

  test('the constants themselves still say what M3 says', () => {
    const css = compileString(
      `@use 'abstract/variables' as v;
       .probe { --hover: #{v.state('hover-state-layer-opacity')};
                --focus: #{v.state('focus-state-layer-opacity')};
                --pressed: #{v.state('pressed-state-layer-opacity')}; }`,
      { loadPaths: ['src/styles'], style: 'expanded' },
    ).css;
    expect(css).toMatch(/--hover:\s*0\.08/);
    expect(css).toMatch(/--focus:\s*0\.1\b/);
    expect(css).toMatch(/--pressed:\s*0\.1\b/);
  });
});
