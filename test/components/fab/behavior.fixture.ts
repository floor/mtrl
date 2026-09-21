import { afterEach, beforeEach, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import createFab from '../../../src/components/fab';
import createExtendedFab from '../../../src/components/extended-fab';

let dom: JSDOM;
let buttons: Array<ReturnType<typeof createFab> | ReturnType<typeof createExtendedFab>>;
const icon = '<svg data-icon="add" viewBox="0 0 24 24"><path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z"/></svg>';
const nextIcon = '<svg data-icon="edit" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"></path></svg>';
const variants = ['primary-container', 'secondary-container', 'tertiary-container', 'primary', 'secondary', 'tertiary', 'surface'] as const;
beforeEach(() => {
  dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  for (const name of ['window', 'document', 'HTMLElement', 'HTMLButtonElement', 'Element', 'Node', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent']) {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: name === 'window' ? dom.window : Reflect.get(dom.window, name) });
  }
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  buttons = [];
});
afterEach(() => { buttons.forEach(b => b.destroy()); dom.window.close(); });
const attach = <T extends ReturnType<typeof createFab> | ReturnType<typeof createExtendedFab>>(button: T): T => {
  document.body.append(button.element); buttons.push(button); return button;
};
const frame = () => new Promise<void>(resolve => dom.window.requestAnimationFrame(() => resolve()));

for (const component of ['fab', 'extended-fab'] as const) {
  const root = `mtrl-${component}`;
  const make = (config: Record<string, unknown> = {}) =>
    attach(component === 'fab' ? createFab({ icon, ariaLabel: 'Create', ...config }) : createExtendedFab({ icon, text: 'Create', ...config }));

  test(`${component}: native button, primary-container default and accessible name`, () => {
    const b = make();
    expect(b.element).toBeInstanceOf(HTMLButtonElement);
    expect(b.element.type).toBe('button');
    expect(b.element.classList.contains(root)).toBe(true);
    expect(b.element.classList.contains(`${root}--primary-container`)).toBe(true);
    expect(b.element.classList.contains(`${root}--${component === 'fab' ? 'default' : 'small'}`)).toBe(true);
    expect(b.element.getAttribute('aria-label')).toBe('Create');
  });
  // FLO-110. config.ts used to read
  // `config.ariaLabel || (config.icon ? "action" : undefined)`, so a FAB
  // built without a label got the name "action" -- enough to pass axe and
  // Lighthouse while telling a screen-reader user nothing. The fallback is
  // gone, and the type now requires a label, so this asserts what happens to
  // an untyped caller who ignores that.
  test(`${component}: no manufactured name when the label is left out`, () => {
    const b = attach(
      component === 'fab'
        ? createFab({ icon } as never)
        : createExtendedFab({ icon, text: 'Create' } as never),
    );

    expect(b.element.getAttribute('aria-label')).not.toBe('action');
    if (component === 'fab') {
      expect(b.element.hasAttribute('aria-label')).toBe(false);
    }
  });

  for (const variant of variants) {
    test(`${component}: ${variant} colour class`, () => {
      const b = make({ variant });
      expect(b.element.classList.contains(`${root}--${variant}`)).toBe(true);
    });
  }
  for (const size of component === 'fab' ? ['small', 'default', 'medium', 'large'] : ['small', 'medium', 'large']) {
    test(`${component}: ${size} size class`, () => {
      const b = make({ size });
      expect(b.element.classList.contains(`${root}--${size}`)).toBe(true);
    });
  }
  test(`${component}: configured value and button type reach the DOM`, () => {
    const b = make({ value: 'save', type: 'submit' });
    expect(b.element.type).toBe('submit');
    expect(b.element.value).toBe('save');
    expect(b.getValue()).toBe('save');
    expect(b.setValue('saved')).toBe(b);
    expect(b.element.value).toBe('saved');
  });
  test(`${component}: preserves an explicitly empty initial value`, () => {
    const b = make({ value: '' });
    expect(b.element.hasAttribute('value')).toBe(true);
    expect(b.getValue()).toBe('');
  });
  test(`${component}: className arrays combine with component classes`, () => {
    const b = make({ className: ['first', 'second'], size: 'large' });
    expect(b.element.classList.contains('first')).toBe(true);
    expect(b.element.classList.contains('second')).toBe(true);
    expect(b.element.classList.contains(`${root}--large`)).toBe(true);
  });
  test(`${component}: replaces the actual icon content`, () => {
    const b = make();
    expect(b.element.querySelector('[data-icon="add"]')).not.toBeNull();
    expect(b.setIcon(nextIcon)).toBe(b);
    expect(b.element.querySelector('[data-icon="edit"]')).not.toBeNull();
    expect(b.element.querySelector('[data-icon="add"]')).toBeNull();
    expect(b.getIcon()).toBe(nextIcon);
  });
  test(`${component}: position, lower and raise APIs change classes`, () => {
    const b = make({ position: 'bottom-right' });
    expect(b.element.classList.contains(`${root}--bottom-right`)).toBe(true);
    expect(b.getPosition()).toBe('bottom-right');
    expect(b.setPosition('top-left')).toBe(b);
    expect(b.element.classList.contains(`${root}--bottom-right`)).toBe(false);
    expect(b.element.classList.contains(`${root}--top-left`)).toBe(true);
    expect(b.getPosition()).toBe('top-left');
    expect(b.lower()).toBe(b);
    expect(b.element.classList.contains(`${root}--lowered`)).toBe(true);
    expect(b.raise()).toBe(b);
    expect(b.element.classList.contains(`${root}--lowered`)).toBe(false);
  });
  test(`${component}: disabled clicks are suppressed; enable and disable update DOM`, () => {
    const b = make({ disabled: true });
    let clicks = 0;
    b.on('click', () => clicks++);
    expect(b.element.disabled).toBe(true);
    b.element.click();
    expect(clicks).toBe(0);
    expect(b.enable()).toBe(b);
    expect(b.element.disabled).toBe(false);
    b.element.click();
    expect(clicks).toBe(1);
    expect(b.disable()).toBe(b);
    b.element.click();
    expect(clicks).toBe(1);
  });
  test(`${component}: on/off subscriptions follow real native clicks`, () => {
    const b = make(); let clicks = 0;
    const handler = () => clicks++;
    b.on('click', handler); b.element.click();
    expect(clicks).toBe(1);
    b.off('click', handler); b.element.click();
    expect(clicks).toBe(1);
  });
  test(`${component}: on, off and addClass return the component they are called on`, () => {
    const b = make(); let clicks = 0;
    const handler = () => clicks++;
    expect(b.on('click', handler)).toBe(b);
    b.element.click();
    expect(clicks).toBe(1);
    expect(b.off('click', handler)).toBe(b);
    b.element.click();
    expect(clicks).toBe(1);
    expect(b.addClass('x')).toBe(b);
    expect(b.element.classList.contains('x')).toBe(true);
  });
  test(`${component}: on after destroy registers nothing`, () => {
    const b = make(); let calls = 0;
    // emit is not part of the public type; it is the events feature the API delegates to
    const emit = (event: string) => Reflect.apply(Reflect.get(b, 'emit'), b, [event]);
    b.on('ping', () => calls++);
    emit('ping');
    expect(calls).toBe(1);
    b.destroy();
    expect(b.on('ping', () => calls++)).toBe(b);
    emit('ping');
    expect(calls).toBe(1);
  });
  test(`${component}: ripple is present by default and can be opted out`, () => {
    expect(make().element.querySelector('.mtrl-ripple')).not.toBeNull();
    expect(make({ ripple: false }).element.querySelector('.mtrl-ripple')).toBeNull();
  });
  test(`${component}: custom and animation classes`, () => {
    const b = make({ class: 'custom-action', animate: true });
    expect(b.element.classList.contains('custom-action'), b.element.className).toBe(true);
    expect(b.element.classList.contains(`${root}--animate-enter`)).toBe(true);
    b.addClass('highlight');
    expect(b.element.classList.contains('highlight')).toBe(true);
  });
  test(`${component}: destroy removes listeners and ripple from a retained element`, () => {
    const b = make(), element = b.element; let clicks = 0;
    b.on('click', () => clicks++);
    element.click(); expect(clicks).toBe(1);
    b.destroy();
    expect(element.isConnected).toBe(false);
    expect(element.querySelector('.mtrl-ripple')).toBeNull();
    element.click(); expect(clicks).toBe(1);
    b.destroy();
  });
}

test('extended FAB: text and collapse/expand update the real DOM and emit events', () => {
  const b = attach(createExtendedFab({ icon, text: 'Create' }));
  expect(b.getText()).toBe('Create');
  expect(b.setText('Save')).toBe(b);
  expect(b.element.querySelector('.mtrl-extended-fab__text')?.textContent).toBe('Save');
  const events: string[] = [];
  b.element.addEventListener('collapse', () => events.push('collapse'));
  b.element.addEventListener('expand', () => events.push('expand'));
  expect(b.collapse()).toBe(b);
  expect(b.element.classList.contains('mtrl-extended-fab--collapsed')).toBe(true);
  expect(b.expand()).toBe(b);
  expect(b.element.classList.contains('mtrl-extended-fab--collapsed')).toBe(false);
  expect(events).toEqual(['collapse', 'expand']);
});
for (const width of ['fixed','fluid'] as const) {
  test(`extended FAB: ${width} width class`, () => {
    const b = attach(createExtendedFab({ icon, text: 'Create', width }));
    expect(b.element.classList.contains(`mtrl-extended-fab--${width}`)).toBe(true);
  });
}
test('extended FAB: scroll collapse/expand and listener cleanup use real events', async () => {
  const b = attach(createExtendedFab({ icon, text: 'Create', collapseOnScroll: true }));
  await frame();
  const scroll = async (y: number) => {
    Object.defineProperty(dom.window, 'scrollY', { configurable: true, value: y });
    dom.window.dispatchEvent(new dom.window.Event('scroll'));
    await frame();
  };
  await scroll(40);
  expect(b.element.classList.contains('mtrl-extended-fab--collapsed')).toBe(true);
  await scroll(0);
  expect(b.element.classList.contains('mtrl-extended-fab--collapsed')).toBe(false);
  let events = 0;
  b.element.addEventListener('collapse', () => events++);
  b.element.addEventListener('expand', () => events++);
  b.destroy();
  await scroll(80);
  expect(events).toBe(0);
});

for (const position of ['start', 'end'] as const) {
  test(`extended FAB: icon position ${position} uses the real child order`, () => {
    const b = attach(createExtendedFab({ icon, text: 'Create', iconPosition: position }));
    expect(b.element.classList.contains('mtrl-extended-fab--icon-end')).toBe(position === 'end');
    const children = Array.from(b.element.children).filter(el => !el.classList.contains('mtrl-ripple'));
    const iconIndex = children.indexOf(b.element.querySelector('.mtrl-extended-fab__icon')!);
    const textIndex = children.indexOf(b.element.querySelector('.mtrl-extended-fab__text')!);
    expect(iconIndex).toBeGreaterThanOrEqual(0);
    expect(textIndex).toBeGreaterThanOrEqual(0);
    expect(iconIndex < textIndex).toBe(position === 'start');
  });
}

test('extended FAB: text added later stays before an end icon', () => {
  const b = attach(createExtendedFab({ icon, iconPosition: 'end' }));
  b.setText('Create');
  const children = Array.from(b.element.children);
  expect(children.indexOf(b.element.querySelector('.mtrl-extended-fab__text')!))
    .toBeLessThan(children.indexOf(b.element.querySelector('.mtrl-extended-fab__icon')!));
});

test('extended FAB: an end icon added later follows existing text', () => {
  const b = attach(createExtendedFab({ text: 'Create', iconPosition: 'end' }));
  b.setIcon(icon);
  const children = Array.from(b.element.children);
  expect(children.indexOf(b.element.querySelector('.mtrl-extended-fab__text')!))
    .toBeLessThan(children.indexOf(b.element.querySelector('.mtrl-extended-fab__icon')!));
});
