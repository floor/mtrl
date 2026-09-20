// test/components/search/search.test.ts
//
// The real search in a JSDOM document: how it is exposed and labelled, how
// typing, Enter, clear and submit reach its value, events and config
// callbacks, how it moves between bar and view, and how suggestions render.
//
// This replaces test/components/search.test.ts, which asserted against a
// createMockSearch defined in its own file. Porting it found two defects:
// suggestions passed in config were stored and never rendered, even with the
// view open, and the onExpand and onCollapse callbacks were never called while
// every other callback was.
//
// The input's listeners are attached on the tick after creation, so each test
// mounts and then waits a tick before typing.
//
// Deliberately not asserted, because each is open: the input has no combobox
// semantics (role, aria-expanded, aria-controls), and search has no name option,
// so it submits no named value in a form (N12).
import { describe, test, expect, beforeEach, mock } from 'bun:test';
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
g.FocusEvent = dom.window.FocusEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};

import createSearch from '../../../src/components/search';

const tick = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => { document.body.innerHTML = ''; });

const mount = async (config: Parameters<typeof createSearch>[0] = {}) => {
  const search = createSearch(config);
  document.body.append(search.element);
  await tick();
  return search;
};
const inputOf = (search: { element: HTMLElement }) => search.element.querySelector('input')!;
const type = (search: { element: HTMLElement }, text: string) => {
  const input = inputOf(search);
  input.value = text;
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
};
const press = (search: { element: HTMLElement }, key: string) =>
  inputOf(search).dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true }));
const options = (search: { element: HTMLElement }) => [...search.element.querySelectorAll('[role="option"]')];

describe('search', () => {
  test('is a role="search" landmark whose input is labelled by its placeholder', async () => {
    const search = await mount({ placeholder: 'Search mail' });
    expect(search.element.getAttribute('role')).toBe('search');
    expect(inputOf(search).placeholder).toBe('Search mail');
    expect(inputOf(search).getAttribute('aria-label')).toBe('Search mail');
    expect(search.getPlaceholder()).toBe('Search mail');
  });

  test('typing updates the value, emits input and calls onInput', async () => {
    const onInput = mock((_value: unknown) => {});
    const search = await mount({ onInput });
    const inputs = mock((_event: unknown) => {});
    search.on('input', inputs);
    type(search, 'hello');
    expect(search.getValue()).toBe('hello');
    expect(inputs).toHaveBeenCalledTimes(1);
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  test('setValue updates the input, and emits input unless told not to', async () => {
    const search = await mount();
    const inputs = mock((_event: unknown) => {});
    search.on('input', inputs);
    search.setValue('world');
    expect(inputOf(search).value).toBe('world');
    search.setValue('quiet', false);
    expect(search.getValue()).toBe('quiet');
    expect(inputs).toHaveBeenCalledTimes(1);
  });

  test('Enter submits the current value; an empty value is not submitted', async () => {
    const onSubmit = mock((_value: unknown) => {});
    const search = await mount({ onSubmit });
    press(search, 'Enter');
    expect(onSubmit).not.toHaveBeenCalled();
    type(search, 'invoices');
    press(search, 'Enter');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('clear empties the value, drops the populated state and calls onClear', async () => {
    const onClear = mock(() => {});
    const search = await mount({ value: 'hello', onClear });
    expect(search.element.classList.contains('mtrl-search--populated')).toBe(true);
    search.clear();
    expect(search.getValue()).toBe('');
    expect(inputOf(search).value).toBe('');
    expect(search.element.classList.contains('mtrl-search--populated')).toBe(false);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  test('a clear button is rendered unless showClearButton is false', async () => {
    expect((await mount({ value: 'x' })).element.querySelector('[aria-label="Clear search"]')).not.toBeNull();
    expect((await mount({ value: 'x', showClearButton: false })).element.querySelector('[aria-label="Clear search"]')).toBeNull();
  });

  test('expand and collapse move between bar and view, emit events and call their callbacks', async () => {
    const onExpand = mock(() => {});
    const onCollapse = mock(() => {});
    const search = await mount({ onExpand, onCollapse });
    const events = mock((_event: unknown) => {});
    search.on('expand', events);
    search.on('collapse', events);

    expect([search.getState(), search.isExpanded()]).toEqual(['bar', false]);
    search.expand();
    expect([search.getState(), search.isExpanded()]).toEqual(['view', true]);
    expect(search.element.classList.contains('mtrl-search--view')).toBe(true);
    search.collapse();
    expect(search.getState()).toBe('bar');

    expect(events).toHaveBeenCalledTimes(2);
    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  test('a disabled search disables its input and does not expand', async () => {
    const search = await mount();
    search.disable();
    expect(search.isDisabled()).toBe(true);
    expect(inputOf(search).disabled).toBe(true);
    search.expand();
    expect(search.getState()).toBe('bar');
    search.enable();
    expect(inputOf(search).disabled).toBe(false);
    expect((await mount({ disabled: true })).isDisabled()).toBe(true);
  });

  test('setSuggestions renders strings or objects as options of a listbox', async () => {
    const search = await mount();
    search.expand();
    search.setSuggestions(['alpha', 'beta']);
    expect(search.element.querySelector('[role="listbox"]')).not.toBeNull();
    expect(options(search).map((o) => o.textContent)).toEqual(['alpha', 'beta']);
    search.setSuggestions([{ text: 'Gamma', value: 'g' }]);
    expect(options(search).map((o) => o.textContent)).toEqual(['Gamma']);
    search.clearSuggestions();
    expect(search.getSuggestions()).toEqual([]);
  });

  test('suggestions given in config are rendered when the view opens', async () => {
    const search = await mount({ suggestions: ['alpha', 'beta'] });
    search.expand();
    await tick();
    expect(options(search).map((o) => o.textContent)).toEqual(['alpha', 'beta']);
  });

  test('suggestions given in config are rendered in a view that starts open', async () => {
    const search = await mount({ suggestions: ['one', 'two'], initialState: 'view' });
    expect(options(search).length).toBe(2);
  });

  test('choosing a suggestion sets the value, reports it and closes the view', async () => {
    const onSuggestionSelect = mock((_suggestion: unknown) => {});
    const search = await mount({ onSuggestionSelect });
    search.expand();
    search.setSuggestions([{ text: 'Gamma', value: 'g' }]);
    (options(search)[0] as HTMLElement).click();
    expect(search.getValue()).toBe('g');
    expect(onSuggestionSelect).toHaveBeenCalledTimes(1);
    expect(search.getState()).toBe('bar');
  });

  test('view mode is configurable and changeable', async () => {
    const search = await mount({ viewMode: 'docked' });
    expect(search.getViewMode()).toBe('docked');
    search.setViewMode('fullscreen');
    expect(search.getViewMode()).toBe('fullscreen');
    expect(search.element.classList.contains('mtrl-search--fullscreen')).toBe(true);
  });

  test('off() removes a handler', async () => {
    const search = await mount();
    const inputs = mock((_event: unknown) => {});
    search.on('input', inputs);
    search.off('input', inputs);
    search.setValue('x');
    expect(inputs).not.toHaveBeenCalled();
  });

  test('destroy removes the element', async () => {
    const search = await mount();
    search.destroy();
    expect(document.body.contains(search.element)).toBe(false);
  });
});

// The focused state had no coverage at all -- not one mention of focus in this
// file before FLO-114 typed withStates. It is one of the four state methods
// the input feature drives, and the only one nothing reached.
describe('the focused state', () => {
  const focusClass = 'mtrl-search--focused';
  const focus = (search: { element: HTMLElement }) =>
    inputOf(search).dispatchEvent(new dom.window.FocusEvent('focus', { bubbles: true }));
  const blur = (search: { element: HTMLElement }) =>
    inputOf(search).dispatchEvent(new dom.window.FocusEvent('blur', { bubbles: true }));

  test('focusing the input marks the search focused, and blurring clears it', async () => {
    const search = await mount({ expandOnFocus: false, collapseOnBlur: false });

    expect(search.element.classList.contains(focusClass)).toBe(false);

    focus(search);
    expect(search.element.classList.contains(focusClass)).toBe(true);

    blur(search);
    expect(search.element.classList.contains(focusClass)).toBe(false);
  });

  test('focus and blur are reported as events', async () => {
    const search = await mount({ expandOnFocus: false, collapseOnBlur: false });
    const seen: string[] = [];
    search.on('focus', () => seen.push('focus'));
    search.on('blur', () => seen.push('blur'));

    focus(search);
    blur(search);

    expect(seen).toEqual(['focus', 'blur']);
  });

  // The class and the expansion are separate: expandOnFocus drives one, the
  // focused state the other, and a search that does not expand is still
  // focused.
  test('the focused state is set whether or not the search expands', async () => {
    const expanding = await mount({ expandOnFocus: true, collapseOnBlur: false });

    focus(expanding);
    await tick(30);

    expect(expanding.element.classList.contains(focusClass)).toBe(true);
    expect(expanding.isExpanded()).toBe(true);
  });
});
