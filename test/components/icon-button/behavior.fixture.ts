import { afterEach, beforeEach, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import createIconButton from '../../../src/components/icon-button';

let dom: JSDOM;
let buttons: ReturnType<typeof createIconButton>[];
const icon = '<svg data-icon="unselected" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>';
const selectedIcon = '<svg data-icon="selected" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>';
const root = 'mtrl-icon-button';

beforeEach(() => {
  dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  for (const name of ['window', 'document', 'HTMLElement', 'HTMLButtonElement', 'Element', 'Node', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent']) {
    Object.defineProperty(globalThis, name, {
      configurable: true, writable: true,
      value: name === 'window' ? dom.window : Reflect.get(dom.window, name),
    });
  }
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  buttons = [];
});

afterEach(() => {
  buttons.forEach(button => button.destroy());
  dom.window.close();
});

// Partial: the helper already supplies icon and ariaLabel, so a caller
// overriding one option should not have to repeat the label. FLO-110 made
// ariaLabel required on the component's own config.
const make = (config: Partial<Parameters<typeof createIconButton>[0]> = {}) => {
  const button = createIconButton({ icon, ariaLabel: 'Favorite', ...config });
  document.body.append(button.element);
  buttons.push(button);
  return button;
};
const assertSelected = (button: ReturnType<typeof createIconButton>, selected: boolean) => {
  expect(button.isSelected()).toBe(selected);
  expect(button.element.getAttribute('aria-pressed')).toBe(String(selected));
  expect(button.element.classList.contains(`${root}--selected`)).toBe(selected);
};

for (const variant of ['standard', 'filled', 'tonal', 'outlined'] as const) {
  test(`${variant} variant class`, () => {
    const button = make({ variant });
    expect(button.element).toBeInstanceOf(HTMLButtonElement);
    expect(button.element.classList.contains(root)).toBe(true);
    expect(button.element.classList.contains(`${root}--${variant}`)).toBe(true);
    expect(button.getVariant()).toBe(variant);
  });
}
for (const size of ['xs', 's', 'm', 'l', 'xl'] as const) {
  test(`${size} size class`, () => {
    const button = make({ size });
    expect(button.element.classList.contains(`${root}--${size}`)).toBe(true);
    expect(button.getSize()).toBe(size);
  });
}
for (const shape of ['round', 'square'] as const) {
  test(`${shape} shape class`, () => {
    const button = make({ shape });
    expect(button.element.classList.contains(`${root}--square`)).toBe(shape === 'square');
    expect(button.element.classList.contains(`${root}--round`)).toBe(shape === 'round');
    expect(button.getShape()).toBe(shape);
  });
}
for (const width of ['narrow', 'default', 'wide'] as const) {
  test(`${width} width class or base style`, () => {
    const button = make({ width });
    expect(button.element.classList.contains(`${root}--narrow`)).toBe(width === 'narrow');
    expect(button.element.classList.contains(`${root}--wide`)).toBe(width === 'wide');
    expect(button.getWidth()).toBe(width);
  });
}

test('a plain button has no pressed state and clicking does not select it', () => {
  const button = make();
  expect(button.isToggle()).toBe(false);
  expect(button.element.hasAttribute('aria-pressed')).toBe(false);
  button.element.click();
  expect(button.isSelected()).toBe(false);
  expect(button.element.hasAttribute('aria-pressed')).toBe(false);
});

test('toggle clicks flip aria-pressed, the selected class and DOM toggle events', () => {
  const button = make({ toggle: true });
  const states: boolean[] = [];
  button.element.addEventListener('toggle', event => states.push((event as CustomEvent).detail.selected));
  expect(button.isToggle()).toBe(true);
  expect(button.element.classList.contains(`${root}--toggle`)).toBe(true);
  assertSelected(button, false);
  button.element.click();
  assertSelected(button, true);
  button.element.click();
  assertSelected(button, false);
  expect(states).toEqual([true, false]);
});

test('selectedIcon swaps into the real DOM and deselection restores the original', () => {
  const button = make({ toggle: true, selectedIcon });
  expect(button.element.querySelector('[data-icon="unselected"]')).not.toBeNull();
  button.element.click();
  expect(button.element.querySelector('[data-icon="selected"]')).not.toBeNull();
  expect(button.element.querySelector('[data-icon="unselected"]')).toBeNull();
  button.element.click();
  expect(button.element.querySelector('[data-icon="unselected"]')).not.toBeNull();
  expect(button.element.querySelector('[data-icon="selected"]')).toBeNull();
});

test('initial selected state initializes the selected icon and aria-pressed', () => {
  const button = make({ toggle: true, selected: true, selectedIcon });
  assertSelected(button, true);
  expect(button.element.querySelector('[data-icon="selected"]')).not.toBeNull();
});

test('select, deselect and toggleSelected keep DOM state synchronized and are chainable', () => {
  const button = make({ toggle: true, selectedIcon });
  expect(button.select()).toBe(button);
  assertSelected(button, true);
  expect(button.select()).toBe(button);
  assertSelected(button, true);
  expect(button.deselect()).toBe(button);
  assertSelected(button, false);
  expect(button.deselect()).toBe(button);
  assertSelected(button, false);
  expect(button.toggleSelected()).toBe(button);
  assertSelected(button, true);
  expect(button.toggleSelected()).toBe(button);
  assertSelected(button, false);
});

test('toggleOnClick false leaves selection under programmatic control', () => {
  const button = make({ toggle: true, toggleOnClick: false });
  button.element.click();
  assertSelected(button, false);
  button.select();
  assertSelected(button, true);
});

for (const selected of [false, true]) {
  test(`disabled native clicks preserve selected=${selected}; enabling restores clicks`, () => {
    const button = make({ toggle: true, disabled: true, selected });
    let events = 0;
    button.element.addEventListener('toggle', () => events++);
    expect(button.element.disabled).toBe(true);
    button.element.click();
    assertSelected(button, selected);
    expect(events).toBe(0);
    button.enable();
    button.element.click();
    assertSelected(button, !selected);
    expect(events).toBe(1);
    button.disable();
    button.element.click();
    assertSelected(button, !selected);
    expect(events).toBe(1);
  });
}

test('destroy removes the toggle click listener from a retained element', () => {
  const button = make({ toggle: true });
  const element = button.element;
  let clicks = 0;
  let toggles = 0;
  button.on('click', () => clicks++);
  element.addEventListener('toggle', () => toggles++);
  element.click();
  assertSelected(button, true);
  expect(clicks).toBe(1);
  expect(toggles).toBe(1);
  button.destroy();
  expect(element.isConnected).toBe(false);
  element.click();
  expect(clicks).toBe(1);
  expect(toggles).toBe(1);
  assertSelected(button, true);
});

test('a default button carries the round class so the selected morph applies to it', () => {
  const button = make({ toggle: true });
  expect(button.element.classList.contains(`${root}--round`)).toBe(true);
  expect(button.element.classList.contains(`${root}--square`)).toBe(false);
  button.select();
  expect(button.element.matches(`.${root}--selected.${root}--round`)).toBe(true);
});
