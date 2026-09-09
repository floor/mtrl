// test/components/card/card.test.ts
//
// The real component in a JSDOM document. The existing card suite builds a
// hand-written mock, which is why a debug class shipped on every card and a
// drag state was never updated: neither is visible to a test of a mock.
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
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

import createCard from '../../../src/components/card';
import { createCardContent } from '../../../src/components/card/content';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('card', () => {
  test('it builds with the three M3 variants', () => {
    for (const variant of ['elevated', 'filled', 'outlined']) {
      const card = createCard({ variant });
      expect(card.element.classList.contains(`mtrl-card--${variant}`)).toBe(true);
    }
  });

  test('it takes no width of its own', () => {
    // the width belongs to the layout, not to the component
    const card = createCard();
    expect(card.element.style.width).toBe('');
  });

  test('card content carries no debug class', () => {
    // this shipped on every card, under a comment saying to remove it
    const content = createCardContent({ text: 'Body' });
    expect(content.classList.contains('debug-content')).toBe(false);
    expect(content.className).not.toContain('debug');
  });

  test('a draggable card reports being grabbed, with or without a callback', () => {
    // the listeners that maintain aria-grabbed used to sit inside the callback
    // branch, so a plain makeDraggable() left it reading false for the drag
    const plain = createCard();
    plain.makeDraggable();
    expect(plain.element.getAttribute('draggable')).toBe('true');
    expect(plain.element.getAttribute('aria-grabbed')).toBe('false');

    plain.element.dispatchEvent(new dom.window.Event('dragstart'));
    expect(plain.element.getAttribute('aria-grabbed')).toBe('true');

    plain.element.dispatchEvent(new dom.window.Event('dragend'));
    expect(plain.element.getAttribute('aria-grabbed')).toBe('false');
  });

  test('a drag callback still runs, and still reports the state', () => {
    let called = 0;
    const card = createCard();
    card.makeDraggable(() => { called += 1; });

    card.element.dispatchEvent(new dom.window.Event('dragstart'));
    expect(called).toBe(1);
    expect(card.element.getAttribute('aria-grabbed')).toBe('true');

    card.element.dispatchEvent(new dom.window.Event('dragend'));
    expect(card.element.getAttribute('aria-grabbed')).toBe('false');
  });

  test('an interactive card is marked and reachable', () => {
    const card = createCard({ interactive: true });
    expect(card.element.classList.contains('mtrl-card--interactive')).toBe(true);
    expect(card.element.getAttribute('tabindex')).not.toBeNull();
  });
});
