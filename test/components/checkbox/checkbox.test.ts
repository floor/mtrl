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
// the `variant` option, which changes nothing (M3 defines no checkbox variants;
// 1.0 removed CHECKBOX_VARIANTS); and a custom class gaining the
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

  test('check, uncheck and toggle move the input and the class, silently (FLO-328)', () => {
    const checkbox = mount();
    const changes = mock((_event: unknown) => {});
    checkbox.on('change', changes);

    checkbox.check();
    checkbox.check();
    expect(checkbox.element.classList.contains('mtrl-checkbox--checked')).toBe(true);
    expect(changes).not.toHaveBeenCalled();

    checkbox.uncheck();
    expect(checkbox.input.checked).toBe(false);
    expect(checkbox.element.classList.contains('mtrl-checkbox--checked')).toBe(false);

    checkbox.toggle();
    expect(checkbox.isChecked()).toBe(true);
    expect(changes).not.toHaveBeenCalled();
  });

  test('a user click toggles it and reports the new state', () => {
    const checkbox = mount();
    const changes = mock((_event: { checked: boolean }) => {});
    checkbox.on('change', changes);
    checkbox.input.click();
    expect(checkbox.isChecked()).toBe(true);
    expect(changes.mock.calls[0][0].checked).toBe(true);
  });

  test('input changes carry the original change event, including keyboard activation', () => {
    const checkbox = mount({ value: 'accepted' });
    const payloads: Array<{ checked: boolean; value: boolean; valueAttribute: string; nativeEvent?: Event }> = [];
    const nativeEvents: Event[] = [];
    checkbox.on('change', payload => {
      expect(payload.value).toBe(checkbox.getValue());
      payloads.push(payload);
    });
    checkbox.input.addEventListener('change', event => nativeEvents.push(event));
    checkbox.input.click();
    const keydown = new dom.window.KeyboardEvent('keydown', { key: ' ', bubbles: true });
    checkbox.input.dispatchEvent(keydown);
    expect(payloads).toHaveLength(2);
    expect(payloads.map(payload => payload.checked)).toEqual([true, false]);
    payloads.forEach((payload, index) => {
      expect(payload.value).toBe(payload.checked);
      expect(payload.valueAttribute).toBe('accepted');
      expect(payload.nativeEvent).toBe(nativeEvents[index]);
      expect(payload.nativeEvent?.type).toBe('change');
      expect(payload.nativeEvent?.target).toBe(checkbox.input);
    });
    expect(payloads[1].nativeEvent).not.toBe(keydown);
    checkbox.destroy();
  });

  // FLO-265 (Dr Jones): Space toggles; Enter is left to the form, as natively.
  test('Enter does not toggle a checkbox, and is not cancelled', () => {
    const checkbox = mount();
    const enter = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    checkbox.input.dispatchEvent(enter);
    expect(checkbox.isChecked()).toBe(false);
    expect(enter.defaultPrevented).toBe(false);
    checkbox.destroy();
  });

  test('error marks the checkbox and its input invalid, and setError clears it', () => {
    const checkbox = mount({ error: true });
    expect(checkbox.element.classList.contains('mtrl-checkbox--error')).toBe(true);
    expect(checkbox.input.getAttribute('aria-invalid')).toBe('true');
    expect(checkbox.setError(false)).toBe(checkbox);
    expect(checkbox.element.classList.contains('mtrl-checkbox--error')).toBe(false);
    expect(checkbox.input.hasAttribute('aria-invalid')).toBe(false);
    checkbox.destroy();
  });

  test('programmatic changes are silent, as setting a native checkbox (FLO-328)', () => {
    const checkbox = mount({ value: 'accepted' });
    const payloads: Array<{ checked: boolean; value: boolean; valueAttribute: string; nativeEvent?: Event }> = [];
    checkbox.on('change', payload => {
      expect(payload.value).toBe(checkbox.getValue());
      payloads.push(payload);
    });
    const states: boolean[] = [];
    checkbox.check();
    states.push(checkbox.isChecked());
    checkbox.uncheck();
    states.push(checkbox.isChecked());
    checkbox.toggle();
    states.push(checkbox.isChecked());
    checkbox.setValue(false);
    states.push(checkbox.isChecked());
    expect(states).toEqual([true, false, true, false]);
    expect(payloads).toEqual([]);
    checkbox.destroy();
  });

  test('subscriptions chain, unsubscribe, suppress disabled clicks and stop after destroy', () => {
    const checkbox = mount({ disabled: true });
    let changes = 0;
    const handler = () => changes++;
    expect(checkbox.on('change', handler)).toBe(checkbox);
    checkbox.input.click();
    expect(changes).toBe(0);
    checkbox.enable();
    checkbox.input.click();
    expect(changes).toBe(1);
    expect(checkbox.off('change', handler)).toBe(checkbox);
    checkbox.toggle();
    expect(changes).toBe(1);
    checkbox.on('change', handler);
    checkbox.destroy();
    checkbox.on('change', handler);
    checkbox.toggle();
    expect(changes).toBe(1);
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
    expect(changes).not.toHaveBeenCalled(); // silent (FLO-328)
  });

  test('uncheck() on an indeterminate checkbox clears mixed state', () => {
    const checkbox = mount({ checked: true, indeterminate: true });
    const changes = mock((_event: unknown) => {});
    checkbox.on('change', changes);
    checkbox.uncheck();
    expect(checkbox.isChecked()).toBe(false);
    expect(checkbox.input.indeterminate).toBe(false);
    expect(indeterminateClass(checkbox)).toBe(false);
    expect(changes).not.toHaveBeenCalled(); // silent (FLO-328)
  });

  test('setValue on an indeterminate checkbox clears mixed state', () => {
    const on = mount({ indeterminate: true });
    const onChanges = mock((_event: unknown) => {});
    on.on('change', onChanges);
    on.setValue(true);
    expect(on.isChecked()).toBe(true);
    expect(on.input.indeterminate).toBe(false);
    expect(indeterminateClass(on)).toBe(false);
    expect(onChanges).not.toHaveBeenCalled();

    const off = mount({ checked: true, indeterminate: true });
    const offChanges = mock((_event: unknown) => {});
    off.on('change', offChanges);
    off.setValue(false);
    expect(off.isChecked()).toBe(false);
    expect(off.input.indeterminate).toBe(false);
    expect(indeterminateClass(off)).toBe(false);
    expect(offChanges).not.toHaveBeenCalled();
  });

  test('toggle() on an indeterminate checkbox clears mixed state', () => {
    const checkbox = mount({ indeterminate: true });
    const changes = mock((_event: unknown) => {});
    checkbox.on('change', changes);
    checkbox.toggle();
    expect(checkbox.isChecked()).toBe(true);
    expect(checkbox.input.indeterminate).toBe(false);
    expect(indeterminateClass(checkbox)).toBe(false);
    expect(changes).not.toHaveBeenCalled(); // silent (FLO-328)
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

// FLO-316: Space (and Enter, with enterToggles) on a mixed box set `checked`
// by hand and left `indeterminate` true, so the dash and the mixed class
// stayed. The key now activates the input as a click does.
describe('keyboard activation of a mixed checkbox', () => {
  const press = (checkbox: ReturnType<typeof mount>, key: string) => {
    const events: string[] = [];
    for (const type of ['input', 'change']) checkbox.input.addEventListener(type, () => events.push(type));
    const changes: boolean[] = [];
    checkbox.on('change', ({ checked }) => changes.push(checked));
    checkbox.input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    return { events, changes };
  };
  const mixed = (checkbox: ReturnType<typeof mount>) =>
    [checkbox.input.indeterminate, checkbox.element.classList.contains('mtrl-checkbox--indeterminate')];

  test('Space checks it, clears the mixed state and class, and fires input then change once', () => {
    const checkbox = mount({ indeterminate: true });
    expect(mixed(checkbox)).toEqual([true, true]);
    const { events, changes } = press(checkbox, ' ');
    expect(checkbox.isChecked()).toBe(true);
    expect(mixed(checkbox)).toEqual([false, false]);
    expect(events).toEqual(['input', 'change']);
    expect(changes).toEqual([true]);
    checkbox.destroy();
  });

  test('Enter does the same when enterToggles is on', () => {
    const checkbox = mount({ indeterminate: true, enterToggles: true });
    const { events, changes } = press(checkbox, 'Enter');
    expect(checkbox.isChecked()).toBe(true);
    expect(mixed(checkbox)).toEqual([false, false]);
    expect(events).toEqual(['input', 'change']);
    expect(changes).toEqual([true]);
    checkbox.destroy();
  });

  test('a checked mixed box unchecks, as a click does', () => {
    const checkbox = mount({ checked: true, indeterminate: true });
    press(checkbox, ' ');
    expect(checkbox.isChecked()).toBe(false);
    expect(mixed(checkbox)).toEqual([false, false]);
    checkbox.destroy();
  });

  test('a disabled mixed box stays as it is', () => {
    const checkbox = mount({ indeterminate: true, disabled: true });
    const { events, changes } = press(checkbox, ' ');
    expect(checkbox.isChecked()).toBe(false);
    expect(mixed(checkbox)).toEqual([true, true]);
    expect([events, changes]).toEqual([[], []]);
    checkbox.destroy();
  });
});

// FLO-336: the check icon is built with DOM APIs, not parsed through the HTML
// sink; its nodes are exactly those the old markup parsed to.
describe('the check icon', () => {
  test('is the same DOM the markup parsed to, whitespace included, and no shared node', () => {
    const reference = document.createElement('span');
    reference.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M9.55 14.6L6.35 11.4l-1.9 1.9L9.55 18.4l10.9-10.9-1.9-1.9z"/>
    </svg>
  `;
    const first = mount().element.querySelector('.mtrl-checkbox__icon') as HTMLElement;
    const second = mount().element.querySelector('.mtrl-checkbox__icon') as HTMLElement;
    reference.className = first.className;
    expect(first.isEqualNode(reference)).toBe(true);
    expect(first.innerHTML).toBe(reference.innerHTML);
    expect(first.querySelector('svg')?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    // each checkbox has its own nodes
    expect(first.querySelector('svg')).not.toBe(second.querySelector('svg'));
    expect(second.isEqualNode(reference)).toBe(true);
  });
});
