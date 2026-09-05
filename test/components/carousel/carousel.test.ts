// test/components/carousel/carousel.test.ts
import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { JSDOM } from 'jsdom';

let dom: JSDOM;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
  const g = globalThis as any;
  g.window = dom.window;
  g.document = dom.window.document;
  g.HTMLElement = dom.window.HTMLElement;
  g.Element = dom.window.Element;
  g.Node = dom.window.Node;
  g.Event = dom.window.Event;
  g.KeyboardEvent = dom.window.KeyboardEvent;
  g.FocusEvent = dom.window.FocusEvent;
  g.CustomEvent = dom.window.CustomEvent;
  g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
  g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  g.ResizeObserver = class { observe() {} disconnect() {} };
});

afterEach(() => {
  dom.window.close();
});

import { createCarousel } from '../../../src/components/carousel/carousel';

const slides = [
  { image: 'a.jpg', title: 'Alpha' },
  { image: 'b.jpg', title: 'Beta', alt: '' },
  { image: 'c.jpg', title: 'Gamma', description: 'Third', buttonText: 'Open', buttonUrl: '/c' },
  { content: '<p>Custom</p>' },
];

/** JSDOM has no layout: give the scroller a size */
const sized = (carousel: ReturnType<typeof createCarousel>, width: number) => {
  const scroller = carousel.element.querySelector('.mtrl-carousel__scroller') as HTMLElement;
  Object.defineProperty(scroller, 'clientWidth', { value: width, configurable: true });
  Object.defineProperty(scroller, 'clientHeight', { value: 200, configurable: true });
  return scroller;
};

describe('carousel', () => {
  test('renders a labelled region with one focusable slide per item', () => {
    const carousel = createCarousel({ slides, ariaLabel: 'Featured' });
    const el = carousel.element;
    expect(el.classList.contains('mtrl-carousel')).toBe(true);
    expect(el.classList.contains('mtrl-carousel--multi-browse')).toBe(true);
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-roledescription')).toBe('carousel');
    expect(el.getAttribute('aria-label')).toBe('Featured');
    expect(el.hasAttribute('aria-live')).toBe(false);

    const items = el.querySelectorAll('.mtrl-carousel__item');
    expect(items.length).toBe(4);
    expect(items[0]!.getAttribute('role')).toBe('group');
    expect(items[0]!.getAttribute('aria-roledescription')).toBe('slide');
    expect(items[0]!.getAttribute('aria-label')).toBe('1 of 4');
    expect(items[3]!.getAttribute('aria-label')).toBe('4 of 4');
    expect(items[0]!.getAttribute('tabindex')).toBe('0');
    expect(items[0]!.getAttribute('style') ?? '').not.toContain('position');
  });

  test('image alt text: the title by default, empty when the image is decorative', () => {
    const carousel = createCarousel({ slides });
    const images = carousel.element.querySelectorAll('img');
    expect(images[0]!.alt).toBe('Alpha');
    expect(images[1]!.alt).toBe('');
    expect(carousel.element.querySelector('.mtrl-carousel__button')!.getAttribute('href')).toBe('/c');
    expect(carousel.element.querySelectorAll('.mtrl-carousel__item')[3]!.innerHTML).toBe('<p>Custom</p>');
  });

  test('layout defaults per variant: full-screen is vertical with no padding, uncontained does not snap', () => {
    const full = createCarousel({ variant: 'full-screen', slides });
    expect(full.element.classList.contains('mtrl-carousel--vertical')).toBe(true);
    expect(full.getVariant()).toBe('full-screen');
    const uncontained = createCarousel({ variant: 'uncontained', slides });
    expect(uncontained.element.classList.contains('mtrl-carousel--snap')).toBe(false);
    expect(createCarousel({ variant: 'uncontained', snap: true, slides }).element.classList.contains('mtrl-carousel--snap')).toBe(true);
  });

  test('without a measurable container the index stays a number', () => {
    const carousel = createCarousel({ slides });
    expect(carousel.getCurrentSlide()).toBe(0);
    carousel.next();
    expect(carousel.getCurrentSlide()).toBe(1);
    carousel.goTo(99);
    expect(carousel.getCurrentSlide()).toBe(3);
    carousel.goTo(-5);
    expect(carousel.getCurrentSlide()).toBe(0);
  });

  test('with a container: one snap point per item, items sized to the large keyline, change events', () => {
    const carousel = createCarousel({ slides, initialSlide: 1 });
    const scroller = sized(carousel, 600);
    const scrollTo = mock((_: ScrollToOptions) => undefined);
    (scroller as any).scrollTo = scrollTo;
    // a resize would do this in the browser; JSDOM never fires ResizeObserver
    carousel.addSlide({ image: 'd.jpg' });
    expect(carousel.element.classList.contains('mtrl-carousel--snap')).toBe(true);
    const snaps = carousel.element.querySelectorAll('.mtrl-carousel__snap');
    expect(snaps.length).toBe(5);
    expect((snaps[0] as HTMLElement).style.left).toBe('0px');
    const items = carousel.element.querySelectorAll<HTMLElement>('.mtrl-carousel__item');
    expect(parseFloat(items[0]!.style.width)).toBeGreaterThan(200);
    expect(items[0]!.style.clipPath).toContain('round 28px');
    expect(carousel.element.style.getPropertyValue('--mtrl-carousel-corner')).toBe('28px');
    expect(carousel.getCurrentSlide()).toBe(1);

    const changes: number[] = [];
    carousel.on('change', ({ index }: { index: number }) => changes.push(index));
    carousel.next();
    expect(changes).toEqual([2]);
    expect(scrollTo).toHaveBeenLastCalledWith({ left: expect.any(Number), behavior: 'smooth' });
  });

  test('arrow keys move focus between items along the axis only', () => {
    const carousel = createCarousel({ slides });
    document.body.appendChild(carousel.element);
    const scroller = sized(carousel, 600);
    carousel.addSlide({ image: 'd.jpg' });
    const items = carousel.element.querySelectorAll<HTMLElement>('.mtrl-carousel__item');
    items[0]!.focus();
    items[0]!.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);
    expect(carousel.getCurrentSlide()).toBe(1);
    items[1]!.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);
    items[1]!.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(items[4]);
    expect(scroller.contains(document.activeElement)).toBe(true);
  });

  test('removing and updating slides relabels them', () => {
    const carousel = createCarousel({ slides });
    carousel.removeSlide(0);
    const items = carousel.element.querySelectorAll('.mtrl-carousel__item');
    expect(items.length).toBe(3);
    expect(items[0]!.getAttribute('aria-label')).toBe('1 of 3');
    carousel.slides.updateSlide(0, { image: 'z.jpg', title: 'Zeta' });
    expect(items[0]!.querySelector('.mtrl-carousel__title')!.textContent).toBe('Zeta');
    expect(carousel.slides.getSlide(0)?.title).toBe('Zeta');
  });

  test('does not trap the wheel', () => {
    const carousel = createCarousel({ slides });
    const scroller = carousel.element.querySelector('.mtrl-carousel__scroller')!;
    const wheel = new dom.window.Event('wheel', { bubbles: true, cancelable: true });
    scroller.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(false);
  });

  test('destroy removes the element', () => {
    const carousel = createCarousel({ slides });
    document.body.appendChild(carousel.element);
    carousel.destroy();
    expect(document.body.children.length).toBe(0);
  });
});
