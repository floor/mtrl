// test/components/loading-indicator/loading-indicator.test.ts
//
// The component in a JSDOM document with a recording 2D context: what it
// renders, how it is labelled, how the clock advances, and the value mode.
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

let frames: FrameRequestCallback[] = [];
g.requestAnimationFrame = (cb: FrameRequestCallback) => {
  frames.push(cb);
  return frames.length;
};
g.cancelAnimationFrame = () => {};
/** Runs the pending animation frames once */
const flushFrames = () => {
  const pending = frames;
  frames = [];
  for (const cb of pending) cb(performance.now());
};

/** A 2D context that records what is drawn */
interface Recording {
  fills: number;
  points: [number, number][];
  fillStyle: string;
  cleared: number;
}
const recordings = new WeakMap<HTMLCanvasElement, Recording>();
dom.window.HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
  let rec = recordings.get(this);
  if (!rec) {
    rec = { fills: 0, points: [], fillStyle: '', cleared: 0 };
    recordings.set(this, rec);
  }
  const r = rec;
  return {
    get fillStyle() { return r.fillStyle; },
    set fillStyle(v: string) { r.fillStyle = v; },
    setTransform() {},
    scale() {},
    clearRect() { r.cleared++; r.points = []; },
    beginPath() {},
    moveTo(x: number, y: number) { r.points.push([x, y]); },
    lineTo(x: number, y: number) { r.points.push([x, y]); },
    closePath() {},
    fill() { r.fills++; },
  } as unknown as CanvasRenderingContext2D;
} as any;

import createLoadingIndicator from '../../../src/components/loading-indicator';
import { indeterminateFrame, determinateFrame, morphProgress, MORPH_SETTLE_SECONDS } from '../../../src/components/loading-indicator/features/motion';

const drawn = (canvas: HTMLCanvasElement): Recording => recordings.get(canvas)!;
const farthest = (points: [number, number][], center: number): number =>
  Math.max(...points.map(([x, y]) => Math.hypot(x - center, y - center)));

beforeEach(() => {
  frames = [];
  document.body.innerHTML = '';
});

afterEach(() => {
  frames = [];
});

describe('loading indicator', () => {
  test('is a labelled progressbar with a canvas, 48px by default, primary by colour', () => {
    const indicator = createLoadingIndicator();
    document.body.appendChild(indicator.element);
    const el = indicator.element;
    expect(el.classList.contains('mtrl-loading-indicator')).toBe(true);
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-label')).toBe('Loading');
    expect(el.hasAttribute('aria-valuenow')).toBe(false);
    expect(el.style.getPropertyValue('--mtrl-loading-indicator-size')).toBe('48px');
    expect(indicator.getSize()).toBe(48);
    expect(indicator.canvas.classList.contains('mtrl-loading-indicator__canvas')).toBe(true);
    expect(indicator.canvas.getAttribute('aria-hidden')).toBe('true');
    expect(indicator.canvas.style.width).toBe('48px');
    expect(indicator.isRunning()).toBe(true);
    expect(indicator.getValue()).toBeNull();
    expect(el.classList.contains('mtrl-loading-indicator--contained')).toBe(false);

    const contained = createLoadingIndicator({ contained: true, ariaLabel: 'Refreshing page', size: 64 });
    expect(contained.element.classList.contains('mtrl-loading-indicator--contained')).toBe(true);
    expect(contained.element.getAttribute('aria-label')).toBe('Refreshing page');
    expect(contained.getSize()).toBe(64);
    contained.setLabel('Loading news');
    expect(contained.element.getAttribute('aria-label')).toBe('Loading news');
  });

  test('the size is kept between 24 and 240', () => {
    expect(createLoadingIndicator({ size: 10 }).getSize()).toBe(24);
    expect(createLoadingIndicator({ size: 400 }).getSize()).toBe(240);
    const indicator = createLoadingIndicator();
    indicator.setSize(96);
    expect(indicator.getSize()).toBe(96);
    expect(indicator.canvas.style.height).toBe('96px');
  });

  test('draws the morph each frame within the 38/48 active circle', () => {
    const indicator = createLoadingIndicator();
    document.body.appendChild(indicator.element);
    flushFrames();
    const rec = drawn(indicator.canvas);
    expect(rec.fills).toBe(1);
    expect(rec.points.length).toBe(360);
    // the largest shape reaches the active indicator circle, none goes past it
    expect(farthest(rec.points, 24)).toBeLessThanOrEqual(19 + 1e-6);
    expect(farthest(rec.points, 24)).toBeGreaterThan(14);
    expect(frames.length).toBe(1);
    flushFrames();
    expect(rec.fills).toBe(2);
  });

  test('stop freezes the frames; start resumes them', () => {
    const indicator = createLoadingIndicator();
    flushFrames();
    indicator.stop();
    expect(indicator.isRunning()).toBe(false);
    flushFrames();
    const fills = drawn(indicator.canvas).fills;
    flushFrames();
    expect(drawn(indicator.canvas).fills).toBe(fills);
    indicator.start();
    flushFrames();
    expect(drawn(indicator.canvas).fills).toBe(fills + 1);
  });

  test('a value makes it determinate: no loop, aria values, drawn at once', () => {
    const indicator = createLoadingIndicator({ value: 0.25 });
    expect(indicator.getValue()).toBe(0.25);
    expect(indicator.element.classList.contains('mtrl-loading-indicator--determinate')).toBe(true);
    expect(indicator.element.getAttribute('aria-valuenow')).toBe('25');
    expect(indicator.element.getAttribute('aria-valuemax')).toBe('100');
    expect(drawn(indicator.canvas).fills).toBe(1);
    expect(frames.length).toBe(0);

    indicator.setValue(1.7);
    expect(indicator.getValue()).toBe(1);
    expect(indicator.element.getAttribute('aria-valuenow')).toBe('100');
    expect(drawn(indicator.canvas).fills).toBe(2);

    indicator.setValue(null);
    expect(indicator.element.hasAttribute('aria-valuenow')).toBe(false);
    expect(indicator.element.classList.contains('mtrl-loading-indicator--determinate')).toBe(false);
    expect(frames.length).toBe(1);
  });

  test('destroy stops the loop and removes the element', () => {
    const indicator = createLoadingIndicator();
    document.body.appendChild(indicator.element);
    indicator.destroy();
    expect(document.body.contains(indicator.element)).toBe(false);
    expect(indicator.isRunning()).toBe(false);
    flushFrames();
    expect(frames.length).toBe(0);
  });
});

describe('loading indicator clock', () => {
  test('the morph spring overshoots and settles well within the 650ms interval', () => {
    expect(morphProgress(0)).toBeCloseTo(0, 5);
    expect(MORPH_SETTLE_SECONDS).toBeGreaterThan(0.15);
    expect(MORPH_SETTLE_SECONDS).toBeLessThan(0.4);
    let peak = 0;
    for (let ms = 0; ms < 650; ms += 5) peak = Math.max(peak, morphProgress(ms));
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThan(1.15);
    expect(morphProgress(640)).toBe(1);
  });

  test('every 650ms the shape index advances and the rotation gains a quarter turn on top of the slow spin', () => {
    const a = indeterminateFrame(0, 7);
    expect(a.index).toBe(0);
    expect(a.progress).toBeCloseTo(0, 5);
    expect(a.rotation).toBeCloseTo(90, 5);
    const b = indeterminateFrame(650, 7);
    expect(b.index).toBe(1);
    expect(b.rotation).toBeCloseTo((180 + (650 / 4666) * 360) % 360, 5);
    expect(indeterminateFrame(650 * 7, 7).index).toBe(0);
    // the end of one interval and the start of the next draw the same shape
    const end = indeterminateFrame(649, 7);
    expect(end.index).toBe(0);
    expect(end.progress).toBe(1);
    expect(end.rotation).toBeCloseTo(indeterminateFrame(650, 7).rotation, 0);
  });

  test('a determinate value morphs from the circle and turns half a circle counter-clockwise', () => {
    expect(determinateFrame(0)).toEqual({ index: 0, progress: 0, rotation: -0 });
    expect(determinateFrame(0.5).rotation).toBe(-90);
    expect(determinateFrame(1)).toEqual({ index: 0, progress: 1, rotation: -180 });
  });
});
