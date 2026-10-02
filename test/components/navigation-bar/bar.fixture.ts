// test/components/navigation-bar/bar.fixture.ts
//
// The navigation bar's behaviour (FLO-305); its geometry, colours, keyboard and
// scrolling are measured in a browser by scripts/check-navigation-bar.ts.
import { beforeEach, afterEach, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import createNavigationBar from '../../../src/components/navigation-bar';
import type { NavigationBarConfig } from '../../../src/components/navigation-bar';

let dom: JSDOM;
let bars: ReturnType<typeof createNavigationBar>[];
let windowListeners: string[];
beforeEach(() => {
    dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://example.test' });
    for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'FocusEvent', 'getComputedStyle'])
        Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: name === 'window' ? dom.window : name === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : Reflect.get(dom.window, name) });
    windowListeners = [];
    const add = dom.window.addEventListener.bind(dom.window);
    dom.window.addEventListener = ((type: string, ...rest: unknown[]) => { windowListeners.push(type); return (add as (...a: unknown[]) => void)(type, ...rest); }) as typeof dom.window.addEventListener;
    bars = [];
});
afterEach(() => { bars.forEach(bar => bar.destroy()); dom.window.close(); });

const icon = '<svg></svg>';
const make = (config: NavigationBarConfig = {}) => {
    const bar = createNavigationBar({
        items: [
            { id: 'home', label: 'Home', icon, active: true },
            { id: 'search', label: 'Search', icon },
            { id: 'library', label: 'Library', icon, href: '/library' },
            { id: 'off', label: 'Off', icon, disabled: true },
        ],
        ...config,
    });
    document.body.append(bar.element);
    bars.push(bar);
    return bar;
};
const item = (bar: ReturnType<typeof make>, id: string) => bar.element.querySelector<HTMLElement>(`[data-id="${id}"]`)!;

test('a named nav landmark of links and buttons, the active one aria-current, icons hidden', () => {
    const bar = make();
    expect([bar.element.tagName, bar.element.getAttribute('aria-label')]).toEqual(['NAV', 'Primary navigation']);
    expect(make({ ariaLabel: 'Sections' }).element.getAttribute('aria-label')).toBe('Sections');
    expect(item(bar, 'home').getAttribute('aria-current')).toBe('page');
    expect(item(bar, 'search').hasAttribute('aria-current')).toBe(false);
    expect([item(bar, 'library').tagName, item(bar, 'library').getAttribute('href')]).toEqual(['A', '/library']);
    expect([item(bar, 'search').tagName, item(bar, 'search').getAttribute('type')]).toEqual(['BUTTON', 'button']);
    expect(item(bar, 'off').hasAttribute('disabled')).toBe(true);
    expect(bar.element.querySelector('.mtrl-navigation-bar__icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(bar.element.querySelector('[role="tab"]')).toBeNull();
});

test('destinations need unique ids, labels and icons; one is active at most', () => {
    expect(() => createNavigationBar({ items: [{ id: 'a', label: 'A', icon }, { id: 'a', label: 'B', icon }] })).toThrow('NavigationBar destinations require unique IDs, labels, and icons');
    expect(() => createNavigationBar({ items: [{ id: 'a', label: '', icon }] })).toThrow();
    const bar = make({ items: [{ id: 'a', label: 'A', icon, active: true }, { id: 'b', label: 'B', icon, active: true }] });
    expect(bar.getItems().filter(entry => entry.active).map(entry => entry.id)).toEqual(['a']);
});

test('a click selects once and emits select with value; setActive is silent; a disabled item is not selected', () => {
    const seen: unknown[] = [];
    const bar = make({ onSelect: event => seen.push(['option', event.value, event.index]) });
    bar.on('select', event => seen.push(['event', event.value, event.id]));
    item(bar, 'search').click();
    expect(seen).toEqual([['option', 'search', 1], ['event', 'search', 'search']]);
    expect([bar.getActive(), bar.getValue()]).toEqual(['search', 'search']);
    expect(item(bar, 'search').getAttribute('aria-current')).toBe('page');
    bar.setActive('home');
    expect([seen.length, bar.getActive()]).toEqual([2, 'home']);
    item(bar, 'off').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect([seen.length, bar.getActive()]).toEqual([2, 'home']);
    bar.setActive('off');
    expect(bar.getActive()).toBe('home');
    bar.setActive(null);
    expect(bar.getActive()).toBeNull();
});

test('a modified click on a link keeps native navigation and selects nothing', () => {
    const bar = make();
    item(bar, 'library').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    expect(bar.getActive()).toBe('home');
});

test('badges: a count or text, the dot, folded into the name, updated in place', () => {
    const bar = make();
    bar.setBadge('home', 3);
    expect([item(bar, 'home').querySelector('.mtrl-navigation-bar__badge')?.textContent, item(bar, 'home').getAttribute('aria-label')]).toEqual(['3', 'Home, 3']);
    bar.setBadge('search', true, 'New results');
    expect(item(bar, 'search').querySelector('.mtrl-navigation-bar__badge--dot')).not.toBeNull();
    expect(item(bar, 'search').getAttribute('aria-label')).toBe('Search, New results');
    bar.setBadge('home', undefined);
    expect([item(bar, 'home').querySelector('.mtrl-navigation-bar__badge'), item(bar, 'home').getAttribute('aria-label')]).toEqual([null, 'Home']);
});

test('setItems renders the new destinations and keeps the focused one focused', () => {
    const bar = make();
    item(bar, 'search').focus();
    bar.setItems([{ id: 'search', label: 'Search', icon }, { id: 'new', label: 'New', icon }]);
    expect([...bar.element.querySelectorAll('.mtrl-navigation-bar__item')].map(el => (el as HTMLElement).dataset.id)).toEqual(['search', 'new']);
    expect((document.activeElement as HTMLElement).dataset.id).toBe('search');
    expect(bar.element.style.getPropertyValue('--mtrl-navigation-bar-count')).toBe('2');
});

test('the item layout is a class; auto by default', () => {
    expect(make().element.classList.contains('mtrl-navigation-bar--auto')).toBe(true);
    expect(make({ itemLayout: 'horizontal' }).element.classList.contains('mtrl-navigation-bar--horizontal')).toBe(true);
    expect(make({ itemLayout: 'vertical' }).element.classList.contains('mtrl-navigation-bar--vertical')).toBe(true);
});

test('hide and show emit visibility once per change, and focus inside shows the bar', () => {
    const bar = make();
    const seen: boolean[] = [];
    bar.on('visibility', ({ hidden }) => seen.push(hidden));
    bar.hide(); bar.hide();
    expect([bar.isHidden(), bar.element.classList.contains('mtrl-navigation-bar--hidden')]).toEqual([true, true]);
    item(bar, 'home').focus();
    expect(bar.isHidden()).toBe(false);
    bar.show();
    expect(seen).toEqual([true, false]);
});

test('no scroll listener unless hideOnScroll; one on the target given; none after destroy', () => {
    make();
    expect(windowListeners).not.toContain('scroll');
    make({ hideOnScroll: true });
    expect(windowListeners).toContain('scroll');
    const pane = document.createElement('div');
    let added = 0, removed = 0;
    pane.addEventListener = ((type: string) => { if (type === 'scroll') added++; }) as typeof pane.addEventListener;
    pane.removeEventListener = ((type: string) => { if (type === 'scroll') removed++; }) as typeof pane.removeEventListener;
    const bar = make({ hideOnScroll: { target: pane } });
    bar.destroy();
    expect([added, removed]).toEqual([1, 1]);
});

test('destroy is idempotent, and the bar does nothing afterwards', () => {
    const bar = make();
    let selected = 0;
    bar.on('select', () => selected++);
    bar.destroy();
    bar.destroy();
    expect(bar.element.isConnected).toBe(false);
    expect(() => bar.setActive('search').setItems([]).hide()).not.toThrow();
    expect(selected).toBe(0);
});
