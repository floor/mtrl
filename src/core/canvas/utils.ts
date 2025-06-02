import { getThemeColor } from '../utils';

/**
 * Common canvas context interface used by components
 */
export interface CanvasContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
}

/**
 * Creates and initializes a canvas context with proper pixel ratio handling
 * 
 * @param canvas - The canvas element
 * @param width - Canvas width
 * @param height - Canvas height
 * @returns Initialized canvas context
 */
export const createCanvasContext = (
  canvas: HTMLCanvasElement, 
  width: number, 
  height: number
): CanvasContext => {
  const pixelRatio = window.devicePixelRatio || 1;
  const ctx = canvas.getContext('2d')!;
  
  // Set display size
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Set actual size with pixel ratio
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  
  // Scale context to match pixel ratio
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(pixelRatio, pixelRatio);
  
  return {
    canvas,
    ctx,
    width,
    height,
    pixelRatio
  };
};

/**
 * Updates canvas dimensions while preserving pixel ratio
 * 
 * @param context - The canvas context to update
 * @param width - New width
 * @param height - New height
 */
export const updateCanvasDimensions = (
  context: CanvasContext,
  width: number,
  height: number
): void => {
  const { canvas, ctx, pixelRatio } = context;
  
  // Update display size
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Update actual size with pixel ratio
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  
  // Update context dimensions
  context.width = width;
  context.height = height;
  
  // Reapply scale transform
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(pixelRatio, pixelRatio);
};

/**
 * Tries to initialize a canvas with retry mechanism
 * 
 * @param initFn - Function that performs initialization
 * @param onSuccess - Optional callback on successful initialization
 * @returns Whether initialization was immediately successful
 */
export const initializeCanvasWithRetry = (
  initFn: () => boolean,
  onSuccess?: () => void
): boolean => {
  // Try to initialize immediately
  if (initFn()) {
    onSuccess?.();
    return true;
  }
  
  // Retry with requestAnimationFrame
  requestAnimationFrame(() => {
    if (initFn()) {
      onSuccess?.();
    } else {
      // Final retry with setTimeout
      setTimeout(() => {
        if (initFn()) {
          onSuccess?.();
        }
      }, 100);
    }
  });
  
  return false;
};

/**
 * Creates a theme observer that triggers a callback on theme changes
 * 
 * @param color - The theme color to observe (e.g., 'primary', 'secondary')
 * @param callback - Function to call when theme changes
 * @returns Cleanup function or null
 */
export const createCanvasThemeObserver = (
  color: string,
  callback: () => void
): (() => void) | null => {
  const cleanup = getThemeColor(`sys-color-${color}`, { 
    onThemeChange: callback 
  });
  return typeof cleanup === 'function' ? cleanup : null;
};

/**
 * Standard animation frame manager for components
 */
export class AnimationFrameManager {
  private animationId: number | null = null;
  
  /**
   * Starts an animation loop
   * @param callback - Animation callback receiving timestamp
   */
  start(callback: (timestamp: number) => void): void {
    this.stop();
    
    const animate = (timestamp: number) => {
      callback(timestamp);
      this.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  /**
   * Stops the animation loop
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  /**
   * Whether animation is currently running
   */
  get isRunning(): boolean {
    return this.animationId !== null;
  }
}

/**
 * Manages multiple cleanup functions for components
 */
export class CleanupManager {
  private cleanupFunctions: Array<() => void> = [];
  
  /**
   * Adds a cleanup function
   */
  add(cleanup: (() => void) | null | undefined): void {
    if (cleanup) {
      this.cleanupFunctions.push(cleanup);
    }
  }
  
  /**
   * Runs all cleanup functions and clears the list
   */
  cleanup(): void {
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
  }
}

/**
 * Creates a standard canvas element with common styles
 * 
 * @param className - CSS class name for the canvas
 * @param additionalStyles - Additional styles to apply
 * @returns Canvas element
 */
export const createStyledCanvas = (
  className: string,
  additionalStyles: Partial<CSSStyleDeclaration> = {}
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.className = className;
  
  Object.assign(canvas.style, {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    ...additionalStyles
  });
  
  return canvas;
}; 