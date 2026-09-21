// test/styles/disabled-tokens.test.ts
//
// M3 specifies disabled appearance per role, not as one opacity over a subtree. The
// selection controls each did the latter, which flattens the roles that differ and, on
// radios, compounded two ancestors down to roughly 0.23 against a specified 0.38.
//
// The direction that matters here is the opposite of the state-layer guard: a blanket
// opacity on a container is the defect, while a per-element opacity is often fine. So
// these assert the roles, not the absence of opacity.
import { describe, test, expect, beforeAll } from 'bun:test';
import { compileString } from 'sass';

const css: Record<string, string> = {};

const compile = (component: string) =>
  compileString(`@use 'components/${component}';`, { loadPaths: ['src/styles'], style: 'expanded' }).css;

beforeAll(() => {
  for (const component of ['checkbox', 'radios', 'switch']) css[component] = compile(component);
});

type Rule = { selector: string; body: string };

const rules = (component: string): Rule[] =>
  Array.from(css[component].matchAll(/([^{}]+)\{([^{}]*)\}/g), (m) => ({
    selector: m[1].replace(/\s+/g, ' ').trim(),
    body: m[2],
  }));

const find = (component: string, pattern: RegExp): Rule[] =>
  rules(component).filter((rule) => pattern.test(rule.selector));

const declaration = (rule: Rule | undefined, property: string): string | undefined =>
  rule?.body.match(new RegExp(`(?:^|;|\\n)\\s*${property}\\s*:\\s*([^;]+);`))?.[1].trim();

const onSurface = (percent: number) =>
  `color-mix(in srgb, var(--mtrl-sys-color-on-surface) ${percent}%, transparent)`;

describe('disabled states use the per-role tokens', () => {
  test('radios: no ancestor dims the control, so 0.38 lands unmodified', () => {
    const dimmers = find('radios', /--disabled$/).filter((rule) => {
      const opacity = declaration(rule, 'opacity');
      return opacity !== undefined && Number(opacity) < 1;
    });
    expect(dimmers.map((rule) => rule.selector)).toEqual([]);
  });

  test('radios: the ring, the dot and the label each carry on-surface at 38%', () => {
    const disabled = find('radios', /:disabled/);
    const values = disabled.flatMap((rule) => [
      declaration(rule, 'border-color'),
      declaration(rule, 'background-color'),
      declaration(rule, 'color'),
    ]);
    expect(values).toContain(onSurface(38));
  });

  test('checkbox: the root no longer fades the whole control', () => {
    const root = find('checkbox', /\.mtrl-checkbox--disabled$/)[0];
    expect(declaration(root, 'opacity')).toBeUndefined();
  });

  test('checkbox: the unselected outline takes on-surface 38%, not the enabled outline role', () => {
    const icon = find('checkbox', /--disabled .mtrl-checkbox__icon$/)[0];
    expect(declaration(icon, 'border-color')).toBe(onSurface(38));
    expect(declaration(icon, 'background-color')).toBe('transparent');
  });

  test('checkbox: the selected container takes on-surface 38% and the checkmark surface', () => {
    const checked = find('checkbox', /--disabled .*:checked ~ .mtrl-checkbox__icon$/)[0];
    expect(declaration(checked, 'background-color')).toBe(onSurface(38));
    expect(declaration(checked, 'color')).toBe('var(--mtrl-sys-color-surface)');
  });

  test('switch: the track is 12%, which is its own token, not the handle 38%', () => {
    const track = find('switch', /\.mtrl-switch--disabled .mtrl-switch-track$/)[0];
    expect(declaration(track, 'background-color')).toBe(onSurface(12));
    expect(declaration(track, 'border-color')).toBe(onSurface(12));
    expect(declaration(track, 'opacity')).toBeUndefined();
  });

  test('switch: the unselected handle is on-surface 38%', () => {
    const thumb = find('switch', /\.mtrl-switch--disabled .mtrl-switch-thumb$/)[0];
    expect(declaration(thumb, 'background-color')).toBe(onSurface(38));
  });

  test('switch: the selected handle is surface at full opacity, not faded to 38%', () => {
    const checkedThumb = find('switch', /--disabled.*--checked .mtrl-switch-thumb$/)[0];
    expect(declaration(checkedThumb, 'background-color')).toBe('var(--mtrl-sys-color-surface)');
  });

  test('switch: the selected disabled track keeps 12% rather than the enabled outline role', () => {
    const checkedTrack = find('switch', /--disabled.*--checked .mtrl-switch-track$/)[0];
    expect(declaration(checkedTrack, 'background-color')).toBe(onSurface(12));
  });
});
