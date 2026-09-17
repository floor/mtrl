// test/components/app-bars/bottom-app-bar.test.ts
//
// The real bottom app bar in a JSDOM document: its toolbar role, its actions
// and FAB slots, and how visibility changes -- by call and by scrolling --
// reach its state, its class and onVisibilityChange.
//
// This replaces test/components/bottom-app-bar.test.ts, which asserted against
// a mock defined in its own file. Porting it found one defect: show() and hide()
// changed visibility without calling onVisibilityChange, which only the
// auto-hide scroll handler called.
//
// Deliberately not asserted, because each is open: the bar takes role="toolbar"
// without the arrow-key navigation that role implies, it labels itself with the
// fixed English string "Bottom app bar", and whether it should become M3's docked
// toolbar is undecided.
import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};

import createBottomAppBar from '../../../src/components/bottom-app-bar';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const scrollPage = async (y: number) => {
  (dom.window as any).scrollY = y;
  dom.window.dispatchEvent(new dom.window.Event('scroll'));
  await wait(20);
};

beforeEach(async () => { document.body.innerHTML = ''; await scrollPage(0); });
afterEach(async () => { await scrollPage(0); });

describe('bottom app bar', () => {
  test('is a toolbar with an actions container and a FAB container', () => {
    const bar = createBottomAppBar({ hasFab: true });
    expect(bar.element.getAttribute('role')).toBe('toolbar');
    expect(bar.getActionsContainer()).toBeTruthy();
    expect(bar.element.querySelector('.mtrl-bottom-app-bar-fab-container')).not.toBeNull();
  });

  test('addAction and addFab place their elements, and a new FAB replaces the old one', () => {
    const bar = createBottomAppBar({ hasFab: true });
    const search = document.createElement('button');
    bar.addAction(search);
    expect(bar.getActionsContainer().contains(search)).toBe(true);

    const first = document.createElement('button');
    const second = document.createElement('button');
    bar.addFab(first);
    bar.addFab(second);
    expect(bar.element.contains(first)).toBe(false);
    expect(bar.element.contains(second)).toBe(true);
  });

  test('a FAB bar is marked, and a centred FAB is marked as centred; end is the default', () => {
    const centred = createBottomAppBar({ hasFab: true, fabPosition: 'center' });
    expect(centred.element.classList.contains('mtrl-bottom-app-bar--with-fab')).toBe(true);
    expect(centred.element.classList.contains('mtrl-bottom-app-bar--fab-center')).toBe(true);
    expect(createBottomAppBar({ hasFab: true }).element.classList.contains('mtrl-bottom-app-bar--fab-center')).toBe(false);
    expect(createBottomAppBar({}).element.classList.contains('mtrl-bottom-app-bar--with-fab')).toBe(false);
  });

  test('a custom tag is used for the root', () => {
    expect(createBottomAppBar({ tag: 'footer' }).element.tagName).toBe('FOOTER');
  });

  test('hide and show change visibility and call onVisibilityChange once per change', () => {
    const onVisibilityChange = mock((_visible: boolean) => {});
    const bar = createBottomAppBar({ onVisibilityChange });
    expect(bar.isVisible()).toBe(true);

    bar.hide();
    expect(bar.isVisible()).toBe(false);
    expect(bar.element.classList.contains('mtrl-bottom-app-bar--hidden')).toBe(true);
    bar.hide();

    bar.show();
    expect(bar.isVisible()).toBe(true);
    expect(bar.element.classList.contains('mtrl-bottom-app-bar--hidden')).toBe(false);

    expect(onVisibilityChange.mock.calls.map((call) => call[0])).toEqual([false, true]);
  });

  test('with autoHide, scrolling down hides it and scrolling up shows it, each reported once', async () => {
    const onVisibilityChange = mock((_visible: boolean) => {});
    const bar = createBottomAppBar({ autoHide: true, onVisibilityChange });
    document.body.append(bar.element);
    await scrollPage(300);
    expect(bar.isVisible()).toBe(false);
    await scrollPage(100);
    expect(bar.isVisible()).toBe(true);
    expect(onVisibilityChange.mock.calls.map((call) => call[0])).toEqual([false, true]);
    bar.destroy();
  });

  test('destroy removes the element and stops auto-hiding', async () => {
    const onVisibilityChange = mock((_visible: boolean) => {});
    const bar = createBottomAppBar({ autoHide: true, onVisibilityChange });
    document.body.append(bar.element);
    bar.destroy();
    expect(document.body.contains(bar.element)).toBe(false);
    await scrollPage(400);
    expect(onVisibilityChange).not.toHaveBeenCalled();
  });
});
