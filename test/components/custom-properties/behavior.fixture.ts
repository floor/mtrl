import { afterEach, beforeEach, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import createButtonGroup from '../../../src/components/button-group';
import createCard from '../../../src/components/card';
import createDrawer from '../../../src/components/drawer';
import createCarousel from '../../../src/components/carousel';
import { PREFIX } from '../../../src/core/config';

let dom: JSDOM;
let components: Array<{ element: HTMLElement; destroy: () => void }>;
beforeEach(() => {
  dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  for (const name of ['window', 'document', 'HTMLElement', 'HTMLButtonElement', 'Element', 'Node', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent']) {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: name === 'window' ? dom.window : Reflect.get(dom.window, name) });
  }
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  components = [];
});
afterEach(() => { components.forEach(c => c.destroy()); dom.window.close(); });
const attach = <T extends { element: HTMLElement; destroy: () => void }>(component: T): T => {
  document.body.append(component.element); components.push(component); return component;
};
const propertyNames = (element: HTMLElement) => Array.from(element.style).filter(name => name.startsWith('--'));

for (const prefix of [PREFIX]) {
  test(`${prefix}: button-group geometry properties track size and density`, () => {
    const group = attach(createButtonGroup({ prefix, kind: 'connected', size: 'm', buttons: [{ text: 'Day' }] }));
    const names = ['height', 'icon', 'gap', 'inner-corner', 'pressed-corner', 'radius'].map(name => `--${prefix}-button-group-${name}`);
    expect(propertyNames(group.element).sort()).toEqual(names.sort());
    expect(names.map(name => group.element.style.getPropertyValue(name))).toEqual(names.map(name => ({ height: '56px', icon: '24px', gap: '2px', 'inner-corner': '8px', 'pressed-corner': '4px', radius: '28px' })[name.slice(`--${prefix}-button-group-`.length)]));
    group.setDensity('compact');
    expect(group.element.style.getPropertyValue(`--${prefix}-button-group-height`)).toBe('48px');
    expect(group.element.style.getPropertyValue(`--${prefix}-button-group-radius`)).toBe('24px');
  });

  test(`${prefix}: card initial, hover and drag elevation writes agree`, () => {
    const card = attach(createCard({ prefix, variant: 'elevated', interactive: true, draggable: true }));
    const property = `--${prefix}-card-elevation`;
    expect(propertyNames(card.element)).toEqual([property]);
    expect(card.element.style.getPropertyValue(property)).toBe('1');
    for (const [event, level] of [['mouseenter', '2'], ['mouseleave', '1'], ['dragstart', '4'], ['dragend', '1']]) {
      card.element.dispatchEvent(new Event(event));
      expect(propertyNames(card.element)).toEqual([property]);
      expect(card.element.style.getPropertyValue(property)).toBe(level);
    }
  });

  test(`${prefix}: drawer width is written under the configured name`, () => {
    const drawer = attach(createDrawer({ prefix, width: 312, items: [] }));
    expect(propertyNames(drawer.element)).toEqual([`--${prefix}-drawer-width`]);
    expect(drawer.element.style.getPropertyValue(`--${prefix}-drawer-width`)).toBe('312px');
  });

  test(`${prefix}: carousel writes its corner and item fade after layout`, () => {
    const carousel = attach(createCarousel({ prefix, cornerRadius: 19, slides: Array.from({ length: 5 }, () => ({ content: '<p>Slide</p>' })) }));
    const scroller = carousel.element.querySelector(`.${prefix}-carousel__scroller`)!;
    Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: 800 });
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 200 });
    carousel.addSlide({ content: '<p>Next</p>' });
    expect(propertyNames(carousel.element)).toEqual([`--${prefix}-carousel-corner`]);
    expect(carousel.element.style.getPropertyValue(`--${prefix}-carousel-corner`)).toBe('19px');
    for (const item of carousel.element.querySelectorAll<HTMLElement>(`.${prefix}-carousel__item`)) {
      expect(propertyNames(item)).toEqual([`--${prefix}-carousel-fade`]);
      expect(Number(item.style.getPropertyValue(`--${prefix}-carousel-fade`))).toBeGreaterThanOrEqual(0);
    }
  });
}
