// test/components/tabs-selectors.test.ts
//
// The tabs stylesheet sets `$component` to the compound `mtrl-button.mtrl-tab`, so a
// nested `&-icon` compiled to `.mtrl-button.mtrl-tab-icon`: a single element carrying
// both classes, which no tab ever produces. The icon size, the label rules, the
// icon-only label hiding and the badge offsets were all dead. The `--icon-only &`
// blocks failed differently — `&` already contained the tab, so they asked for a tab
// inside a tab.
//
// This drives the real component (the existing tabs suite mocks it entirely, which is
// why none of this was caught) and checks the emitted classes against the compiled CSS,
// so a selector that matches nothing fails here.
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
  // JSDOM has neither; tabs observes its scroller and its own mutations.
  g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.ResizeObserver = g.ResizeObserver;
});

afterAll(() => {
  dom.window.close();
});

const { default: createTabs } = await import('../../src/components/tabs/tabs');

let css = '';
const selectors = (): string[] => {
  if (!css) {
    css = compileString(`@use 'components/tabs';`, { loadPaths: ['src/styles'], style: 'expanded' }).css;
  }
  // Split selector lists: a rule may head several selectors, and a pattern spanning the
  // comma would read two single-element selectors as one nested chain.
  return Array.from(css.matchAll(/([^{}]+)\{[^{}]*\}/g))
    .flatMap((m) => m[1].split(','))
    .map((selector) => selector.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
};

const build = () =>
  createTabs({
    tabs: [
      { text: 'One', value: 'one', icon: '<svg></svg>' },
      { text: 'Two', value: 'two' },
    ],
  });

describe('tabs: the stylesheet targets classes the component emits', () => {
  test('no selector requires a tab nested inside another tab', () => {
    const impossible = selectors().filter((selector) =>
      /mtrl-button\.mtrl-tab[^ ]*\s+[^ ]*mtrl-button\.mtrl-tab/.test(selector),
    );
    expect(impossible).toEqual([]);
  });

  test('no selector targets a tab-prefixed child that is never emitted', () => {
    const phantom = selectors().filter((selector) => /\.mtrl-tab-(icon|text)\b/.test(selector));
    expect(phantom).toEqual([]);
  });

  test('the tab really does carry both classes the compound selector assumes', () => {
    const tabs = build();
    const tab = tabs.element.querySelector('button') as HTMLElement;
    expect(tab.classList.contains('mtrl-button')).toBe(true);
    expect(tab.classList.contains('mtrl-tab')).toBe(true);
  });

  test('the icon and label children carry the button classes the rules now target', () => {
    const tabs = build();
    const tab = tabs.element.querySelector('button') as HTMLElement;
    expect(tab.querySelector('.mtrl-button-icon')).not.toBeNull();
    expect(tab.querySelector('.mtrl-button-text')).not.toBeNull();
    // and not the ones the dead rules assumed
    expect(tab.querySelector('.mtrl-tab-icon')).toBeNull();
    expect(tab.querySelector('.mtrl-tab-text')).toBeNull();
  });

  test('the icon rule matches a real icon element', () => {
    const tabs = build();
    const icon = tabs.element.querySelector('.mtrl-button-icon') as HTMLElement;
    const rule = selectors().find((s) => s.endsWith('.mtrl-button-icon') && s.includes('mtrl-tab'));
    expect(rule).toBeDefined();
    expect(icon).not.toBeNull();
  });

  test('the icon-only label rule hangs off the tab itself', () => {
    const iconOnly = selectors().filter((s) => /mtrl-tab--icon-only .*button-text/.test(s));
    expect(iconOnly.length).toBeGreaterThan(0);
    for (const selector of iconOnly) {
      // one tab in the chain, not two
      expect((selector.match(/mtrl-tab/g) ?? []).length).toBe(1);
    }
  });

  test('the badge offsets hang off the tab itself, for all three layouts', () => {
    const badgeRules = selectors().filter((s) => /badge--top-right/.test(s));
    expect(badgeRules.length).toBe(3);
    for (const selector of badgeRules) {
      expect(/mtrl-tab--(icon-only|text-only|icon-and-text)/.test(selector)).toBe(true);
      expect((selector.match(/mtrl-button\.mtrl-tab/g) ?? []).length).toBeLessThanOrEqual(1);
    }
  });

  test('the layout modifier the rules key on is the one the component applies', () => {
    const tabs = build();
    const [withIcon, withoutIcon] = Array.from(
      tabs.element.querySelectorAll('button'),
    ) as HTMLElement[];
    expect(withIcon.className).toContain('mtrl-tab--icon-and-text');
    expect(withoutIcon.className).toContain('mtrl-tab--text-only');
  });
});
