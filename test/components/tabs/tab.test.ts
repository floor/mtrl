// test/components/tabs/tab.test.ts
//
// The real tab in a JSDOM document. The tabs suite builds mock tabs, so the
// event methods on the object createTab returns are pinned here.
import { describe, test, expect, beforeEach } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.CustomEvent = dom.window.CustomEvent;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

import { createTab } from '../../../src/components/tabs/tab';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('tab', () => {
  test('on and off return the tab they are called on', () => {
    const tab = createTab({ text: 'One', value: 'one' });
    const handler = () => {};
    expect(tab.on('click', handler)).toBe(tab);
    expect(tab.off('click', handler)).toBe(tab);
    tab.destroy();
  });

  test('a click handler registered through on fires, and stops after off', () => {
    const tab = createTab({ text: 'One', value: 'one' });
    document.body.appendChild(tab.element);
    let clicks = 0;
    const handler = () => clicks++;
    tab.on('click', handler);
    tab.element.click();
    expect(clicks).toBe(1);
    tab.off('click', handler);
    tab.element.click();
    expect(clicks).toBe(1);
    tab.destroy();
  });

  test('two tabs with the same value do not share an id', () => {
    const one = createTab({ text: 'One', value: 'one' });
    const two = createTab({ text: 'One', value: 'one' });
    expect(one.element.id).toBeTruthy();
    expect(two.element.id).toBeTruthy();
    expect(one.element.id).not.toBe(two.element.id);
    expect(one.element.hasAttribute('aria-controls')).toBe(false);
    one.destroy();
    two.destroy();
  });

  test('setValue keeps the group id and only controls a matching panel', () => {
    const tab = createTab({ text: 'One', value: 'one', groupId: 'g' });
    expect(tab.element.id).toBe('tab-g-one');
    expect(tab.element.hasAttribute('aria-controls')).toBe(false);

    const panel = document.createElement('div');
    panel.setAttribute('role', 'tabpanel');
    panel.id = 'tabpanel-g-two';
    document.body.append(panel);

    tab.setValue('two');
    expect(tab.element.id).toBe('tab-g-two');
    expect(tab.element.getAttribute('aria-controls')).toBe('tabpanel-g-two');
    tab.destroy();
  });
});
