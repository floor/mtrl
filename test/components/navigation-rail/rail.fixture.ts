import { beforeEach, afterEach, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import createNavigationRail from '../../../src/components/navigation-rail';
let dom: JSDOM;
let rails: ReturnType<typeof createNavigationRail>[];
beforeEach(() => {
    dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://example.test' });
    for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent'])
        Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: name === 'window' ? dom.window : Reflect.get(dom.window, name) });
    rails = [];
});
afterEach(() => { rails.forEach(rail => rail.destroy()); dom.window.close(); });
const make = (config: Parameters<typeof createNavigationRail>[0] = {}) => {
    const rail = createNavigationRail({ items: [{ id: 'home', label: 'Home', icon: '<svg></svg>', active: true }, { id: 'mail', label: 'Mail', icon: '<svg></svg>', href: '/mail' }], ...config });
    document.body.append(rail.element);
    rails.push(rail);
    return rail;
};
test('standalone navigation exposes links and current destination, not tabs', () => {
    const rail = make();
    expect(rail.element.tagName).toBe('NAV');
    expect(rail.element.querySelector('[role="tab"]')).toBeNull();
    expect(rail.element.querySelector('[data-id="home"]')?.getAttribute('aria-current')).toBe('page');
    expect(rail.element.querySelector('a')?.getAttribute('href')).toBe('/mail');
});
test('expansion keeps destination nodes and focus and emits only on changes', () => {
    let changes = 0;
    const rail = make({ onExpand: () => changes++ });
    const item = rail.element.querySelector<HTMLElement>('[data-id="home"]')!;
    item.focus();
    rail.expand().expand();
    expect(changes).toBe(1);
    expect(rail.isExpanded()).toBe(true);
    expect(document.activeElement).toBe(item);
    expect(rail.element.querySelector('[data-id="home"]')).toBe(item);
    rail.collapse();
    expect(rail.isExpanded()).toBe(false);
});
test('keyboard moves focus past disabled items without changing selection', () => {
    const rail = make({ items: [{ id: 'a', label: 'A', icon: 'A', active: true }, { id: 'b', label: 'B', icon: 'B', disabled: true }, { id: 'c', label: 'C', icon: 'C' }] });
    const a = rail.element.querySelector<HTMLElement>('[data-id="a"]')!;
    a.focus();
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect((document.activeElement as HTMLElement).dataset.id).toBe('c');
    expect(rail.getActive()).toBe('a');
});
test('selection swaps icons and modified link clicks preserve current page', () => {
    const rail = make({ items: [{ id: 'a', label: 'A', icon: 'outline', activeIcon: 'filled', active: true }, { id: 'b', label: 'B', icon: 'B', href: '/b' }] });
    expect(rail.element.querySelector('[data-id="a"]')?.textContent).toContain('filled');
    rail.element.querySelector('a')!.dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true, cancelable: true }));
    expect(rail.getActive()).toBe('a');
    rail.setActive('b');
    expect(rail.element.querySelector('[data-id="a"]')?.textContent).toContain('outline');
});
test('items are copied, badges update without losing focus, invalid IDs preserve selection', () => {
    const items = [{ id: 'a"b', label: 'Home', icon: 'H', active: true }];
    const rail = make({ items });
    items[0].label = 'Changed';
    const item = rail.element.querySelector<HTMLElement>('[data-id]')!;
    item.focus();
    rail.setBadge('a"b', '8');
    expect(item.textContent).toContain('Home');
    expect(item.textContent).toContain('8');
    expect(document.activeElement).toBe(item);
    rail.setActive('missing');
    expect(rail.getActive()).toBe('a"b');
    expect(() => rail.setItems([{ id: 'x', label: 'X', icon: 'X' }, { id: 'x', label: 'Y', icon: 'Y' }])).toThrow();
    expect(rail.getActive()).toBe('a"b');
});
test('destroy releases interaction, supports repeated calls, and cannot restart', () => {
    let calls = 0;
    const rail = make({ onSelect: () => calls++ });
    const item = rail.element.querySelector<HTMLButtonElement>('[data-id="home"]')!;
    rail.destroy();
    rail.destroy();
    item.click();
    rail.expand();
    expect(calls).toBe(0);
    expect(rail.element.isConnected).toBe(false);
    expect(rail.isExpanded()).toBe(false);
});
test('replacing items normalizes selection and moves focus away from a newly disabled destination', () => {
    const rail = make();
    rail.element.querySelector<HTMLElement>('[data-id="home"]')!.focus();
    rail.setItems([{ id: 'home', label: 'Home', icon: 'H', disabled: true, active: true }, { id: 'next', label: 'Next', icon: 'N', active: true }, { id: 'last', label: 'Last', icon: 'L', active: true }]);
    expect(rail.getActive()).toBe('next');
    expect((document.activeElement as HTMLElement).dataset.id).toBe('next');
    expect(rail.element.querySelectorAll('[aria-current="page"]').length).toBe(1);
});
test('hidden collapsed rails are inert and show their optional header on expansion', () => {
    const header = document.createElement('button');
    header.textContent = 'Compose';
    const rail = make({ hideWhenCollapsed: true, showToggle: false, header });
    expect(rail.element.hasAttribute('inert')).toBe(true);
    rail.expand();
    expect(rail.element.hasAttribute('inert')).toBe(false);
    expect(rail.element.contains(header)).toBe(true);
    rail.destroy();
    expect(header.textContent).toBe('Compose');
});
test('press ripples are removed on animation completion and destroy', () => {
    const rail = make();
    const item = rail.element.querySelector<HTMLElement>('[data-id="home"]')!;
    item.dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }));
    const wave = rail.element.querySelector('.mtrl-navigation-rail__ripple')!;
    expect(wave).not.toBeNull();
    wave.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(rail.element.querySelector('.mtrl-navigation-rail__ripple')).toBeNull();
    item.dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }));
    rail.destroy();
    expect(rail.element.querySelector('.mtrl-navigation-rail__ripple')).toBeNull();
});
