import { onThemeChange } from '../utils/theme';

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
 * @param signal - Optional signal to cancel pending initialization attempts
 * @returns Whether initialization was immediately successful
 */
export const initializeCanvasWithRetry = (
  initFn: () => boolean,
  onSuccess?: () => void,
  signal?: AbortSignal
): boolean => {
  let frame: number | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cleanup = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    if (timer !== null) clearTimeout(timer);
    signal?.removeEventListener('abort', cleanup);
  };
  if (signal?.aborted) return false;
  signal?.addEventListener('abort', cleanup, { once: true });
  const attempt = () => {
    if (signal?.aborted) return false;
    if (!initFn()) return false;
    cleanup();
    onSuccess?.();
    return true;
  };
  if (attempt()) return true;
  frame = requestAnimationFrame(() => {
    frame = null;
    if (attempt() || signal?.aborted) return;
    timer = setTimeout(() => {
      timer = null;
      attempt();
      cleanup();
    }, 100);
  });
  return false;
};

/**
 * Creates a theme observer that triggers a callback on theme changes
 * 
 * @param _color - Colour name retained for compatibility; notifications cover all colours
 * @param callback - Function to call when theme changes
 * @returns Function that unsubscribes from theme changes
 */
export const createCanvasThemeObserver = (
  _color: string,
  callback: () => void
): (() => void) => {
  // Theme notifications apply to every colour. Keep the colour argument for
  // compatibility; colour lookup belongs to the drawing callback.
  return onThemeChange(callback);
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