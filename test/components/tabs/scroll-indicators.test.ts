// test/components/tabs/scroll-indicators.test.ts
//
// addScrollIndicators is an enhancer: createTabs does not call it. These tests
// mount two real tab groups and drive the real function against both, because
// the update and destroy paths look up buttons with querySelector on a shared
// class name.
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
import { addScrollIndicators } from '../../../src/components/tabs/scroll-indicators';
import type { ScrollIndicatorConfig } from '../../../src/components/tabs/scroll-indicators';
import type { TabsComponent } from '../../../src/components/tabs/types';

const TAB_PAIR = [
  { text: 'Flights', value: 'flights', state: 'active' as const },
  { text: 'Trips', value: 'trips' },
];

const mount = (config: Record<string, unknown> = {}): TabsComponent => {
  const tabs = createTabs({ tabs: TAB_PAIR, ...config });
  document.body.append(tabs.element);
  return tabs;
};

const scrollerOf = (tabs: TabsComponent): HTMLElement => {
  const scroller = tabs.element.querySelector(`.${tabs.getClass('tabs')}-scroll`);
  if (!(scroller instanceof HTMLElement)) {
    throw new Error('expected a scroll container');
  }
  return scroller;
};

const wireScroller = (
  scroller: HTMLElement,
  sizes: { scrollWidth: number; clientWidth: number; scrollLeft?: number },
): { getLeft: () => number; setLeft: (value: number) => void } => {
  let scrollLeft = sizes.scrollLeft ?? 0;
  Object.defineProperty(scroller, 'scrollWidth', {
    configurable: true,
    get: () => sizes.scrollWidth,
  });
  Object.defineProperty(scroller, 'clientWidth', {
    configurable: true,
    get: () => sizes.clientWidth,
  });
  Object.defineProperty(scroller, 'scrollLeft', {
    configurable: true,
    get: () => scrollLeft,
    set: (value: number) => {
      scrollLeft = value;
    },
  });
  scroller.scrollBy = ((options?: ScrollToOptions | number) => {
    if (typeof options === 'object' && options !== null) {
      scrollLeft += options.left ?? 0;
    } else if (typeof options === 'number') {
      scrollLeft += options;
    }
  }) as HTMLElement['scrollBy'];
  return {
    getLeft: () => scrollLeft,
    setLeft: (value: number) => {
      scrollLeft = value;
    },
  };
};

const enhance = (tabs: TabsComponent, config: ScrollIndicatorConfig = {}): void => {
  addScrollIndicators(tabs, config);
};

const indicators = (tabs: TabsComponent): HTMLElement[] =>
  Array.from(tabs.element.querySelectorAll(`.${tabs.getClass('tabs')}-scroll-indicator`));

const indicator = (tabs: TabsComponent, side: 'left' | 'right'): HTMLElement => {
  const el = tabs.element.querySelector(
    `.${tabs.getClass('tabs')}-scroll-indicator--${side}`,
  );
  if (!(el instanceof HTMLElement)) {
    throw new Error(`expected a ${side} indicator`);
  }
  return el;
};

const button = (tabs: TabsComponent, side: 'left' | 'right'): HTMLButtonElement => {
  const el = tabs.element.querySelector(
    `.${tabs.getClass('tabs')}-scroll-button--${side}`,
  );
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error(`expected a ${side} scroll button`);
  }
  return el;
};

beforeEach(() => {
  document.body.innerHTML = '';
  resizeObservers.length = 0;
});

describe('addScrollIndicators', () => {
  test('adds a left and right fade indicator on each of two mounted groups', () => {
    const first = mount();
    const second = mount();
    wireScroller(scrollerOf(first), { scrollWidth: 400, clientWidth: 200 });
    wireScroller(scrollerOf(second), { scrollWidth: 400, clientWidth: 200 });

    enhance(first);
    enhance(second);

    expect(indicators(first)).toHaveLength(2);
    expect(indicators(second)).toHaveLength(2);
    expect(indicator(first, 'left').className).toContain(
      `${first.getClass('tabs')}-scroll-indicator--fade`,
    );
    expect(indicator(second, 'right').className).toContain(
      `${second.getClass('tabs')}-scroll-indicator--fade`,
    );
    expect(first.element.contains(indicator(second, 'left'))).toBe(false);
    expect(second.element.contains(indicator(first, 'right'))).toBe(false);
  });

  test('skips a disabled group and a group with no scroller, while still decorating its sibling', () => {
    const disabled = mount();
    const fixed = mount({ scrollable: false });
    const live = mount();
    wireScroller(scrollerOf(disabled), { scrollWidth: 400, clientWidth: 200 });
    wireScroller(scrollerOf(live), { scrollWidth: 400, clientWidth: 200 });

    enhance(disabled, { enabled: false });
    enhance(fixed);
    enhance(live);

    expect(indicators(disabled)).toHaveLength(0);
    expect(indicators(fixed)).toHaveLength(0);
    expect(indicators(live)).toHaveLength(2);
    expect(live.element.contains(indicator(live, 'left'))).toBe(true);
    expect(disabled.element.contains(indicator(live, 'left'))).toBe(false);
  });

  test('uses the configured appearance class', () => {
    const tabs = mount();
    wireScroller(scrollerOf(tabs), { scrollWidth: 400, clientWidth: 200 });
    enhance(tabs, { appearance: 'shadow' });

    expect(indicator(tabs, 'left').classList.contains(
      `${tabs.getClass('tabs')}-scroll-indicator--shadow`,
    )).toBe(true);
    expect(indicator(tabs, 'right').classList.contains(
      `${tabs.getClass('tabs')}-scroll-indicator--fade`,
    )).toBe(false);
  });

  test('shows the right indicator when more content is off-screen, and the left after a scroll', () => {
    const first = mount();
    const second = mount();
    const firstScroll = wireScroller(scrollerOf(first), { scrollWidth: 400, clientWidth: 200 });
    wireScroller(scrollerOf(second), { scrollWidth: 400, clientWidth: 200, scrollLeft: 0 });

    enhance(first);
    enhance(second);

    expect(indicator(first, 'left').classList.contains('visible')).toBe(false);
    expect(indicator(first, 'right').classList.contains('visible')).toBe(true);
    expect(indicator(second, 'left').classList.contains('visible')).toBe(false);

    firstScroll.setLeft(80);
    scrollerOf(first).dispatchEvent(new Event('scroll'));

    expect(indicator(first, 'left').classList.contains('visible')).toBe(true);
    expect(indicator(first, 'right').classList.contains('visible')).toBe(true);
    expect(indicator(second, 'left').classList.contains('visible')).toBe(false);

    firstScroll.setLeft(200);
    scrollerOf(first).dispatchEvent(new Event('scroll'));

    expect(indicator(first, 'right').classList.contains('visible')).toBe(false);
    expect(indicator(second, 'right').classList.contains('visible')).toBe(true);
  });

  test('adds labelled scroll buttons that move only that group\'s scroller', () => {
    const first = mount();
    const second = mount();
    const firstScroll = wireScroller(scrollerOf(first), { scrollWidth: 400, clientWidth: 200 });
    const secondScroll = wireScroller(scrollerOf(second), { scrollWidth: 400, clientWidth: 200 });

    enhance(first, { showButtons: true });
    enhance(second, { showButtons: true });

    expect(button(first, 'left').getAttribute('aria-label')).toBe('Scroll tabs left');
    expect(button(first, 'right').getAttribute('aria-label')).toBe('Scroll tabs right');
    expect(button(first, 'right').querySelector('svg path')).not.toBeNull();
    expect(button(first, 'left').disabled).toBe(true);
    expect(button(first, 'right').disabled).toBe(false);
    expect(button(second, 'left').disabled).toBe(true);

    button(first, 'right').click();
    expect(firstScroll.getLeft()).toBe(100);
    expect(secondScroll.getLeft()).toBe(0);

    scrollerOf(first).dispatchEvent(new Event('scroll'));
    expect(button(first, 'left').disabled).toBe(false);
    expect(button(second, 'left').disabled).toBe(true);

    button(first, 'left').click();
    expect(firstScroll.getLeft()).toBe(0);
    expect(secondScroll.getLeft()).toBe(0);
  });

  test('a resize that shrinks the scroller reveals the right indicator', () => {
    const tabs = mount();
    const sizes = { scrollWidth: 200, clientWidth: 200 };
    wireScroller(scrollerOf(tabs), sizes);
    enhance(tabs);

    expect(indicator(tabs, 'right').classList.contains('visible')).toBe(false);

    sizes.clientWidth = 80;
    expect(resizeObservers.length).toBeGreaterThan(0);
    for (const observer of [...resizeObservers]) observer.notify();

    expect(indicator(tabs, 'right').classList.contains('visible')).toBe(true);
  });

  test('destroy removes this group\'s indicators and buttons and still unmounts the tabs', () => {
    const first = mount();
    const second = mount();
    wireScroller(scrollerOf(first), { scrollWidth: 400, clientWidth: 200 });
    wireScroller(scrollerOf(second), { scrollWidth: 400, clientWidth: 200 });

    enhance(first, { showButtons: true });
    enhance(second, { showButtons: true });

    const firstLeft = indicator(first, 'left');
    const firstButton = button(first, 'left');
    first.destroy();

    expect(document.body.contains(first.element)).toBe(false);
    expect(firstLeft.parentNode).toBeNull();
    expect(firstButton.parentNode).toBeNull();
    expect(indicators(second)).toHaveLength(2);
    expect(button(second, 'right').parentNode).toBe(second.element);
  });
});
