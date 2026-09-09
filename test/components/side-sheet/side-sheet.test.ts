// test/components/side-sheet/side-sheet.test.ts
//
// The real component in a JSDOM document, not a mock.
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
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
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);

import createSideSheet from '../../../src/components/side-sheet';

let sheets: Array<{ destroy: () => void }> = [];
const make = (config = {}) => {
  const sheet = createSideSheet(config);
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

describe('side sheet', () => {
  test('it mounts itself, closed', () => {
    const sheet = make({ title: 'Filters' });
    expect(sheet.element.isConnected).toBe(true);
    expect(sheet.isOpen()).toBe(false);
    expect(sheet.element.getAttribute('aria-hidden')).toBe('true');
  });

  test('open, close and toggle, without throwing', () => {
    const sheet = make();
    expect(() => sheet.open()).not.toThrow();
    expect(sheet.isOpen()).toBe(true);
    expect(sheet.element.getAttribute('aria-hidden')).toBe('false');

    sheet.close();
    expect(sheet.isOpen()).toBe(false);

    sheet.toggle();
    expect(sheet.isOpen()).toBe(true);
    sheet.toggle();
    expect(sheet.isOpen()).toBe(false);
  });

  test('its events fire, including handlers given at creation', () => {
    const seen: string[] = [];
    const sheet = make({ on: { open: () => seen.push('open'), close: () => seen.push('close') } });
    sheet.open();
    sheet.close();
    expect(seen).toEqual(['open', 'close']);
  });

  test('a modal sheet has a scrim and is a dialog; a standard one is complementary', () => {
    const modal = make({ variant: 'modal' });
    expect(modal.element.querySelector('.mtrl-side-sheet-scrim')?.isConnected).toBe(true);
    const container = modal.element.querySelector('.mtrl-side-sheet-container')!;
    expect(container.getAttribute('role')).toBe('dialog');
    expect(container.getAttribute('aria-modal')).toBe('true');

    const standard = make({ variant: 'standard' });
    expect(standard.element.querySelector('.mtrl-side-sheet-scrim')).toBeNull();
    expect(
      standard.element.querySelector('.mtrl-side-sheet-container')!.getAttribute('role')
    ).toBe('complementary');
  });

  test('it docks to the trailing edge by default, and can dock to the leading one', () => {
    expect(make().element.classList.contains('mtrl-side-sheet--end')).toBe(true);
    expect(make({ position: 'start' }).element.classList.contains('mtrl-side-sheet--start')).toBe(true);
  });

  test('the close button closes it and carries a name', () => {
    const sheet = make({ title: 'Filters' });
    sheet.open();
    const close = sheet.element.querySelector('.mtrl-side-sheet-close') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Close');
    expect(close.type).toBe('button');

    close.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(sheet.isOpen()).toBe(false);
  });

  test('the close button can be left out', () => {
    expect(make({ closeButton: false }).element.querySelector('.mtrl-side-sheet-close')).toBeNull();
  });

  test('the scrim and Escape close it, unless told not to', () => {
    const sheet = make();
    sheet.open();
    (sheet.element.querySelector('.mtrl-side-sheet-scrim') as HTMLElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(sheet.isOpen()).toBe(false);

    const escapable = make();
    escapable.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(escapable.isOpen()).toBe(false);

    const sticky = make({ closeOnScrimClick: false, closeOnEscape: false });
    sticky.open();
    (sticky.element.querySelector('.mtrl-side-sheet-scrim') as HTMLElement)
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(sticky.isOpen()).toBe(true);
  });

  test('a title names the sheet, before and after creation', () => {
    const sheet = make({ title: 'Filters' });
    const container = sheet.element.querySelector('.mtrl-side-sheet-container')!;
    const title = sheet.element.querySelector('.mtrl-side-sheet-title')!;
    expect(title.textContent).toBe('Filters');
    expect(container.getAttribute('aria-labelledby')).toBe(title.id);

    const later = make({ closeButton: false });
    later.setTitle('Added later');
    const laterContainer = later.element.querySelector('.mtrl-side-sheet-container')!;
    const laterTitle = later.element.querySelector('.mtrl-side-sheet-title')!;
    expect(laterTitle.textContent).toBe('Added later');
    expect(laterContainer.getAttribute('aria-labelledby')).toBe(laterTitle.id);
  });

  test('width is applied and capped', () => {
    const container = make().element.querySelector('.mtrl-side-sheet-container') as HTMLElement;
    expect(container.style.width).toBe('256px');
    expect(container.style.maxWidth).toBe('400px');

    const wide = make({ width: 320, maxWidth: 360 }).element.querySelector('.mtrl-side-sheet-container') as HTMLElement;
    expect(wide.style.width).toBe('320px');
    expect(wide.style.maxWidth).toBe('360px');
  });

  test('content can be markup or an element, and can be replaced', () => {
    const sheet = make({ content: '<p>First</p>' });
    const content = sheet.element.querySelector('.mtrl-side-sheet-content')!;
    expect(content.textContent).toBe('First');

    const replacement = document.createElement('span');
    replacement.textContent = 'Second';
    sheet.setContent(replacement);
    expect(content.textContent).toBe('Second');
  });

  test('it can start open', () => {
    expect(make({ open: true }).isOpen()).toBe(true);
  });

  test('destroy removes it and stops listening', () => {
    const sheet = createSideSheet();
    sheet.open();
    const element = sheet.element;
    sheet.destroy();

    expect(element.isConnected).toBe(false);
    expect(() =>
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    ).not.toThrow();
  });
});
