// test/components/badge-host-label.test.ts
//
// The badge reads `label` from its config. Every host built its badge config with
// `content`, and nothing aliases the two at construction time, so a badge created
// through a host rendered as an empty pill: the count never appeared. `setContent` is a
// documented alias on the component API, which is why the defect survived — a later
// setContent() call worked, so only the initial render was wrong.
//
// Real DOM, real components, no mock: the existing badge test mocks the component and so
// never exercised the host path at all.
import { describe, test, expect } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document as any;
global.window = dom.window as any;
global.Element = dom.window.Element as any;
global.HTMLElement = dom.window.HTMLElement as any;
global.Event = dom.window.Event as any;
global.CustomEvent = dom.window.CustomEvent as any;

import createBadge from '../../src/components/badge';
import { pipe } from '../../src/core/compose/pipe';
import { createBase, withElement } from '../../src/core/compose/component';
import { withBadge } from '../../src/core/compose/features/badge';

const host = (badge: string | number) =>
  pipe(
    createBase,
    withElement({ tag: 'div', componentName: 'host' }),
    withBadge({ badge })
  )({ componentName: 'host', prefix: 'mtrl' } as any) as any;

describe('badges created through a host', () => {
  test('a badge created directly still shows its label', () => {
    const badge = createBadge({ label: 5 });
    expect(badge.element.textContent).toBe('5');
  });

  test('withBadge renders the count, rather than an empty pill', () => {
    const component = host(5);
    expect(component.badge).toBeDefined();
    expect(component.badge.element.textContent).toBe('5');
  });

  test('withBadge carries a string label through as well', () => {
    expect(host('New').badge.element.textContent).toBe('New');
  });

  test('the label survives as the component reports it', () => {
    expect(host(12).badge.getLabel()).toBe('12');
  });

  test('setContent still works, since it is a documented alias', () => {
    const component = host(1);
    component.badge.setContent(9);
    expect(component.badge.element.textContent).toBe('9');
  });
});
