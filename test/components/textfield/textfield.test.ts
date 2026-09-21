// test/components/textfield/textfield.test.ts
//
// The real textfield in a JSDOM document: its labelled input and attributes,
// value and events, variant and density, supporting text and error state, the
// icon, prefix and suffix slots, and disabled state. The spawned lifecycle
// fixture beside this file covers observers and teardown.
//
// This replaces test/components/textfield.test.ts, which asserted against a
// mock defined in its own file. Porting it found two defects fixed here:
// readonly was documented and never applied to the input, and setError(false)
// left the error message on screen as ordinary helper text instead of restoring
// what it had replaced.
//
// Deliberately not asserted, because each is open: the input is never marked
// aria-invalid nor tied to its helper by aria-describedby (F8); and the icon,
// prefix and suffix setters do nothing on a field created without that slot, or
// after the slot is removed.
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLInputElement = dom.window.HTMLInputElement;
g.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
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

import createTextfield from '../../../src/components/textfield';

const ICON = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

beforeEach(() => { document.body.innerHTML = ''; });

const mount = (config: Parameters<typeof createTextfield>[0] = {}) => {
  const field = createTextfield(config);
  document.body.append(field.element);
  return field;
};
const helper = (field: { element: HTMLElement }) => field.element.querySelector('.mtrl-textfield__helper');
const type = (field: { input: HTMLInputElement | HTMLTextAreaElement }, text: string) => {
  field.input.value = text;
  field.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
};

describe('textfield', () => {
  test('its label is associated with the input', () => {
    const field = mount({ label: 'Email' });
    const label = field.element.querySelector('label')!;
    expect(label.textContent).toBe('Email');
    expect(field.input.id).not.toBe('');
    expect(label.htmlFor).toBe(field.input.id);
  });

  test('form attributes from config reach the input, including readonly', () => {
    const field = mount({ label: 'Email', name: 'email', type: 'email', required: true, maxLength: 40, placeholder: 'you@example.com', readonly: true });
    const input = field.input as HTMLInputElement;
    expect([input.name, input.type, input.required, input.maxLength, input.placeholder]).toEqual(['email', 'email', true, 40, 'you@example.com']);
    expect(input.readOnly).toBe(true);
    expect(mount({ label: 'x' }).input.readOnly).toBe(false);
  });

  test('a multiline field is a textarea', () => {
    expect(mount({ label: 'Notes', type: 'multiline' }).input.tagName).toBe('TEXTAREA');
  });

  test('typing updates the value and emits input; setValue updates the input', () => {
    const field = mount({ label: 'Name' });
    const inputs = mock((_event: unknown) => {});
    field.on('input', inputs);
    type(field, 'Ada');
    expect(field.getValue()).toBe('Ada');
    expect(inputs).toHaveBeenCalledTimes(1);
    field.setValue('Grace');
    expect(field.input.value).toBe('Grace');
  });

  test('an empty field is marked empty, and a value clears the mark', () => {
    const field = mount({ label: 'Name' });
    expect(field.element.classList.contains('mtrl-textfield--empty')).toBe(true);
    type(field, 'x');
    expect(field.element.classList.contains('mtrl-textfield--empty')).toBe(false);
  });

  test('setLabel replaces the label', () => {
    const field = mount({ label: 'Email' });
    field.setLabel('Work email');
    expect(field.getLabel()).toBe('Work email');
    expect(field.element.querySelector('label')?.textContent).toBe('Work email');
  });

  test('filled by default, outlined by config or setVariant', () => {
    const field = mount({ label: 'x' });
    expect(field.getVariant()).toBe('filled');
    expect(field.element.classList.contains('mtrl-textfield--filled')).toBe(true);
    field.setVariant('outlined');
    expect(field.element.classList.contains('mtrl-textfield--outlined')).toBe(true);
    expect(field.element.classList.contains('mtrl-textfield--filled')).toBe(false);
    expect(mount({ label: 'x', variant: 'outlined' }).getVariant()).toBe('outlined');
    expect(field.getDensity()).toBe('default');
  });

  test('setAttribute, getAttribute and removeAttribute act on the input', () => {
    const field = mount({ label: 'x' });
    field.setAttribute('autocomplete', 'email');
    expect(field.input.getAttribute('autocomplete')).toBe('email');
    expect(field.getAttribute('autocomplete')).toBe('email');
    field.removeAttribute('autocomplete');
    expect(field.input.hasAttribute('autocomplete')).toBe(false);
  });

  test('supporting text from config, set later, and removed', () => {
    expect(helper(mount({ label: 'x', supportingText: 'We never share it' }))?.textContent).toBe('We never share it');
    const field = mount({ label: 'x' });
    field.setSupportingText('Helper');
    expect(helper(field)?.textContent).toBe('Helper');
    field.removeSupportingText();
    expect(helper(field)).toBeNull();
  });

  test('setError shows its message as an error, and ending it restores the helper text', () => {
    const field = mount({ label: 'Email', supportingText: 'We never share it' });
    field.setError(true, 'Invalid email');
    expect(field.isError()).toBe(true);
    expect(field.element.classList.contains('mtrl-textfield--error')).toBe(true);
    expect(helper(field)?.textContent).toBe('Invalid email');
    expect(helper(field)?.classList.contains('mtrl-textfield__helper--error')).toBe(true);

    field.setError(false);
    expect(field.isError()).toBe(false);
    expect(field.element.classList.contains('mtrl-textfield--error')).toBe(false);
    expect(helper(field)?.textContent).toBe('We never share it');
    expect(helper(field)?.classList.contains('mtrl-textfield__helper--error')).toBe(false);
  });

  test('ending an error on a field that had no helper text removes the message', () => {
    const field = mount({ label: 'Email' });
    field.setError(true, 'Invalid email');
    field.setError(false);
    expect(helper(field)?.textContent ?? '').toBe('');
  });

  test('an error from config is applied', () => {
    const field = mount({ label: 'x', error: true, supportingText: 'Required' });
    expect(field.isError()).toBe(true);
    expect(field.element.classList.contains('mtrl-textfield--error')).toBe(true);
  });

  // F8: the supporting text and the error were only seen. Nothing tied the
  // text to the input or marked the input invalid, so a screen reader heard
  // neither the hint nor the validation
  test('supporting text describes the input, and stops once removed', () => {
    const field = mount({ label: 'Email', supportingText: 'We never share it' });
    const describedBy = () => (field.input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    expect(describedBy()).toHaveLength(1);
    expect(document.getElementById(describedBy()[0])?.textContent).toBe('We never share it');

    field.setSupportingText('Work address');
    expect(document.getElementById(describedBy()[0])?.textContent).toBe('Work address');

    field.removeSupportingText();
    expect(field.input.hasAttribute('aria-describedby')).toBe(false);
  });

  test('a description set by the page survives the supporting text coming and going', () => {
    const field = mount({ label: 'Email' });
    field.input.setAttribute('aria-describedby', 'page-hint');
    field.setSupportingText('Helper');
    expect(field.input.getAttribute('aria-describedby')?.split(' ')).toContain('page-hint');
    field.removeSupportingText();
    expect(field.input.getAttribute('aria-describedby')).toBe('page-hint');
  });

  test('an error marks the input invalid and its message describes it; ending it clears both', () => {
    const field = mount({ label: 'Email', supportingText: 'We never share it' });
    expect(field.input.hasAttribute('aria-invalid')).toBe(false);

    field.setError(true, 'Invalid email');
    expect(field.input.getAttribute('aria-invalid')).toBe('true');
    const id = field.input.getAttribute('aria-describedby')!;
    expect(document.getElementById(id)?.textContent).toBe('Invalid email');

    field.setError(false);
    expect(field.input.hasAttribute('aria-invalid')).toBe(false);
    expect(document.getElementById(field.input.getAttribute('aria-describedby')!)?.textContent).toBe('We never share it');
  });

  test('an error from config marks the input invalid', () => {
    const field = mount({ label: 'x', error: true, supportingText: 'Required' });
    expect(field.input.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(field.input.getAttribute('aria-describedby')!)?.textContent).toBe('Required');
  });

  test('two fields describe themselves with their own text', () => {
    const a = mount({ label: 'A', supportingText: 'First' });
    const b = mount({ label: 'B', supportingText: 'Second' });
    expect(a.input.getAttribute('aria-describedby')).not.toBe(b.input.getAttribute('aria-describedby'));
    expect(document.getElementById(b.input.getAttribute('aria-describedby')!)?.textContent).toBe('Second');
  });

  test('icon, prefix and suffix slots from config render, and can be removed', () => {
    const field = mount({ label: 'Price', leadingIcon: ICON, trailingIcon: ICON, prefixText: '$', suffixText: 'kg' });
    const slot = (name: string) => field.element.querySelector(`.mtrl-textfield__${name}`);
    expect(slot('leading-icon')).not.toBeNull();
    expect(slot('trailing-icon')).not.toBeNull();
    expect(slot('prefix')?.textContent).toBe('$');
    expect(slot('suffix')?.textContent).toBe('kg');
    expect(field.element.classList.contains('mtrl-textfield--with-leading-icon')).toBe(true);

    field.setPrefixText('€');
    expect(slot('prefix')?.textContent).toBe('€');

    field.removeLeadingIcon();
    field.removeTrailingIcon();
    field.removePrefixText();
    field.removeSuffixText();
    expect([slot('leading-icon'), slot('trailing-icon'), slot('prefix'), slot('suffix')]).toEqual([null, null, null, null]);
    expect(field.element.classList.contains('mtrl-textfield--with-leading-icon')).toBe(false);
  });

  test('disabled from config, and disable and enable, reach the input', () => {
    expect(mount({ label: 'x', disabled: true }).input.disabled).toBe(true);
    const field = mount({ label: 'x' });
    field.disable();
    expect(field.input.disabled).toBe(true);
    expect(field.element.classList.contains('mtrl-textfield--disabled')).toBe(true);
    field.enable();
    expect(field.input.disabled).toBe(false);
  });

  test('off() removes a handler', () => {
    const field = mount({ label: 'x' });
    const inputs = mock(() => {});
    field.on('input', inputs);
    field.off('input', inputs);
    type(field, 'z');
    expect(inputs).not.toHaveBeenCalled();
  });

  test('destroy removes the element', () => {
    const field = mount({ label: 'x' });
    field.destroy();
    expect(document.body.contains(field.element)).toBe(false);
  });

  // FLO-105 — the icon, prefix and suffix setters used to do nothing unless the
  // slot had been configured at creation, and after a remove they wrote into a
  // node that was no longer in the document. Both were silent: no error, no
  // element, nothing to tell a caller their code had not worked.

  const SLOTS = [
    { name: 'leading icon', set: 'setLeadingIcon', remove: 'removeLeadingIcon', prop: 'leadingIcon', selector: '__leading-icon', value: ICON, read: (el: HTMLElement) => el.innerHTML },
    { name: 'trailing icon', set: 'setTrailingIcon', remove: 'removeTrailingIcon', prop: 'trailingIcon', selector: '__trailing-icon', value: ICON, read: (el: HTMLElement) => el.innerHTML },
    { name: 'prefix', set: 'setPrefixText', remove: 'removePrefixText', prop: 'prefixTextElement', selector: '__prefix', value: '$', read: (el: HTMLElement) => el.textContent },
    { name: 'suffix', set: 'setSuffixText', remove: 'removeSuffixText', prop: 'suffixTextElement', selector: '__suffix', value: 'kg', read: (el: HTMLElement) => el.textContent },
  ] as const;

  // The input carries `…-input--with-leading-icon`, which contains the slot
  // name as a substring, so a loose [class*=] match picks the input instead of
  // the slot. Match the slot's own class, which has no modifier in it.
  const slotEl = (field: { element: HTMLElement }, selector: string) =>
    ([...field.element.children] as HTMLElement[]).find(
      (el) => el.className.endsWith(selector) && !el.className.includes('--'),
    ) ?? null;

  for (const slot of SLOTS) {
    test(`${slot.set} creates the ${slot.name} on a field that never configured one`, () => {
      const field = mount({ label: 'Plain' }) as any;
      expect(slotEl(field, slot.selector)).toBeNull();

      const returned = field[slot.set](slot.value);

      const el = slotEl(field, slot.selector);
      expect(el).not.toBeNull();
      expect(slot.read(el!)).toContain(typeof slot.value === 'string' && slot.value.startsWith('<') ? 'svg' : slot.value);
      // The setters chain, like every other setter on this component.
      expect(returned).toBe(field);
    });

    test(`${slot.set} works again after ${slot.remove}`, () => {
      const configured = slot.set === 'setLeadingIcon' ? { leadingIcon: ICON }
        : slot.set === 'setTrailingIcon' ? { trailingIcon: ICON }
        : slot.set === 'setPrefixText' ? { prefixText: 'a' }
        : { suffixText: 'a' };
      const field = mount({ label: 'Configured', ...configured }) as any;
      expect(slotEl(field, slot.selector)).not.toBeNull();

      field[slot.remove]();
      expect(slotEl(field, slot.selector)).toBeNull();
      expect(field[slot.prop]).toBeNull();

      field[slot.set](slot.value);
      const el = slotEl(field, slot.selector);
      expect(el).not.toBeNull();
      // Not merely present: the element in the document is the one written to.
      expect(field[slot.prop]).toBe(el);
    });
  }

  test('a removed slot drops its modifier class, and setting it again restores it', () => {
    const field = mount({ label: 'x', leadingIcon: ICON }) as any;
    const withIcon = [...field.element.classList].find((c) => c.endsWith('--with-leading-icon'));
    expect(withIcon).toBeDefined();

    field.removeLeadingIcon();
    expect([...field.element.classList].some((c) => c.endsWith('--with-leading-icon'))).toBe(false);

    field.setLeadingIcon(ICON);
    expect([...field.element.classList].some((c) => c.endsWith('--with-leading-icon'))).toBe(true);
  });

  test('the four slots coexist on one field created without any of them', () => {
    const field = mount({ label: 'x' }) as any;
    field.setLeadingIcon(ICON).setTrailingIcon(ICON).setPrefixText('$').setSuffixText('kg');
    for (const slot of SLOTS) {
      expect(slotEl(field, slot.selector)).not.toBeNull();
    }
  });
});
