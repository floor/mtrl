// test/components/xss-sinks.test.ts
//
// The component-level sinks. The core helpers are covered separately; these prove the
// components actually route through them, which is the part a helper test cannot show.
//
// Each of these was live at 0.9.0: card interpolated `text` into innerHTML, search
// interpolated the query and the suggestion label, and the carousel and rail assigned
// href and src without checking the scheme. All are CMS-shaped inputs.
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');

beforeAll(() => {
  const g = global as any;
  const w = dom.window as any;
  for (const key of ['document', 'window', 'Element', 'HTMLElement', 'Node', 'Event',
    'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'MutationObserver', 'SVGElement', 'getComputedStyle']) {
    if (w[key] !== undefined) g[key] = w[key];
  }
  g.document = w.document;
  g.window = w;
  g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
  g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.ResizeObserver = g.ResizeObserver;
});

afterAll(() => dom.window.close());

const XSS = '<img src=x onerror=alert(1)>';

describe('card content', () => {
  test('text is rendered as text, not parsed as markup', async () => {
    const { createCardContent } = await import('../../src/components/card/content');
    // createCardContent returns the element itself, not a component wrapper.
    const content = createCardContent({ text: XSS } as any);
    expect(content.querySelector('img')).toBeNull();
    expect(content.textContent).toContain('onerror');
  });

  test('html remains the explicit markup path, so callers keep a documented opt-in', async () => {
    const { createCardContent } = await import('../../src/components/card/content');
    const content = createCardContent({ html: '<em>markup</em>' } as any);
    expect(content.querySelector('em')).not.toBeNull();
  });
});

describe('search suggestions', () => {
  // renderSuggestions reads the query from the input and returns early unless the list
  // exists, so the component has to be driven the way it actually works: expand, set the
  // value, then supply suggestions. Asserting against an unrendered list proves nothing.
  const renderedSearch = async (value: string, text: string) => {
    const { default: createSearch } = await import('../../src/components/search');
    const search: any = createSearch({});
    search.expand?.();
    search.setValue?.(value);
    search.setSuggestions?.([{ text }]);
    return search;
  };

  // The exploitable branch is the one with NO match: highlightMatch returned the text
  // unchanged, and that went through createElement({ html }) into innerHTML. With a
  // matching query the highlight splits the payload and the parser mangles it, which
  // hides the sink — so a test that only uses a matching query proves nothing.
  test('a suggestion that does not match the query is not parsed as markup', async () => {
    const search = await renderedSearch('zzz', XSS);
    expect(search.element.querySelectorAll('li').length).toBeGreaterThan(0);
    const label = search.element.querySelector('[class*=suggestion-text]');
    expect(label).not.toBeNull();
    expect(label!.querySelector('img')).toBeNull();
    expect(label!.textContent).toBe(XSS);
    search.destroy?.();
  });

  test('the suggestion label is not parsed as markup', async () => {
    const search = await renderedSearch('img', XSS);
    expect(search.element.querySelectorAll('li').length).toBeGreaterThan(0);
    expect(search.element.querySelector('img')).toBeNull();
    expect(search.element.textContent).toContain('onerror');
    search.destroy?.();
  });

  test('the query is not parsed as markup either', async () => {
    // The query is reflected into the highlight, so it is a sink in its own right.
    const search = await renderedSearch('<img src=x onerror=alert(1)>', 'safe label');
    expect(search.element.querySelector('img')).toBeNull();
    search.destroy?.();
  });

  test('the highlight still marks exactly the matching run', async () => {
    const search = await renderedSearch('ell', 'hello');
    const strong = search.element.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong!.textContent).toBe('ell');
    expect(search.element.querySelector('[class*=suggestion-text]')?.textContent).toBe('hello');
    search.destroy?.();
  });
});

describe('URLs that would execute are refused', () => {
  test('a carousel slide button', async () => {
    const { default: createCarousel } = await import('../../src/components/carousel');
    const carousel = createCarousel({
      slides: [{ title: 'x', buttonText: 'Go', buttonUrl: 'javascript:alert(1)' }],
    } as any);
    const anchor = carousel.element.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe('');
    carousel.destroy?.();
  });

  test('a carousel slide image', async () => {
    const { default: createCarousel } = await import('../../src/components/carousel');
    const carousel = createCarousel({ slides: [{ image: 'javascript:alert(1)' }] } as any);
    const img = carousel.element.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('');
    carousel.destroy?.();
  });

  test('a navigation rail destination', async () => {
    const { default: createNavigationRail } = await import('../../src/components/navigation-rail');
    const rail = createNavigationRail({
      items: [{ id: 'a', label: 'A', icon: '<svg></svg>', href: 'javascript:alert(1)' }],
    } as any);
    const anchor = rail.element.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe('');
    rail.destroy?.();
  });

  test('a legitimate URL is left alone', async () => {
    const { default: createCarousel } = await import('../../src/components/carousel');
    const carousel = createCarousel({
      slides: [{ title: 'x', buttonText: 'Go', buttonUrl: 'https://example.com/x' }],
    } as any);
    const anchor = carousel.element.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe('https://example.com/x');
    carousel.destroy?.();
  });
});
