// test/components/list/api.test.ts
//
// The public list methods come from withAPI wrapping the renderer and
// selection features. Two lists are mounted because selection looks items up
// by data-id, and a document-wide query would hit the first list.
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
  Element: typeof Element;
  Node: typeof Node;
  Event: typeof Event;
  MouseEvent: typeof MouseEvent;
  KeyboardEvent: typeof KeyboardEvent;
  CustomEvent: typeof CustomEvent;
  MutationObserver: typeof MutationObserver;
  getComputedStyle: typeof getComputedStyle;
};
g.window = win;
g.document = win.document;
g.navigator = win.navigator;
g.HTMLElement = win.HTMLElement;
g.Element = win.Element;
g.Node = win.Node;
g.Event = win.Event;
g.MouseEvent = win.MouseEvent;
g.KeyboardEvent = win.KeyboardEvent;
g.CustomEvent = win.CustomEvent;
g.MutationObserver = win.MutationObserver;
g.getComputedStyle = win.getComputedStyle.bind(win);

import createList from '../../../src/components/list';
import type { ListComponent, SelectEvent } from '../../../src/components/list/types';

interface Person {
  id: string;
  text: string;
  selected?: boolean;
}

const PEOPLE = (): Person[] => [
  { id: 'ada', text: 'Ada' },
  { id: 'alan', text: 'Alan' },
  { id: 'grace', text: 'Grace' },
];

const wait = (ms = 50): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const mount = (
  config: { items?: Person[]; animate?: boolean; initialSelection?: string[]; multiSelect?: boolean } = {},
): ListComponent<Person> => {
  const list = createList({
    items: config.items ?? PEOPLE(),
    animate: config.animate,
    initialSelection: config.initialSelection,
    multiSelect: config.multiSelect,
    ariaLabel: 'People',
  }) as ListComponent<Person>;
  document.body.append(list.element);
  return list;
};

const itemEl = (list: ListComponent<Person>, id: string): HTMLElement => {
  const el = list.element.querySelector(`[data-id="${id}"]`);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`expected item ${id}`);
  }
  return el;
};

const selectedClass = 'mtrl-list__item--selected';

const wireScrollIntoView = (list: ListComponent<Person>): { last: { id: string; behavior: string; block: string } | null } => {
  const seen: { last: { id: string; behavior: string; block: string } | null } = { last: null };
  for (const el of Array.from(list.element.querySelectorAll('[data-id]'))) {
    if (!(el instanceof HTMLElement)) continue;
    el.scrollIntoView = (arg?: boolean | ScrollIntoViewOptions) => {
      const options = typeof arg === 'object' && arg !== null ? arg : {};
      seen.last = {
        id: el.getAttribute('data-id') ?? '',
        behavior: options.behavior ?? 'auto',
        block: options.block ?? 'start',
      };
      const parent = el.parentElement;
      if (parent) {
        const index = Array.from(parent.children).indexOf(el);
        parent.scrollTop = options.block === 'end' ? index * 48 + 24 : index * 48;
      }
    };
  }
  return seen;
};

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('list public API', () => {
  test('getAllItems and getVisibleItems return this list\'s items, not the other\'s', () => {
    const first = mount();
    const second = mount({ items: [{ id: 'linus', text: 'Linus' }] });

    expect(first.getAllItems().map((item) => item.id)).toEqual(['ada', 'alan', 'grace']);
    expect(first.getVisibleItems().map((item) => item.text)).toEqual(['Ada', 'Alan', 'Grace']);
    expect(second.getAllItems().map((item) => item.id)).toEqual(['linus']);
    expect(second.getVisibleItems()).toEqual(second.getAllItems());
  });

  test('a rendered list is never loading and never has a next page', () => {
    const first = mount();
    const second = mount();
    expect(first.isLoading()).toBe(false);
    expect(first.hasNextPage()).toBe(false);
    expect(second.isLoading()).toBe(false);
    expect(second.hasNextPage()).toBe(false);
  });

  test('refresh re-renders from the same items array, only on that list', async () => {
    const firstItems = PEOPLE();
    const first = mount({ items: firstItems });
    const second = mount();
    expect(first.element.querySelectorAll('[data-id]').length).toBe(3);

    firstItems.push({ id: 'barbara', text: 'Barbara' });
    await first.refresh();

    expect(first.element.querySelector('[data-id="barbara"]')?.textContent).toBe('Barbara');
    expect(first.getAllItems().map((item) => item.id)).toContain('barbara');
    expect(second.element.querySelector('[data-id="barbara"]')).toBeNull();
    expect(second.getAllItems()).toHaveLength(3);
  });

  test('scrollToItem and scrollToIndex move that list\'s own row into view', async () => {
    const first = mount();
    const second = mount();
    const firstSeen = wireScrollIntoView(first);
    const secondSeen = wireScrollIntoView(second);

    first.scrollToItem('grace', 'end', true);
    expect(firstSeen.last).toEqual({ id: 'grace', behavior: 'smooth', block: 'end' });
    expect(itemEl(first, 'grace').parentElement?.scrollTop).toBe(2 * 48 + 24);
    expect(secondSeen.last).toBeNull();

    await first.scrollToIndex(1, 'start');
    expect(firstSeen.last).toEqual({ id: 'alan', behavior: 'auto', block: 'start' });
    expect(itemEl(first, 'alan').parentElement?.scrollTop).toBe(48);
  });

  test('config.animate is the default when scrollToItem is not given a flag', () => {
    const list = mount({ animate: true });
    const seen = wireScrollIntoView(list);

    list.scrollToItem('alan');
    expect(seen.last?.behavior).toBe('smooth');

    list.scrollToItem('grace', 'start', false);
    expect(seen.last).toEqual({ id: 'grace', behavior: 'auto', block: 'start' });
  });

  test('selectItem through the public API is visible on getAllItems of only that list', () => {
    const first = mount();
    const second = mount();

    first.selectItem('ada');

    expect(first.getAllItems().find((item) => item.id === 'ada')?.text).toBe('Ada');
    expect(first.isItemSelected('ada')).toBe(true);
    expect(itemEl(first, 'ada').classList.contains(selectedClass)).toBe(true);
    expect(second.getAllItems().map((item) => item.id)).toEqual(['ada', 'alan', 'grace']);
    expect(second.isItemSelected('ada')).toBe(false);
    expect(itemEl(second, 'ada').classList.contains(selectedClass)).toBe(false);

    first.setSelection(['alan', 'grace']);
    expect(first.getVisibleItems().filter((item) => first.isItemSelected(item.id)).map((item) => item.id).sort()).toEqual([
      'alan',
      'grace',
    ]);
    expect(second.getVisibleItems().every((item) => !second.isItemSelected(item.id))).toBe(true);

    first.deselectItem('alan');
    first.clearSelection();
    expect(first.getAllItems().every((item) => !first.isItemSelected(item.id))).toBe(true);
    expect(itemEl(first, 'grace').classList.contains(selectedClass)).toBe(false);
  });

  test('on and off through the public API receive a real select, and preventDefault keeps the row unselected', async () => {
    const first = mount();
    const second = mount();
    const seen: string[] = [];
    let prevented = false;
    const handler = (event: SelectEvent<Person>): void => {
      seen.push(`${event.item.id}:${first.getAllItems().length}`);
      if (event.item.id === 'alan') {
        event.preventDefault();
        prevented = event.defaultPrevented;
      }
    };
    first.on('select', handler);
    await wait();

    itemEl(first, 'ada').click();
    expect(seen).toEqual(['ada:3']);
    expect(first.isItemSelected('ada')).toBe(true);

    itemEl(first, 'alan').click();
    expect(seen).toEqual(['ada:3', 'alan:3']);
    expect(prevented).toBe(true);
    expect(first.isItemSelected('alan')).toBe(false);

    first.off('select', handler);
    itemEl(first, 'grace').click();
    expect(seen).toEqual(['ada:3', 'alan:3']);
    expect(first.isItemSelected('grace')).toBe(true);
    expect(second.getAllItems()).toHaveLength(3);
    expect(second.isItemSelected('ada')).toBe(false);
  });

  test('destroy unmounts this list and leaves the other\'s items in the document', () => {
    const first = mount();
    const second = mount();
    const secondAda = itemEl(second, 'ada');

    first.destroy();

    expect(document.body.contains(first.element)).toBe(false);
    expect(document.body.contains(second.element)).toBe(true);
    expect(secondAda.textContent).toBe('Ada');
    expect(second.getAllItems()).toHaveLength(3);
  });
});

// Every method ListComponent declares as returning ListComponent used to hand
// back the component as withAPI received it -- the pipeline object, which has
// the features but not the public API built on top of them. So a chain lost
// seven methods after one hop, and `list.selectItem('ada').refresh()` threw.
// They return `this` now.
describe('the chaining methods hand back the list', () => {
  const chainers: Array<[string, (list: ListComponent<Person>) => unknown]> = [
    ['selectItem', (list) => list.selectItem('ada')],
    ['deselectItem', (list) => list.deselectItem('ada')],
    ['clearSelection', (list) => list.clearSelection()],
    ['setSelection', (list) => list.setSelection(['alan'])],
    ['on', (list) => list.on('select', () => {})],
    ['off', (list) => list.off('select', () => {})],
    // These two were missed when the other seven were fixed in #125, and
    // annotating the factory's return type in FLO-113 is what surfaced them:
    // the declared ListComponent could not be satisfied while they handed back
    // the pipeline object.
    ['scrollToItem', (list) => { wireScrollIntoView(list); return list.scrollToItem('ada'); }],
  ];

  for (const [name, call] of chainers) {
    test(`${name} returns the list itself`, () => {
      const list = mount();

      expect(call(list)).toBe(list);
    });
  }

  test('so a chain keeps every method it started with', () => {
    const list = mount();

    const chained = list.selectItem('ada') as ListComponent<Person>;

    // These seven are what withAPI adds on top of the features, and they are
    // exactly what a chain used to drop.
    for (const method of [
      'refresh', 'getAllItems', 'getVisibleItems',
      'scrollToItem', 'scrollToIndex', 'isLoading', 'hasNextPage',
    ] as const) {
      expect(typeof chained[method]).toBe('function');
    }
  });

  test('and the call it was chained off still did its work', () => {
    const list = mount();

    const chained = list.selectItem('ada').setSelection(['alan', 'grace']) as ListComponent<Person>;

    expect(chained.getSelectedItemIds().sort()).toEqual(['alan', 'grace']);
    expect(list.getSelectedItemIds().sort()).toEqual(['alan', 'grace']);
  });

  test('refresh resolves to the list, which is what its Promise type says', async () => {
    const list = mount();

    await expect(list.refresh()).resolves.toBe(list);
  });

  test('scrollToIndex resolves to the list, as its Promise type says', async () => {
    const list = mount();
    wireScrollIntoView(list);

    await expect(list.scrollToIndex(1)).resolves.toBe(list);
  });

  test('and a scroll can be chained off, which is the point of returning it', () => {
    const list = mount();
    wireScrollIntoView(list);

    const chained = list.scrollToItem('ada') as ListComponent<Person>;

    expect(typeof chained.getSelectedItemIds).toBe('function');
    expect(chained.getAllItems()).toHaveLength(3);
  });
});
