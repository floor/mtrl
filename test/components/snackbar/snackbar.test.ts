// test/components/snackbar/snackbar.test.ts
//
// The real component in a JSDOM document: what it renders, how long it stays,
// how it leaves, and what it tells the queue.
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
import type { SnackbarEvent } from '../../../src/components/snackbar';

const after = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const onPage = (text: string) => document.body.textContent?.includes(text) ?? false;

/** JSDOM has no layout: give the action a width */
const widen = (element: HTMLElement | undefined, width: number) => {
  Object.defineProperty(element, 'offsetWidth', { value: width, configurable: true });
};

beforeEach(() => {
  clearSnackbars();
  document.body.innerHTML = '';
});

afterEach(() => {
  clearSnackbars();
});

describe('snackbar', () => {
  test('is a status live region with the message, positioned by a class', () => {
    const snackbar = createSnackbar({ message: 'Saved' });
    const el = snackbar.element;
    expect(el.classList.contains('mtrl-snackbar')).toBe(true);
    expect(el.classList.contains('mtrl-snackbar--center')).toBe(true);
    expect(el.getAttribute('role')).toBe('status');
    expect(el.querySelector('.mtrl-snackbar-text')!.textContent).toBe('Saved');
    expect(el.querySelector('.mtrl-snackbar-action')).toBeNull();
    expect(el.querySelector('.mtrl-snackbar-close')).toBeNull();
    expect(snackbar.getMessage()).toBe('Saved');
    expect(snackbar.state).toBe('hidden');
    expect(() => createSnackbar({ message: '' })).toThrow();
  });

  test('the action is a text button; the close affordance a labelled icon button', () => {
    const snackbar = createSnackbar({ message: 'Deleted', action: 'Undo', dismissible: true });
    const el = snackbar.element;
    const action = el.querySelector<HTMLButtonElement>('.mtrl-snackbar-action')!;
    expect(action.tagName).toBe('BUTTON');
    expect(action.classList.contains('mtrl-button--text')).toBe(true);
    expect(action.textContent).toBe('Undo');
    expect(snackbar.getAction()).toBe('Undo');
    expect(el.classList.contains('mtrl-snackbar--with-action')).toBe(true);

    const close = el.querySelector<HTMLButtonElement>('.mtrl-snackbar-close')!;
    expect(close.classList.contains('mtrl-icon-button')).toBe(true);
    expect(close.getAttribute('aria-label')).toBe('Dismiss');
    expect(close.querySelector('svg')).not.toBeNull();
    expect(el.classList.contains('mtrl-snackbar--dismissible')).toBe(true);
    expect(el.lastElementChild).toBe(close);

    expect(createSnackbar({ message: 'x', dismissible: true, closeLabel: 'Fermer' }).closeButton!.getAttribute('aria-label')).toBe('Fermer');
  });

  test('duration: 4 s without an action, indefinite with one, presets and milliseconds', () => {
    expect(createSnackbar({ message: 'a' }).getDuration()).toBe(4000);
    expect(createSnackbar({ message: 'a', action: 'Undo' }).getDuration()).toBe(0);
    expect(createSnackbar({ message: 'a', duration: 'long' }).getDuration()).toBe(10000);
    expect(createSnackbar({ message: 'a', duration: 'short', action: 'Undo' }).getDuration()).toBe(4000);
    expect(createSnackbar({ message: 'a', duration: 'indefinite' }).getDuration()).toBe(0);
    expect(createSnackbar({ message: 'a', duration: 2500 }).getDuration()).toBe(2500);
    expect(createSnackbar({ message: 'a', duration: -1 }).getDuration()).toBe(0);
    const snackbar = createSnackbar({ message: 'a' });
    snackbar.setDuration('long');
    expect(snackbar.getDuration()).toBe(10000);
    snackbar.setDuration(0);
    expect(snackbar.getDuration()).toBe(0);
  });

  test('show puts it on the page and emits open; the timeout closes it and takes it off', async () => {
    const events: string[] = [];
    const snackbar = createSnackbar({
      message: 'Sent',
      duration: 40,
      onOpen: () => events.push('onOpen'),
      onClose: (e: SnackbarEvent) => events.push(`onClose:${e.reason}`),
      on: { dismiss: (e: SnackbarEvent) => events.push(`dismiss:${e.reason}`) },
    });
    snackbar.show();
    expect(document.body.contains(snackbar.element)).toBe(true);
    expect(snackbar.element.classList.contains('mtrl-snackbar--visible')).toBe(true);
    expect(snackbar.state).toBe('visible');
    expect(events).toEqual(['onOpen']);

    await after(80);
    expect(snackbar.state).toBe('hidden');
    expect(snackbar.element.classList.contains('mtrl-snackbar--visible')).toBe(false);
    expect(events).toEqual(['onOpen', 'onClose:timeout', 'dismiss:timeout']);
    // no transition ends in JSDOM: the exit duration is the fallback
    await after(450);
    expect(document.body.contains(snackbar.element)).toBe(false);
  });

  test('the countdown holds while the pointer is over it or focus is inside', async () => {
    const snackbar = createSnackbar({ message: 'Hold', duration: 60 });
    snackbar.show();
    const el = snackbar.element;
    el.dispatchEvent(new dom.window.Event('pointerenter'));
    await after(100);
    expect(snackbar.state).toBe('visible');
    el.dispatchEvent(new dom.window.Event('pointerleave'));
    await after(100);
    expect(snackbar.state).toBe('hidden');

    const focused = createSnackbar({ message: 'Focus', action: 'Retry', duration: 60 });
    focused.show();
    focused.actionButton!.focus();
    await after(100);
    expect(focused.state).toBe('visible');
    focused.actionButton!.blur();
    await after(100);
    expect(focused.state).toBe('hidden');
  });

  test('the action fires the callback and closes the snackbar', () => {
    const reasons: string[] = [];
    let acted = 0;
    const snackbar = createSnackbar({ message: 'Deleted', action: 'Undo', onAction: () => acted++ });
    snackbar.on('close', (e: SnackbarEvent) => reasons.push(e.reason!));
    snackbar.show();
    snackbar.actionButton!.click();
    expect(acted).toBe(1);
    expect(reasons).toEqual(['action']);
    expect(snackbar.state).toBe('hidden');
  });

  test('the close icon and Escape dismiss it; focus goes back where it was', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const snackbar = createSnackbar({ message: 'Deleted', action: 'Undo', dismissible: true });
    const reasons: string[] = [];
    snackbar.on('close', (e: SnackbarEvent) => reasons.push(e.reason!));
    snackbar.show();
    expect(document.activeElement).toBe(trigger);

    snackbar.actionButton!.focus();
    snackbar.actionButton!.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(reasons).toEqual(['escape']);
    expect(document.activeElement).toBe(trigger);

    const other = createSnackbar({ message: 'Again', dismissible: true });
    other.on('close', (e: SnackbarEvent) => reasons.push(e.reason!));
    other.show();
    other.closeButton!.click();
    expect(reasons).toEqual(['escape', 'close-button']);
  });

  test('an action wider than 128px moves below the text', () => {
    const snackbar = createSnackbar({ message: 'Archived', action: 'Restore the conversation' });
    widen(snackbar.actionButton, 180);
    snackbar.show();
    expect(snackbar.element.classList.contains('mtrl-snackbar--action-below')).toBe(true);

    const short = createSnackbar({ message: 'Archived', action: 'Undo' });
    widen(short.actionButton, 64);
    snackbar.hide();
    short.show();
    expect(short.element.classList.contains('mtrl-snackbar--action-below')).toBe(false);
  });

  test('hide takes it off the page even when no transition ever ends', async () => {
    const snackbar = createSnackbar({ message: 'on its way out', duration: 100000 });
    snackbar.show();
    expect(onPage('on its way out')).toBe(true);
    snackbar.hide();
    await after(450);
    expect(document.body.contains(snackbar.element)).toBe(false);
  });

  test('clearing the queue takes the one on screen with it', async () => {
    createSnackbar({ message: "an account's own", duration: 100000 }).show();
    expect(onPage("an account's own")).toBe(true);
    clearSnackbars();
    await after(450);
    expect(onPage("an account's own")).toBe(false);
  });

  test('a hidden snackbar hands the queue to the next one', async () => {
    const first = createSnackbar({ message: 'first', action: 'Undo' });
    const second = createSnackbar({ message: 'second', action: 'Undo' });
    first.show();
    second.show();
    expect(onPage('second')).toBe(false);
    first.hide();
    await after(250);
    expect(onPage('second')).toBe(true);
  });

  test('showing again while it is still fading keeps it on the page', async () => {
    const snackbar = createSnackbar({ message: 'back', action: 'Undo' });
    snackbar.show();
    snackbar.hide();
    await after(250);
    snackbar.show();
    await after(300);
    expect(document.body.contains(snackbar.element)).toBe(true);
    expect(snackbar.element.classList.contains('mtrl-snackbar--visible')).toBe(true);
  });

  test('messages, actions and positions can change; an unknown position falls back to the centre', () => {
    const snackbar = createSnackbar({ message: 'One', action: 'Undo', position: 'start' });
    expect(snackbar.getPosition()).toBe('start');
    snackbar.setPosition('end');
    expect(snackbar.element.classList.contains('mtrl-snackbar--end')).toBe(true);
    expect(snackbar.element.classList.contains('mtrl-snackbar--start')).toBe(false);
    snackbar.setPosition('nowhere' as any);
    expect(snackbar.getPosition()).toBe('center');
    expect(snackbar.element.getAttribute('style')).toBeNull();
    snackbar.setMessage('Two');
    snackbar.setAction('Redo');
    expect(snackbar.getMessage()).toBe('Two');
    expect(snackbar.getAction()).toBe('Redo');
    expect(snackbar.element.querySelector('.mtrl-snackbar-action')!.textContent).toBe('Redo');
  });

  test('destroy removes the element and stops the timer', async () => {
    const snackbar = createSnackbar({ message: 'gone', duration: 30 });
    snackbar.show();
    snackbar.destroy();
    expect(document.body.contains(snackbar.element)).toBe(false);
    await after(60);
    expect(snackbar.state).toBe('visible');
  });
});
