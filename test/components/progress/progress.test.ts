// test/components/progress/progress.test.ts
//
// The real component in a JSDOM document with a recording 2D context: what it
// renders, how it is labelled, and what it draws for a given value.
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLCanvasElement = dom.window.HTMLCanvasElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.ResizeObserver = class { observe() {} disconnect() {} };

let frames: FrameRequestCallback[] = [];
g.requestAnimationFrame = (cb: FrameRequestCallback) => { frames.push(cb); return frames.length; };
g.cancelAnimationFrame = () => {};
const flush = (time = performance.now()) => {
  const pending = frames;
  frames = [];
  for (const cb of pending) cb(time);
};

/** One drawn stroke or fill */
interface Shape {
  kind: 'line' | 'arc' | 'dot';
  color: string;
  lineWidth: number;
  /** for a line: [x0, x1]; for an arc: [from, sweep]; for a dot: [x, y] */
  at: [number, number];
}
const recordings = new WeakMap<HTMLCanvasElement, Shape[]>();

dom.window.HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
  const canvas = this;
  if (!recordings.has(canvas)) recordings.set(canvas, []);
  let points: [number, number][] = [];
  let arc: [number, number] | null = null;
  const state = { fillStyle: '', strokeStyle: '', lineWidth: 0, lineCap: '', lineJoin: '' };
  return {
    get fillStyle() { return state.fillStyle; }, set fillStyle(v: string) { state.fillStyle = v; },
    get strokeStyle() { return state.strokeStyle; }, set strokeStyle(v: string) { state.strokeStyle = v; },
    get lineWidth() { return state.lineWidth; }, set lineWidth(v: number) { state.lineWidth = v; },
    get lineCap() { return state.lineCap; }, set lineCap(v: string) { state.lineCap = v; },
    get lineJoin() { return state.lineJoin; }, set lineJoin(v: string) { state.lineJoin = v; },
    setTransform() {}, scale() {},
    clearRect() { recordings.set(canvas, []); },
    beginPath() { points = []; arc = null; },
    moveTo(x: number, y: number) { points.push([x, y]); },
    lineTo(x: number, y: number) { points.push([x, y]); },
    arc(_x: number, _y: number, _r: number, from: number, to: number) { arc = [from, to - from]; },
    closePath() {},
    stroke() {
      const shapes = recordings.get(canvas)!;
      if (arc) shapes.push({ kind: 'arc', color: state.strokeStyle, lineWidth: state.lineWidth, at: arc });
      else if (points.length) {
        const xs = points.map((p) => p[0]);
        shapes.push({ kind: 'line', color: state.strokeStyle, lineWidth: state.lineWidth, at: [Math.min(...xs), Math.max(...xs)] });
      }
    },
    fill() {
      const shapes = recordings.get(canvas)!;
      if (arc) shapes.push({ kind: 'dot', color: state.fillStyle, lineWidth: 0, at: [0, 0] });
    },
  } as unknown as CanvasRenderingContext2D;
} as any;

import createProgress from '../../../src/components/progress';

const shapes = (p: { canvas: unknown }): Shape[] => recordings.get(p.canvas as HTMLCanvasElement) ?? [];
// JSDOM lays nothing out: give every element the width a browser would
let elementWidth = 200;
dom.window.HTMLElement.prototype.getBoundingClientRect = function () {
  return { width: elementWidth, height: 4, top: 0, left: 0, right: elementWidth, bottom: 4, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
};
const sized = (_p: unknown, width: number) => { elementWidth = width; };

beforeEach(() => { frames = []; document.body.innerHTML = ''; });
afterEach(() => { frames = []; });

describe('progress', () => {
  test('is a labelled progressbar with a canvas and the value in its aria attributes', () => {
    const progress = createProgress({ value: 42, ariaLabel: 'Loading news article' });
    const el = progress.element;
    expect(el.classList.contains('mtrl-progress')).toBe(true);
    expect(el.classList.contains('mtrl-progress--linear')).toBe(true);
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-label')).toBe('Loading news article');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('42');
    const canvas = el.querySelector('canvas')!;
    expect(canvas.classList.contains('mtrl-progress-canvas')).toBe(true);
    expect(canvas.getAttribute('aria-hidden')).toBe('true');
    expect(createProgress({}).element.getAttribute('aria-label')).toBe('Loading');
  });

  test('an indeterminate indicator carries no value', () => {
    const progress = createProgress({ indeterminate: true });
    expect(progress.element.hasAttribute('aria-valuenow')).toBe(false);
    expect(progress.element.classList.contains('mtrl-progress--indeterminate')).toBe(true);
    expect(progress.isIndeterminate()).toBe(true);
    progress.setIndeterminate(false);
    expect(progress.element.hasAttribute('aria-valuenow')).toBe(true);
    expect(progress.element.classList.contains('mtrl-progress--indeterminate')).toBe(false);
  });

  test('linear: the canvas is as tall as the track, 10px when it waves', () => {
    sized(null, 240);
    const flat = createProgress({});
    expect(flat.canvas.style.height).toBe('4px');
    expect(flat.canvas.style.width).toBe('240px');

    const thick = createProgress({ thickness: 'thick' });
    expect(thick.canvas.style.height).toBe('8px');

    // 3dp of wave above and below a 4dp track is the 10dp the tokens describe
    const wavy = createProgress({ shape: 'wavy' });
    expect(wavy.canvas.style.height).toBe('10px');
  });

  test('circular: 40px flat, 48px wavy, and anywhere from 24 to 240 on request', () => {
    expect(createProgress({ variant: 'circular' }).canvas.style.width).toBe('40px');
    expect(createProgress({ variant: 'circular', shape: 'wavy' }).canvas.style.width).toBe('48px');
    const sizable = createProgress({ variant: 'circular', size: 96 });
    expect(sizable.canvas.style.width).toBe('96px');
    expect(sizable.getSize()).toBe(96);
    sizable.setSize(500);
    expect(sizable.getSize()).toBe(240);
    sizable.setSize(2);
    expect(sizable.getSize()).toBe(24);
  });

  test('linear determinate: an indicator, a gap, the track, and the stop dot', () => {
    sized(null, 200);
    const progress = createProgress({ value: 50 });
    const drawn = shapes(progress);
    const lines = drawn.filter((s) => s.kind === 'line');
    expect(lines.length).toBe(2);
    // the track comes first, then the indicator over it
    const [track, indicator] = lines as [Shape, Shape];
    expect(indicator.color).not.toBe(track.color);
    expect(indicator.at[0]).toBeCloseTo(2, 0); // the round cap keeps its end inside
    expect(indicator.at[1]).toBeCloseTo(100, 0);
    // a 4dp gap plus the stroke separates the two
    expect(track.at[0] - indicator.at[1]).toBeCloseTo(8, 0);
    expect(track.at[1]).toBeCloseTo(198, 0);
    // and the end of the track is marked
    expect(drawn.some((s) => s.kind === 'dot')).toBe(true);
  });

  test('the stop indicator can be turned off, and never shows while indeterminate', () => {
    sized(null, 200);
    const without = createProgress({ value: 50, showStopIndicator: false });
    expect(shapes(without).some((s) => s.kind === 'dot')).toBe(false);

    const indeterminate = createProgress({ indeterminate: true });
    expect(shapes(indeterminate).some((s) => s.kind === 'dot')).toBe(false);
  });

  test('circular determinate: the arc starts at 12 o\'clock and the track clears both its ends', () => {
    const progress = createProgress({ variant: 'circular', value: 25 });
    const arcs = shapes(progress).filter((s) => s.kind === 'arc');
    expect(arcs.length).toBe(2);
    const [track, indicator] = arcs as [Shape, Shape];
    expect(indicator.at[0]).toBeCloseTo(-Math.PI / 2, 5);
    expect(indicator.at[1]).toBeCloseTo(Math.PI / 2, 5); // a quarter of the circle
    // the track starts after the arc plus a gap and stops a gap before it
    expect(track.at[0]).toBeGreaterThan(indicator.at[0] + indicator.at[1]);
    expect(track.at[1]).toBeLessThan(2 * Math.PI - indicator.at[1]);
  });

  test('a circular indeterminate indicator has no track', () => {
    const progress = createProgress({ variant: 'circular', indeterminate: true });
    flush(0);
    const arcs = shapes(progress).filter((s) => s.kind === 'arc');
    expect(arcs.length).toBe(1);
  });

  test('values are clamped, reported and announced', () => {
    const progress = createProgress({ value: 10 });
    const changes: number[] = [];
    progress.on('change', (e: CustomEvent) => changes.push((e.detail as { value: number }).value));
    progress.setValue(60, false);
    expect(progress.getValue()).toBe(60);
    expect(progress.element.getAttribute('aria-valuenow')).toBe('60');
    expect(changes).toEqual([60]);
    progress.setValue(500, false);
    expect(progress.getValue()).toBe(100);
    progress.setValue(-5, false);
    expect(progress.getValue()).toBe(0);
  });

  test('reaching the maximum fires complete once the value is there', () => {
    const progress = createProgress({ value: 0 });
    let completed = 0;
    progress.element.addEventListener('complete', () => completed++);
    progress.setValue(100, false);
    expect(completed).toBe(1);
  });

  test('thickness and shape can change after creation', () => {
    const progress = createProgress({ value: 50 });
    progress.setThickness('thick');
    expect(progress.getThickness()).toBe(8);
    expect(progress.canvas.style.height).toBe('8px');
    progress.setShape('wavy');
    expect(progress.getShape()).toBe('wavy');
    expect(progress.canvas.style.height).toBe('20px'); // 8 + 2 * 6
    progress.setShape('flat');
    expect(progress.canvas.style.height).toBe('8px');
  });

  test('the label is optional and sits outside the canvas', () => {
    const progress = createProgress({ value: 42, showLabel: true });
    const label = progress.element.querySelector('.mtrl-progress__label');
    expect(label?.textContent).toBe('42%');
    progress.setLabelFormatter((v: number, m: number) => `${v} of ${m}`);
    expect(progress.element.querySelector('.mtrl-progress__label')!.textContent).toBe('42 of 100');
    progress.hideLabel();
    expect(progress.element.querySelector('.mtrl-progress__label')).toBeNull();
    expect(createProgress({ value: 1 }).element.querySelector('.mtrl-progress__label')).toBeNull();
  });

  test('hiding stops the animation and marks the element hidden', () => {
    const progress = createProgress({ indeterminate: true });
    document.body.appendChild(progress.element);
    expect(progress.isVisible()).toBe(true);
    progress.hide();
    expect(progress.element.hasAttribute('hidden')).toBe(true);
    expect(progress.isVisible()).toBe(false);
    frames = [];
    flush();
    expect(frames.length).toBe(0);
    progress.show();
    expect(progress.isVisible()).toBe(true);
    expect(frames.length).toBeGreaterThan(0);
  });

  test('destroy stops everything and removes the element', () => {
    const progress = createProgress({ indeterminate: true });
    document.body.appendChild(progress.element);
    progress.destroy();
    expect(document.body.contains(progress.element)).toBe(false);
    frames = [];
    flush();
    expect(frames.length).toBe(0);
  });
});
