// test/styles/datepicker-elevation.test.ts
//
// The calendar surface asks for `DatePickerModalTokens.ContainerElevation`, which is
// Level 3. It was written as `v.elevation('level3')` while the $elevation map is keyed
// with hyphens, so map.get returned null and Sass dropped the whole declaration: the
// surface floated with no shadow at all, and nothing failed.
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
  css = compileString(`@use 'components/datepicker';`, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');
});

describe('datepicker stylesheet', () => {
  test('the calendar surface carries a shadow', () => {
    expect(value('.mtrl-datepicker__calendar', 'box-shadow')).toBeDefined();
  });

  test('that shadow is the level-3 elevation, not an arbitrary one', () => {
    const shadow = value('.mtrl-datepicker__calendar', 'box-shadow');
    // $elevation 'level-3' is the two-layer shadow below; a wrong key yields null and
    // Sass emits no declaration at all, which is exactly what this guards against.
    expect(shadow).toBe('0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)');
  });
});
