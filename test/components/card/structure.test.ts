// test/components/card/structure.test.ts
//
// The real card in a JSDOM document: its role and ARIA from config, the header,
// content, media and actions it builds and where each lands, the button
// shorthand, clickable cards from the keyboard, elevation, the loading,
// expandable and swipeable enhancers, and destroy. card.test.ts beside this file
// covers variants, config identity, classes, dragging and interactive marking.
//
// This replaces test/components/card.test.ts, which asserted against a mock
// defined in its own file. Porting it found three defects: aria: { role } was
// written as a bogus aria-role attribute and left the card with no role at all;
// a header title never named its card, because the header looked for its card
// before it was attached to one, and every title shared one id; and setHeader()
// placed the header after the last media, so on a card with media at the bottom
// the header ended up below everything.
//
// Deliberately not asserted, because each is open: an interactive card that is
// not clickable takes role="button" and focus but does nothing on Enter or Space;
// the header wraps its h3 and h4 in role="heading", which folds the subtitle into
// the heading; every content block is an unnamed role="region".
import { describe, test, expect, beforeEach } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLButtonElement = dom.window.HTMLButtonElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.CustomEvent = dom.window.CustomEvent;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

import createCard, {
  createCardActions,
  createCardContent,
  createCardHeader,
  createCardMedia,
  withExpandable,
  withLoading,
  withSwipeable,
} from '../../../src/components/card';
import { CARD_CLASSES } from '../../../src/components/card/constants';

const wait = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));
const parts = (card: { element: HTMLElement }) =>
  Array.from(card.element.children).map((child) => child.classList[0]);
const byId = (card: { element: HTMLElement }, id: string | null) =>
  id ? card.element.querySelector(`[id="${id}"]`) : null;

beforeEach(() => { document.body.innerHTML = ''; });

describe('card role and ARIA', () => {
  test('a static card is a region and an interactive one a focusable button', () => {
    expect(createCard().element.getAttribute('role')).toBe('region');
    const clickable = createCard({ clickable: true });
    expect(clickable.element.getAttribute('role')).toBe('button');
    expect(clickable.element.getAttribute('tabindex')).toBe('0');
  });

  test('aria config sets the role and aria attributes it names', () => {
    const card = createCard({ aria: { role: 'article', label: 'News', describedby: 'summary' } });
    expect(card.element.getAttribute('role')).toBe('article');
    expect(card.element.hasAttribute('aria-role')).toBe(false);
    expect(card.element.getAttribute('aria-label')).toBe('News');
    expect(card.element.getAttribute('aria-describedby')).toBe('summary');
  });

  test('fullWidth adds its modifier', () => {
    expect(createCard({ fullWidth: true }).element.classList.contains('mtrl-card--full-width')).toBe(true);
  });
});

describe('card header', () => {
  test('public part constants address the rendered header and content', () => {
    const card = createCard({
      header: { title: 'Trip', subtitle: 'Paris', avatar: '<span>A</span>', action: '<button>More</button>' },
      content: { text: 'Body' },
      media: { src: 'https://example.com/a.png' },
      actions: { actions: [] },
    });
    for (const key of ['HEADER', 'TITLE', 'SUBTITLE', 'AVATAR', 'HEADER_ACTION', 'CONTENT', 'MEDIA', 'ACTIONS'] as const) {
      expect(card.element.querySelector(`.mtrl-${CARD_CLASSES[key]}`)).not.toBeNull();
    }
    card.destroy();
  });

  test('renders title and subtitle, and the title names the card', () => {
    const card = createCard({ header: { title: 'Trip', subtitle: 'Paris' } });
    expect(card.element.querySelector('.mtrl-card__header-title')?.textContent).toBe('Trip');
    expect(card.element.querySelector('.mtrl-card__header-subtitle')?.textContent).toBe('Paris');
    const name = card.element.getAttribute('aria-labelledby');
    expect(byId(card, name)?.textContent).toBe('Trip');
  });

  test('titles of different cards carry different ids', () => {
    const first = createCard({ header: { title: 'One' } });
    const second = createCard({ header: { title: 'Two' } });
    const a = first.element.querySelector('.mtrl-card__header-title')!.id;
    const b = second.element.querySelector('.mtrl-card__header-title')!.id;
    expect(a).not.toBe('');
    expect(a).not.toBe(b);
  });

  test('an explicit aria-label is kept', () => {
    const card = createCard({ aria: { label: 'Custom' }, header: { title: 'Trip' } });
    expect(card.element.getAttribute('aria-label')).toBe('Custom');
    expect(card.element.hasAttribute('aria-labelledby')).toBe(false);
  });

  test('replacing the header replaces the name it gave', () => {
    const card = createCard({ header: { title: 'Old' } });
    card.setHeader(createCardHeader({ title: 'New' }));
    expect(card.element.querySelectorAll('.mtrl-card__header')).toHaveLength(1);
    expect(byId(card, card.element.getAttribute('aria-labelledby'))?.textContent).toBe('New');
  });

  test('avatar and action strings are rendered around the text', () => {
    const header = createCardHeader({ title: 'T', avatar: '<img src="a.png">', action: '<button>More</button>' });
    expect(Array.from(header.children).map((child) => child.classList[0])).toEqual([
      'mtrl-card__header-avatar', 'mtrl-card__header-text', 'mtrl-card__header-action',
    ]);
    const img = header.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
  });

  test('setHeader ignores an element that is not a card header', () => {
    const card = createCard();
    card.setHeader(document.createElement('div'));
    expect(card.element.children).toHaveLength(0);
  });
});

describe('card structure order', () => {
  test('inline config builds media, header, content and actions in order', () => {
    const card = createCard({
      media: { src: 'https://example.com/a.png', alt: 'Tower' },
      header: { title: 'Trip' },
      content: { text: 'Body' },
      actions: { actions: [document.createElement('button')] },
    });
    expect(parts(card)).toEqual(['mtrl-card__media', 'mtrl-card__header', 'mtrl-card__content', 'mtrl-card__actions']);
  });

  test('media at the bottom goes after content', () => {
    const card = createCard({ media: { src: 'https://example.com/a.png', position: 'bottom' }, header: { title: 'T' }, content: { text: 'Body' } });
    expect(parts(card)).toEqual(['mtrl-card__header', 'mtrl-card__content', 'mtrl-card__media']);
  });

  test('setHeader stays above content when media sits at the bottom', () => {
    const card = createCard();
    card.addMedia(createCardMedia({ src: 'https://example.com/top.png' }), 'top');
    card.addContent(createCardContent({ text: 'Body' }));
    card.addMedia(createCardMedia({ src: 'https://example.com/bottom.png' }), 'bottom');
    card.setHeader(createCardHeader({ title: 'Heading' }));
    expect(parts(card)).toEqual(['mtrl-card__media', 'mtrl-card__header', 'mtrl-card__content', 'mtrl-card__media']);
  });

  test('setActions replaces earlier actions at the end', () => {
    const card = createCard({ content: { text: 'Body' } });
    card.setActions(createCardActions({ class: 'first' }));
    card.setActions(createCardActions({ class: 'second' }));
    expect(card.element.querySelectorAll('.mtrl-card__actions')).toHaveLength(1);
    expect(card.element.lastElementChild?.classList.contains('second')).toBe(true);
  });

  test('addContent and addMedia ignore elements of the wrong kind', () => {
    const card = createCard();
    card.addContent(document.createElement('div'));
    card.addMedia(document.createElement('div'));
    expect(card.element.children).toHaveLength(0);
  });
});

describe('card parts', () => {
  test('content renders text as text, html as markup, and children', () => {
    const child = document.createElement('span');
    const text = createCardContent({ text: '<b>bold</b>', children: [child] });
    expect(text.querySelector('b')).toBeNull();
    expect(text.textContent).toBe('<b>bold</b>');
    expect(text.contains(child)).toBe(true);
    expect(createCardContent({ html: '<b>bold</b>' }).querySelector('b')).not.toBeNull();
    expect(createCardContent({ padding: false }).classList.contains('mtrl-card__content--no-padding')).toBe(true);
  });

  test('media images carry alt text, or are hidden as decoration', () => {
    const described = createCardMedia({ src: 'https://example.com/a.png', alt: 'Tower', aspectRatio: '16:9', contain: true });
    expect(described.querySelector('img')?.alt).toBe('Tower');
    expect(described.querySelector('img')?.hasAttribute('aria-hidden')).toBe(false);
    expect(described.classList.contains('mtrl-card__media--16-9')).toBe(true);
    expect(described.classList.contains('mtrl-card__media--contain')).toBe(true);

    const decorative = createCardMedia({ src: 'https://example.com/a.png' });
    expect(decorative.querySelector('img')?.getAttribute('aria-hidden')).toBe('true');
  });

  test('media refuses a script URL', () => {
    const media = createCardMedia({ src: 'javascript:alert(1)' });
    expect(media.querySelector('img')?.getAttribute('src')).not.toContain('javascript');
  });

  test('actions group their buttons and label unlabelled ones', () => {
    const icon = document.createElement('button');
    const text = document.createElement('button');
    text.textContent = 'Share';
    const actions = createCardActions({ actions: [icon, text], align: 'end', vertical: true, fullBleed: true });
    expect(actions.getAttribute('role')).toBe('group');
    expect(icon.getAttribute('aria-label')).toBe('Action 1');
    expect(text.hasAttribute('aria-label')).toBe(false);
    for (const modifier of ['end', 'vertical', 'full-bleed']) {
      expect(actions.classList.contains(`mtrl-card__actions--${modifier}`)).toBe(true);
    }
  });

  test('the buttons shorthand adds real buttons as actions', async () => {
    const card = createCard({ buttons: [{ text: 'Cancel' }, { text: 'Save' }] });
    await wait();
    const buttons = card.element.querySelectorAll('.mtrl-card__actions .mtrl-button');
    expect(Array.from(buttons).map((button) => button.textContent?.trim())).toEqual(['Cancel', 'Save']);
  });
});

describe('card behaviour', () => {
  test('a clickable card activates from Enter and Space', () => {
    const card = createCard({ clickable: true });
    let clicks = 0;
    card.element.addEventListener('click', () => { clicks += 1; });
    card.element.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    card.element.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(clicks).toBe(2);
  });

  test('elevation starts at level 1 for elevated cards and 0 otherwise, and rises on hover', () => {
    const elevated = createCard({ clickable: true });
    const level = () => elevated.element.style.getPropertyValue('--mtrl-card-elevation');
    expect(level()).toBe('1');
    elevated.element.dispatchEvent(new dom.window.MouseEvent('mouseenter'));
    expect(level()).toBe('2');
    elevated.element.dispatchEvent(new dom.window.MouseEvent('mouseleave'));
    expect(level()).toBe('1');
    expect(createCard({ variant: 'outlined' }).element.style.getPropertyValue('--mtrl-card-elevation')).toBe('0');
  });

  test('focus toggles the focused modifier on an interactive card', () => {
    const card = createCard({ interactive: true });
    document.body.appendChild(card.element);
    card.focus();
    expect(card.element.classList.contains('mtrl-card--focused')).toBe(true);
    card.element.blur();
    expect(card.element.classList.contains('mtrl-card--focused')).toBe(false);
  });

  test('draggable config marks the card while it is dragged', () => {
    const card = createCard({ draggable: true });
    expect(card.element.getAttribute('draggable')).toBe('true');
    card.element.dispatchEvent(new dom.window.Event('dragstart'));
    expect(card.element.classList.contains('mtrl-card--dragging')).toBe(true);
    card.element.dispatchEvent(new dom.window.Event('dragend'));
    expect(card.element.classList.contains('mtrl-card--dragging')).toBe(false);
  });

  test('drag data uses the title selected through the migrated header class', () => {
    const card = createCard({ draggable: true, header: { title: 'Trip' } });
    const values = new Map<string, string>();
    const event = new dom.window.Event('dragstart');
    Object.defineProperty(event, 'dataTransfer', { value: {
      setData: (type: string, value: string) => values.set(type, value),
    } });
    card.element.dispatchEvent(event);
    expect(values.get('text/plain')).toBe('Trip');
    card.destroy();
  });

  test('destroy removes the card', () => {
    const card = createCard({ header: { title: 'T' } });
    document.body.appendChild(card.element);
    card.destroy();
    expect(card.element.isConnected).toBe(false);
  });
});

describe('card enhancers', () => {
  test('expansion reuses the actions built by inline configuration', () => {
    const action = document.createElement('button');
    action.textContent = 'Share';
    const base = createCard({ actions: { actions: [action] } });
    const card = withExpandable({ expandableContent: document.createElement('div') })(base);
    expect(card.element.querySelectorAll('.mtrl-card__actions')).toHaveLength(1);
    expect(action.parentElement?.querySelector('.mtrl-card__expand-button')).not.toBeNull();
    base.destroy();
  });

  test('withLoading shows a busy overlay and removes it', () => {
    const card = withLoading({ initialState: true })(createCard());
    expect(card.loading.isLoading()).toBe(true);
    expect(card.element.getAttribute('aria-busy')).toBe('true');
    expect(card.element.classList.contains('mtrl-card--state-loading')).toBe(true);
    expect(card.element.querySelector('.mtrl-card__loading-overlay')?.getAttribute('role')).toBe('progressbar');

    card.loading.setLoading(false);
    expect(card.loading.isLoading()).toBe(false);
    expect(card.element.getAttribute('aria-busy')).toBe('false');
    expect(card.element.querySelector('.mtrl-card__loading-overlay')).toBeNull();
  });

  test('withExpandable wires its button to the content it shows and hides', () => {
    const content = document.createElement('div');
    const card = withExpandable({ expandableContent: content })(createCard());
    const button = card.element.querySelector<HTMLButtonElement>('.mtrl-card__expand-button')!;
    expect(button.getAttribute('aria-controls')).toBe(content.id);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(content.getAttribute('aria-hidden')).toBe('true');

    button.click();
    expect(card.expandable.isExpanded()).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(content.getAttribute('aria-hidden')).toBe('false');
    expect(card.element.classList.contains('mtrl-card--expanded')).toBe(true);

    card.expandable.setExpanded(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(content.style.display).toBe('none');
  });

  test('withSwipeable runs its handlers from the keyboard fallbacks and resets', () => {
    const seen: string[] = [];
    const card = withSwipeable({ onSwipeLeft: () => seen.push('left'), onSwipeRight: () => seen.push('right') })(createCard());
    expect(card.element.classList.contains('mtrl-card--swipeable')).toBe(true);
    card.element.querySelector<HTMLButtonElement>('.mtrl-card__swipe-left-action')!.click();
    expect(card.element.style.transform).toBe('translateX(-100%)');
    card.element.querySelector<HTMLButtonElement>('.mtrl-card__swipe-right-action')!.click();
    expect(seen).toEqual(['left', 'right']);
    card.swipeable.reset();
    expect(card.element.style.transform).toBe('translateX(0)');
  });
});
