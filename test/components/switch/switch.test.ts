// test/components/switch/switch.test.ts
//
// The real switch in a JSDOM document: what it renders, how its checked,
// disabled and supporting-text state reach the DOM, and what its API reports.
//
// This replaces test/components/switch.test.ts, which asserted against a
// createMockSwitch defined in its own file. The mock had its own setLabel and
// its own supportingTextElement, so it could not notice that the real ones
// were broken: setLabel() and getLabel() read a `text` key the component never
// had, and supportingTextElement was a snapshot taken at creation.
//
// Deliberately not asserted here, because each is an open finding and a test
// would bless the current behaviour: the label is not associated with the
// input (F9), and a custom class gains the library prefix (F11).
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
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

import createSwitch from '../../../src/components/switch';
import { SWITCH_DEFAULTS } from '../../../src/components/switch/constants';

beforeEach(() => { document.body.innerHTML = ''; });

const mount = (config: Parameters<typeof createSwitch>[0] = {}) => {
  const s = createSwitch(config);
  document.body.append(s.element);
  return s;
};

describe('switch', () => {
  test('is a checkbox input with the switch role inside an mtrl-switch root', () => {
    const s = mount();
    expect(s.element.classList.contains('mtrl-switch')).toBe(true);
    expect(s.input.type).toBe('checkbox');
    expect(s.input.getAttribute('role')).toBe('switch');
    expect(s.element.querySelector('.mtrl-switch-track .mtrl-switch-thumb')).not.toBeNull();
  });

  test('form attributes reach the input', () => {
    const s = mount({ name: 'wifi', value: 'on', required: true });
    expect(s.input.name).toBe('wifi');
    expect(s.input.value).toBe('on');
    expect(s.input.required).toBe(true);
  });

  test('a label renders its text and names the input; no label renders no label element', () => {
    const labelled = mount({ label: 'Wi-Fi' });
    expect(labelled.element.querySelector('label')?.textContent).toBe('Wi-Fi');
    expect(labelled.input.getAttribute('aria-label')).toBe('Wi-Fi');
    expect(mount().element.querySelector('label')).toBeNull();
  });

  // The published default once said end while a switch rendered its label at
  // the start. The label leads, as in M3 settings rows, and the constant is
  // what the component reads, so the two are asserted together.
  test('with no position the label leads, and that default is the published one', () => {
    const s = mount({ label: 'Wi-Fi' });
    expect(SWITCH_DEFAULTS.LABEL_POSITION).toBe('start');
    expect(s.element.classList.contains(`mtrl-switch--label-${SWITCH_DEFAULTS.LABEL_POSITION}`)).toBe(true);
    expect(s.element.querySelector('label')?.classList.contains('mtrl-switch-label--start')).toBe(true);
  });

  test('an explicit label position is reflected in the root class', () => {
    expect(mount({ label: 'A', labelPosition: 'start' }).element.classList.contains('mtrl-switch--label-start')).toBe(true);
    expect(mount({ label: 'B', labelPosition: 'end' }).element.classList.contains('mtrl-switch--label-end')).toBe(true);
  });

  test('getLabel() reads the rendered label, and setLabel() changes it', () => {
    const s = mount({ label: 'Wi-Fi' });
    expect(s.getLabel()).toBe('Wi-Fi');
    s.setLabel('Bluetooth');
    expect(s.getLabel()).toBe('Bluetooth');
    expect(s.element.querySelector('label')?.textContent).toBe('Bluetooth');
  });

  test('checked state from config reaches the input, the class and the API', () => {
    const s = mount({ checked: true });
    expect(s.input.checked).toBe(true);
    expect(s.element.classList.contains('mtrl-switch--checked')).toBe(true);
    expect(s.isChecked()).toBe(true);
    expect(s.getValue()).toBe(true);
    expect(mount().isChecked()).toBe(false);
  });

  test('check, uncheck and toggle move the input and the class, and emit change', () => {
    const s = mount();
    const changes = mock((_event: unknown) => {});
    s.on('change', changes);

    s.check();
    expect(s.input.checked).toBe(true);
    expect(s.element.classList.contains('mtrl-switch--checked')).toBe(true);

    s.uncheck();
    expect(s.input.checked).toBe(false);
    expect(s.element.classList.contains('mtrl-switch--checked')).toBe(false);

    s.toggle();
    expect(s.isChecked()).toBe(true);
    expect(changes).toHaveBeenCalledTimes(3);
  });

  test('check() on a checked switch changes nothing and emits nothing', () => {
    const s = mount({ checked: true });
    const changes = mock((_event: unknown) => {});
    s.on('change', changes);
    s.check();
    expect(changes).not.toHaveBeenCalled();
  });

  test('a user click toggles it and reports the new state', () => {
    const s = mount();
    const changes = mock((_event: { checked: boolean }) => {});
    s.on('change', changes);
    s.input.click();
    expect(s.isChecked()).toBe(true);
    expect(changes).toHaveBeenCalledTimes(1);
    expect(changes.mock.calls[0][0].checked).toBe(true);
  });

  test('setValue accepts booleans and the strings "true" and "1"', () => {
    const s = mount();
    s.setValue(true); expect(s.getValue()).toBe(true);
    s.setValue(false); expect(s.getValue()).toBe(false);
    s.setValue('true'); expect(s.getValue()).toBe(true);
    s.setValue('0'); expect(s.getValue()).toBe(false);
    s.setValue('1'); expect(s.getValue()).toBe(true);
  });

  test('the value attribute is separate from the checked state', () => {
    const s = mount({ value: 'on' });
    expect(s.getValueAttribute()).toBe('on');
    s.setValueAttribute('dark-mode');
    expect(s.input.value).toBe('dark-mode');
    expect(s.isChecked()).toBe(false);
  });

  test('disable and enable reach the input and the class', () => {
    const s = mount();
    s.disable();
    expect(s.input.disabled).toBe(true);
    expect(s.element.classList.contains('mtrl-switch--disabled')).toBe(true);
    s.enable();
    expect(s.input.disabled).toBe(false);
    expect(s.element.classList.contains('mtrl-switch--disabled')).toBe(false);
  });

  test('supporting text can be set as an error, and removed, and the API tracks the element', () => {
    const s = mount({ label: 'Wi-Fi' });
    expect(s.supportingTextElement).toBeNull();

    s.setSupportingText('Required', true);
    const helper = s.element.querySelector('.mtrl-switch-helper');
    expect(helper?.textContent).toBe('Required');
    expect(helper?.classList.contains('mtrl-switch-helper--error')).toBe(true);
    expect(s.element.classList.contains('mtrl-switch--error')).toBe(true);
    expect(s.supportingTextElement).toBe(helper as HTMLElement);

    s.setSupportingText('Fine', false);
    expect(s.element.classList.contains('mtrl-switch--error')).toBe(false);

    s.removeSupportingText();
    expect(s.element.querySelector('.mtrl-switch-helper')).toBeNull();
    expect(s.supportingTextElement).toBeNull();
  });

  test('supporting text from config is rendered and exposed', () => {
    const s = mount({ label: 'Wi-Fi', supportingText: 'Uses more battery' });
    expect(s.supportingTextElement?.textContent).toBe('Uses more battery');
  });

  test('destroy removes the element', () => {
    const s = mount();
    s.destroy();
    expect(document.body.contains(s.element)).toBe(false);
  });
});
