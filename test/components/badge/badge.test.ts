// test/components/badge/badge.test.ts
//
// The real badge in a JSDOM document: variants and the ARIA each carries, its
// label and max formatting, visibility, color and position, attaching to and
// detaching from a target, custom classes and destroy. badge-host-label.test.ts
// covers badges created through a host component.
//
// This replaces test/components/badge.test.ts, which asserted against a mock
// defined in its own file. Porting it found two defects: setVariant() kept the
// ARIA of the variant it left, so a small badge switched to large still carried
// aria-hidden="true" and its count never reached assistive technology; and
// removeClass() threw, forwarding to a method the composed badge never had.
//
// Deliberately not asserted, because each is open: a badge created with label 0
// or no label is visible where setLabel(0) and setLabel('') hide it; a numeric
// string over max shows "max+" without the overflow class a number gets; a
// target outside the document gets the positioned class but no wrapper.
import { describe, test, expect, beforeEach } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.CustomEvent = dom.window.CustomEvent;

import createBadge from '../../../src/components/badge';

const has = (badge: { element: HTMLElement }, modifier: string) =>
  badge.element.classList.contains(`mtrl-badge--${modifier}`);

const mountTarget = () => {
  const parent = document.createElement('div');
  const target = document.createElement('button');
  parent.appendChild(target);
  document.body.appendChild(parent);
  return { parent, target };
};

beforeEach(() => { document.body.innerHTML = ''; });

describe('badge defaults', () => {
  test('is a large error badge at the top right, announced as a status', () => {
    const badge = createBadge({ label: 5 });
    expect(badge.element.tagName).toBe('SPAN');
    expect(has(badge, 'large')).toBe(true);
    expect(has(badge, 'error')).toBe(true);
    expect(has(badge, 'top-right')).toBe(true);
    expect(badge.element.getAttribute('role')).toBe('status');
    expect(badge.element.hasAttribute('aria-hidden')).toBe(false);
    expect(badge.getLabel()).toBe('5');
    expect(badge.isVisible()).toBe(true);
  });

  test('applies color, position and a custom class from config', () => {
    const badge = createBadge({ color: 'primary', position: 'bottom-left', class: 'extra' });
    expect(has(badge, 'primary')).toBe(true);
    expect(has(badge, 'error')).toBe(false);
    expect(has(badge, 'bottom-left')).toBe(true);
    expect(badge.element.classList.contains('extra')).toBe(true);
  });
});

describe('badge variants', () => {
  test('a small badge is a decorative dot without text', () => {
    const badge = createBadge({ variant: 'small', label: 7 });
    expect(has(badge, 'small')).toBe(true);
    expect(badge.getLabel()).toBe('');
    expect(badge.element.getAttribute('aria-hidden')).toBe('true');
    expect(badge.element.hasAttribute('role')).toBe(false);
    badge.setLabel(8);
    expect(badge.getLabel()).toBe('');
  });

  test('switching small to large restores the label and exposes it', () => {
    const badge = createBadge({ variant: 'small', label: 3 });
    badge.setVariant('large');
    expect(has(badge, 'large')).toBe(true);
    expect(has(badge, 'small')).toBe(false);
    expect(badge.getLabel()).toBe('3');
    expect(badge.element.getAttribute('role')).toBe('status');
    expect(badge.element.hasAttribute('aria-hidden')).toBe(false);
  });

  test('switching large to small clears the text and hides it', () => {
    const badge = createBadge({ label: 42 });
    badge.setVariant('small');
    expect(has(badge, 'small')).toBe(true);
    expect(has(badge, 'large')).toBe(false);
    expect(badge.getLabel()).toBe('');
    expect(badge.element.getAttribute('aria-hidden')).toBe('true');
    expect(badge.element.hasAttribute('role')).toBe(false);
  });
});

describe('badge label', () => {
  test('setLabel and setContent replace the text', () => {
    const badge = createBadge({ label: 1 });
    badge.setLabel('New');
    expect(badge.getLabel()).toBe('New');
    badge.setContent(9);
    expect(badge.getContent()).toBe('9');
  });

  test('labels longer than four characters are shortened', () => {
    expect(createBadge({ label: 'Updated' }).getLabel()).toBe('Upda');
    expect(createBadge({ label: 12345 }).getLabel()).toBe('999+');
  });

  test('a number over max shows max+ with the overflow modifier', () => {
    const badge = createBadge({ label: 150, max: 99 });
    expect(badge.getLabel()).toBe('99+');
    expect(has(badge, 'overflow')).toBe(true);

    badge.setLabel(50);
    expect(badge.getLabel()).toBe('50');
    expect(has(badge, 'overflow')).toBe(false);
  });

  test('setMax reformats the current label', () => {
    const badge = createBadge({ label: 100 });
    expect(badge.getLabel()).toBe('100');
    badge.setMax(99);
    expect(badge.getLabel()).toBe('99+');
    badge.setMax(200);
    expect(badge.getLabel()).toBe('100');
  });

  test('setLabel hides the badge for an empty or zero label and shows it again', () => {
    const badge = createBadge({ label: 4 });
    badge.setLabel(0);
    expect(badge.isVisible()).toBe(false);
    badge.setLabel(2);
    expect(badge.isVisible()).toBe(true);
    badge.setLabel('');
    expect(badge.isVisible()).toBe(false);
  });
});

describe('badge visibility', () => {
  test('visible: false starts hidden', () => {
    const badge = createBadge({ label: 1, visible: false });
    expect(badge.isVisible()).toBe(false);
    expect(has(badge, 'invisible')).toBe(true);
  });

  test('show, hide and toggle change the state', () => {
    const badge = createBadge({ label: 1 });
    badge.hide();
    expect(badge.isVisible()).toBe(false);
    badge.show();
    expect(badge.isVisible()).toBe(true);
    badge.toggle();
    expect(badge.isVisible()).toBe(false);
    badge.toggle();
    expect(badge.isVisible()).toBe(true);
    badge.toggle(false);
    expect(badge.isVisible()).toBe(false);
    badge.toggle(true);
    expect(badge.isVisible()).toBe(true);
  });
});

// FLO-108. Creation and the setters disagreed about the same badge. Measured
// before the fix, at 600px in JSDOM:
//
//   label 0     created hidden=false   setLabel(0)     hidden=true
//   label ""    created hidden=false   setLabel("")    hidden=true
//   label "0"   created hidden=false   setLabel("0")   hidden=true
//   "1250" max 999  created overflow=false   setLabel overflow=false
//                   -- while 1250 as a number got the class, and both
//                      rendered "999+", because formatBadgeLabel has always
//                      used Number(label)
//
// The rules live in config.ts now and both sides call them, so the two cannot
// drift apart again.
describe('a badge says the same thing however it was set', () => {
  const EMPTY: Array<string | number> = [0, '', '0'];

  for (const label of EMPTY) {
    test(`${JSON.stringify(label)} is hidden at creation, as it is by setLabel`, () => {
      const created = createBadge({ label } as never);
      const set = createBadge({ label: 5 } as never);
      set.setLabel(label);

      expect(has(created, 'invisible')).toBe(true);
      expect(has(set, 'invisible')).toBe(true);
    });
  }

  test('a badge with no label at all is hidden too', () => {
    expect(has(createBadge({} as never), 'invisible')).toBe(true);
  });

  for (const label of [5, 'hi'] as Array<string | number>) {
    test(`${JSON.stringify(label)} is shown both ways`, () => {
      const created = createBadge({ label } as never);
      const set = createBadge({ label: 1 } as never);
      set.setLabel(label);

      expect(has(created, 'invisible')).toBe(false);
      expect(has(set, 'invisible')).toBe(false);
    });
  }

  // The overflow class asked about the label's *type*; the formatter asks
  // about its value. A numeric string rendered "999+" and looked like an
  // ordinary label.
  for (const label of [1250, '1250'] as Array<string | number>) {
    test(`${JSON.stringify(label)} over max is marked overflow both ways`, () => {
      const created = createBadge({ label, max: 999 } as never);
      const set = createBadge({ label: 1, max: 999 } as never);
      set.setLabel(label);

      expect(created.element.textContent).toBe('999+');
      expect(set.element.textContent).toBe('999+');
      expect(has(created, 'overflow')).toBe(true);
      expect(has(set, 'overflow')).toBe(true);
    });
  }

  test('a label under max is not marked overflow', () => {
    expect(has(createBadge({ label: 42, max: 999 } as never), 'overflow')).toBe(false);
    expect(has(createBadge({ label: '42', max: 999 } as never), 'overflow')).toBe(false);
  });

  // withAttachment builds a wrapper and replaces the target with it. With no
  // parent there is nothing to replace, so the wrapper was dropped and the
  // badge kept a position it never took.
  test('a target outside the document is not claimed as positioned', () => {
    const detached = document.createElement('button');

    const badge = createBadge({ label: 3, target: detached } as never);

    expect(has(badge, 'positioned')).toBe(false);
    expect((badge as unknown as { wrapper?: HTMLElement }).wrapper).toBeUndefined();
  });

  test('a target in the document still is', () => {
    const { target } = mountTarget();

    const badge = createBadge({ label: 3, target } as never);

    expect(has(badge, 'positioned')).toBe(true);
    expect((badge as unknown as { wrapper?: HTMLElement }).wrapper).toBeDefined();
  });
});

describe('badge appearance', () => {
  test('setColor and setPosition swap their modifiers', () => {
    const badge = createBadge({ label: 1 });
    badge.setColor('success');
    expect(has(badge, 'success')).toBe(true);
    expect(has(badge, 'error')).toBe(false);
    badge.setPosition('bottom-left');
    expect(has(badge, 'bottom-left')).toBe(true);
    expect(has(badge, 'top-right')).toBe(false);
  });

  test('addClass and removeClass change custom classes', () => {
    const badge = createBadge({ label: 1 });
    badge.addClass('one', 'two');
    expect(badge.element.classList.contains('one')).toBe(true);
    badge.removeClass('one');
    expect(badge.element.classList.contains('one')).toBe(false);
    expect(badge.element.classList.contains('two')).toBe(true);
  });
});

describe('badge attachment', () => {
  test('a target in config is wrapped with the badge beside it', () => {
    const { parent, target } = mountTarget();
    const badge = createBadge({ label: 2, target });
    expect(badge.wrapper?.parentNode).toBe(parent);
    expect(badge.wrapper?.classList.contains('mtrl-badge__wrapper')).toBe(true);
    expect(Array.from(badge.wrapper!.children)).toEqual([target, badge.element]);
    expect(has(badge, 'positioned')).toBe(true);
  });

  test('attachTo wraps a target and detach moves the badge out', () => {
    const { parent, target } = mountTarget();
    const badge = createBadge({ label: 2 });
    badge.attachTo(target);
    expect(target.parentElement).toBe(badge.wrapper!);
    expect(badge.wrapper?.parentNode).toBe(parent);
    expect(has(badge, 'positioned')).toBe(true);

    const wrapper = badge.wrapper!;
    badge.detach();
    expect(wrapper.contains(badge.element)).toBe(false);
    expect(badge.element.parentNode).toBe(document.body);
    expect(has(badge, 'positioned')).toBe(false);
    expect(badge.wrapper).toBeUndefined();
  });

  test('destroy removes the badge and unwraps the target', () => {
    const { parent, target } = mountTarget();
    const badge = createBadge({ label: 2, target });
    badge.destroy();
    expect(badge.element.isConnected).toBe(false);
    expect(Array.from(parent.children)).toEqual([target]);
  });
});
