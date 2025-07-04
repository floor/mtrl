// src/components/progress/features/canvas.ts

import { ProgressConfig, ProgressThickness, ProgressShape } from "../types";
import {
  PROGRESS_CLASSES,
  PROGRESS_VARIANTS,
  PROGRESS_MEASUREMENTS,
  PROGRESS_THICKNESS,
  PROGRESS_WAVE,
} from "../constants";
import { getThemeColor } from "../../../core/utils";
import { observeCanvasResize } from "../../../core/canvas/resize";
import { drawCircularProgress } from "./circular";
import { drawLinearProgress } from "./linear";

/**
 * Canvas dimensions and drawing context
 */
export interface CanvasContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
}

/**
 * Component with canvas capabilities
 */
interface CanvasComponent {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  getClass: (name: string) => string;
  draw: () => void;
  resize: () => void;
  [key: string]: unknown;
}

/**
 * Base component interface for withCanvas
 */
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
  // Animation properties that will be added
  animationId?: number | null;
  wavyAnimationId?: number | null;
  valueAnimationId?: number | null;
  animationTime?: number;
  setIndeterminate?: (indeterminate: boolean) => void;
  [key: string]: unknown;
}

/**
 * Gets the stroke width for a given thickness preset or custom value
 */
export const getStrokeWidth = (
  thickness: ProgressThickness = "thin"
): number => {
  if (typeof thickness === "number") {
    return thickness;
  }

  return thickness === "thick"
    ? PROGRESS_THICKNESS.THICK
    : PROGRESS_THICKNESS.THIN;
};

/**
 * Calculates wave amplitude based on stroke width
 * Uses thickness 4 as the baseline (where amplitude is perfect)
 */
export const getWaveAmplitude = (
  strokeWidth: number,
  baseAmplitude: number,
  maxAmplitude?: number
): number => {
  // Use thickness 4 as baseline (perfect amplitude)
  const baselineThickness = 4;

  // Formula with dampening factor for gentler scaling
  // The 0.3 factor makes the scaling very subtle
  const scaleFactor =
    1 +
    (0.3 * (baselineThickness - strokeWidth)) /
      (strokeWidth + baselineThickness);

  const amplitude = baseAmplitude * scaleFactor;
  return maxAmplitude ? Math.min(amplitude, maxAmplitude) : amplitude;
};

/**
 * Updates canvas dimensions based on current thickness
 */
const updateCanvasDimensions = (
  canvas: HTMLCanvasElement,
  context: CanvasContext,
  isCircular: boolean,
  config?: ProgressConfig
): void => {
  const pixelRatio = window.devicePixelRatio || 1;
  const strokeWidth = getStrokeWidth(config?.thickness);
  const { ctx } = context;

  if (isCircular) {
    const size = Math.max(
      24,
      Math.min(config?.size ?? PROGRESS_MEASUREMENTS.CIRCULAR.SIZE, 240)
    );

    // Calculate wave amplitude using the same logic as in drawCircularProgress
    let waveAmplitude = 0;
    if (config?.shape === "wavy") {
      const baseRadius = size / 2 - strokeWidth / 2;
      const amplitudePercent = config?.indeterminate
        ? PROGRESS_WAVE.CIRCULAR.INDETERMINATE_AMPLITUDE
        : PROGRESS_WAVE.CIRCULAR.AMPLITUDE;
      const baseAmplitude = baseRadius * (amplitudePercent / 100);
      waveAmplitude = getWaveAmplitude(strokeWidth, baseAmplitude);
    }

    const adjustedSize = size + waveAmplitude * 2;

    canvas.style.width = canvas.style.height = `${adjustedSize}px`;
    canvas.width = canvas.height = Math.round(adjustedSize * pixelRatio);
    context.width = context.height = adjustedSize;
  } else {
    const progressElement = canvas.parentElement;
    if (!progressElement) return;

    const width = Math.max(
      progressElement.getBoundingClientRect().width ||
        progressElement.offsetWidth,
      200
    );

    // Calculate extra height needed for waves based on actual amplitude
    let extraHeight = 0;
    if (config?.shape === "wavy") {
      const baseAmplitude = PROGRESS_WAVE.LINEAR.AMPLITUDE;
      const waveAmplitude = getWaveAmplitude(strokeWidth, baseAmplitude);
      extraHeight = Math.ceil(waveAmplitude * 2); // Space for wave peaks above and below
    }

    const height = strokeWidth + extraHeight;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    context.width = width;
    context.height = height;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(pixelRatio, pixelRatio);
};

/**
 * Sets up canvas with proper pixel ratio and dimensions
 */
const setupCanvas = (
  canvas: HTMLCanvasElement,
  isCircular: boolean,
  config?: ProgressConfig
): CanvasContext => {
  const context: CanvasContext = {
    canvas,
    ctx: canvas.getContext("2d")!,
    width: 0,
    height: 0,
    pixelRatio: window.devicePixelRatio || 1,
  };

  updateCanvasDimensions(canvas, context, isCircular, config);
  return context;
};

/**
 * Adds canvas functionality to replace complex DOM structure
 */
export const withCanvas =
  (config: ProgressConfig) =>
  (component: BaseComponent): CanvasComponent => {
    const variant = config.variant;
    const isCircular = variant === PROGRESS_VARIANTS.CIRCULAR;

    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.className = `${component.getClass(
      PROGRESS_CLASSES.CONTAINER
    )}-canvas`;
    canvas.style.maxWidth = "100%";
    canvas.style.maxHeight = "100%";
    canvas.style.boxSizing = "border-box";

    component.element.appendChild(canvas);

    // Setup canvas context
    let canvasContext: CanvasContext | null = null;
    let resizeCleanup: (() => void) | null = null;
    let themeChangeCleanup: (() => void) | null = null;

    // Current values - managed by API
    let currentThickness = config.thickness;
    let currentShape = config.shape;
    let currentSize = config.size ?? PROGRESS_MEASUREMENTS.CIRCULAR.SIZE;

    // Track animated value for smooth transitions
    let animatedValue = config.value ?? 0;
    let targetValue = animatedValue;
    let lastSetValueTime = 0;

    const initializeCanvas = (): boolean => {
      try {
        canvasContext = setupCanvas(canvas, isCircular, {
          ...config,
          thickness: currentThickness,
          shape: currentShape,
          size: currentSize,
        });
        component.ctx = canvasContext.ctx;
        return true;
      } catch (error) {
        console.warn("Canvas initialization failed:", error);
        return false;
      }
    };

    // Try to initialize immediately
    if (!initializeCanvas()) {
      requestAnimationFrame(() => {
        if (!initializeCanvas()) {
          setTimeout(initializeCanvas, 100);
        }
      });
    }

    // Store canvas references and animation state
    component.canvas = canvas;
    component.animationTime = 0;
    component.animationId = null;
    component.wavyAnimationId = null;
    component.valueAnimationId = null;
    component.currentShape = currentShape;

    // Animation loop for indeterminate progress
    const startIndeterminateAnimation = (timeOffset: number = 0): void => {
      if (!component.state?.indeterminate) return;

      if (component.animationId) {
        cancelAnimationFrame(component.animationId);
        component.animationId = null;
      }

      // Store the animation start time
      let animationStartTime = 0;

      const animate = (timestamp: number): void => {
        if (!component.state?.indeterminate) {
          stopIndeterminateAnimation();
          return;
        }

        if (animationStartTime === 0) {
          animationStartTime = timestamp - timeOffset;
        }

        const relativeTime = timestamp - animationStartTime;
        component.animationTime = relativeTime;
        draw(relativeTime);
        component.animationId = requestAnimationFrame(animate);
      };

      component.animationId = requestAnimationFrame(animate);
    };

    const stopIndeterminateAnimation = (): void => {
      if (component.animationId) {
        cancelAnimationFrame(component.animationId);
        component.animationId = null;
      }
    };

    // Animation loop for wavy progress
    const startWavyAnimation = (timeOffset: number = 0): void => {
      if (component.wavyAnimationId) {
        cancelAnimationFrame(component.wavyAnimationId);
        component.wavyAnimationId = null;
      }

      // Store the animation start time
      let animationStartTime = 0;

      const animate = (timestamp: number): void => {
        if (animationStartTime === 0) {
          animationStartTime = timestamp - timeOffset;
        }

        const relativeTime = timestamp - animationStartTime;
        component.animationTime = relativeTime;
        draw(relativeTime);
        component.wavyAnimationId = requestAnimationFrame(animate);
      };

      component.wavyAnimationId = requestAnimationFrame(animate);
    };

    const stopWavyAnimation = (): void => {
      if (component.wavyAnimationId) {
        cancelAnimationFrame(component.wavyAnimationId);
        component.wavyAnimationId = null;
      }
    };

    // Drawing function with animation support
    const draw = (animationTime: number = 0): void => {
      if (!canvasContext) return;

      const state = component.state;
      const value = state?.value ?? config.value ?? 0;
      const max = state?.max ?? config.max ?? 100;
      const buffer = state?.buffer ?? config.buffer ?? 0;
      const isIndeterminate =
        state?.indeterminate ?? config.indeterminate ?? false;

      const currentConfig = {
        ...config,
        thickness: currentThickness,
        shape: currentShape,
        size: currentSize,
      };

      updateCanvasDimensions(canvas, canvasContext, isCircular, currentConfig);

      const drawValue = isIndeterminate || !state ? value : animatedValue;

      if (isCircular) {
        drawCircularProgress(
          canvasContext,
          currentConfig,
          drawValue,
          max,
          isIndeterminate,
          animationTime,
          currentShape
        );
      } else {
        drawLinearProgress(
          canvasContext,
          currentConfig,
          drawValue,
          max,
          buffer,
          isIndeterminate,
          animationTime,
          true,
          currentShape
        );
      }
    };

    // Resize function
    const resize = (): void => {
      if (!canvasContext) return;

      try {
        const newContext = setupCanvas(canvas, isCircular, {
          ...config,
          thickness: currentThickness,
          shape: currentShape,
          size: currentSize,
        });
        component.ctx = newContext.ctx;
        Object.assign(canvasContext, newContext);
        draw();
      } catch (error) {
        console.warn("Canvas resize failed:", error);
      }
    };

    // Setup observers
    resizeCleanup = observeCanvasResize(component.element, canvas, () => {
      if (component.element.offsetWidth > 0 || isCircular) {
        resize();
      }
    });

    const cleanup = getThemeColor("sys-color-primary", { onThemeChange: draw });
    themeChangeCleanup = typeof cleanup === "function" ? cleanup : null;

    // Initial draw and setup animation if needed
    const initialDraw = (): void => {
      if (!canvasContext) {
        requestAnimationFrame(initialDraw);
        return;
      }

      draw();

      // Start appropriate animation
      if (component.state?.indeterminate) {
        if (currentShape === "wavy" || !isCircular) {
          startWavyAnimation();
        } else {
          startIndeterminateAnimation();
        }
      } else if (currentShape === "wavy") {
        startWavyAnimation();
      }
    };

    requestAnimationFrame(initialDraw);

    // Helper to update config and redraw
    const updateConfigAndDraw = (updates: Partial<ProgressConfig>) => {
      if (!canvasContext) return;

      const currentConfig = {
        ...config,
        thickness: currentThickness,
        shape: currentShape,
        size: currentSize,
        ...updates,
      };

      updateCanvasDimensions(canvas, canvasContext, isCircular, currentConfig);
      draw();
    };

    // Add setThickness method to component
    component.setThickness = (thickness: ProgressThickness) => {
      currentThickness = thickness;
      updateConfigAndDraw({ thickness });
    };

    // Add setSize and getSize API to returned component
    component.setSize = (size: number) => {
      if (!isCircular) return;
      currentSize = Math.max(24, Math.min(size, 240));
      updateConfigAndDraw({ size: currentSize });
    };

    component.getSize = () => (isCircular ? currentSize : undefined);

    // Update currentShape in setShape
    component.setShape = (shape: ProgressShape) => {
      // Don't do anything if shape hasn't changed
      if (currentShape === shape) return;

      currentShape = shape;
      component.currentShape = currentShape;

      updateConfigAndDraw({ shape });

      // For indeterminate mode, we need to switch animation types
      // but preserve the current animation time
      if (component.state?.indeterminate) {
        const currentAnimationTime = component.animationTime || 0;

        // Stop current animations
        stopWavyAnimation();
        stopIndeterminateAnimation();

        // Start the appropriate animation with time offset
        if (shape === "wavy" || !isCircular) {
          startWavyAnimation(currentAnimationTime);
        } else {
          startIndeterminateAnimation(currentAnimationTime);
        }
      } else if (shape === "wavy") {
        // For determinate wavy, start wavy animation if not already running
        if (!component.wavyAnimationId) {
          startWavyAnimation();
        }
      } else {
        // For determinate non-wavy, stop wavy animation
        stopWavyAnimation();
      }

      // Force a redraw
      draw(component.animationTime || 0);
    };

    // Update setValue method to handle rapid updates better
    component.setValue = (value: number, animate: boolean = true) => {
      targetValue = Math.max(0, Math.min(component.state.max, value));

      if (component.state.indeterminate) {
        component.setIndeterminate(false);
      }

      // If animation is already running and we want to animate, just update the target
      if (component.valueAnimationId && animate) {
        // Update target, existing animation will handle it
        return;
      }

      if (component.valueAnimationId) {
        cancelAnimationFrame(component.valueAnimationId);
        component.valueAnimationId = null;
      }

      if (!animate) {
        animatedValue = targetValue;
        draw();
        // Don't restart wavy animation if it's already running
        if (
          currentShape === "wavy" &&
          !component.state.indeterminate &&
          !component.wavyAnimationId
        ) {
          startWavyAnimation();
        }
        // Emit complete event if reached max
        if (targetValue >= component.state.max) {
          component.element.dispatchEvent(
            new CustomEvent("complete", {
              detail: { value: targetValue, max: component.state.max },
            })
          );
        }
        return;
      }

      const startValue = animatedValue;
      const startTime = performance.now();

      // Calculate adaptive duration based on update frequency
      const timeSinceLastCall = startTime - lastSetValueTime;
      let duration = 300; // Default duration

      if (timeSinceLastCall < 300 && lastSetValueTime > 0) {
        // If updates are coming faster than our animation, speed it up
        duration = Math.max(100, timeSinceLastCall * 0.9); // 90% of update interval, min 100ms
      }

      lastSetValueTime = startTime;

      const animateValue = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        animatedValue = startValue + (targetValue - startValue) * easedProgress;

        // Always use the current animation time if wavy is running
        if (!component.wavyAnimationId || currentShape !== "wavy") {
          draw(currentTime);
        }

        if (progress < 1) {
          component.valueAnimationId = requestAnimationFrame(animateValue);
        } else {
          animatedValue = targetValue;
          component.valueAnimationId = null;

          // Start wavy animation if needed and not already running
          if (
            currentShape === "wavy" &&
            !component.state.indeterminate &&
            !component.wavyAnimationId
          ) {
            startWavyAnimation();
          }

          // Emit complete event if reached max
          if (targetValue >= component.state.max) {
            component.element.dispatchEvent(
              new CustomEvent("complete", {
                detail: { value: targetValue, max: component.state.max },
              })
            );
          }
        }
      };

      component.valueAnimationId = requestAnimationFrame(animateValue);
    };

    // Add setIndeterminate method to component
    component.setIndeterminate = (indeterminate: boolean) => {
      if (!component.state) {
        console.warn("[Progress] No state available for setIndeterminate");
        return;
      }

      component.state.indeterminate = indeterminate;

      if (indeterminate) {
        // Stop value animation
        if (component.valueAnimationId) {
          cancelAnimationFrame(component.valueAnimationId);
          component.valueAnimationId = null;
        }

        animatedValue = component.state.value;

        // Start appropriate animation
        if (currentShape === "wavy" || !isCircular) {
          startWavyAnimation();
        } else {
          startIndeterminateAnimation();
        }
      } else {
        // Stopping indeterminate mode
        animatedValue = component.state.value;

        // Stop indeterminate animation
        stopIndeterminateAnimation();

        // For wavy shape, keep or start wavy animation
        if (currentShape === "wavy") {
          if (!component.wavyAnimationId) {
            startWavyAnimation();
          }
        } else {
          stopWavyAnimation();
        }

        draw();
      }
    };

    // Add hide method to component
    component.hide = () => {
      component.element.classList.add(
        component.getClass(PROGRESS_CLASSES.TRANSITION)
      );
      component.element.style.opacity = "0";

      const onTransitionEnd = () => {
        component.element.style.display = "none";
        component.element.removeEventListener("transitionend", onTransitionEnd);
      };
      component.element.addEventListener("transitionend", onTransitionEnd);

      // Stop all animations
      [
        component.animationId,
        component.wavyAnimationId,
        component.valueAnimationId,
      ].forEach((id) => {
        if (id) cancelAnimationFrame(id as number);
      });
      component.animationId =
        component.wavyAnimationId =
        component.valueAnimationId =
          null;

      return component;
    };

    // Add show method to component
    component.show = () => {
      component.element.classList.add(
        component.getClass(PROGRESS_CLASSES.TRANSITION)
      );
      component.element.style.display = "";
      component.element.style.opacity = "0";
      component.element.offsetHeight; // Force reflow
      component.element.style.opacity = "1";

      // Restart animations
      if (component.state?.indeterminate) {
        if (currentShape === "wavy" || !isCircular) {
          startWavyAnimation();
        } else {
          startIndeterminateAnimation();
        }
      } else if (currentShape === "wavy") {
        startWavyAnimation();
      }

      return component;
    };

    // Add isVisible method to component
    component.isVisible = () =>
      component.element.style.display !== "none" &&
      component.element.style.opacity !== "0";

    // Cleanup on destroy
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy || (() => {});
      component.lifecycle.destroy = () => {
        if (resizeCleanup) resizeCleanup();
        if (themeChangeCleanup) themeChangeCleanup();

        // Stop all animations
        [
          component.animationId,
          component.wavyAnimationId,
          component.valueAnimationId,
        ].forEach((id) => {
          if (id) cancelAnimationFrame(id as number);
        });

        originalDestroy();
      };
    }

    // Expose animation methods
    Object.assign(component, {
      startWavyAnimation,
      stopWavyAnimation,
      startIndeterminateAnimation,
      stopIndeterminateAnimation,
    });

    return {
      ...component,
      canvas,
      get ctx() {
        return canvasContext?.ctx;
      },
      draw,
      resize,
    };
  };
