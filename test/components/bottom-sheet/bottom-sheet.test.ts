// test/components/bottom-sheet/bottom-sheet.test.ts
//
// The real component in a JSDOM document, not a mock. The sheet this one
// replaces had 29 passing tests against a hand-written mock while its `open()`
// threw on every call, so nothing here stands in for the component itself.
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
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
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);

import createBottomSheet from '../../../src/components/bottom-sheet';

let sheets: Array<{ destroy: () => void }> = [];
const make = (config = {}) => {
  const sheet = createBottomSheet(config);
  sheets.push(sheet);
  return sheet;
};

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  for (const sheet of sheets) sheet.destroy();
  sheets = [];
});

describe('bottom sheet', () => {
  test('it mounts itself, hidden', () => {
    const sheet = make({ title: 'Share' });
    expect(sheet.element.isConnected).toBe(true);
    expect(sheet.element.getAttribute('aria-hidden')).toBe('true');
    expect(sheet.isOpen()).toBe(false);
    expect(sheet.getState()).toBe('hidden');
  });

  test('opening and closing move through the states', () => {
    const sheet = make();
    sheet.open();
    expect(sheet.isOpen()).toBe(true);
    expect(sheet.getState()).toBe('partial');
    expect(sheet.element.getAttribute('aria-hidden')).toBe('false');

    sheet.expand();
    expect(sheet.getState()).toBe('expanded');

    sheet.collapse();
    expect(sheet.getState()).toBe('partial');

    sheet.close();
    expect(sheet.isOpen()).toBe(false);
    expect(sheet.element.getAttribute('aria-hidden')).toBe('true');
  });

  test('open() does not throw, and its events fire', () => {
    // the previous sheet component called an events object the composed
    // enhancer never provided, so this is the regression that matters most
    const seen: string[] = [];
    const sheet = make();
    sheet.on('open', () => seen.push('open'));
    sheet.on('close', () => seen.push('close'));

    expect(() => sheet.open()).not.toThrow();
    expect(() => sheet.close()).not.toThrow();
    expect(seen).toEqual(['open', 'close']);
  });

  test('a state change reports where it came from', () => {
    const changes: Array<{ state: string; previous: string }> = [];
    const sheet = make({ on: { stateChange: (e: any) => changes.push(e) } });

    sheet.open();
    sheet.expand();

    expect(changes).toEqual([
      { state: 'partial', previous: 'hidden' },
      { state: 'expanded', previous: 'partial' }
    ]);
  });

  test('handlers given at creation are registered', () => {
    // an `on` option that is declared and never read is the most common defect
    // in this library; this proves the sheet reads it
    let opened = 0;
    const sheet = make({ on: { open: () => { opened += 1; } } });
    sheet.open();
    expect(opened).toBe(1);
  });

  test('a modal sheet has a scrim and is a dialog; a standard one is neither', () => {
    const modal = make({ variant: 'modal' });
    const scrim = modal.element.querySelector('.mtrl-bottom-sheet-scrim');
    const container = modal.element.querySelector('.mtrl-bottom-sheet-container')!;
    expect(scrim).not.toBeNull();
    expect(container.getAttribute('role')).toBe('dialog');
    expect(container.getAttribute('aria-modal')).toBe('true');

    const standard = make({ variant: 'standard' });
    expect(standard.element.querySelector('.mtrl-bottom-sheet-scrim')).toBeNull();
    expect(
      standard.element.querySelector('.mtrl-bottom-sheet-container')!.getAttribute('role')
    ).toBe('region');
  });

  test('the scrim is in the document, not merely created', () => {
    // the previous sheet inserted its scrim through a parent that did not
    // exist yet, so no modal sheet ever had an overlay
    const sheet = make({ variant: 'modal' });
    const scrim = sheet.element.querySelector('.mtrl-bottom-sheet-scrim');
    expect(scrim?.isConnected).toBe(true);
  });

  test('clicking the scrim closes a modal sheet, unless told not to', () => {
    const sheet = make({ variant: 'modal' });
    sheet.open();
    (sheet.element.querySelector('.mtrl-bottom-sheet-scrim') as HTMLElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(sheet.isOpen()).toBe(false);

    const sticky = make({ variant: 'modal', closeOnScrimClick: false });
    sticky.open();
    (sticky.element.querySelector('.mtrl-bottom-sheet-scrim') as HTMLElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(sticky.isOpen()).toBe(true);
  });

  test('Escape closes it, unless told not to', () => {
    const sheet = make();
    sheet.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(sheet.isOpen()).toBe(false);

    const sticky = make({ closeOnEscape: false });
    sticky.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(sticky.isOpen()).toBe(true);
  });

  test('a title names the sheet for assistive technology', () => {
    const sheet = make({ title: 'Share this file' });
    const container = sheet.element.querySelector('.mtrl-bottom-sheet-container')!;
    const title = sheet.element.querySelector('.mtrl-bottom-sheet-title')!;
    expect(title.textContent).toBe('Share this file');
    expect(container.getAttribute('aria-labelledby')).toBe(title.id);
    expect(title.id).not.toBe('');
  });

  test('a title added later is announced too', () => {
    const sheet = make();
    expect(sheet.element.querySelector('.mtrl-bottom-sheet-title')).toBeNull();

    sheet.setTitle('Added later');
    const container = sheet.element.querySelector('.mtrl-bottom-sheet-container')!;
    const title = sheet.element.querySelector('.mtrl-bottom-sheet-title')!;
    expect(title.textContent).toBe('Added later');
    expect(container.getAttribute('aria-labelledby')).toBe(title.id);
  });

  test('the drag handle is there by default and can be turned off', () => {
    expect(make().element.querySelector('.mtrl-bottom-sheet-handle')).not.toBeNull();
    expect(
      make({ dragHandle: false }).element.querySelector('.mtrl-bottom-sheet-handle')
    ).toBeNull();
  });

  test('content can be markup or an element, and can be replaced', () => {
    const sheet = make({ content: '<p>First</p>' });
    const content = sheet.element.querySelector('.mtrl-bottom-sheet-content')!;
    expect(content.textContent).toBe('First');

    const replacement = document.createElement('span');
    replacement.textContent = 'Second';
    sheet.setContent(replacement);
    expect(content.textContent).toBe('Second');
    expect(content.querySelector('span')).not.toBeNull();
  });

  test('the max width is applied, so it does not stretch across a desktop', () => {
    const container = make().element.querySelector('.mtrl-bottom-sheet-container') as HTMLElement;
    expect(container.style.maxWidth).toBe('640px');
    const narrow = make({ maxWidth: 400 }).element.querySelector('.mtrl-bottom-sheet-container') as HTMLElement;
    expect(narrow.style.maxWidth).toBe('400px');
  });

  test('destroy takes the sheet off the page and stops listening', () => {
    const sheet = createBottomSheet();
    sheet.open();
    const element = sheet.element;
    sheet.destroy();

    expect(element.isConnected).toBe(false);
    // the document listener must go with it, or Escape keeps reaching a
    // component that no longer exists
    expect(() =>
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    ).not.toThrow();
  });

  test('it can start open', () => {
    const sheet = make({ initialState: 'expanded' });
    expect(sheet.getState()).toBe('expanded');
    expect(sheet.isOpen()).toBe(true);
  });
});
