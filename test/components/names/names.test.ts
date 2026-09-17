// test/components/names/names.test.ts
//
// Where a component's `name` lands. createElement used to write `name` onto
// whatever element it built, so the root of every component carried it --
// on a div, a nav, an aside, a span -- as well as on the input that actually
// submits the value. `name` is invalid on those elements, and worse than inert:
// `form.querySelector('[name="x"]')` returned the component's root div, and
// `document.getElementsByName` counted it, before the real control.
//
// Now `name` is written only on elements where HTML gives it a meaning, so a
// root button keeps it and a root div never has it.
import { describe, test, expect, beforeEach } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.FocusEvent = dom.window.FocusEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import { createElement } from '../../../src/core/dom/create';
import {
  createButton,
  createCheckbox,
  createDatePicker,
  createRadios,
  createSelect,
  createSwitch,
  createTextfield,
  createCard,
} from '../../../src';

let form: HTMLFormElement;
beforeEach(() => {
  document.body.innerHTML = '';
  form = document.createElement('form');
  document.body.append(form);
});

describe('createElement and name', () => {
  test('writes name on elements where it means something', () => {
    for (const tag of ['input', 'button', 'select', 'textarea', 'fieldset', 'output']) {
      expect(createElement({ tag, name: 'field' }).getAttribute('name')).toBe('field');
    }
  });

  test('never writes name on other elements', () => {
    for (const tag of ['div', 'span', 'nav', 'aside', 'section', 'label']) {
      expect(createElement({ tag, name: 'field' }).hasAttribute('name')).toBe(false);
    }
  });
});

describe('components and name', () => {
  const inputBacked: [string, () => { element: HTMLElement }][] = [
    ['checkbox', () => createCheckbox({ name: 'field', label: 'Accept' })],
    ['switch', () => createSwitch({ name: 'field', label: 'Wi-Fi' })],
    ['textfield', () => createTextfield({ name: 'field', label: 'Email' })],
    ['select', () => createSelect({ name: 'field', label: 'Size', options: [] } as any)],
    ['datepicker', () => createDatePicker({ name: 'field' } as any)],
  ];

  for (const [label, make] of inputBacked) {
    test(`${label}: the name is on its input, and a [name] lookup finds that input rather than the root`, () => {
      const component = make();
      form.append(component.element);
      expect(component.element.hasAttribute('name')).toBe(false);
      const found = form.querySelector('[name="field"]');
      expect(found?.tagName).toBe('INPUT');
      expect(component.element.contains(found)).toBe(true);
      expect(document.getElementsByName('field').length).toBe(1);
    });
  }

  test('radios: every radio input carries the group name, and the root does not', () => {
    const radios = createRadios({
      name: 'size',
      options: [
        { value: 's', label: 'Small' },
        { value: 'm', label: 'Medium' },
      ],
    } as any);
    form.append(radios.element);
    expect(radios.element.hasAttribute('name')).toBe(false);
    const named = [...document.getElementsByName('size')];
    expect(named.length).toBe(2);
    expect(named.every((el) => el.tagName === 'INPUT')).toBe(true);
  });

  test('a component whose root is a button keeps the name on it', () => {
    const button = createButton({ name: 'action', text: 'Save' } as any);
    form.append(button.element);
    expect(button.element.tagName).toBe('BUTTON');
    expect(button.element.getAttribute('name')).toBe('action');
  });

  test('a component with no form control does not put name on its root', () => {
    const card = createCard({ name: 'field' } as any);
    expect(card.element.hasAttribute('name')).toBe(false);
  });
});
