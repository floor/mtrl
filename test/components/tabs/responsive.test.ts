// test/components/tabs/responsive.test.ts
//
// setupResponsiveBehavior is an enhancer: createTabs does not call it. Two
// groups are mounted because the observer watches document.body and the layout
// switch reads window.innerWidth — both are document-wide.
import { describe, test, expect, beforeEach } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const win = dom.window;
const g = globalThis as unknown as {
  window: typeof win;
  document: Document;
  navigator: Navigator;
  HTMLElement: typeof HTMLElement;
  HTMLButtonElement: typeof HTMLButtonElement;
  Element: typeof Element;
  Node: typeof Node;
  Event: typeof Event;
  MouseEvent: typeof MouseEvent;
  KeyboardEvent: typeof KeyboardEvent;
  CustomEvent: typeof CustomEvent;
  MutationObserver: typeof MutationObserver;
  ResizeObserver: typeof ResizeObserver;
  getComputedStyle: typeof getComputedStyle;
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (id: number) => void;
};
g.window = win;
g.document = win.document;
g.navigator = win.navigator;
g.HTMLElement = win.HTMLElement;
g.HTMLButtonElement = win.HTMLButtonElement;
g.Element = win.Element;
g.Node = win.Node;
g.Event = win.Event;
g.MouseEvent = win.MouseEvent;
g.KeyboardEvent = win.KeyboardEvent;
g.CustomEvent = win.CustomEvent;
g.MutationObserver = win.MutationObserver;
g.getComputedStyle = win.getComputedStyle.bind(win);
g.requestAnimationFrame = (cb: FrameRequestCallback): number =>
  Number(setTimeout(() => cb(Date.now()), 0));
g.cancelAnimationFrame = (id: number): void => {
  clearTimeout(id);
};

const resizeObservers: Array<{ notify: () => void; disconnect: () => void }> = [];

class TestResizeObserver {
  readonly notify: () => void;
  constructor(callback: () => void) {
    this.notify = callback;
    resizeObservers.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    const index = resizeObservers.indexOf(this);
    if (index !== -1) resizeObservers.splice(index, 1);
  }
}

g.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
win.ResizeObserver = g.ResizeObserver;

import createTabs from '../../../src/components/tabs';
import { setupResponsiveBehavior } from '../../../src/components/tabs/responsive';
import type { ResponsiveConfig } from '../../../src/components/tabs/responsive';
import type { TabsComponent, TabComponent } from '../../../src/components/tabs/types';

const ICON = '<svg viewBox="0 0 24 24"><path d="M12 2L2 22h20z"/></svg>';

const TABS_WITH_ICONS = [
  { text: 'Flights', value: 'flights', icon: ICON, state: 'active' as const },
  { text: 'Trips', value: 'trips', icon: ICON },
];

const TABS_MIXED = [
  { text: 'Flights', value: 'flights', icon: ICON, state: 'active' as const },
  { text: 'Trips', value: 'trips' },
];

const setWidth = (width: number): void => {
  Object.defineProperty(win, 'innerWidth', { configurable: true, writable: true, value: width });
  Object.defineProperty(g.window, 'innerWidth', { configurable: true, writable: true, value: width });
};

const notifyResize = (): void => {
  for (const observer of [...resizeObservers]) observer.notify();
};

const mount = (tabsConfig: Record<string, unknown> = {}): TabsComponent => {
  const tabs = createTabs({
    tabs: TABS_WITH_ICONS,
    ...tabsConfig,
  });
  document.body.append(tabs.element);
  return tabs;
};

const enhance = (tabs: TabsComponent, config: ResponsiveConfig = {}): void => {
  setupResponsiveBehavior(tabs, config);
};

const smallClass = (tabs: TabsComponent): string =>
  `${tabs.getClass('tabs')}--responsive-small`;

const layoutOf = (tab: TabComponent): string[] =>
  ['icon-only', 'text-only', 'icon-and-text'].filter((layout) =>
    tab.element.classList.contains(`${tab.getClass('tab')}--${layout}`),
  );

const byValue = (tabs: TabsComponent, value: string): TabComponent => {
  const tab = tabs.getTabs().find((entry) => entry.getValue() === value);
  if (!tab) throw new Error(`missing tab ${value}`);
  return tab;
};

beforeEach(() => {
  document.body.innerHTML = '';
  resizeObservers.length = 0;
  setWidth(1280);
});

describe('setupResponsiveBehavior', () => {
  test('a group with responsive false stays icon-and-text while its sibling switches', () => {
    setWidth(400);
    const frozen = mount();
    const live = mount();
    enhance(frozen, { responsive: false });
    enhance(live);

    expect(frozen.element.classList.contains(smallClass(frozen))).toBe(false);
    expect(layoutOf(byValue(frozen, 'flights'))).toEqual(['icon-and-text']);
    expect(live.element.classList.contains(smallClass(live))).toBe(true);
    expect(layoutOf(byValue(live, 'flights'))).toEqual(['icon-only']);
  });

  test('on a small viewport, two icon groups become icon-only and both carry the small class', () => {
    setWidth(599);
    const first = mount();
    const second = mount();
    enhance(first);
    enhance(second);

    expect(first.element.classList.contains(smallClass(first))).toBe(true);
    expect(second.element.classList.contains(smallClass(second))).toBe(true);
    expect(layoutOf(byValue(first, 'flights'))).toEqual(['icon-only']);
    expect(layoutOf(byValue(first, 'trips'))).toEqual(['icon-only']);
    expect(layoutOf(byValue(second, 'flights'))).toEqual(['icon-only']);
    expect(byValue(first, 'flights').getText()).toBe('Flights');
  });

  test('a tab without an icon is left as text-only when the small layout is icon-only', () => {
    setWidth(400);
    const tabs = createTabs({ tabs: TABS_MIXED });
    document.body.append(tabs.element);
    enhance(tabs);

    expect(layoutOf(byValue(tabs, 'flights'))).toEqual(['icon-only']);
    expect(layoutOf(byValue(tabs, 'trips'))).toEqual(['text-only']);
    expect(tabs.element.classList.contains(smallClass(tabs))).toBe(true);
  });

  test('a text-only small layout strips the icon-and-text class on every tab', () => {
    setWidth(400);
    const first = mount();
    const second = mount();
    enhance(first, { smallScreen: { layout: 'text-only' } });
    enhance(second, { smallScreen: { layout: 'text-only' } });

    expect(layoutOf(byValue(first, 'flights'))).toEqual(['text-only']);
    expect(layoutOf(byValue(second, 'trips'))).toEqual(['text-only']);
    expect(byValue(first, 'flights').getIcon()).toContain('svg');
  });

  test('at the small breakpoint the original icon-and-text layout is restored', () => {
    setWidth(400);
    const tabs = mount();
    enhance(tabs);
    expect(layoutOf(byValue(tabs, 'flights'))).toEqual(['icon-only']);

    setWidth(600);
    notifyResize();

    expect(tabs.element.classList.contains(smallClass(tabs))).toBe(false);
    expect(layoutOf(byValue(tabs, 'flights'))).toEqual(['icon-and-text']);
    expect(layoutOf(byValue(tabs, 'trips'))).toEqual(['icon-and-text']);
  });

  test('a custom small breakpoint is the one that switches the layout', () => {
    setWidth(700);
    const first = mount();
    const second = mount();
    enhance(first, { breakpoints: { small: 800 } });
    enhance(second, { breakpoints: { small: 800 } });

    expect(first.element.classList.contains(smallClass(first))).toBe(true);
    expect(second.element.classList.contains(smallClass(second))).toBe(true);
    expect(layoutOf(byValue(first, 'flights'))).toEqual(['icon-only']);

    setWidth(800);
    notifyResize();

    expect(first.element.classList.contains(smallClass(first))).toBe(false);
    expect(second.element.classList.contains(smallClass(second))).toBe(false);
    expect(layoutOf(byValue(second, 'trips'))).toEqual(['icon-and-text']);
  });

  test('a tab added after setup is not rewritten on the next resize', () => {
    setWidth(1280);
    const tabs = mount();
    enhance(tabs);
    tabs.addTab({ text: 'Explore', value: 'explore', icon: ICON });

    setWidth(400);
    notifyResize();

    expect(layoutOf(byValue(tabs, 'flights'))).toEqual(['icon-only']);
    expect(layoutOf(byValue(tabs, 'explore'))).toEqual(['icon-and-text']);
  });

  test('destroy disconnects the observer so a later resize does not touch a dead group', () => {
    setWidth(1280);
    const first = mount();
    const second = mount();
    enhance(first);
    enhance(second);

    first.destroy();
    expect(document.body.contains(first.element)).toBe(false);

    setWidth(400);
    notifyResize();

    expect(second.element.classList.contains(smallClass(second))).toBe(true);
    expect(layoutOf(byValue(second, 'flights'))).toEqual(['icon-only']);
  });
});
