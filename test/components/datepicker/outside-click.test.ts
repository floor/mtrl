// test/components/datepicker/outside-click.test.ts
//
// The real datepicker in a JSDOM document. The picker listens on the document
// to close when a click lands outside it; destroy() must take that listener
// off again, or every picker ever created keeps reacting.
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

import createDatePicker from '../../../src/components/datepicker';

/** Counts the click listeners the document holds while fn runs */
const documentClickListeners = () => {
  const add = document.addEventListener.bind(document);
  const remove = document.removeEventListener.bind(document);
  const handlers = new Set<EventListenerOrEventListenerObject>();
  document.addEventListener = ((type: string, handler: EventListenerOrEventListenerObject, options?: unknown) => {
    if (type === 'click') handlers.add(handler);
    return add(type as keyof DocumentEventMap, handler as EventListener, options as boolean);
  }) as typeof document.addEventListener;
  document.removeEventListener = ((type: string, handler: EventListenerOrEventListenerObject, options?: unknown) => {
    if (type === 'click') handlers.delete(handler);
    return remove(type as keyof DocumentEventMap, handler as EventListener, options as boolean);
  }) as typeof document.removeEventListener;
  return {
    get size() { return handlers.size; },
    restore() { document.addEventListener = add as typeof document.addEventListener; document.removeEventListener = remove as typeof document.removeEventListener; },
  };
};

const clickOutside = () => {
  const outside = document.createElement('div');
  document.body.appendChild(outside);
  outside.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  outside.remove();
};

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('datepicker outside click', () => {
  test('a click outside closes the open picker', () => {
    const picker = createDatePicker();
    document.body.appendChild(picker.element);
    let closes = 0;
    picker.on('close', () => closes++);

    picker.open();
    clickOutside();
    expect(closes).toBe(1);

    // a click inside the picker leaves it alone
    picker.open();
    picker.element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    expect(closes).toBe(1);
    picker.destroy();
  });

  test('destroy takes the document listener off; a later click reaches no picker', () => {
    const listeners = documentClickListeners();
    try {
      const picker = createDatePicker();
      document.body.appendChild(picker.element);
      const before = listeners.size;
      expect(before).toBeGreaterThan(0);

      let closes = 0;
      picker.on('close', () => closes++);
      picker.open();

      picker.destroy();
      expect(listeners.size).toBe(before - 1);

      clickOutside();
      expect(closes).toBe(0);
    } finally {
      listeners.restore();
    }
  });
});
