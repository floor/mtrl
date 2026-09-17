// test/components/checkbox/label.test.ts
//
// The real checkbox's label API. Until 0.9.3 setLabel() and getLabel() read a
// `text` key that withTextLabel never sets -- it stores its manager as `label`
// -- so getLabel() returned "" even for a checkbox rendered with a label, and
// setLabel() did nothing. The mock suite in test/components/checkbox.test.ts
// defined its own setLabel and could not see it. The rest of the checkbox still
// waits for that suite to be ported (F6).
import { describe, test, expect } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);

import createCheckbox from '../../../src/components/checkbox';

describe('checkbox label', () => {
  test('getLabel() reads the rendered label, and setLabel() changes it', () => {
    const checkbox = createCheckbox({ label: 'Remember me' });
    expect(checkbox.getLabel()).toBe('Remember me');
    checkbox.setLabel('Stay signed in');
    expect(checkbox.getLabel()).toBe('Stay signed in');
    expect(checkbox.element.querySelector('label')?.textContent).toBe('Stay signed in');
  });
});
