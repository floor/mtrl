// test/components/slider/slider.test.ts
//
// The real slider in a JSDOM document: its handles and their ARIA value
// attributes, setting and clamping values, keyboard stepping and the events it
// reports, range sliders, min/max/step, disabled state, appearance, label, icon
// and destroy. lifecycle.test.ts beside this file covers canvas and theme
// subscriptions.
//
// This replaces test/components/slider.test.ts, which asserted against a mock
// defined in its own file. Porting it found two defects: the second handle of a
// range slider kept its initial aria-valuenow however its value changed, and a
// valueFormatter shaped the value bubble but never reached assistive technology
// through aria-valuetext.
//
// Deliberately not asserted, because each is open: labelPosition and
// iconPosition are typed and defaulted but nothing reads them; setValue() and
// setSecondValue() let the handles cross, where dragging swaps them; setValue()
// does not snap to step, where keyboard and pointer input do; setSize() leaves
// the size class from config in place and getSize() returns a track height as a
// number, where the type promises a string.
import { describe, test, expect, beforeEach } from 'bun:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.FocusEvent = dom.window.FocusEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
dom.window.HTMLCanvasElement.prototype.getContext = function () {
  return new Proxy({}, { get: () => () => {} });
} as any;

import createSlider from '../../../src/components/slider';

const wait = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));
const handles = (slider: { element: HTMLElement }) =>
  Array.from(slider.element.querySelectorAll<HTMLElement>('[role="slider"]'));
const key = (target: HTMLElement, name: string) =>
  target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: name, bubbles: true }));

// The controller wires listeners and renders on the next task.
const mount = async (config: Parameters<typeof createSlider>[0] = {}) => {
  const slider = createSlider(config);
  document.body.appendChild(slider.element);
  await wait();
  return slider;
};

beforeEach(() => { document.body.innerHTML = ''; });

describe('slider handle', () => {
  test('is a labelled slider carrying its range and value', async () => {
    const slider = await mount({ min: 10, max: 50, value: 20, label: 'Volume' });
    const [handle] = handles(slider);
    expect(handles(slider)).toHaveLength(1);
    expect(handle.getAttribute('aria-valuemin')).toBe('10');
    expect(handle.getAttribute('aria-valuemax')).toBe('50');
    expect(handle.getAttribute('aria-valuenow')).toBe('20');
    expect(handle.getAttribute('aria-label')).toBe('Volume');
    expect(handle.getAttribute('tabindex')).toBe('0');
  });

  test('carries no aria-valuetext without a custom formatter', async () => {
    const slider = await mount({ value: 30 });
    expect(handles(slider)[0].hasAttribute('aria-valuetext')).toBe(false);
  });

  test('announces formatted values through aria-valuetext', async () => {
    const slider = await mount({ value: 42, valueFormatter: (v) => `${v}%` });
    const [handle] = handles(slider);
    expect(handle.getAttribute('aria-valuetext')).toBe('42%');
    expect(slider.element.querySelector('.mtrl-slider-value')?.textContent).toBe('42%');

    slider.setValue(60);
    expect(handle.getAttribute('aria-valuetext')).toBe('60%');
  });
});

describe('slider value', () => {
  test('setValue updates the value and the handle', async () => {
    const slider = await mount();
    slider.setValue(35);
    expect(slider.getValue()).toBe(35);
    expect(handles(slider)[0].getAttribute('aria-valuenow')).toBe('35');
  });

  test('setValue clamps to min and max', async () => {
    const slider = await mount({ min: 0, max: 100 });
    slider.setValue(150);
    expect(slider.getValue()).toBe(100);
    slider.setValue(-5);
    expect(slider.getValue()).toBe(0);
  });

  test('setValue reports change unless told not to', async () => {
    const slider = await mount({ value: 10 });
    const seen: number[] = [];
    slider.on('change', (e) => seen.push(e.value));
    slider.setValue(40, false);
    expect(seen).toEqual([]);
    slider.setValue(50);
    expect(seen).toEqual([50]);
  });

  test('setMin and setMax move the bounds and clamp the value', async () => {
    const slider = await mount({ value: 50 });
    const [handle] = handles(slider);
    slider.setMin(60);
    expect(slider.getMin()).toBe(60);
    expect(slider.getValue()).toBe(60);
    expect(handle.getAttribute('aria-valuemin')).toBe('60');

    slider.setMax(80).setValue(80).setMax(70);
    expect(slider.getMax()).toBe(70);
    expect(slider.getValue()).toBe(70);
    expect(handle.getAttribute('aria-valuemax')).toBe('70');
  });

  test('setStep changes how far the keyboard moves the value', async () => {
    const slider = await mount({ value: 20, step: 1 });
    slider.setStep(10);
    expect(slider.getStep()).toBe(10);
    key(handles(slider)[0], 'ArrowRight');
    expect(slider.getValue()).toBe(30);
  });
});

describe('slider keyboard', () => {
  test('arrows step the value and report input then change', async () => {
    const slider = await mount({ value: 50, step: 5 });
    const [handle] = handles(slider);
    const seen: [string, number][] = [];
    slider.on('input', (e) => seen.push(['input', e.value]));
    slider.on('change', (e) => seen.push(['change', e.value]));

    key(handle, 'ArrowRight');
    expect(slider.getValue()).toBe(55);
    key(handle, 'ArrowLeft');
    key(handle, 'ArrowLeft');
    expect(slider.getValue()).toBe(45);
    expect(seen.slice(0, 2)).toEqual([['input', 55], ['change', 55]]);
    expect(handle.getAttribute('aria-valuenow')).toBe('45');
  });

  test('Home and End jump to the bounds', async () => {
    const slider = await mount({ min: 5, max: 95, value: 50 });
    const [handle] = handles(slider);
    key(handle, 'End');
    expect(slider.getValue()).toBe(95);
    key(handle, 'Home');
    expect(slider.getValue()).toBe(5);
  });
});

describe('range slider', () => {
  test('has two labelled handles with their own values', async () => {
    const slider = await mount({ range: true, value: 20, secondValue: 80, label: 'Price' });
    const [first, second] = handles(slider);
    expect(handles(slider)).toHaveLength(2);
    expect(slider.element.classList.contains('mtrl-slider--range')).toBe(true);
    expect(first.getAttribute('aria-label')).toBe('Price minimum');
    expect(second.getAttribute('aria-label')).toBe('Price maximum');
    expect(first.getAttribute('aria-valuenow')).toBe('20');
    expect(second.getAttribute('aria-valuenow')).toBe('80');
  });

  test('setSecondValue updates the second handle and reports both values', async () => {
    const slider = await mount({ range: true, value: 20, secondValue: 80, valueFormatter: (v) => `$${v}` });
    const [, second] = handles(slider);
    const seen: [number, number | null][] = [];
    slider.on('change', (e) => seen.push([e.value, e.secondValue]));

    slider.setSecondValue(70);
    expect(slider.getSecondValue()).toBe(70);
    expect(second.getAttribute('aria-valuenow')).toBe('70');
    expect(second.getAttribute('aria-valuetext')).toBe('$70');
    expect(seen).toEqual([[20, 70]]);
  });

  test('the keyboard moves the second handle and its ARIA value', async () => {
    const slider = await mount({ range: true, value: 20, secondValue: 80 });
    const [, second] = handles(slider);
    key(second, 'ArrowLeft');
    expect(slider.getSecondValue()).toBe(79);
    expect(second.getAttribute('aria-valuenow')).toBe('79');
  });

  test('a single slider has no second value', async () => {
    const slider = await mount({ value: 20 });
    slider.setSecondValue(70);
    expect(slider.getSecondValue()).toBeNull();
  });
});

describe('slider disabled', () => {
  test('starts disabled from config and cannot be focused or stepped', async () => {
    const slider = await mount({ disabled: true, value: 50 });
    const [handle] = handles(slider);
    expect(slider.isDisabled()).toBe(true);
    expect(handle.getAttribute('aria-disabled')).toBe('true');
    expect(handle.getAttribute('tabindex')).toBe('-1');
    key(handle, 'ArrowRight');
    expect(slider.getValue()).toBe(50);
  });

  test('disable and enable toggle the state', async () => {
    const slider = await mount({ value: 50 });
    const [handle] = handles(slider);
    slider.disable();
    expect(slider.isDisabled()).toBe(true);
    expect(slider.element.classList.contains('mtrl-slider--disabled')).toBe(true);
    expect(handle.getAttribute('aria-disabled')).toBe('true');

    slider.enable();
    expect(slider.isDisabled()).toBe(false);
    expect(handle.getAttribute('aria-disabled')).toBe('false');
    expect(handle.getAttribute('tabindex')).toBe('0');
    key(handle, 'ArrowRight');
    expect(slider.getValue()).toBe(51);
  });
});

describe('slider appearance', () => {
  test('color defaults to primary and setColor swaps the modifier', async () => {
    const slider = await mount();
    expect(slider.getColor()).toBe('primary');
    slider.setColor('secondary');
    expect(slider.getColor()).toBe('secondary');
    expect(slider.element.classList.contains('mtrl-slider--secondary')).toBe(true);
    slider.setColor('error');
    expect(slider.element.classList.contains('mtrl-slider--secondary')).toBe(false);
    expect(slider.element.classList.contains('mtrl-slider--error')).toBe(true);
  });

  test('size comes from config and setSize resizes the track and handle', async () => {
    const slider = await mount({ size: 'L' });
    const track = slider.element.querySelector<HTMLElement>('.mtrl-slider-track')!;
    const [handle] = handles(slider);
    expect(slider.getSize()).toBe('L');
    expect(track.style.height).toBe('56px');
    expect(handle.style.height).toBe('68px');

    slider.setSize('M');
    expect(slider.getSize()).toBe('M');
    expect(track.style.height).toBe('40px');
    expect(handle.style.height).toBe('52px');
  });

  test('ticks show only on a discrete slider', async () => {
    const slider = await mount({ step: 10 });
    const ticks = () => Array.from(slider.element.querySelectorAll<HTMLElement>('.mtrl-slider-ticks'));
    expect(ticks().length).toBeGreaterThan(0);
    expect(ticks().every((t) => t.hidden)).toBe(true);
    slider.showTicks(true);
    await wait();
    expect(ticks().every((t) => !t.hidden)).toBe(true);
    slider.showTicks(false);
    await wait();
    expect(ticks().every((t) => t.hidden)).toBe(true);
  });

  test('centered adds its modifier', async () => {
    const slider = await mount({ centered: true, min: -50, max: 50, value: 0 });
    expect(slider.element.classList.contains('mtrl-slider--centered')).toBe(true);
  });
});

describe('slider label and icon', () => {
  test('setLabel replaces the label text', async () => {
    const slider = await mount({ label: 'Volume' });
    expect(slider.getLabel()).toBe('Volume');
    slider.setLabel('Brightness');
    expect(slider.getLabel()).toBe('Brightness');
  });

  test('setIcon renders the icon', async () => {
    const slider = await mount({ icon: '<svg id="first"></svg>' });
    expect(slider.element.classList.contains('mtrl-slider--icon')).toBe(true);
    slider.setIcon('<svg id="second"></svg>');
    expect(slider.getIcon()).toContain('second');
    expect(slider.element.querySelector('#second')).not.toBeNull();
  });
});

describe('slider events and destroy', () => {
  test('config.on registers handlers and off removes them', async () => {
    const seen: number[] = [];
    const slider = await mount({ on: { change: (e) => seen.push(e.value) } });
    const handler = (e: { value: number }) => seen.push(-e.value);
    slider.on('change', handler);
    slider.setValue(10);
    slider.off('change', handler);
    slider.setValue(20);
    expect(seen).toEqual([10, -10, 20]);
  });

  test('destroy removes the element and stops keyboard handling', async () => {
    const slider = await mount({ value: 50 });
    const [handle] = handles(slider);
    const seen: number[] = [];
    slider.on('change', (e) => seen.push(e.value));
    slider.destroy();
    expect(document.body.contains(slider.element)).toBe(false);
    key(handle, 'ArrowRight');
    expect(seen).toEqual([]);
  });
});
