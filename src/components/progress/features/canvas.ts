// src/components/progress/features/canvas.ts
//
// The canvas, its size, and the clock. Sizes follow the Material 3 tokens: a
// linear indicator is as tall as its track, or 10dp at the default thickness
// when it waves; a circular one is 40dp, or 48dp when it waves, and can be
// set anywhere from 24dp to 240dp.

import { ProgressConfig, ProgressThickness, ProgressShape } from "../types";
import {
  PROGRESS_CLASSES,
  PROGRESS_VARIANTS,
  PROGRESS_SHAPES,
  PROGRESS_MEASUREMENTS,
  PROGRESS_MOTION,
  PROGRESS_THICKNESS,
  PROGRESS_WAVE,
} from "../constants";
import { observeCanvasResize } from "../../../core/canvas/resize";
import { createColors } from "./colors";
import { drawCircularProgress } from "./circular";
import { drawLinearProgress } from "./linear";
import { waveAmplitudeAt, waveAmplitudeTarget } from "./motion";

export interface CanvasContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
}

interface BaseComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  lifecycle?: {
    init?: () => void;
    destroy?: () => void;
  };
  state?: {
    value?: number;
    max?: number;
    buffer?: number;
    indeterminate?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CanvasComponent extends BaseComponent {
  canvas: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  draw: () => void;
  resize: () => void;
}

/**
 * Resolves a thickness preset or a number of pixels
 */
export const getStrokeWidth = (thickness: ProgressThickness = "thin"): number => {
  if (typeof thickness === "number") return thickness;
  return thickness === "thick" ? PROGRESS_THICKNESS.THICK : PROGRESS_THICKNESS.THIN;
};

/**
 * How tall the wave is, in pixels. The linear wave keeps the token's
 * relationship to the track (3dp of wave to a 4dp track, which is the 10dp
 * container the tokens describe), so a thicker track waves proportionally;
 * the circular wave scales with the indicator's size, as the guidelines ask.
 */
export const getWaveAmplitude = (
  isCircular: boolean,
  strokeWidth: number,
  size: number
): number =>
  isCircular
    ? PROGRESS_WAVE.CIRCULAR.AMPLITUDE * (size / PROGRESS_MEASUREMENTS.CIRCULAR.SIZE)
    : PROGRESS_WAVE.LINEAR.AMPLITUDE * (strokeWidth / PROGRESS_THICKNESS.THIN);

/** The container size of a circular indicator: 40dp flat, 48dp wavy */
export const getCircularSize = (config: ProgressConfig): number => {
  const fallback =
    config.shape === PROGRESS_SHAPES.WAVY
      ? PROGRESS_MEASUREMENTS.CIRCULAR.WAVE_SIZE
      : PROGRESS_MEASUREMENTS.CIRCULAR.SIZE;
  return Math.max(
    PROGRESS_MEASUREMENTS.CIRCULAR.MIN_SIZE,
    Math.min(config.size ?? fallback, PROGRESS_MEASUREMENTS.CIRCULAR.MAX_SIZE)
  );
};

/** The height of a linear indicator: the track, plus the wave on both sides */
export const getLinearHeight = (strokeWidth: number, isWavy: boolean): number =>
  isWavy ? strokeWidth + 2 * getWaveAmplitude(false, strokeWidth, 0) : strokeWidth;

/**
 * Adds the canvas, the drawing routine and the animation loop
 */
export const withCanvas =
  (config: ProgressConfig) =>
  (component: BaseComponent): CanvasComponent => {
    const isCircular = config.variant === PROGRESS_VARIANTS.CIRCULAR;
    const view = component.element.ownerDocument?.defaultView ?? null;

    const canvas = document.createElement("canvas");
    canvas.className = `${component.getClass(PROGRESS_CLASSES.CONTAINER)}-canvas`;
    canvas.setAttribute("aria-hidden", "true");
    component.element.appendChild(canvas);

    let context: CanvasContext | null = null;
    let currentThickness: ProgressThickness = config.thickness ?? "thin";
    let currentShape: ProgressShape = config.shape ?? PROGRESS_SHAPES.FLAT;
    let currentSize = getCircularSize(config);

    // The value the indicator is drawn at, which follows the state's value
    let animatedValue = config.value ?? 0;
    let targetValue = animatedValue;
    let valueAnimationId: number | null = null;
    let lastSetValueTime = 0;

    // The wave's height, which fades in and out with the value
    let amplitudeFrom = 0;
    let amplitudeTarget = 0;
    let amplitudeStarted = 0;

    let animationId: number | null = null;
    let animationTime = 0;
    let animationStart = 0;

    const reducedMotion = view?.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    const isWavy = (): boolean => currentShape === PROGRESS_SHAPES.WAVY;
    const strokeWidth = (): number => getStrokeWidth(currentThickness);
    const max = (): number => (component.state?.max as number) ?? config.max ?? 100;
    const isIndeterminate = (): boolean =>
      (component.state?.indeterminate as boolean) ?? config.indeterminate ?? false;

    const colors = createColors(() => draw(animationTime));

    /** Sizes the canvas to the element and the device's pixel ratio */
    const measure = (): void => {
      if (!context) return;
      const ratio = view?.devicePixelRatio || 1;
      let width: number;
      let height: number;

      if (isCircular) {
        width = height = currentSize;
      } else {
        const rect = component.element.getBoundingClientRect?.();
        width = Math.max(rect?.width || component.element.offsetWidth || 0, 0);
        height = getLinearHeight(strokeWidth(), isWavy());
      }

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.width = width;
      context.height = height;
      context.pixelRatio = ratio;
      context.ctx.setTransform(1, 0, 0, 1, 0, 0);
      context.ctx.scale(ratio, ratio);
    };

    const initialize = (): boolean => {
      if (typeof canvas.getContext !== "function") return false;
      const ctx = canvas.getContext("2d");
      if (!ctx) return false;
      context = { canvas, ctx, width: 0, height: 0, pixelRatio: view?.devicePixelRatio || 1 };
      measure();
      component.ctx = ctx;
      return true;
    };

    /** The wave's height right now, in pixels */
    const currentAmplitude = (): number => {
      if (!isWavy()) return 0;
      const full = getWaveAmplitude(isCircular, strokeWidth(), currentSize);
      if (isIndeterminate()) return full;
      const fraction = waveAmplitudeAt(
        amplitudeFrom,
        amplitudeTarget,
        (view?.performance ?? performance).now() - amplitudeStarted
      );
      return full * fraction;
    };

    const draw = (time: number = animationTime): void => {
      if (!context || context.width <= 0 || context.height <= 0) return;
      const indeterminate = isIndeterminate();
      const value = indeterminate ? 0 : animatedValue / max();

      if (isCircular) {
        drawCircularProgress(context, {
          progress: value,
          indeterminate,
          strokeWidth: strokeWidth(),
          time,
          waveAmplitude: currentAmplitude(),
          colors: colors.get(),
        });
      } else {
        const rtl =
          view?.getComputedStyle?.(component.element)?.direction === "rtl";
        drawLinearProgress(context, {
          progress: value,
          buffer: ((component.state?.buffer as number) ?? config.buffer ?? 0) / max(),
          indeterminate,
          strokeWidth: strokeWidth(),
          time,
          waveAmplitude: currentAmplitude(),
          rtl,
          colors: colors.get(),
          showStopIndicator: !indeterminate && config.showStopIndicator !== false,
        });
      }
    };

    /**
     * The frame loop. It runs while the indicator is indeterminate or waving,
     * and not at all under prefers-reduced-motion, where a still frame stands
     * in for the animation.
     */
    const needsAnimation = (): boolean =>
      !reducedMotion?.matches && (isIndeterminate() || isWavy());

    const startAnimation = (offset = 0): void => {
      stopAnimation();
      if (!needsAnimation()) {
        draw(0);
        return;
      }
      animationStart = 0;
      const step = (timestamp: number): void => {
        if (animationStart === 0) animationStart = timestamp - offset;
        animationTime = timestamp - animationStart;
        draw(animationTime);
        animationId = needsAnimation() ? requestAnimationFrame(step) : null;
      };
      animationId = requestAnimationFrame(step);
    };

    const stopAnimation = (): void => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const stopValueAnimation = (): void => {
      if (valueAnimationId !== null) {
        cancelAnimationFrame(valueAnimationId);
        valueAnimationId = null;
      }
    };

    /** Points the wave at the height this value calls for */
    const retargetAmplitude = (progress: number): void => {
      const next = waveAmplitudeTarget(progress);
      if (next === amplitudeTarget) return;
      amplitudeFrom = waveAmplitudeAt(
        amplitudeFrom,
        amplitudeTarget,
        (view?.performance ?? performance).now() - amplitudeStarted
      );
      amplitudeTarget = next;
      amplitudeStarted = (view?.performance ?? performance).now();
    };

    const complete = (value: number): void => {
      component.element.dispatchEvent(
        new CustomEvent("complete", { detail: { value, max: max() } })
      );
    };

    // ---------------------------------------------------------------------
    // Methods the API delegates to
    // ---------------------------------------------------------------------

    component.setValue = (value: number, animate = true): void => {
      targetValue = Math.max(0, Math.min(max(), value));
      retargetAmplitude(targetValue / max());

      if (valueAnimationId !== null && animate) return; // the running animation picks it up
      stopValueAnimation();

      if (!animate || reducedMotion?.matches) {
        animatedValue = targetValue;
        draw();
        if (targetValue >= max()) complete(targetValue);
        return;
      }

      const startValue = animatedValue;
      const startTime = (view?.performance ?? performance).now();
      // A value that changes faster than the animation would always lag, so
      // the animation shortens to the interval between updates
      const sinceLast = startTime - lastSetValueTime;
      const duration =
        lastSetValueTime > 0 && sinceLast < PROGRESS_MOTION.VALUE_DURATION
          ? Math.max(100, sinceLast * 0.9)
          : PROGRESS_MOTION.VALUE_DURATION;
      lastSetValueTime = startTime;

      const step = (now: number): void => {
        // The value tween is linear (ProgressIndicatorDefaults.ProgressAnimationSpec)
        const fraction = Math.min((now - startTime) / duration, 1);
        animatedValue = startValue + (targetValue - startValue) * fraction;
        if (animationId === null) draw();
        if (fraction < 1) {
          valueAnimationId = requestAnimationFrame(step);
        } else {
          valueAnimationId = null;
          animatedValue = targetValue;
          if (animationId === null) draw();
          if (targetValue >= max()) complete(targetValue);
        }
      };
      valueAnimationId = requestAnimationFrame(step);
    };

    component.setIndeterminate = (indeterminate: boolean): void => {
      if (component.state) component.state.indeterminate = indeterminate;
      stopValueAnimation();
      animatedValue = (component.state?.value as number) ?? animatedValue;
      if (!indeterminate) retargetAmplitude(animatedValue / max());
      startAnimation();
      if (!needsAnimation()) draw(0);
    };

    component.setThickness = (thickness: ProgressThickness): void => {
      currentThickness = thickness;
      measure();
      draw();
    };

    component.setShape = (shape: ProgressShape): void => {
      if (currentShape === shape) return;
      currentShape = shape;
      component.currentShape = shape;
      if (component.state) component.state.shape = shape;
      if (isCircular && config.size === undefined) currentSize = getCircularSize({ ...config, shape });
      // A wave that has just appeared starts from nothing
      if (shape === PROGRESS_SHAPES.WAVY) {
        amplitudeFrom = 0;
        amplitudeTarget = 0;
        amplitudeStarted = (view?.performance ?? performance).now();
        retargetAmplitude(animatedValue / max());
      }
      measure();
      startAnimation(animationTime);
      if (!needsAnimation()) draw(0);
    };

    component.setSize = (size: number): void => {
      if (!isCircular) return;
      currentSize = Math.max(
        PROGRESS_MEASUREMENTS.CIRCULAR.MIN_SIZE,
        Math.min(size, PROGRESS_MEASUREMENTS.CIRCULAR.MAX_SIZE)
      );
      measure();
      draw();
    };

    component.getSize = (): number | undefined => (isCircular ? currentSize : undefined);

    component.hide = (): BaseComponent => {
      component.element.classList.add(component.getClass(PROGRESS_CLASSES.TRANSITION));
      component.element.setAttribute("hidden", "");
      stopAnimation();
      stopValueAnimation();
      return component;
    };

    component.show = (): BaseComponent => {
      component.element.classList.add(component.getClass(PROGRESS_CLASSES.TRANSITION));
      component.element.removeAttribute("hidden");
      measure();
      startAnimation(animationTime);
      if (!needsAnimation()) draw(0);
      return component;
    };

    component.isVisible = (): boolean => !component.element.hasAttribute("hidden");

    const resize = (): void => {
      measure();
      draw();
    };

    // ---------------------------------------------------------------------
    // Wiring
    // ---------------------------------------------------------------------

    if (!initialize()) {
      requestAnimationFrame(() => {
        if (initialize()) {
          startAnimation();
          draw();
        }
      });
    }

    const resizeCleanup = observeCanvasResize(component.element, canvas, resize);

    if (isWavy() && !isIndeterminate()) {
      amplitudeStarted = (view?.performance ?? performance).now();
      retargetAmplitude(animatedValue / max());
    }

    // A first frame now, and the loop if it is called for
    draw();
    startAnimation();

    const originalDestroy = component.lifecycle?.destroy;
    component.lifecycle = {
      ...(component.lifecycle ?? {}),
      destroy: () => {
        resizeCleanup();
        colors.destroy();
        stopAnimation();
        stopValueAnimation();
        originalDestroy?.();
      },
    };

    return {
      ...component,
      canvas,
      ctx: context?.ctx,
      draw,
      resize,
    } as CanvasComponent;
  };
