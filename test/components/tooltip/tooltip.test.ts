// test/components/tooltip/tooltip.test.ts
//
// The real tooltip in a JSDOM document: how it is exposed and tied to its
// target, and how its config, hover, focus, delays and retargeting behave.
//
// This replaces test/components/tooltip.test.ts, which asserted against a mock
// defined in its own file. Porting it found that the tooltip read none of five
// documented options: position, showDelay, hideDelay, showOnHover and
// showOnFocus were constants inside the API, so getPosition() reported bottom
// for a tooltip created at the top, delays were fixed at 300 and 100 ms, and
// neither trigger could be turned off. It also found retargeting left the old
// target described by the tooltip, and overwrote any existing description on
// the new one.
//
// Escape dismisses it and the pointer can rest on it (F20, WCAG 1.4.13):
// before, nothing handled Escape and the tooltip ignored the pointer.
import { describe, test, expect, beforeEach } from 'bun:test';
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
g.FocusEvent = dom.window.FocusEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};

import createTooltip from '../../../src/components/tooltip';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const hover = (el: HTMLElement) => el.dispatchEvent(new dom.window.MouseEvent('mouseenter'));
const leave = (el: HTMLElement) => el.dispatchEvent(new dom.window.MouseEvent('mouseleave'));
const focus = (el: HTMLElement) => el.dispatchEvent(new dom.window.FocusEvent('focus'));

let target: HTMLButtonElement;
beforeEach(() => {
  document.body.innerHTML = '';
  target = document.createElement('button');
  target.textContent = 'Save';
  document.body.append(target);
});

describe('tooltip', () => {
  test('is a hidden role="tooltip" element that describes its target', () => {
    const tooltip = createTooltip({ text: 'Save changes', target });
    expect(tooltip.element.getAttribute('role')).toBe('tooltip');
    expect(tooltip.element.getAttribute('aria-hidden')).toBe('true');
    expect(tooltip.element.id).not.toBe('');
    expect(target.getAttribute('aria-describedby')).toBe(tooltip.element.id);
    expect(tooltip.isVisible()).toBe(false);
  });

  test('getPosition reports the position it was created with', () => {
    const tooltip = createTooltip({ text: 'x', target, position: 'top' });
    expect(tooltip.getPosition()).toBe('top');
    expect(tooltip.element.classList.contains('mtrl-tooltip--top')).toBe(true);
    expect(createTooltip({ text: 'x', target }).getPosition()).toBe('bottom');
  });

  test('show and hide immediately toggle visibility for assistive technology too', () => {
    const tooltip = createTooltip({ text: 'x', target });
    tooltip.show(true);
    expect(tooltip.isVisible()).toBe(true);
    expect(tooltip.element.getAttribute('aria-hidden')).toBe('false');
    expect(tooltip.element.classList.contains('mtrl-tooltip--visible')).toBe(true);
    tooltip.hide(true);
    expect(tooltip.isVisible()).toBe(false);
    expect(tooltip.element.getAttribute('aria-hidden')).toBe('true');
  });

  test('hovering the target shows it after showDelay, and leaving hides it after hideDelay', async () => {
    const tooltip = createTooltip({ text: 'x', target, showDelay: 60, hideDelay: 60 });
    hover(target);
    await wait(15);
    expect(tooltip.isVisible()).toBe(false);
    await wait(90);
    expect(tooltip.isVisible()).toBe(true);
    leave(target);
    await wait(15);
    expect(tooltip.isVisible()).toBe(true);
    await wait(90);
    expect(tooltip.isVisible()).toBe(false);
  });

  test('a showDelay of 0 shows it on the next tick', async () => {
    const tooltip = createTooltip({ text: 'x', target, showDelay: 0 });
    hover(target);
    await wait(10);
    expect(tooltip.isVisible()).toBe(true);
  });

  test('focusing the target shows it', async () => {
    const tooltip = createTooltip({ text: 'x', target, showDelay: 0 });
    focus(target);
    await wait(10);
    expect(tooltip.isVisible()).toBe(true);
  });

  // Waits past the old hard-coded 300 ms delay: a shorter wait passed even when
  // these options were ignored, because the tooltip had simply not appeared yet.
  test('showOnHover: false ignores hover, and showOnFocus: false ignores focus', async () => {
    const noHover = createTooltip({ text: 'x', target, showDelay: 0, showOnHover: false });
    hover(target);
    await wait(350);
    expect(noHover.isVisible()).toBe(false);
    noHover.destroy();

    const noFocus = createTooltip({ text: 'x', target, showDelay: 0, showOnFocus: false });
    focus(target);
    await wait(350);
    expect(noFocus.isVisible()).toBe(false);
  });

  test('setText and setPosition update the tooltip', () => {
    const tooltip = createTooltip({ text: 'Save', target });
    tooltip.setText('Saved');
    expect(tooltip.getText()).toBe('Saved');
    tooltip.setPosition('left');
    expect(tooltip.getPosition()).toBe('left');
    expect(tooltip.element.classList.contains('mtrl-tooltip--left')).toBe(true);
    expect(tooltip.element.classList.contains('mtrl-tooltip--bottom')).toBe(false);
  });

  test('setTarget moves the description and the listeners to the new target', async () => {
    const tooltip = createTooltip({ text: 'x', target, showDelay: 0 });
    const other = document.createElement('a');
    document.body.append(other);
    tooltip.setTarget(other);

    expect(target.hasAttribute('aria-describedby')).toBe(false);
    expect(other.getAttribute('aria-describedby')).toBe(tooltip.element.id);

    hover(target);
    await wait(15);
    expect(tooltip.isVisible()).toBe(false);
    hover(other);
    await wait(15);
    expect(tooltip.isVisible()).toBe(true);
  });

  test('an existing description on the target is kept, and restored on destroy', () => {
    target.setAttribute('aria-describedby', 'hint');
    const tooltip = createTooltip({ text: 'x', target });
    expect(target.getAttribute('aria-describedby')).toBe(`hint ${tooltip.element.id}`);
    tooltip.destroy();
    expect(target.getAttribute('aria-describedby')).toBe('hint');
  });

  test('destroy removes the element and the description', () => {
    const tooltip = createTooltip({ text: 'x', target });
    tooltip.destroy();
    expect(document.body.contains(tooltip.element)).toBe(false);
    expect(target.hasAttribute('aria-describedby')).toBe(false);
  });

  test('Escape hides a shown tooltip at once without moving focus', async () => {
    const tooltip = createTooltip({ text: 'Save the file', target, showDelay: 0 });
    target.focus();
    focus(target);
    await wait(10);
    expect(tooltip.isVisible()).toBe(true);
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(tooltip.isVisible()).toBe(false);
    expect(tooltip.element.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(target);
  });

  test('Escape is not listened for while the tooltip is hidden, nor after destroy', async () => {
    const tooltip = createTooltip({ text: 'x', target, showDelay: 0, hideDelay: 0 });
    hover(target);
    await wait(10);
    leave(target);
    await wait(10);
    const seen: boolean[] = [];
    const original = tooltip.hide;
    tooltip.hide = (...args) => { seen.push(true); return original.apply(tooltip, args); };
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(seen).toEqual([]);
    tooltip.destroy();
  });

  test('moving the pointer from the target onto the tooltip keeps it shown', async () => {
    const tooltip = createTooltip({ text: 'Save the file', target, showDelay: 0, hideDelay: 50 });
    hover(target);
    await wait(10);
    leave(target);
    hover(tooltip.element);
    await wait(80);
    expect(tooltip.isVisible()).toBe(true);

    leave(tooltip.element);
    await wait(80);
    expect(tooltip.isVisible()).toBe(false);
  });
});
