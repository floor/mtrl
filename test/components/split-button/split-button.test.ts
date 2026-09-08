// test/components/split-button/split-button.test.ts
//
// The split button in a JSDOM document: what it renders, how it is labelled,
// and what the trailing button does.
import { describe, test, expect, beforeEach } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.ResizeObserver = class { observe() {} disconnect() {} };

import createSplitButton from '../../../src/components/split-button';

const items = [
  { id: 'queue', text: 'Add to queue' },
  { id: 'playlist', text: 'Save to playlist' },
];

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('split button', () => {
  test('is a group of two buttons: the action and the one that opens more', () => {
    const split = createSplitButton({ text: 'Watch later', groupLabel: 'Watch options' });
    const el = split.element;
    expect(el.classList.contains('mtrl-split-button')).toBe(true);
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-label')).toBe('Watch options');

    expect(split.leadingElement.classList.contains('mtrl-split-button__leading')).toBe(true);
    expect(split.leadingElement.textContent).toBe('Watch later');
    expect(split.trailingElement.classList.contains('mtrl-split-button__trailing')).toBe(true);
    // both halves are the library's button, so they share its colours and states
    expect(split.leadingElement.classList.contains('mtrl-button')).toBe(true);
    expect(split.trailingElement.classList.contains('mtrl-button')).toBe(true);
    expect(el.children.length).toBe(2);
    expect(el.firstElementChild).toBe(split.leadingElement);
  });

  test('the trailing button says that it opens something and whether it is open', () => {
    const split = createSplitButton({ text: 'Watch later' });
    const trailing = split.trailingElement;
    expect(trailing.getAttribute('aria-haspopup')).toBe('true');
    expect(trailing.getAttribute('aria-expanded')).toBe('false');
    expect(trailing.getAttribute('aria-label')).toBe('More options');
    expect(trailing.querySelector('.mtrl-split-button__chevron')).not.toBeNull();

    // and it should say how its choices relate to the action
    const named = createSplitButton({ text: 'Watch later', trailingLabel: 'More watch options' });
    expect(named.trailingElement.getAttribute('aria-label')).toBe('More watch options');
    // with items it opens a menu, and says so
    expect(createSplitButton({ text: 'x', items }).trailingElement.getAttribute('aria-haspopup')).toBe('menu');
  });

  test('both halves take the same variant and size, defaulting to filled and small', () => {
    const split = createSplitButton({ text: 'Save' });
    expect(split.element.classList.contains('mtrl-split-button--filled')).toBe(true);
    expect(split.element.classList.contains('mtrl-split-button--s')).toBe(true);
    expect(split.leadingElement.classList.contains('mtrl-button--filled')).toBe(true);
    expect(split.trailingElement.classList.contains('mtrl-button--filled')).toBe(true);

    const tonal = createSplitButton({ text: 'Save', variant: 'tonal', size: 'xl' });
    expect(tonal.element.classList.contains('mtrl-split-button--tonal')).toBe(true);
    expect(tonal.element.classList.contains('mtrl-split-button--xl')).toBe(true);
    expect(tonal.leadingElement.classList.contains('mtrl-button--xl')).toBe(true);
    expect(tonal.trailingElement.classList.contains('mtrl-button--tonal')).toBe(true);
  });

  test('the leading button carries the action', () => {
    const clicks: string[] = [];
    const split = createSplitButton({ text: 'Watch later', onClick: () => clicks.push('click') });
    split.leadingElement.click();
    expect(clicks).toEqual(['click']);
    // and the trailing button is not the action
    split.trailingElement.click();
    expect(clicks).toEqual(['click']);
  });

  test('the trailing button toggles, and reports it both ways', () => {
    const split = createSplitButton({ text: 'Watch later' });
    const events: string[] = [];
    split.on('expand', () => events.push('expand'));
    split.on('collapse', () => events.push('collapse'));
    split.on('change', (e) => events.push(`change:${e.expanded}`));

    expect(split.isExpanded()).toBe(false);
    split.trailingElement.click();
    expect(split.isExpanded()).toBe(true);
    expect(split.trailingElement.getAttribute('aria-expanded')).toBe('true');
    expect(split.element.classList.contains('mtrl-split-button--expanded')).toBe(true);

    split.trailingElement.click();
    expect(split.isExpanded()).toBe(false);
    expect(split.trailingElement.getAttribute('aria-expanded')).toBe('false');
    expect(split.element.classList.contains('mtrl-split-button--expanded')).toBe(false);
    expect(events).toEqual(['expand', 'change:true', 'collapse', 'change:false']);
  });

  test('it can be opened and closed from the outside, and says nothing twice', () => {
    const split = createSplitButton({ text: 'Watch later' });
    const events: string[] = [];
    split.on('change', (e) => events.push(`${e.expanded}`));
    split.expand();
    split.expand();
    expect(events).toEqual(['true']);
    split.collapse();
    split.collapse();
    expect(events).toEqual(['true', 'false']);
  });

  test('with items it owns a menu anchored to the trailing button', async () => {
    const chosen: string[] = [];
    const split = createSplitButton({ text: 'Watch later', items, onSelect: (e) => chosen.push(String(e.item?.id ?? '')) });
    expect(split.menu).toBeDefined();
    split.expand();
    expect(split.menu!.isOpen()).toBe(true);
    split.collapse();
    // the menu takes its closing animation to go
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(split.menu!.isOpen()).toBe(false);
    // a menu closed from the outside brings the button's state back with it
    split.expand();
    split.menu!.close();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(split.isExpanded()).toBe(false);
    expect(split.trailingElement.getAttribute('aria-expanded')).toBe('false');
    void chosen;
  });

  test('the label and the icon can change, and both halves disable together', () => {
    const split = createSplitButton({ text: 'Save' });
    split.setText('Save draft');
    expect(split.getText()).toBe('Save draft');
    split.setIcon('<svg id="new"></svg>');
    expect(split.leadingElement.querySelector('#new')).not.toBeNull();

    expect(split.isDisabled()).toBe(false);
    split.disable();
    expect(split.leadingElement.disabled).toBe(true);
    expect(split.trailingElement.disabled).toBe(true);
    expect(split.isDisabled()).toBe(true);
    split.enable();
    expect(split.leadingElement.disabled).toBe(false);
    expect(split.trailingElement.disabled).toBe(false);
  });

  test('a disabled split button starts with both halves disabled', () => {
    const split = createSplitButton({ text: 'Save', disabled: true });
    expect(split.leadingElement.disabled).toBe(true);
    expect(split.trailingElement.disabled).toBe(true);
  });

  test('destroy takes it off the page', () => {
    const split = createSplitButton({ text: 'Save', items });
    document.body.appendChild(split.element);
    split.destroy();
    expect(document.body.contains(split.element)).toBe(false);
  });
});
