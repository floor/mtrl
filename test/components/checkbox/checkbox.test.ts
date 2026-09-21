// test/components/checkbox/checkbox.test.ts
//
// The real checkbox in a JSDOM document: what it renders, how its label is
// associated, and how its checked, indeterminate and disabled state reach the
// DOM and the API.
//
// This replaces test/components/checkbox.test.ts, which asserted against a
// mock defined in its own file. Porting it found two defects the mock could not
// see. getLabel() and setLabel() read a key the component never had (fixed in
// the switch port). And the indeterminate class was toggled separately from the
// input's indeterminate property, so the two drifted: set from config, the
// property was true and the class absent; after a user click, the browser
// cleared the property and the class stayed.
//
// Deliberately not asserted, because each is open and a test would bless it:
// the `variant` option, which changes nothing although CHECKBOX_VARIANTS is
// exported (M3 defines no checkbox variants); and a custom class gaining the
// library prefix (F11).
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

import createCheckbox from '../../../src/components/checkbox';

beforeEach(() => { document.body.innerHTML = ''; });

const mount = (config: Parameters<typeof createCheckbox>[0] = {}) => {
  const checkbox = createCheckbox(config);
  document.body.append(checkbox.element);
  return checkbox;
};

const indeterminateClass = (checkbox: ReturnType<typeof createCheckbox>) =>
  checkbox.element.classList.contains('mtrl-checkbox--indeterminate');

describe('checkbox', () => {
  test('is a checkbox input with its icon inside an mtrl-checkbox root', () => {
    const checkbox = mount();
    expect(checkbox.element.classList.contains('mtrl-checkbox')).toBe(true);
    expect(checkbox.input.type).toBe('checkbox');
    expect(checkbox.element.querySelector('.mtrl-checkbox__icon svg')).not.toBeNull();
  });

  test('form attributes reach the input', () => {
    const checkbox = mount({ name: 'terms', value: 'yes', required: true });
    expect(checkbox.input.name).toBe('terms');
    expect(checkbox.input.value).toBe('yes');
    expect(checkbox.input.required).toBe(true);
  });

  test('the label is associated with the input, so clicking it toggles the checkbox', () => {
    const checkbox = mount({ label: 'Accept' });
    const label = checkbox.element.querySelector('label')!;
    expect(label.textContent).toBe('Accept');
    expect(checkbox.input.id).not.toBe('');
    expect(label.htmlFor).toBe(checkbox.input.id);
    label.click();
    expect(checkbox.isChecked()).toBe(true);
  });

  test('the name follows setLabel: no aria-label repeating the old text outranks the label', () => {
    const checkbox = mount({ label: 'Accept' });
    checkbox.setLabel('Agree');
    expect(checkbox.input.hasAttribute('aria-label')).toBe(false);
    expect(checkbox.input.labels?.[0]?.textContent).toBe('Agree');
  });

  test('getLabel() reads the rendered label, and setLabel() changes it', () => {
    const checkbox = mount({ label: 'Remember me' });
    expect(checkbox.getLabel()).toBe('Remember me');
    checkbox.setLabel('Stay signed in');
    expect(checkbox.getLabel()).toBe('Stay signed in');
    expect(checkbox.element.querySelector('label')?.textContent).toBe('Stay signed in');
  });

  test('the label sits at the end unless placed at the start', () => {
    expect(mount({ label: 'A' }).element.classList.contains('mtrl-checkbox--label-end')).toBe(true);
    expect(mount({ label: 'B', labelPosition: 'start' }).element.classList.contains('mtrl-checkbox--label-start')).toBe(true);
  });

  test('checked state from config reaches the input, the class and the API', () => {
    const checkbox = mount({ checked: true });
    expect(checkbox.input.checked).toBe(true);
    expect(checkbox.element.classList.contains('mtrl-checkbox--checked')).toBe(true);
    expect(checkbox.isChecked()).toBe(true);
    expect(checkbox.getValue()).toBe(true);
  });

  test('check, uncheck and toggle move the input and the class, emitting change only on a change', () => {
    const checkbox = mount();
    const changes = mock((_event: unknown) => {});
    checkbox.on('change', changes);

    checkbox.check();
    checkbox.check();
    expect(checkbox.element.classList.contains('mtrl-checkbox--checked')).toBe(true);
    expect(changes).toHaveBeenCalledTimes(1);

    checkbox.uncheck();
    expect(checkbox.input.checked).toBe(false);
    expect(checkbox.element.classList.contains('mtrl-checkbox--checked')).toBe(false);

    checkbox.toggle();
    expect(checkbox.isChecked()).toBe(true);
    expect(changes).toHaveBeenCalledTimes(3);
  });

  test('a user click toggles it and reports the new state', () => {
    const checkbox = mount();
    const changes = mock((_event: { checked: boolean }) => {});
    checkbox.on('change', changes);
    checkbox.input.click();
    expect(checkbox.isChecked()).toBe(true);
    expect(changes.mock.calls[0][0].checked).toBe(true);
  });

  test('setValue accepts booleans and the strings "true" and "1"; the value attribute is separate', () => {
    const checkbox = mount({ value: 'yes' });
    checkbox.setValue('1'); expect(checkbox.getValue()).toBe(true);
    checkbox.setValue(false); expect(checkbox.getValue()).toBe(false);
    checkbox.setValue('true'); expect(checkbox.getValue()).toBe(true);
    expect(checkbox.getValueAttribute()).toBe('yes');
    checkbox.setValueAttribute('agreed');
    expect(checkbox.input.value).toBe('agreed');
  });

  test('indeterminate from config reaches both the input and the class', () => {
    const checkbox = mount({ indeterminate: true });
    expect(checkbox.input.indeterminate).toBe(true);
    expect(indeterminateClass(checkbox)).toBe(true);
    expect(indeterminateClass(mount())).toBe(false);
  });

  test('setIndeterminate moves the input and the class together', () => {
    const checkbox = mount();
    checkbox.setIndeterminate(true);
    expect(checkbox.input.indeterminate).toBe(true);
    expect(indeterminateClass(checkbox)).toBe(true);
    checkbox.setIndeterminate(false);
    expect(checkbox.input.indeterminate).toBe(false);
    expect(indeterminateClass(checkbox)).toBe(false);
  });

  test('a user click clears indeterminate, and the class follows', () => {
    const checkbox = mount();
    checkbox.setIndeterminate(true);
    checkbox.input.click();
    expect(checkbox.input.indeterminate).toBe(false);
    expect(indeterminateClass(checkbox)).toBe(false);
    expect(checkbox.isChecked()).toBe(true);
  });

  test('check() on an indeterminate checkbox clears mixed state', () => {
    const checkbox = mount({ indeterminate: true });
    const changes = mock((_event: unknown) => {});
    checkbox.on('change', changes);
    checkbox.check();
    expect(checkbox.isChecked()).toBe(true);
    expect(checkbox.input.indeterminate).toBe(false);
    expect(indeterminateClass(checkbox)).toBe(false);
    expect(changes).toHaveBeenCalledTimes(1);
  });

  test('uncheck() on an indeterminate checkbox clears mixed state', () => {
    const checkbox = mount({ checked: true, indeterminate: true });
    const changes = mock((_event: unknown) => {});
    checkbox.on('change', changes);
    checkbox.uncheck();
    expect(checkbox.isChecked()).toBe(false);
    expect(checkbox.input.indeterminate).toBe(false);
    expect(indeterminateClass(checkbox)).toBe(false);
    expect(changes).toHaveBeenCalledTimes(1);
  });

  test('setValue on an indeterminate checkbox clears mixed state', () => {
    const on = mount({ indeterminate: true });
    const onChanges = mock((_event: unknown) => {});
    on.on('change', onChanges);
    on.setValue(true);
    expect(on.isChecked()).toBe(true);
    expect(on.input.indeterminate).toBe(false);
    expect(indeterminateClass(on)).toBe(false);
    expect(onChanges).toHaveBeenCalledTimes(1);

    const off = mount({ checked: true, indeterminate: true });
    const offChanges = mock((_event: unknown) => {});
    off.on('change', offChanges);
    off.setValue(false);
    expect(off.isChecked()).toBe(false);
    expect(off.input.indeterminate).toBe(false);
    expect(indeterminateClass(off)).toBe(false);
    expect(offChanges).toHaveBeenCalledTimes(1);
  });

  test('toggle() on an indeterminate checkbox clears mixed state', () => {
    const checkbox = mount({ indeterminate: true });
    const changes = mock((_event: unknown) => {});
    checkbox.on('change', changes);
    checkbox.toggle();
    expect(checkbox.isChecked()).toBe(true);
    expect(checkbox.input.indeterminate).toBe(false);
    expect(indeterminateClass(checkbox)).toBe(false);
    expect(changes).toHaveBeenCalledTimes(1);
  });

  test('setIndeterminate after check() restores mixed state', () => {
    const checkbox = mount();
    checkbox.check();
    checkbox.setIndeterminate(true);
    expect(checkbox.isChecked()).toBe(true);
    expect(checkbox.input.indeterminate).toBe(true);
    expect(indeterminateClass(checkbox)).toBe(true);
  });

  test('disable and enable reach the input and the class', () => {
    const checkbox = mount();
    checkbox.disable();
    expect(checkbox.input.disabled).toBe(true);
    expect(checkbox.element.classList.contains('mtrl-checkbox--disabled')).toBe(true);
    checkbox.enable();
    expect(checkbox.input.disabled).toBe(false);
    expect(checkbox.element.classList.contains('mtrl-checkbox--disabled')).toBe(false);
  });

  test('destroy removes the element', () => {
    const checkbox = mount();
    checkbox.destroy();
    expect(document.body.contains(checkbox.element)).toBe(false);
  });
});
