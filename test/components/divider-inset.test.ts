// test/components/divider-inset.test.ts
//
// withOrientation sizes a horizontal divider at width: 100%, and withInset then added
// left/right margins to that same element. 100% plus margins overflows the parent, so an
// inset divider ran past the edge of whatever contained it. The fix lets the box shrink
// to what the insets leave. Real DOM, no mock: the previous divider test mocked the
// component and so could not have caught this.
import { describe, test, expect } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document as any;
global.window = dom.window as any;
global.Element = dom.window.Element as any;
global.HTMLElement = dom.window.HTMLElement as any;
global.Event = dom.window.Event as any;
global.CustomEvent = dom.window.CustomEvent as any;

import { createDivider } from '../../src/components/divider';

describe('divider insets', () => {
  test('a full-width divider still spans its container', () => {
    const divider = createDivider();
    expect(divider.element.style.width).toBe('100%');
    expect(divider.element.style.marginLeft).toBe('');
  });

  test('an inset divider does not also claim the full width', () => {
    const divider = createDivider({ variant: 'inset' });
    expect(divider.element.style.marginLeft).toBe('16px');
    // The bug: width stayed 100% alongside a 16px margin, overflowing the parent.
    expect(divider.element.style.width).not.toBe('100%');
    expect(divider.element.style.width).toBe('auto');
  });

  test('a middle-inset divider is inset on both sides and still fits', () => {
    const divider = createDivider({ variant: 'middle-inset' });
    expect(divider.element.style.marginLeft).toBe('16px');
    expect(divider.element.style.marginRight).toBe('16px');
    expect(divider.element.style.width).toBe('auto');
  });

  test('explicit insets are honoured, and still fit', () => {
    const divider = createDivider({ variant: 'inset', insetStart: 24, insetEnd: 8 });
    expect(divider.element.style.marginLeft).toBe('24px');
    expect(divider.element.style.marginRight).toBe('8px');
    expect(divider.element.style.width).toBe('auto');
  });

  test('a vertical inset divider does not also claim the full height', () => {
    const divider = createDivider({ orientation: 'vertical', variant: 'inset' });
    expect(divider.element.style.marginTop).toBe('16px');
    expect(divider.element.style.height).not.toBe('100%');
    expect(divider.element.style.height).toBe('auto');
  });

  test('a vertical full-width divider still spans its container', () => {
    const divider = createDivider({ orientation: 'vertical' });
    expect(divider.element.style.height).toBe('100%');
  });
});
