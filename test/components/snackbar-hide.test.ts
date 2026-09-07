// test/components/snackbar-hide.test.ts
//
// The real component, not a mock: what hiding one actually leaves behind.

import { describe, test, expect, beforeAll } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;

import createSnackbar, { clearSnackbars } from '../../src/components/snackbar';

const after = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('hiding a snackbar', () => {
  beforeAll(() => {
    clearSnackbars();
    document.body.innerHTML = '';
  });

  test('takes it off the page even when no transition ever ends', async () => {
    const snackbar = createSnackbar({ message: 'on its way out', duration: 100000 });
    snackbar.show();
    expect(document.body.textContent).toContain('on its way out');

    snackbar.hide();
    // JSDOM runs no animations, so `transitionend` never comes; a browser
    // under prefers-reduced-motion is in the same position.
    await after(400);
    expect(document.body.contains(snackbar.element)).toBe(false);
  });

  test('clearing the queue takes the one on screen with it', async () => {
    createSnackbar({ message: "an account's own", duration: 100000 }).show();
    expect(document.body.textContent).toContain("an account's own");

    clearSnackbars();
    await after(400);
    expect(document.body.textContent).not.toContain("an account's own");
  });
});
