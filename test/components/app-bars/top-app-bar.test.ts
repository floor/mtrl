// test/components/app-bars/top-app-bar.test.ts
//
// The real top app bar in a JSDOM document: its landmark and headline, its
// leading and trailing slots, its type modifiers, and how page scrolling
// reaches its scrolled state and onScroll.
//
// This replaces test/components/top-app-bar.test.ts, which asserted against a
// mock defined in its own file. Porting it found no defect in what the bar does.
//
// Deliberately not asserted: the bar labels itself with the fixed English
// string "Top app bar", and the expressive flexible variants and token gaps
// recorded in conformance are open.
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

import createTopAppBar from '../../../src/components/top-app-bar';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const scrollPage = async (y: number) => {
  (dom.window as any).scrollY = y;
  Object.defineProperty(dom.window, 'pageYOffset', { value: y, configurable: true });
  dom.window.dispatchEvent(new dom.window.Event('scroll'));
  await wait(30);
};

beforeEach(async () => { document.body.innerHTML = ''; await scrollPage(0); });
afterEach(async () => { await scrollPage(0); });

describe('top app bar', () => {
  test('is a header landmark with its title in a headline', () => {
    const bar = createTopAppBar({ title: 'Inbox' });
    expect(bar.element.tagName).toBe('HEADER');
    expect(bar.element.getAttribute('role')).toBe('banner');
    expect(bar.element.querySelector('h1')?.textContent).toBe('Inbox');
    expect(bar.getTitle()).toBe('Inbox');
  });

  test('setTitle replaces the headline', () => {
    const bar = createTopAppBar({ title: 'Inbox' });
    bar.setTitle('Sent');
    expect(bar.getTitle()).toBe('Sent');
    expect(bar.getHeadlineElement().textContent).toBe('Sent');
  });

  test('leading and trailing elements go into their containers', () => {
    const bar = createTopAppBar({ title: 'Inbox' });
    const menu = document.createElement('button');
    const more = document.createElement('button');
    bar.addLeadingElement(menu);
    bar.addTrailingElement(more);
    expect(bar.getLeadingContainer().contains(menu)).toBe(true);
    expect(bar.getTrailingContainer().contains(more)).toBe(true);
  });

  test('medium, large and center types add their modifiers; medium and large compress', () => {
    const cls = (type: string, extra: Record<string, unknown> = {}) =>
      createTopAppBar({ title: 'T', type, ...extra } as any).element.classList;
    expect(cls('medium').contains('mtrl-top-app-bar--medium')).toBe(true);
    expect(cls('medium').contains('mtrl-top-app-bar--compressible')).toBe(true);
    expect(cls('large').contains('mtrl-top-app-bar--large')).toBe(true);
    expect(cls('center').contains('mtrl-top-app-bar--center')).toBe(true);
    expect(cls('center').contains('mtrl-top-app-bar--compressible')).toBe(false);
  });

  test('setType changes the modifier and keeps the title', () => {
    const bar = createTopAppBar({ title: 'Inbox' });
    bar.setType('large');
    expect(bar.element.classList.contains('mtrl-top-app-bar--large')).toBe(true);
    expect(bar.getTitle()).toBe('Inbox');
  });

  test('a custom tag is used for the root', () => {
    expect(createTopAppBar({ tag: 'nav' } as any).element.tagName).toBe('NAV');
  });

  test('scrolling the page past the threshold marks it scrolled and calls onScroll both ways', async () => {
    const onScroll = mock((_scrolled: boolean) => {});
    const bar = createTopAppBar({ title: 'Inbox', onScroll });
    document.body.append(bar.element);
    await scrollPage(100);
    expect(bar.element.classList.contains('mtrl-top-app-bar--scrolled')).toBe(true);
    await scrollPage(0);
    expect(bar.element.classList.contains('mtrl-top-app-bar--scrolled')).toBe(false);
    expect(onScroll.mock.calls.map((call) => call[0])).toEqual([true, false]);
    bar.destroy();
  });

  test('setScrollState sets the scrolled state directly', () => {
    const bar = createTopAppBar({ title: 'Inbox' });
    bar.setScrollState(true);
    expect(bar.element.classList.contains('mtrl-top-app-bar--scrolled')).toBe(true);
    bar.setScrollState(false);
    expect(bar.element.classList.contains('mtrl-top-app-bar--scrolled')).toBe(false);
  });

  test('destroy removes the element and stops listening to scroll', async () => {
    const onScroll = mock((_scrolled: boolean) => {});
    const bar = createTopAppBar({ title: 'Inbox', onScroll });
    document.body.append(bar.element);
    bar.destroy();
    expect(document.body.contains(bar.element)).toBe(false);
    await scrollPage(200);
    expect(onScroll).not.toHaveBeenCalled();
  });
});
