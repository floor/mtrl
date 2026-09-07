// src/components/loading-indicator/api.ts
import { BaseComponent, LoadingIndicatorComponent, LoadingIndicatorConfig } from './types';
import { Renderer } from './features/renderer';
import { determinateFrame, indeterminateFrame, reducedMotionFrame } from './features/motion';
import {
  LOADING_INDICATOR_CLASSES,
  LOADING_INDICATOR_DETERMINATE_SHAPES,
  LOADING_INDICATOR_SHAPES,
} from './constants';
import { clampSize, clampValue } from './config';

interface ApiOptions {
  config: LoadingIndicatorConfig;
  lifecycle: { destroy: () => void };
}

/**
 * Adds the public API and runs the animation
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods
 */
export const withAPI =
  ({ config, lifecycle }: ApiOptions) =>
  (component: BaseComponent): LoadingIndicatorComponent => {
    const element = component.element;
    const renderer = component.renderer as Renderer;
    const canvas = component.canvas as HTMLCanvasElement;
    const prefix = config.prefix || 'mtrl';
    const cls = (name: string): string => `${prefix}-${name}`;
    const view = element.ownerDocument.defaultView;
    const reducedMotion = view?.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;

    const loopShapes = renderer.profiles(LOADING_INDICATOR_SHAPES);
    const valueShapes = renderer.profiles(LOADING_INDICATOR_DETERMINATE_SHAPES);

    let size = clampSize(config.size);
    let value = clampValue(config.value);
    let running = false;
    let frameId: number | null = null;
    let startedAt = 0;
    let pausedAt = 0;

    const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

    const applySize = (): void => {
      element.style.setProperty(`--${prefix}-loading-indicator-size`, `${size}px`);
      renderer.resize(size);
    };

    const applyValue = (): void => {
      if (value === null) {
        element.classList.remove(cls(LOADING_INDICATOR_CLASSES.DETERMINATE));
        element.removeAttribute('aria-valuenow');
        element.removeAttribute('aria-valuemin');
        element.removeAttribute('aria-valuemax');
      } else {
        element.classList.add(cls(LOADING_INDICATOR_CLASSES.DETERMINATE));
        element.setAttribute('aria-valuemin', '0');
        element.setAttribute('aria-valuemax', '100');
        element.setAttribute('aria-valuenow', String(Math.round(value * 100)));
        renderer.draw(valueShapes, determinateFrame(value));
      }
    };

    const tick = (): void => {
      frameId = null;
      if (!running || value !== null) return;
      const elapsed = now() - startedAt;
      const frame = reducedMotion?.matches
        ? reducedMotionFrame(elapsed, loopShapes.length)
        : indeterminateFrame(elapsed, loopShapes.length);
      renderer.draw(loopShapes, frame);
      frameId = requestAnimationFrame(tick);
    };

    const start = (): void => {
      if (running) return;
      running = true;
      // resume where it stopped rather than snapping back to the first shape
      startedAt = now() - pausedAt;
      if (value === null && frameId === null) frameId = requestAnimationFrame(tick);
    };

    const stop = (): void => {
      if (!running) return;
      running = false;
      pausedAt = now() - startedAt;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const api: LoadingIndicatorComponent = {
      element,
      canvas,

      setValue(next: number | null): LoadingIndicatorComponent {
        const was = value;
        value = clampValue(next);
        applyValue();
        if (value === null && was !== null && running && frameId === null) {
          startedAt = now();
          frameId = requestAnimationFrame(tick);
        }
        return this;
      },

      getValue(): number | null {
        return value;
      },

      setSize(next: number): LoadingIndicatorComponent {
        size = clampSize(next);
        applySize();
        if (value !== null) applyValue();
        return this;
      },

      getSize(): number {
        return size;
      },

      setLabel(label: string): LoadingIndicatorComponent {
        element.setAttribute('aria-label', label);
        return this;
      },

      start(): LoadingIndicatorComponent {
        start();
        return this;
      },

      stop(): LoadingIndicatorComponent {
        stop();
        return this;
      },

      isRunning(): boolean {
        return running;
      },

      destroy(): void {
        stop();
        element.remove();
        lifecycle.destroy();
      },
    };

    if (config.contained) element.classList.add(cls(LOADING_INDICATOR_CLASSES.CONTAINED));
    applySize();
    applyValue();
    start();

    return api;
  };
