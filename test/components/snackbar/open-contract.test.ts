// test/components/snackbar/open-contract.test.ts
//
// FLO-548: one open and close contract for every overlay. For the snackbar
// the methods are show() and hide(), the events open and close: when either
// returns, the state has changed and the event has been emitted. A snackbar
// waiting behind another is "queued", not open: its state turns "visible"
// and `open` is emitted together, when its turn comes.
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
g.KeyboardEvent = dom.window.KeyboardEvent;
g.FocusEvent = dom.window.FocusEvent;
g.CustomEvent = dom.window.CustomEvent;
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);

import createSnackbar, { clearSnackbars } from '../../../src/components/snackbar';
import type { SnackbarComponent, SnackbarConfig, SnackbarEvent } from '../../../src/components/snackbar';

const after = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const onPage = (snackbar: SnackbarComponent) => document.body.contains(snackbar.element);
/** A snackbar that stays until hidden, logging its events and the state each one finds. */
const make = (name: string, log: string[], config: Partial<SnackbarConfig> = {}): SnackbarComponent => {
  const snackbar = createSnackbar({ message: name, duration: 0, ...config });
  for (const type of ['open', 'close', 'dismiss'] as const) {
    snackbar.on(type, (event: SnackbarEvent) => {
      log.push(`${name} ${type}${event.reason ? `:${event.reason}` : ''} ${snackbar.state} ${snackbar.isOpen()}`);
    });
  }
  return snackbar;
};

beforeEach(() => {
  clearSnackbars();
  document.body.innerHTML = '';
});
afterEach(() => clearSnackbars());

describe('snackbar: show() and hide() are synchronous', () => {
  test('with nothing on screen, show() has set the state and emitted open when it returns; hide() the same', () => {
    const log: string[] = [];
    const a = make('a', log);
    expect([a.state, a.isOpen()]).toEqual(['hidden', false]);
    expect(a.show()).toBe(a);
    expect([a.state, a.isOpen(), onPage(a)]).toEqual(['visible', true, true]);
    expect(log).toEqual(['a open visible true']);
    expect(a.hide()).toBe(a);
    expect([a.state, a.isOpen()]).toEqual(['hidden', false]);
    expect(log).toEqual(['a open visible true', 'a close:api hidden false', 'a dismiss:api hidden false']);
  });

  test('show() on a visible one and hide() on a hidden one do nothing and emit nothing', () => {
    const log: string[] = [];
    const a = make('a', log);
    a.hide();
    expect(log).toEqual([]);
    a.show();
    a.show();
    expect(log).toHaveLength(1);
    a.hide();
    a.hide();
    expect(log).toHaveLength(3);
  });

  test('hide() then show() in one task ends visible, with one close and one open', () => {
    const log: string[] = [];
    const a = make('a', log);
    a.show();
    a.hide();
    a.show();
    expect([a.state, a.isOpen(), onPage(a)]).toEqual(['visible', true, true]);
    expect(log.map((line) => line.split(' ').slice(0, 2).join(' '))).toEqual(['a open', 'a close:api', 'a dismiss:api', 'a open']);
  });
});

describe('snackbar: a queued one is not open', () => {
  test('two shown in a row: the second is "queued" until the first closes, then visible and open together', async () => {
    const log: string[] = [];
    const a = make('a', log);
    const b = make('b', log);
    a.show();
    b.show();
    expect([a.state, a.isOpen(), b.state, b.isOpen(), onPage(b)]).toEqual(['visible', true, 'queued', false, false]);
    expect(log).toEqual(['a open visible true']);
    // show() on a queued one changes nothing: it keeps its place
    b.show();
    a.hide();
    expect([b.state, b.isOpen()]).toEqual(['queued', false]);
    await after(400);
    expect([b.state, b.isOpen(), onPage(b)]).toEqual(['visible', true, true]);
    expect(log).toEqual([
      'a open visible true', 'a close:api hidden false', 'a dismiss:api hidden false', 'b open visible true',
    ]);
  });

  test('a queued one hidden before its turn leaves the queue: no open, no close, and it is not shown later', async () => {
    const log: string[] = [];
    const a = make('a', log);
    const b = make('b', log);
    const c = make('c', log);
    a.show();
    b.show();
    c.show();
    expect(b.hide()).toBe(b);
    expect([b.state, b.isOpen()]).toEqual(['hidden', false]);
    expect(log).toEqual(['a open visible true']);
    a.hide();
    await after(400);
    // c took the turn b gave up
    expect([onPage(b), b.state, c.state, c.isOpen()]).toEqual([false, 'hidden', 'visible', true]);
    expect(log.filter((line) => line.startsWith('b '))).toEqual([]);
    // and b can be shown again
    c.hide();
    b.show();
    await after(400);
    expect([b.state, b.isOpen(), onPage(b)]).toEqual(['visible', true, true]);
    expect(log.filter((line) => line.startsWith('b '))).toEqual(['b open visible true']);
  });

  test('a queued one dropped by a replacing snackbar or by clearSnackbars() is hidden, silently, and can be shown again', async () => {
    const log: string[] = [];
    const a = make('a', log);
    const b = make('b', log);
    const c = make('c', log, { queueBehavior: 'replace' });
    a.show();
    b.show();
    c.show();
    expect([a.state, b.state, c.state, c.isOpen()]).toEqual(['hidden', 'hidden', 'visible', true]);
    expect(log).toEqual(['a open visible true', 'a close:queue hidden false', 'a dismiss:queue hidden false', 'c open visible true']);
    b.show();
    expect(b.state).toBe('queued');
    clearSnackbars();
    expect([b.state, c.state]).toEqual(['hidden', 'hidden']);
    expect(log.filter((line) => line.startsWith('b '))).toEqual([]);
    b.show();
    expect([b.state, b.isOpen(), onPage(b)]).toEqual(['visible', true, true]);
  });

  // From #476's review: destroying the one on screen left the queue pointing
  // at it, so the ones behind stayed "queued" until some other snackbar was shown.
  test('destroy() on the visible one lets the next take its turn', async () => {
    const log: string[] = [];
    const a = make('a', log);
    const b = make('b', log);
    a.show();
    b.show();
    a.destroy();
    expect([a.state, b.state]).toEqual(['hidden', 'queued']);
    await after(400);
    expect([b.state, b.isOpen(), onPage(b)]).toEqual(['visible', true, true]);
    // destroy() emits nothing for the one it removes
    expect(log).toEqual(['a open visible true', 'b open visible true']);
  });
});
