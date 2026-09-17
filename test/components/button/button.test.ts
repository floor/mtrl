// test/components/button/button.test.ts
//
// The real button in a JSDOM document: what it renders, how variant, size,
// shape, text, icon, value and type reach the DOM, how disabled and toggle
// state behave, and what the loading state does.
//
// This replaces test/components/button.test.ts, which asserted against a mock
// defined in its own file and covered eight behaviours. Porting it found no
// defect in what the button does, but two gaps recorded as findings: a button
// in its loading state never sets aria-busy, and the stylesheet's --icon-only
// rules are unreachable because nothing adds that class.
//
// Deliberately not asserted, because each is open and a test would bless it:
// an icon-only button gets no accessible name unless ariaLabel is given (F10);
// a custom class gains the library prefix (F11); and an unrecognised variant,
// size or shape is passed straight into a class name.
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.HTMLCanvasElement = dom.window.HTMLCanvasElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.PointerEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
// JSDOM has no canvas. The loading indicator draws on one; nothing here
// asserts what it draws, so any call on the context is a no-op.
dom.window.HTMLCanvasElement.prototype.getContext = function () {
  return new Proxy({}, { get: () => () => {} }) as unknown as CanvasRenderingContext2D;
} as any;

import createButton from '../../../src/components/button';
import { BUTTON_VARIANTS, BUTTON_SIZES } from '../../../src/components/button/constants';

const ICON = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

beforeEach(() => { document.body.innerHTML = ''; });

const mount = (config: Parameters<typeof createButton>[0] = {}) => {
  const button = createButton(config);
  document.body.append(button.element);
  return button;
};

const has = (button: { element: HTMLElement }, modifier: string) =>
  button.element.classList.contains(`mtrl-button--${modifier}`);

describe('button', () => {
  test('is a type="button" element with its text, filled, small and round by default', () => {
    const button = mount({ text: 'Save' });
    expect(button.element.tagName).toBe('BUTTON');
    expect(button.element.getAttribute('type')).toBe('button');
    expect(button.element.querySelector('.mtrl-button-text')?.textContent).toBe('Save');
    expect([button.getVariant(), button.getSize(), button.getShape()]).toEqual(['filled', 's', 'round']);
    expect(has(button, 'filled') && has(button, 's') && has(button, 'round')).toBe(true);
  });

  test('every M3 variant and size maps to its modifier class', () => {
    for (const variant of Object.values(BUTTON_VARIANTS)) {
      expect(has(mount({ text: 'x', variant }), variant)).toBe(true);
    }
    for (const size of Object.values(BUTTON_SIZES)) {
      expect(has(mount({ text: 'x', size }), size)).toBe(true);
    }
    expect(has(mount({ text: 'x', shape: 'square' }), 'square')).toBe(true);
  });

  test('setVariant, setSize and setShape replace the previous modifier', () => {
    const button = mount({ text: 'x' });
    button.setVariant('outlined');
    button.setSize('l');
    button.setShape('square');
    expect([button.getVariant(), button.getSize(), button.getShape()]).toEqual(['outlined', 'l', 'square']);
    expect(has(button, 'outlined') && has(button, 'l') && has(button, 'square')).toBe(true);
    expect(has(button, 'filled') || has(button, 's') || has(button, 'round')).toBe(false);
  });

  test('setText replaces the label', () => {
    const button = mount({ text: 'Save' });
    button.setText('Saved');
    expect(button.getText()).toBe('Saved');
    expect(button.element.textContent).toBe('Saved');
  });

  test('an icon with text is marked for icon layout, and setIcon replaces it', () => {
    const button = mount({ text: 'Add', icon: ICON });
    expect(button.hasIcon()).toBe(true);
    expect(has(button, 'icon')).toBe(true);
    button.setIcon('<svg id="replacement"></svg>');
    expect(button.getIcon()).toContain('id="replacement"');
    expect(has(mount({ text: 'Plain' }), 'icon')).toBe(false);
  });

  test('ariaLabel from config and from setAriaLabel names the button', () => {
    const button = mount({ icon: ICON, ariaLabel: 'Close' });
    expect(button.element.getAttribute('aria-label')).toBe('Close');
    button.setAriaLabel('Dismiss');
    expect(button.element.getAttribute('aria-label')).toBe('Dismiss');
  });

  test('type and value reach the element', () => {
    expect(mount({ text: 'Send', type: 'submit' }).element.getAttribute('type')).toBe('submit');
    const button = mount({ text: 'x', value: 'draft' });
    expect(button.getValue()).toBe('draft');
    button.setValue('final');
    expect(button.element.getAttribute('value')).toBe('final');
    expect(button.getValue()).toBe('final');
  });

  test('disabled from config, enable and disable, and a disabled button emits no click', () => {
    const button = mount({ text: 'x', disabled: true });
    expect(button.element.disabled).toBe(true);
    expect(has(button, 'disabled')).toBe(true);

    const clicks = mock(() => {});
    button.on('click', clicks);
    button.element.click();
    expect(clicks).not.toHaveBeenCalled();

    button.enable();
    expect(button.element.disabled).toBe(false);
    expect(has(button, 'disabled')).toBe(false);
    button.element.click();
    expect(clicks).toHaveBeenCalledTimes(1);
  });

  test('a toggle button reports its state through aria-pressed and flips on click', () => {
    const button = mount({ text: 'Bold', toggle: true });
    expect(button.element.getAttribute('aria-pressed')).toBe('false');
    button.element.click();
    expect(button.element.getAttribute('aria-pressed')).toBe('true');
    expect(has(button, 'selected')).toBe(true);
    button.setSelected(false);
    expect(button.element.getAttribute('aria-pressed')).toBe('false');
    expect(has(button, 'selected')).toBe(false);
    expect(mount({ text: 'x', toggle: true, selected: true }).element.getAttribute('aria-pressed')).toBe('true');
  });

  test('a plain button is not a toggle: no aria-pressed, and setSelected does not add one', () => {
    const button = mount({ text: 'x' });
    button.setSelected(true);
    expect(button.element.hasAttribute('aria-pressed')).toBe(false);
  });

  test('setLoading disables the button and swaps its label, and undoing it restores both', async () => {
    const button = mount({ text: 'Save', progress: true });
    await button.setLoading(true, 'Saving');
    expect(button.element.disabled).toBe(true);
    expect(has(button, 'progress')).toBe(true);
    expect(button.getText()).toBe('Saving');

    await button.setLoading(false);
    expect(button.element.disabled).toBe(false);
    expect(button.getText()).toBe('Save');
  });

  test('destroy removes the element', () => {
    const button = mount({ text: 'x' });
    button.destroy();
    expect(document.body.contains(button.element)).toBe(false);
  });
});
