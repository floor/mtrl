// src/components/loading-indicator/features/renderer.ts
//
// The canvas and the shape maths: each Material shape as a radial profile,
// interpolated and drawn as a filled outline. Scale follows Compose's
// calculateScaleFactor: the spikiest shape's farthest point reaches the
// 38/48 active indicator circle, so every shape fits while it rotates.

import { createCanvasContext, updateCanvasDimensions, CanvasContext } from '../../../core/canvas/utils';
import { onThemeChange } from '../../../core/utils/theme';
import { materialShape, radialProfile, RadialProfile, MaterialShapeName } from '../../../core/shapes';
import { BaseComponent, LoadingIndicatorConfig } from '../types';
import { LOADING_INDICATOR_CLASSES, LOADING_INDICATOR_DEFAULTS } from '../constants';

/** A frame: which morph, how far along it, and the rotation in degrees */
export interface Frame {
  /** Index of the shape the morph starts from */
  index: number;
  /** 0 at the shape, 1 at the next; may overshoot */
  progress: number;
  /** Clockwise rotation in degrees */
  rotation: number;
}

export interface Renderer {
  /** Draws one frame with the given shape sequence */
  draw: (shapes: readonly RadialProfile[], frame: Frame) => void;
  /** Resizes the canvas to the element's size */
  resize: (size: number) => void;
  /** Re-reads the indicator colour from the element's computed style */
  refreshColor: () => void;
  /** The last frame drawn, redrawn on resize and theme change */
  redraw: () => void;
  /** Profiles for a shape sequence, cached per name */
  profiles: (names: readonly MaterialShapeName[]) => RadialProfile[];
}

const profileCache = new Map<MaterialShapeName, RadialProfile>();

const profileFor = (name: MaterialShapeName): RadialProfile => {
  let profile = profileCache.get(name);
  if (!profile) {
    profile = radialProfile(materialShape(name), LOADING_INDICATOR_DEFAULTS.SAMPLES);
    profileCache.set(name, profile);
  }
  return profile;
};

const TWO_PI = Math.PI * 2;

/**
 * Adds the canvas and the drawing routine
 * @param {LoadingIndicatorConfig} config - Component configuration
 * @returns {Function} Higher-order function that adds the renderer
 */
export const withRenderer = (config: LoadingIndicatorConfig) =>
  (component: BaseComponent): BaseComponent => {
    const prefix = config.prefix || 'mtrl';
    const canvas = document.createElement('canvas');
    canvas.className = `${prefix}-${LOADING_INDICATOR_CLASSES.CANVAS}`;
    canvas.setAttribute('aria-hidden', 'true');
    component.element.appendChild(canvas);

    let context: CanvasContext | null = null;
    let color = '';
    let last: { shapes: readonly RadialProfile[]; frame: Frame } | null = null;

    const ensureContext = (size: number): CanvasContext | null => {
      if (typeof canvas.getContext !== 'function') return null;
      if (!context) {
        if (!canvas.getContext('2d')) return null;
        context = createCanvasContext(canvas, size, size);
      } else if (context.width !== size) {
        updateCanvasDimensions(context, size, size);
      }
      return context;
    };

    // Empty while the element is not in a document: a detached element has
    // no computed style, and the frame is drawn again once it is attached
    const refreshColor = (): void => {
      const view = component.element.ownerDocument.defaultView;
      color = view && component.element.isConnected ? view.getComputedStyle(component.element).color : '';
    };

    const draw = (shapes: readonly RadialProfile[], frame: Frame): void => {
      last = { shapes, frame };
      const size = context?.width ?? 0;
      const ctx = context?.ctx;
      if (!ctx || size <= 0 || shapes.length === 0) return;

      const from = shapes[frame.index % shapes.length]!;
      const to = shapes[(frame.index + 1) % shapes.length]!;
      const samples = from.radii.length;
      let maxRadius = 0;
      for (const shape of shapes) maxRadius = Math.max(maxRadius, shape.maxRadius);
      const scale = (size * (LOADING_INDICATOR_DEFAULTS.INDICATOR_SIZE / LOADING_INDICATOR_DEFAULTS.SIZE)) / 2 / maxRadius;
      const center = size / 2;
      const rotation = (frame.rotation * Math.PI) / 180;
      const t = frame.progress;

      ctx.clearRect(0, 0, size, size);
      if (!color) refreshColor();
      ctx.fillStyle = color || '#000';
      ctx.beginPath();
      for (let i = 0; i < samples; i++) {
        const r = (from.radii[i]! + (to.radii[i]! - from.radii[i]!) * t) * scale;
        const a = (i / samples) * TWO_PI + rotation;
        const x = center + Math.cos(a) * r;
        const y = center + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    };

    const redraw = (): void => {
      if (last) draw(last.shapes, last.frame);
    };

    const resize = (size: number): void => {
      ensureContext(size);
      refreshColor();
      redraw();
    };

    // Colours change with the theme; the canvas cannot follow a custom
    // property on its own
    const offThemeChange = onThemeChange(() => {
      refreshColor();
      redraw();
    });

    // The element gets its colour when it enters a document, and may be
    // resized by the page: both redraw the last frame
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          refreshColor();
          redraw();
        })
      : null;
    observer?.observe(component.element);

    const originalDestroy = component.lifecycle?.destroy;
    if (component.lifecycle) {
      component.lifecycle.destroy = () => {
        observer?.disconnect();
        offThemeChange();
        originalDestroy?.call(component.lifecycle);
      };
    }

    const renderer: Renderer = {
      draw,
      resize,
      refreshColor,
      redraw,
      profiles: (names) => names.map(profileFor),
    };

    return {
      ...component,
      canvas,
      renderer,
    };
  };
