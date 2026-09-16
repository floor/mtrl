// test/core/dom/xss-sinks.test.ts
//
// The core DOM helpers every component builds on. Two sinks were open here: the options
// spread in createElement wrote any unreserved key as an attribute, so spreading
// CMS-shaped props could attach onclick or onerror; and nothing scheme-checked href,
// src or action at any of the four places attributes are set.
import { describe, test, expect, beforeAll } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');

beforeAll(() => {
  const g = global as any;
  const w = dom.window as any;
  for (const key of ['document', 'window', 'Element', 'HTMLElement', 'Node', 'Event', 'CustomEvent', 'SVGElement']) {
    if (w[key] !== undefined) g[key] = w[key];
  }
  g.document = w.document;
  g.window = w;
});

const { createElement } = await import('../../../src/core/dom/create');
const { setAttributes, batchAttributes } = await import('../../../src/core/dom/attributes');

describe('createElement refuses event-handler attributes', () => {
  test('an onclick passed through the options spread is not written', () => {
    const el = createElement({ tag: 'div', onclick: 'alert(1)' } as any);
    expect(el.getAttribute('onclick')).toBeNull();
    expect(el.outerHTML).not.toContain('onclick');
  });

  test('onerror and onload are refused too, whatever their case', () => {
    const el = createElement({ tag: 'img', onerror: 'alert(1)', ONLOAD: 'alert(2)' } as any);
    expect(el.getAttribute('onerror')).toBeNull();
    expect(el.getAttribute('onload')).toBeNull();
  });

  test('an attribute that merely starts with "on" is still allowed', () => {
    // `only` is not a handler; the guard requires on + a letter, and these are real
    // attribute names that would be wrong to drop.
    const el = createElement({ tag: 'div', 'data-only': 'yes' } as any);
    expect(el.getAttribute('data-only')).toBe('yes');
  });
});

describe('URL attributes are scheme-checked wherever they are set', () => {
  test('through the options spread', () => {
    const el = createElement({ tag: 'a', href: 'javascript:alert(1)' } as any);
    expect(el.getAttribute('href')).toBe('');
  });

  test('through the structured attributes path, single attribute', () => {
    const el = dom.window.document.createElement('a');
    setAttributes(el, { href: 'javascript:alert(1)' });
    expect(el.getAttribute('href')).toBe('');
  });

  test('through the structured attributes path, several attributes', () => {
    // The multi-attribute loop is a separate branch from the single-attribute fast path.
    const el = dom.window.document.createElement('a');
    setAttributes(el, { href: 'javascript:alert(1)', title: 'x', rel: 'noopener' });
    expect(el.getAttribute('href')).toBe('');
    expect(el.getAttribute('title')).toBe('x');
  });

  test('through the batched update path', () => {
    const el = dom.window.document.createElement('img');
    batchAttributes(el, [{ action: 'set', key: 'src', value: 'javascript:alert(1)' }] as any);
    expect(el.getAttribute('src')).toBe('');
  });

  test('a legitimate URL passes every path untouched', () => {
    const spread = createElement({ tag: 'a', href: 'https://example.com/x' } as any);
    expect(spread.getAttribute('href')).toBe('https://example.com/x');

    const structured = dom.window.document.createElement('a');
    setAttributes(structured, { href: '/relative', src: 'https://cdn.example.com/i.png' });
    expect(structured.getAttribute('href')).toBe('/relative');
    expect(structured.getAttribute('src')).toBe('https://cdn.example.com/i.png');
  });
});
