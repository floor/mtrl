// test/components/datepicker/input.test.ts
//
// The real datepicker in a JSDOM document. The datepicker suite builds a mock
// picker, so the input the component creates is pinned here.
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

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('datepicker input', () => {
  test('the input is the INPUT element inside the picker', () => {
    const picker = createDatePicker();
    document.body.appendChild(picker.element);
    expect(picker.input.tagName).toBe('INPUT');
    expect(picker.element.querySelector('input')).toBe(picker.input);
    picker.destroy();
  });

  test('setting a date writes it into the input', () => {
    const picker = createDatePicker();
    document.body.appendChild(picker.element);
    picker.setValue(new Date(2026, 8, 15));
    expect(picker.input.value).toBe('09/15/2026');
    picker.destroy();
  });
});
