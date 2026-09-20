// test/components/chips/label.test.ts
//
// withChipsLabel is not in createChips' pipe. createChips is still the host:
// the enhancer is applied to two real chips containers so a label moved on
// one cannot be the first match for the other.
import { describe, test, expect, beforeEach } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const win = dom.window;
const g = globalThis as unknown as {
  window: typeof win;
  document: Document;
  navigator: Navigator;
  HTMLElement: typeof HTMLElement;
  HTMLLabelElement: typeof HTMLLabelElement;
  Element: typeof Element;
  Node: typeof Node;
  Event: typeof Event;
  CustomEvent: typeof CustomEvent;
  MutationObserver: typeof MutationObserver;
  getComputedStyle: typeof getComputedStyle;
};
g.window = win;
g.document = win.document;
g.navigator = win.navigator;
g.HTMLElement = win.HTMLElement;
g.HTMLLabelElement = win.HTMLLabelElement;
g.Element = win.Element;
g.Node = win.Node;
g.Event = win.Event;
g.CustomEvent = win.CustomEvent;
g.MutationObserver = win.MutationObserver;
g.getComputedStyle = win.getComputedStyle.bind(win);

import { createChips } from '../../../src/components/chips';
import { withChipsLabel } from '../../../src/components/chips/features/label';
import type { ChipsConfig } from '../../../src/components/chips/types';

interface LabelController {
  setText: (text: string) => LabelController;
  getText: () => string;
  setPosition: (position: 'start' | 'end') => LabelController;
  getPosition: () => string;
}

interface LabelHost {
  element: HTMLElement;
  getClass: (name: string) => string;
  components?: { label?: HTMLElement };
  destroy: () => void;
}

interface LabeledChips extends LabelHost {
  label: LabelController;
}

const asHost = (chips: ReturnType<typeof createChips>): LabelHost =>
  chips as unknown as LabelHost;

const applyLabel = (host: LabelHost, config: ChipsConfig = {}): LabeledChips =>
  withChipsLabel(config)(host) as LabeledChips;

const mount = (
  config: ChipsConfig = {},
  options: { attachExistingLabel?: boolean; components?: { label?: HTMLElement } } = {},
): LabeledChips => {
  const host = asHost(createChips(config));
  if (options.components) {
    host.components = options.components;
  } else if (options.attachExistingLabel) {
    const existing = host.element.querySelector('label');
    host.components = existing instanceof g.HTMLElement ? { label: existing } : {};
  } else if (host.components === undefined) {
    host.components = {};
  }
  const labeled = applyLabel(host, config);
  document.body.append(labeled.element);
  return labeled;
};

const isLabel = (el: Element | null | undefined): el is HTMLLabelElement =>
  el instanceof g.HTMLLabelElement;

const labelEl = (chips: LabeledChips): HTMLLabelElement | null => {
  const fromBag = chips.components?.label;
  if (isLabel(fromBag)) return fromBag;
  const found = chips.element.querySelector('label');
  return isLabel(found) ? found : null;
};

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('withChipsLabel', () => {
  test('reads the configured text and position before anything is written', () => {
    const start = mount({ label: 'Filters' });
    const end = mount({ label: 'Tags', labelPosition: 'end' });

    expect(start.label.getText()).toBe('Filters');
    expect(start.label.getPosition()).toBe('start');
    expect(end.label.getText()).toBe('Tags');
    expect(end.label.getPosition()).toBe('end');
  });

  test('setText creates a chips-label at the start, only on that instance', () => {
    const first = mount();
    const second = mount();

    first.label.setText('Filters');

    const created = labelEl(first);
    expect(created).not.toBeNull();
    expect(created?.textContent).toBe('Filters');
    expect(created?.className).toBe(first.getClass('chips-label'));
    expect(first.element.firstChild).toBe(created);
    expect(first.element.classList.contains(`${first.getClass('chips')}--with-label`)).toBe(true);

    expect(labelEl(second)?.textContent === 'Filters').toBe(false);
    expect(second.element.classList.contains(`${second.getClass('chips')}--with-label`)).toBe(false);
    expect(second.label.getText()).toBe('');
  });

  test('setText appends the label when the stored position is end', () => {
    const chips = mount({ labelPosition: 'end' });
    chips.label.setText('Tags');

    const created = labelEl(chips);
    expect(created).not.toBeNull();
    expect(chips.element.lastChild).toBe(created);
    expect(created?.textContent).toBe('Tags');
  });

  test('setText updates an existing label and drops --with-label when the text is emptied', () => {
    const chips = mount({ label: 'Filters' }, { attachExistingLabel: true });
    const existing = labelEl(chips);
    expect(existing?.textContent).toBe('Filters');

    expect(chips.label.setText('Updated')).toBe(chips.label);
    expect(existing?.textContent).toBe('Updated');
    expect(chips.label.getText()).toBe('Updated');
    expect(chips.element.classList.contains(`${chips.getClass('chips')}--with-label`)).toBe(true);

    chips.label.setText('');
    expect(existing?.textContent).toBe('');
    expect(chips.label.getText()).toBe('');
    expect(chips.element.classList.contains(`${chips.getClass('chips')}--with-label`)).toBe(false);
  });

  test('without a components bag, setText changes only the stored text', () => {
    const host = asHost(createChips({}));
    const labeled = applyLabel(host, {});
    document.body.append(labeled.element);
    const before = labeled.element.querySelectorAll('label').length;

    labeled.label.setText('Orphans');

    expect(labeled.label.getText()).toBe('Orphans');
    expect(labeled.element.querySelectorAll('label').length).toBe(before);
    expect(labeled.element.classList.contains(`${labeled.getClass('chips')}--with-label`)).toBe(false);
  });

  test('setPosition moves each instance\'s own label and toggles --label-end', () => {
    const first = mount({ label: 'One' }, { attachExistingLabel: true });
    const second = mount({ label: 'Two' }, { attachExistingLabel: true });
    const firstLabel = labelEl(first);
    const secondLabel = labelEl(second);

    first.label.setPosition('end');

    expect(first.label.getPosition()).toBe('end');
    expect(first.element.lastChild).toBe(firstLabel);
    expect(first.element.classList.contains(`${first.getClass('chips')}--label-end`)).toBe(true);
    expect(second.element.classList.contains(`${second.getClass('chips')}--label-end`)).toBe(false);
    expect(second.element.lastChild).not.toBe(firstLabel);

    first.label.setPosition('start');

    expect(first.element.firstChild).toBe(firstLabel);
    expect(first.element.classList.contains(`${first.getClass('chips')}--label-end`)).toBe(false);
    expect(secondLabel?.textContent).toBe('Two');
  });

  test('setPosition with no label element still records the position', () => {
    const chips = mount();
    chips.components = {};

    chips.label.setPosition('end');
    expect(chips.label.getPosition()).toBe('end');
    expect(chips.element.classList.contains(`${chips.getClass('chips')}--label-end`)).toBe(false);

    chips.label.setText('Late');
    expect(chips.element.lastChild).toBe(labelEl(chips));
  });
});
