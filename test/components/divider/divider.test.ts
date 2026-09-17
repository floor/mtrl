// test/components/divider/divider.test.ts
//
// The real divider in a JSDOM document: orientation, variants and insets,
// thickness and color, and how each setter leaves the element when called after
// the others. divider-inset.test.ts covers inset dividers fitting their parent.
//
// This replaces test/components/divider.test.ts, which asserted against a mock
// defined in its own file. Porting it found that every setter worked only once,
// from the state the divider was created with: setOrientation() and setVariant()
// never updated what getOrientation() and getVariant() return, so switching back
// left both classes; setInset() did nothing after setVariant() from full-width;
// setThickness() sized the wrong axis after setOrientation(); and setVariant()
// to an inset kept the full width the inset fix removed at creation. A vertical
// divider also never told assistive technology its orientation.
import { describe, test, expect } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.CustomEvent = dom.window.CustomEvent;

import { createDivider } from '../../../src/components/divider';

const modifiers = (divider: { element: HTMLElement }) =>
  Array.from(divider.element.classList).filter((name) => name.startsWith('mtrl-divider--')).sort();

describe('divider creation', () => {
  test('is a horizontal full-width hr by default', () => {
    const divider = createDivider();
    expect(divider.element.tagName).toBe('HR');
    expect(divider.element.classList.contains('mtrl-divider')).toBe(true);
    expect(modifiers(divider)).toEqual(['mtrl-divider--full-width', 'mtrl-divider--horizontal']);
    expect(divider.getOrientation()).toBe('horizontal');
    expect(divider.getVariant()).toBe('full-width');
    expect(divider.element.style.height).toBe('1px');
    expect(divider.element.style.width).toBe('100%');
    expect(divider.element.hasAttribute('aria-orientation')).toBe(false);
  });

  test('a vertical divider says so to assistive technology', () => {
    const divider = createDivider({ orientation: 'vertical', thickness: 2 });
    expect(divider.getOrientation()).toBe('vertical');
    expect(divider.element.getAttribute('aria-orientation')).toBe('vertical');
    expect(divider.element.style.width).toBe('2px');
    expect(divider.element.style.height).toBe('100%');
  });

  test('applies a custom class and color', () => {
    const divider = createDivider({ class: 'extra', color: 'rgb(255, 0, 0)' });
    expect(divider.element.classList.contains('mtrl-extra')).toBe(true);
    expect(divider.element.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  test('middle-inset defaults to 16px on both sides', () => {
    const divider = createDivider({ variant: 'middle-inset' });
    expect(divider.getVariant()).toBe('middle-inset');
    expect(divider.element.style.marginLeft).toBe('16px');
    expect(divider.element.style.marginRight).toBe('16px');
  });
});

describe('divider orientation', () => {
  test('setOrientation switches and switches back cleanly', () => {
    const divider = createDivider({ thickness: 2 });
    divider.setOrientation('vertical');
    expect(divider.getOrientation()).toBe('vertical');
    expect(modifiers(divider)).toEqual(['mtrl-divider--full-width', 'mtrl-divider--vertical']);
    expect(divider.element.style.width).toBe('2px');
    expect(divider.element.style.height).toBe('100%');
    expect(divider.element.getAttribute('aria-orientation')).toBe('vertical');

    divider.setOrientation('horizontal');
    expect(divider.getOrientation()).toBe('horizontal');
    expect(modifiers(divider)).toEqual(['mtrl-divider--full-width', 'mtrl-divider--horizontal']);
    expect(divider.element.style.height).toBe('2px');
    expect(divider.element.style.width).toBe('100%');
    expect(divider.element.hasAttribute('aria-orientation')).toBe(false);
  });

  test('an inset moves to the new axis', () => {
    const divider = createDivider({ variant: 'inset', insetStart: 24 });
    divider.setOrientation('vertical');
    expect(divider.element.style.marginLeft).toBe('');
    expect(divider.element.style.marginTop).toBe('24px');
    expect(divider.element.style.marginBottom).toBe('0px');
    expect(divider.element.style.height).toBe('auto');
  });
});

describe('divider variants and insets', () => {
  test('setVariant to inset applies the inset and fits the parent', () => {
    const divider = createDivider();
    divider.setVariant('inset');
    expect(divider.getVariant()).toBe('inset');
    expect(modifiers(divider)).toEqual(['mtrl-divider--horizontal', 'mtrl-divider--inset']);
    expect(divider.element.style.marginLeft).toBe('16px');
    expect(divider.element.style.marginRight).toBe('0px');
    expect(divider.element.style.width).toBe('auto');
  });

  test('setVariant back to full-width clears the inset', () => {
    const divider = createDivider({ variant: 'middle-inset' });
    divider.setVariant('inset').setVariant('full-width');
    expect(divider.getVariant()).toBe('full-width');
    expect(modifiers(divider)).toEqual(['mtrl-divider--full-width', 'mtrl-divider--horizontal']);
    expect(divider.element.style.marginLeft).toBe('');
    expect(divider.element.style.marginRight).toBe('');
    expect(divider.element.style.width).toBe('100%');
  });

  test('setInset changes the margins of an inset divider', () => {
    const divider = createDivider({ variant: 'middle-inset' });
    divider.setInset(8, 4);
    expect(divider.element.style.marginLeft).toBe('8px');
    expect(divider.element.style.marginRight).toBe('4px');
    divider.setInset(undefined, 12);
    expect(divider.element.style.marginLeft).toBe('8px');
    expect(divider.element.style.marginRight).toBe('12px');
  });

  test('setInset works after setVariant made the divider inset', () => {
    const divider = createDivider();
    divider.setVariant('inset').setInset(8, 4);
    expect(divider.element.style.marginLeft).toBe('8px');
    expect(divider.element.style.marginRight).toBe('4px');
  });

  test('custom insets survive a change of orientation', () => {
    const divider = createDivider({ variant: 'inset' });
    divider.setInset(10, 6).setOrientation('vertical');
    expect(divider.element.style.marginTop).toBe('10px');
    expect(divider.element.style.marginBottom).toBe('6px');
  });
});

describe('divider thickness and color', () => {
  test('setThickness sizes the cross axis', () => {
    const divider = createDivider();
    divider.setThickness(3);
    expect(divider.element.style.height).toBe('3px');
    expect(divider.element.style.width).toBe('100%');
  });

  test('setThickness follows the current orientation', () => {
    const divider = createDivider({ thickness: 2 });
    divider.setOrientation('vertical').setThickness(3);
    expect(divider.element.style.width).toBe('3px');
    expect(divider.element.style.height).toBe('100%');
  });

  test('setColor sets the background', () => {
    const divider = createDivider();
    divider.setColor('rgb(0, 128, 0)');
    expect(divider.element.style.backgroundColor).toBe('rgb(0, 128, 0)');
  });
});
