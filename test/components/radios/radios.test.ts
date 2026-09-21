// test/components/radios/radios.test.ts
//
// The real radio group in a JSDOM document: how it is exposed and labelled,
// how selection reaches the inputs, the API and change handlers, and how the
// group and its options are disabled.
//
// This replaces test/components/radios.test.ts, which asserted against a mock
// defined in its own file. Porting it found three defects the mock could not
// see:
//
// - disable() styled the root and left every radio usable: the API called the
//   core disabled manager, which knows nothing about the inputs, instead of the
//   group's own disable;
// - every selection reached change handlers twice, once with its payload and
//   once with undefined, and off() could never remove a handler: radios built
//   its own DOM-event bridge named "change" on the root, where the input's
//   native change event also bubbles;
// - setValue() with a value no option carries checked nothing, yet getValue()
//   went on reporting it.
//
// Deliberately not asserted: the variant and size options, which change
// nothing although RADIO_VARIANTS and RADIO_SIZES are exported and M3 defines
// neither; and that setValue() can select an option disabled on its own.
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
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;

import createRadios from '../../../src/components/radios';

beforeEach(() => { document.body.innerHTML = ''; });

const OPTIONS = [
  { value: 's', label: 'Small' },
  { value: 'm', label: 'Medium' },
  { value: 'l', label: 'Large', disabled: true },
];

const mount = (config: Record<string, unknown> = {}) => {
  const radios = createRadios({ name: 'size', options: OPTIONS.map((o) => ({ ...o })), ...config } as any);
  document.body.append(radios.element);
  return radios;
};

const input = (radios: { element: HTMLElement }, value: string) =>
  radios.element.querySelector<HTMLInputElement>(`input[value="${value}"]`)!;
const inputs = (radios: { element: HTMLElement }) =>
  [...radios.element.querySelectorAll<HTMLInputElement>('input')];

describe('radios', () => {
  test('is a radiogroup that ariaLabel names, with one named radio input per option', () => {
    const radios = mount({ ariaLabel: 'Size' });
    expect(radios.element.getAttribute('role')).toBe('radiogroup');
    expect(radios.element.getAttribute('aria-label')).toBe('Size');
    expect(inputs(radios).map((i) => [i.type, i.name, i.value])).toEqual([
      ['radio', 'size', 's'], ['radio', 'size', 'm'], ['radio', 'size', 'l'],
    ]);
  });

  test('each label is associated with its input, so clicking the label selects it', () => {
    const radios = mount();
    const small = input(radios, 's');
    const label = radios.element.querySelector<HTMLLabelElement>(`label[for="${small.id}"]`)!;
    expect(label.textContent).toContain('Small');
    label.click();
    expect(small.checked).toBe(true);
    expect(radios.getValue()).toBe('s');
  });

  test('the initial value is checked and reported, with its option', () => {
    const radios = mount({ value: 'm' });
    expect(input(radios, 'm').checked).toBe(true);
    expect(radios.getValue()).toBe('m');
    expect(radios.getSelected()?.label).toBe('Medium');
  });

  test('a user selection emits change exactly once, carrying the value and option', () => {
    const radios = mount();
    const changes = mock((_event: { value: string; option: { label: string } }) => {});
    radios.on('change', changes);
    input(radios, 's').click();
    expect(changes).toHaveBeenCalledTimes(1);
    expect(changes.mock.calls[0][0].value).toBe('s');
    expect(changes.mock.calls[0][0].option.label).toBe('Small');
  });

  test('off() removes a change handler', () => {
    const radios = mount();
    const changes = mock(() => {});
    radios.on('change', changes);
    radios.off('change', changes);
    input(radios, 'm').click();
    expect(changes).not.toHaveBeenCalled();
  });

  test('native selection carries the exact option and change event', () => {
    const radios = mount();
    const payloads: Array<{ value: string; option: { value: string; label: string } | null; originalEvent: Event | undefined }> = [];
    const nativeEvents: Event[] = [];
    const handler = (payload: typeof payloads[number]) => payloads.push(payload);
    expect(radios.on('change', handler)).toBe(radios);
    const selected = radios.radios[0];
    selected.input.addEventListener('change', event => nativeEvents.push(event));
    selected.input.click();
    expect(payloads).toHaveLength(1);
    expect(payloads[0].value).toBe('s');
    expect(payloads[0].option).toBe(selected.config);
    expect(payloads[0].originalEvent).toBe(nativeEvents[0]);
    expect(payloads[0].originalEvent?.type).toBe('change');
    expect(payloads[0].originalEvent?.target).toBe(selected.input);
    expect(radios.off('change', handler)).toBe(radios);
    input(radios, 'm').click();
    expect(payloads).toHaveLength(1);
    radios.destroy();
  });

  test('programmatic clearing reports null option and undefined originalEvent', () => {
    const radios = mount();
    const payloads: Array<{ value: string; option: { value: string; label: string } | null; originalEvent: Event | undefined }> = [];
    radios.on('change', payload => payloads.push(payload));
    radios.setValue('s');
    expect(payloads).toEqual([]);
    radios.setValue('missing');
    expect(payloads).toEqual([{ value: '', option: null, originalEvent: undefined }]);
    expect(Object.hasOwn(payloads[0], 'originalEvent')).toBe(true);
    radios.destroy();
  });

  test('disabled clicks and retained inputs after destroy do not emit change', () => {
    const radios = mount({ disabled: true });
    const selected = radios.radios[0].input;
    let changes = 0;
    const handler = () => changes++;
    radios.on('change', handler);
    selected.click();
    expect(changes).toBe(0);
    radios.enable();
    selected.click();
    expect(changes).toBe(1);
    radios.destroy();
    radios.on('change', handler);
    selected.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(changes).toBe(1);
  });

  test('setValue checks the matching input and unchecks the others', () => {
    const radios = mount({ value: 's' });
    radios.setValue('m');
    expect(inputs(radios).map((i) => i.checked)).toEqual([false, true, false]);
    expect(radios.getValue()).toBe('m');
  });

  test('setValue with a value no option carries selects nothing, and getValue says so', () => {
    const radios = mount({ value: 's' });
    radios.setValue('xl');
    expect(inputs(radios).every((i) => !i.checked)).toBe(true);
    expect(radios.getValue()).toBe('');
    expect(radios.getSelected()).toBeNull();
  });

  test('disable() disables every radio, and enable() restores options disabled on their own', () => {
    const radios = mount();
    radios.disable();
    expect(inputs(radios).every((i) => i.disabled)).toBe(true);
    expect(radios.element.classList.contains('mtrl-radios--disabled')).toBe(true);

    radios.enable();
    expect(inputs(radios).map((i) => i.disabled)).toEqual([false, false, true]);
    expect(radios.element.classList.contains('mtrl-radios--disabled')).toBe(false);
  });

  test('a group disabled from config has every radio disabled', () => {
    expect(inputs(mount({ disabled: true })).every((i) => i.disabled)).toBe(true);
  });

  test('enableOption and disableOption act on one radio', () => {
    const radios = mount();
    radios.enableOption('l');
    expect(input(radios, 'l').disabled).toBe(false);
    radios.disableOption('s');
    expect(input(radios, 's').disabled).toBe(true);
    expect(input(radios, 'm').disabled).toBe(false);
  });

  test('addOption joins the group, and removing the selected option clears the value', () => {
    const radios = mount();
    radios.addOption({ value: 'xl', label: 'Extra large' });
    expect(input(radios, 'xl').name).toBe('size');
    radios.setValue('xl');
    radios.removeOption('xl');
    expect(radios.element.querySelector('input[value="xl"]')).toBeNull();
    expect(radios.getValue()).toBe('');
  });

  test('a group created without a name still shares one generated name', () => {
    const radios = createRadios({ options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] } as any);
    const names = inputs(radios).map((i) => i.name);
    expect(names[0]).not.toBe('');
    expect(names[1]).toBe(names[0]);
  });

  test('direction is reflected in the root class', () => {
    expect(mount().element.classList.contains('mtrl-radios--vertical')).toBe(true);
    expect(mount({ direction: 'horizontal' }).element.classList.contains('mtrl-radios--horizontal')).toBe(true);
  });

  test('destroy removes the element', () => {
    const radios = mount();
    radios.destroy();
    expect(document.body.contains(radios.element)).toBe(false);
  });
});
