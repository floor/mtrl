// test/components/tabs-tokens.test.ts
//
// The behavioural half of the tabs audit, after #41 fixed the selectors. Each assertion
// names the source it comes from, because several were wrong in the audit's own wording
// and only the Compose source settled them:
//
//   - ActiveIndicatorHeight is 3dp, and TabRowDefaults.SecondaryIndicator takes the
//     *primary* token for both height and colour (TabRow.kt:1080-1081) — so the
//     hardcoded 4px/2px and the secondary's on-surface were both wrong.
//   - The fixed row divides evenly: tabWidth = tabRowWidth / tabCount (TabRow.kt:443-447).
//   - The indicator floors at 24dp: maxOf(contentWidth, 24.dp) (TabRow.kt:461).
//   - edgePadding applies at both edges, despite the token being named
//     ScrollableTabRowEdgeStartPadding (TabRow.kt:239).
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { compileString } from 'sass';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const g = global as any;

beforeAll(() => {
  const w = dom.window as any;
  for (const key of ['document', 'window', 'Element', 'HTMLElement', 'Node', 'Event',
    'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'MutationObserver', 'getComputedStyle']) {
    if (w[key] !== undefined) g[key] = w[key];
  }
  g.document = w.document;
  g.window = w;
  g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
  g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.ResizeObserver = g.ResizeObserver;
});

afterAll(() => dom.window.close());

const { default: createTabs } = await import('../../src/components/tabs/tabs');
const { createTabIndicator } = await import('../../src/components/tabs/indicator');

// Strip comments: the compiled output opens with one, and a naive rule pattern would
// glue it onto the first selector.
const css = compileString(`@use 'components/tabs';`, { loadPaths: ['src/styles'], style: 'expanded' })
  .css.replace(/\/\*[\s\S]*?\*\//g, '');

const rules = Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g)).map((m) => ({
  selector: m[1].replace(/\s+/g, ' ').trim(),
  body: m[2],
}));

const bodyOf = (pattern: RegExp) => rules.find((r) => pattern.test(r.selector))?.body;
const decl = (body: string | undefined, property: string) =>
  body?.match(new RegExp(`(?:^|;|\\n)\\s*${property}\\s*:\\s*([^;]+);`))?.[1].trim();

describe('the tab indicator carries its token height', () => {
  test('the height option is applied to the element, not merely accepted', () => {
    const indicator = createTabIndicator({ height: 3 });
    expect(indicator.element.style.height).toBe('3px');
  });

  test('it defaults to ActiveIndicatorHeight when no height is passed', () => {
    expect(createTabIndicator().element.style.height).toBe('3px');
  });

  test('a caller can still override it', () => {
    expect(createTabIndicator({ height: 5 }).element.style.height).toBe('5px');
  });

  test('the stylesheet no longer hardcodes a competing height', () => {
    for (const variant of [/tabs--primary .*-indicator$/, /tabs--secondary .*-indicator$/]) {
      expect(decl(bodyOf(variant), 'height')).toBeUndefined();
    }
  });
});

describe('the indicator colour and shape follow the tokens', () => {
  test('both variants use the primary active-indicator colour', () => {
    const primary = decl(bodyOf(/tabs--primary .*-indicator$/), 'background-color');
    const secondary = decl(bodyOf(/tabs--secondary .*-indicator$/), 'background-color');
    expect(primary).toBe('var(--mtrl-sys-color-primary)');
    expect(secondary).toBe('var(--mtrl-sys-color-primary)');
  });

  test('the primary indicator takes a 3px corner on every side', () => {
    expect(decl(bodyOf(/tabs--primary .*-indicator$/), 'border-radius')).toBe('3px');
  });
});

describe('one state layer per tab, not two', () => {
  test("the button's own layer is suppressed for tabs", () => {
    const suppressed = rules.find((r) => /mtrl-tab::before$/.test(r.selector));
    expect(suppressed).toBeDefined();
    expect(decl(suppressed?.body, 'content')).toBe('none');
  });

  test('the tab still paints its own pressed layer', () => {
    const pressed = rules.filter((r) => /:active/.test(r.selector) && /background-color/.test(r.body));
    expect(pressed.length).toBeGreaterThan(0);
  });
});

describe('the fixed form and the scrollable edges', () => {
  test('without scrollable, tabs share the row evenly', () => {
    const fixed = rules.find((r) => /:not\(.*--scrollable\) > /.test(r.selector));
    expect(fixed).toBeDefined();
    expect(decl(fixed?.body, 'flex')).toBe('1');
  });

  test('the fixed-form rule targets direct children, since no scroll container is built', () => {
    // withScrollable returns early when scrollable is false, so .mtrl-tabs-scroll does
    // not exist in that form; a rule keyed on it would match nothing.
    const fixed = rules.find((r) => /:not\(.*--scrollable\) > /.test(r.selector));
    expect(fixed?.selector).not.toContain('tabs-scroll');
  });

  test('the scroll container is padded at both edges', () => {
    expect(decl(bodyOf(/--scrollable .*-scroll$/), 'padding-inline')).toBe('52px');
  });

  test('a scrollable tabs component still builds its scroll container', () => {
    const tabs = createTabs({ tabs: [{ text: 'One', value: 'one' }], scrollable: true });
    expect(tabs.element.querySelector('.mtrl-tabs-scroll')).not.toBeNull();
  });

  test('a fixed tabs component does not, so the tabs are direct children', () => {
    const tabs = createTabs({ tabs: [{ text: 'One', value: 'one' }], scrollable: false });
    expect(tabs.element.querySelector('.mtrl-tabs-scroll')).toBeNull();
    expect(tabs.element.querySelector(':scope > button.mtrl-tab')).not.toBeNull();
  });
});
