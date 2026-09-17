// test/components/tabs/tabs.test.ts
//
// The real tab group in a JSDOM document: how it is exposed, how selection by
// click and by code reaches the tabs, events and config handlers, and how tabs
// are added, removed and disabled. test/components/tabs/tab.test.ts covers a
// single tab.
//
// This replaces test/components/tabs.test.ts, which asserted against mocks of
// both the tab and the group defined in its own file. Porting it found three
// defects:
//
// - every click emitted change twice: tabs from config and tabs added later
//   were each given a listener through the tab's on() and a second DOM listener
//   "as a fallback", so the click handler ran twice;
// - setActiveTab() selected a disabled tab, which a click refuses;
// - handlers passed as config.on were documented and never registered.
//
// Deliberately not asserted, because each is open: arrow keys do not move
// between tabs and every tab is its own tab stop (F17); and each tab points
// aria-controls at a tabpanel id nothing creates, built from its value alone,
// so two groups sharing a value share ids.
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import createTabs from '../../../src/components/tabs';

beforeEach(() => { document.body.innerHTML = ''; });

const TABS = () => [
  { text: 'Flights', value: 'flights' },
  { text: 'Trips', value: 'trips', state: 'active' },
  { text: 'Explore', value: 'explore', disabled: true },
];

const mount = (config: Record<string, unknown> = {}) => {
  const tabs = createTabs({ tabs: TABS(), ...config } as any);
  document.body.append(tabs.element);
  return tabs;
};

const selected = (tabs: ReturnType<typeof createTabs>) =>
  tabs.getTabs().map((tab) => tab.element.getAttribute('aria-selected'));
const byValue = (tabs: ReturnType<typeof createTabs>, value: string) =>
  tabs.getTabs().find((tab) => tab.getValue() === value)!;

describe('tabs', () => {
  test('is a horizontal tablist of role="tab" elements carrying their text and value', () => {
    const tabs = mount();
    expect(tabs.element.getAttribute('role')).toBe('tablist');
    expect(tabs.element.getAttribute('aria-orientation')).toBe('horizontal');
    expect(tabs.getTabs().map((tab) => [tab.element.getAttribute('role'), tab.getValue(), tab.element.textContent])).toEqual([
      ['tab', 'flights', 'Flights'], ['tab', 'trips', 'Trips'], ['tab', 'explore', 'Explore'],
    ]);
  });

  test('a tab configured with state "active" starts selected', () => {
    const tabs = mount();
    expect(tabs.getActiveTab()?.getValue()).toBe('trips');
    expect(selected(tabs)).toEqual(['false', 'true', 'false']);
  });

  test('a click selects the tab and emits change exactly once with its value', () => {
    const tabs = mount();
    const changes = mock((_event: { value: string }) => {});
    tabs.on('change', changes);
    byValue(tabs, 'flights').element.click();
    expect(tabs.getActiveTab()?.getValue()).toBe('flights');
    expect(selected(tabs)).toEqual(['true', 'false', 'false']);
    expect(changes).toHaveBeenCalledTimes(1);
    expect(changes.mock.calls[0][0].value).toBe('flights');
  });

  test('a handler passed as config.on.change is called', () => {
    const change = mock((_event: { value: string }) => {});
    const tabs = mount({ on: { change } });
    byValue(tabs, 'flights').element.click();
    expect(change).toHaveBeenCalledTimes(1);
    expect(change.mock.calls[0][0].value).toBe('flights');
  });

  test('setActiveTab selects by value or by tab, and emits change', () => {
    const tabs = mount();
    const changes = mock((_event: unknown) => {});
    tabs.on('change', changes);
    tabs.setActiveTab('flights');
    expect(tabs.getActiveTab()?.getValue()).toBe('flights');
    tabs.setActiveTab(byValue(tabs, 'trips'));
    expect(selected(tabs)).toEqual(['false', 'true', 'false']);
    expect(changes).toHaveBeenCalledTimes(2);
  });

  test('a disabled tab is selected neither by a click nor by setActiveTab', () => {
    const tabs = mount();
    const changes = mock((_event: unknown) => {});
    tabs.on('change', changes);
    byValue(tabs, 'explore').element.click();
    tabs.setActiveTab('explore');
    expect(tabs.getActiveTab()?.getValue()).toBe('trips');
    expect(changes).not.toHaveBeenCalled();
  });

  test('addTab appends a working tab, whose click also emits change once', () => {
    const tabs = mount();
    const added = tabs.addTab({ text: 'Stays', value: 'stays' });
    expect(tabs.getTabs().length).toBe(4);
    expect(tabs.element.contains(added.element)).toBe(true);

    const changes = mock((_event: { value: string }) => {});
    tabs.on('change', changes);
    added.element.click();
    expect(tabs.getActiveTab()?.getValue()).toBe('stays');
    expect(changes).toHaveBeenCalledTimes(1);
  });

  test('removeTab removes by value or by tab; removing the selected one leaves none selected', () => {
    const tabs = mount();
    const flights = byValue(tabs, 'flights');
    tabs.removeTab('flights');
    expect(tabs.element.contains(flights.element)).toBe(false);
    tabs.removeTab(byValue(tabs, 'trips'));
    expect(tabs.getTabs().map((tab) => tab.getValue())).toEqual(['explore']);
    expect(tabs.getActiveTab()).toBeNull();
  });

  test('variant, divider and scrolling follow config', () => {
    const primary = mount();
    expect(primary.element.classList.contains('mtrl-tabs--primary')).toBe(true);
    expect(primary.element.classList.contains('mtrl-tabs--scrollable')).toBe(true);
    expect(primary.element.querySelector('.mtrl-tabs-divider')).not.toBeNull();

    expect(mount({ variant: 'secondary' }).element.classList.contains('mtrl-tabs--secondary')).toBe(true);
    expect(mount({ showDivider: false }).element.querySelector('.mtrl-tabs-divider')).toBeNull();
    expect(mount({ scrollable: false }).element.classList.contains('mtrl-tabs--scrollable')).toBe(false);
  });

  test('an active-tab indicator is rendered', () => {
    expect(mount().element.querySelector('.mtrl-tabs-indicator')).not.toBeNull();
  });

  test('off() removes a handler', () => {
    const tabs = mount();
    const changes = mock(() => {});
    tabs.on('change', changes);
    tabs.off('change', changes);
    tabs.setActiveTab('flights');
    expect(changes).not.toHaveBeenCalled();
  });

  test('destroy removes the element', () => {
    const tabs = mount();
    tabs.destroy();
    expect(document.body.contains(tabs.element)).toBe(false);
  });
});
