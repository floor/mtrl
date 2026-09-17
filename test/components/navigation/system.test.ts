// test/components/navigation/system.test.ts
//
// A smoke test for the legacy navigation, which is deprecated for removal at
// 3.0.0 (decided 2026-09-16) and not being aligned. It protects exactly the
// contract mtrl.app uses until then: createNavigationSystem with sectioned
// items, rail and drawer options, initialize, hideDrawer and showDrawer,
// getRail and getDrawer, navigateTo, onItemSelect and cleanup; plus the plain
// createNavigation its demo page renders.
//
// It replaces test/components/navigation.test.ts, which asserted against a mock
// defined in its own file. It is deliberately thin: behaviour mtrl.app does not
// depend on is not pinned, including whether a silent navigateTo should leave
// the drawer closed and skip onSectionChange (today it does neither).
import { describe, test, expect, beforeEach } from 'bun:test';
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
g.PointerEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.FocusEvent = dom.window.FocusEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
g.matchMedia = dom.window.matchMedia = ((query: string) => ({
  matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
})) as any;

import { createNavigationSystem, createNavigation } from '../../../src';

const ICON = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The shape of mtrl.app's sitemap: sections keyed by name, some with items.
const SITEMAP = () => ({
  home: { label: 'Home', path: '/', icon: ICON },
  core: {
    label: 'Core', path: '/core', icon: ICON,
    items: [
      { id: 'composition', label: 'Composition', path: '/core/composition' },
      { id: 'state', label: 'State', path: '/core/state' },
    ],
  },
});

// The options mtrl.app passes.
const create = () => createNavigationSystem({
  items: SITEMAP(),
  expanded: false,
  railOptions: { componentName: 'rail', position: 'left', showLabels: true },
  drawerOptions: { componentName: 'nav', position: 'left' },
} as any);

beforeEach(() => { document.body.innerHTML = ''; });

describe('navigation system, as mtrl.app uses it', () => {
  test('initialize builds a rail and a drawer in the document and returns the system', () => {
    const nav = create();
    expect(nav.initialize()).toBe(nav);
    expect(document.body.contains(nav.getRail().element)).toBe(true);
    expect(document.body.contains(nav.getDrawer().element)).toBe(true);
    nav.cleanup();
  });

  test('hideDrawer and showDrawer control the drawer', () => {
    const nav = create();
    nav.initialize();
    nav.hideDrawer();
    expect(nav.isDrawerVisible()).toBe(false);
    nav.showDrawer();
    expect(nav.isDrawerVisible()).toBe(true);
    nav.cleanup();
  });

  test('navigateTo sets the active section and subsection, and the drawer lists that section', async () => {
    const nav = create();
    nav.initialize();
    nav.navigateTo('core', 'state', true);
    await wait(20);
    expect(nav.getActiveSection()).toBe('core');
    expect(nav.getActiveSubsection()).toBe('state');
    const labels = nav.getDrawer().element.textContent ?? '';
    expect(labels).toContain('Composition');
    expect(labels).toContain('State');
    nav.cleanup();
  });

  test('choosing a drawer item reaches onItemSelect', async () => {
    const nav = create();
    const selected: unknown[] = [];
    nav.onItemSelect = (event: any) => selected.push(event?.item?.id ?? event?.id);
    nav.initialize();
    nav.navigateTo('core', null, true);
    nav.showDrawer();
    await wait(20);
    const state = [...nav.getDrawer().element.querySelectorAll<HTMLElement>('[data-id="state"], button, a')]
      .find((el) => el.textContent?.trim() === 'State' || el.getAttribute('data-id') === 'state');
    expect(state).toBeTruthy();
    state!.click();
    await wait(30);
    expect(selected).toContain('state');
    nav.cleanup();
  });

  test('cleanup removes the rail and the drawer', () => {
    const nav = create();
    nav.initialize();
    const rail = nav.getRail().element;
    const drawer = nav.getDrawer().element;
    nav.cleanup();
    expect(document.body.contains(rail)).toBe(false);
    expect(document.body.contains(drawer)).toBe(false);
  });
});

describe('createNavigation, as the mtrl.app demo page uses it', () => {
  test('a rail renders its items', () => {
    const nav = createNavigation({
      variant: 'rail',
      items: [{ id: 'a', label: 'Alpha', icon: ICON }, { id: 'b', label: 'Beta', icon: ICON }],
    } as any);
    expect(nav.element.classList.contains('mtrl-nav--rail')).toBe(true);
    expect(nav.element.textContent).toContain('Alpha');
    expect(nav.element.textContent).toContain('Beta');
  });
});
