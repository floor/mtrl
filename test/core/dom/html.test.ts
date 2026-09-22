// test/core/dom/html.test.ts
//
// F16: every markup string a component writes goes through setHTML, so a
// consumer can set one policy, a sanitizer or a Trusted Types policy, and
// have it applied to icons and content across the library. Before, 55
// innerHTML assignments in 27 files wrote strings straight in, with no hook,
// and under `require-trusted-types-for 'script'` every icon threw.
import { describe, test, expect, afterEach, beforeEach } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import { setHTML, configureHTML, getHTMLPolicy } from '../../../src/core/dom/html';
import createButton from '../../../src/components/button';
import createDialog from '../../../src/components/dialog';
import createMenu from '../../../src/components/menu';
import createDrawer from '../../../src/components/drawer';
import { createAssistChip } from '../../../src/components/chips';
import { createCardContent } from '../../../src/components/card';

const ICON = '<svg data-icon="x"></svg>';
// A sanitizer that leaves a trace, so its use is visible
const tag = (html: string) => html.replace('<svg', '<svg data-sanitized="1"');

beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => { configureHTML(null); });

describe('setHTML', () => {
  test('without a policy, writes markup as it is', () => {
    const el = document.createElement('div');
    setHTML(el, '<b>x</b>');
    expect(el.innerHTML).toBe('<b>x</b>');
    expect(getHTMLPolicy()).toBeNull();
  });

  test('with a policy, writes what the policy returns', () => {
    configureHTML({ sanitize: (html) => html.replace(/<script.*?<\/script>/g, '') });
    const el = document.createElement('div');
    setHTML(el, '<b>x</b><script>alert(1)</script>');
    expect(el.innerHTML).toBe('<b>x</b>');
  });

  test('a TrustedHTML-like value is written without going through the policy', () => {
    const seen: string[] = [];
    configureHTML({ sanitize: (html) => { seen.push(html); return html; } });
    const el = document.createElement('div');
    setHTML(el, { toString: () => '<i>trusted</i>' });
    expect(el.innerHTML).toBe('<i>trusted</i>');
    expect(seen).toEqual([]);
  });

  test('empty markup empties the element without a policy call', () => {
    const seen: string[] = [];
    configureHTML({ sanitize: (html) => { seen.push(html); return html; } });
    const el = document.createElement('div');
    el.append(document.createElement('span'));
    setHTML(el, '');
    expect(el.childNodes.length).toBe(0);
    setHTML(el, null);
    expect(seen).toEqual([]);
  });
});

describe('the policy reaches every component sink', () => {
  test('button icon, from config and from setIcon', () => {
    configureHTML({ sanitize: tag });
    const button = createButton({ text: 'Save', icon: ICON });
    expect(button.element.querySelector('svg')?.getAttribute('data-sanitized')).toBe('1');
    button.setIcon('<svg data-icon="y"></svg>');
    expect(button.element.querySelector('svg[data-icon="y"]')?.getAttribute('data-sanitized')).toBe('1');
  });

  test('dialog content, from config and from setContent', () => {
    configureHTML({ sanitize: (html) => html.replace('<script>bad</script>', '') });
    const dialog = createDialog({ title: 'T', content: '<p>ok</p><script>bad</script>' });
    expect(dialog.element.querySelector('.mtrl-dialog__content')?.innerHTML).toBe('<p>ok</p>');
    dialog.setContent('<p>later</p><script>bad</script>');
    expect(dialog.element.querySelector('.mtrl-dialog__content')?.innerHTML).toBe('<p>later</p>');
  });

  test('menu item icons', async () => {
    configureHTML({ sanitize: tag });
    const opener = document.createElement('button');
    document.body.append(opener);
    const menu = createMenu({ opener, items: [{ id: 'a', text: 'A', icon: ICON }] });
    menu.open();
    await new Promise((r) => setTimeout(r, 30));
    expect(menu.element.querySelector('svg')?.getAttribute('data-sanitized')).toBe('1');
    menu.destroy();
  });

  test('drawer item icons', () => {
    configureHTML({ sanitize: tag });
    const drawer = createDrawer({ items: [{ id: 'a', label: 'A', icon: ICON }] });
    expect(drawer.element.querySelector('svg')?.getAttribute('data-sanitized')).toBe('1');
    drawer.destroy();
  });

  test('chip icons', () => {
    configureHTML({ sanitize: tag });
    const chip = createAssistChip({ label: 'A', leadingIcon: ICON });
    expect(chip.element.querySelector('svg')?.getAttribute('data-sanitized')).toBe('1');
  });

  test('card html content', () => {
    configureHTML({ sanitize: (html) => html.replace('<script>bad</script>', '') });
    const content = createCardContent({ html: '<p>ok</p><script>bad</script>' });
    expect(content.innerHTML).toBe('<p>ok</p>');
  });

  test("the library's own icons go through the policy too", () => {
    const seen: string[] = [];
    configureHTML({ sanitize: (html) => { seen.push(html); return html; } });
    createDialog({ title: 'T', content: 'x', size: 'fullscreen' });
    expect(seen.some((html) => html.includes('<svg'))).toBe(true);
  });
});
