// src/components/progress/features/canvas.ts

import { ProgressConfig, ProgressVariant, ProgressThickness, ProgressShape } from '../types';
import { 
  PROGRESS_CLASSES, 
  PROGRESS_VARIANTS,
  PROGRESS_MEASUREMENTS,
  PROGRESS_THICKNESS
} from '../constants';
import { getThemeColor } from '../../../core/utils';
import { PREFIX } from '../../../core/config';
import { observeCanvasResize } from '../../../core/canvas';
import { drawCircularProgress } from './circular';
import { drawLinearProgress } from './linear';

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
  [key: string]: any;
}

/**
 * Gets the stroke width value from the thickness config
 */
export const getStrokeWidth = (thickness?: string | number): number => {
  // Handle numeric values first
  if (typeof thickness === 'number') {
    return Math.max(thickness, PROGRESS_MEASUREMENTS.LINEAR.MIN_HEIGHT);
  }
  
  // Handle string values (named presets)
  if (typeof thickness === 'string') {
    switch (thickness) {
      case 'thin':
        return PROGRESS_THICKNESS.THIN;
      case 'thick':
        return PROGRESS_THICKNESS.THICK;
      default:
        // If it's a string that can be parsed as a number, use that
        const numValue = parseFloat(thickness);
        return !isNaN(numValue) 
          ? Math.max(numValue, PROGRESS_MEASUREMENTS.LINEAR.MIN_HEIGHT)
          : PROGRESS_THICKNESS.THIN;
    }
  }
  
  // Default to thin if undefined or invalid
  return PROGRESS_THICKNESS.THIN;
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

  if (isCircular) {
    // Clamp size between 24 and 240
    const rawSize = config?.size ?? PROGRESS_MEASUREMENTS.CIRCULAR.SIZE;
    const size = Math.max(24, Math.min(rawSize, 240));
    // Set display size first
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    // Set actual canvas dimensions accounting for pixel ratio
    const canvasSize = Math.round(size * pixelRatio);
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    // Update context dimensions
    context.width = size;
    context.height = size;
    // Reset transform and scale context to match pixel ratio
    const ctx = context.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.scale(pixelRatio, pixelRatio);
  } else {
    // For linear progress, update height based on thickness
    const progressElement = canvas.parentElement;
    if (!progressElement) return;
    
    const progressWidth = progressElement.getBoundingClientRect().width || progressElement.offsetWidth;
    const width = Math.max(progressWidth, 200); // Ensure minimum width
    
    // Calculate height based on thickness and shape
    let height = strokeWidth;
    if (config?.shape === 'wavy') {
      // Add extra height for wavy shape to accommodate the wave
      height = Math.max(height + 6, 10);
    }
    
    // Update canvas dimensions and style
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Set actual canvas dimensions accounting for pixel ratio
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.borderRadius = height / 2 + 'px'
    
    // Update context dimensions
    context.width = width;
    context.height = height;
    
    // Reset transform and scale context to match pixel ratio
    const ctx = context.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.scale(pixelRatio, pixelRatio);
  }
};

/**
 * Sets up canvas with proper pixel ratio and dimensions
 */
const setupCanvas = (canvas: HTMLCanvasElement, isCircular: boolean, config?: ProgressConfig): CanvasContext => {
  const pixelRatio = window.devicePixelRatio || 1;
  const ctx = canvas.getContext('2d')!;
  
  // Initial context setup
  const context: CanvasContext = {
    canvas,
    ctx,
    width: 0,
    height: 0,
    pixelRatio
  };
  
  // Set initial dimensions with proper thickness and size
  updateCanvasDimensions(canvas, context, isCircular, {
    ...config,
    thickness: config?.thickness, // Ensure thickness is passed through
    size: config?.size // Pass size through
  });
  
  return context;
};

/**
 * Adds canvas functionality to replace complex DOM structure
 */
export const withCanvas = (config: ProgressConfig) => 
  (component: any): CanvasComponent => {
    // Store variant at initialization to ensure it doesn't change
    const variant = config.variant;
    const isCircular = variant === PROGRESS_VARIANTS.CIRCULAR;
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.className = `${component.getClass(PROGRESS_CLASSES.CONTAINER)}-canvas`;
    
    // IMPORTANT: Constrain canvas to its immediate parent only
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
    canvas.style.boxSizing = 'border-box';
    
    // Add canvas to component element
    component.element.appendChild(canvas);
    
    // Setup canvas context
    let canvasContext: CanvasContext | null = null;
    let resizeCleanup: (() => void) | null = null;
    let themeChangeCleanup: (() => void) | null = null;
    
    // Current thickness value - managed by API
    let currentThickness = config.thickness;
    // Current shape value - managed by API
    let currentShape = config.shape;
    
    // In withCanvas, manage currentSize for circular progress
    let currentSize = config.size ?? PROGRESS_MEASUREMENTS.CIRCULAR.SIZE;
    
    // Track animated value for smooth transitions
    let animatedValue = config.value ?? 0;
    let targetValue = animatedValue;
    let animationDuration = 30; // 300ms for value transitions
    
    // Animation state
    let isAnimating = false;
    let lastAnimationTime = 0;
    
    const initializeCanvas = (): boolean => {
      try {
        // Initialize with the current thickness
        canvasContext = setupCanvas(canvas, isCircular, {
          ...config,
          thickness: currentThickness,
          size: currentSize
        });
        component.ctx = canvasContext.ctx;
        
        // Force initial dimensions update
        updateCanvasDimensions(canvas, canvasContext, isCircular, {
          ...config,
          thickness: currentThickness,
          size: currentSize
        });
        
        return true;
      } catch (error) {
        console.warn('Canvas initialization failed:', error);
        return false;
      }
    };
    
    // Try to initialize immediately
    if (!initializeCanvas()) {
      // If immediate initialization fails, wait for next frame
      requestAnimationFrame(() => {
        if (!initializeCanvas()) {
          // Last resort: wait a bit longer
          setTimeout(initializeCanvas, 100);
        }
      });
    }
    
    // Store canvas references and animation state
    component.canvas = canvas;
    component.animationTime = 0;
    component.animationId = null;
    component.wavyAnimationId = null; // Separate ID for wavy animation
    component.valueAnimationId = null; // Separate ID for value animation
    
    // Make currentShape accessible to drawLinearProgress
    component.currentShape = currentShape;
    
    // Animation loop for indeterminate progress
    const startIndeterminateAnimation = (): void => {
      if (!component.state || component.state.indeterminate !== true) {
        return;
      }

      // Stop any existing animation first
      if (component.animationId) {
        cancelAnimationFrame(component.animationId);
        component.animationId = null;
      }
      
      // Reset animation state
      isAnimating = false;
      lastAnimationTime = 0;
      
      const animate = (timestamp: number): void => {
        if (!component.state || component.state.indeterminate !== true) {
          stopIndeterminateAnimation();
          return;
        }

        if (lastAnimationTime === 0) {
          lastAnimationTime = timestamp;
        }
        
        component.animationTime = timestamp;
        draw(timestamp);
        component.animationId = requestAnimationFrame(animate);
      };

      component.animationId = requestAnimationFrame(animate);
      isAnimating = true;
    };
    
    const stopIndeterminateAnimation = (): void => {
      if (component.animationId) {
        cancelAnimationFrame(component.animationId);
        component.animationId = null;
      }
      isAnimating = false;
      lastAnimationTime = 0;
    };

    // Drawing function with animation support
    const draw = (animationTime: number = 0): void => {
      // Ensure canvas is initialized
      if (!canvasContext) {
        return;
      }
      
      // Get values from component state
      const state = component.state;
      if (!state) {
        // Use config values as fallback
        const value = config.value ?? 0;
        const max = config.max ?? 100;
        const buffer = config.buffer ?? 0;
        const isIndeterminate = config.indeterminate ?? false;
        
        // Draw with config values
        const currentConfig = {
          ...config,
          thickness: currentThickness,
          shape: currentShape,
          size: currentSize
        };
        
        updateCanvasDimensions(canvas, canvasContext, isCircular, currentConfig);
        
        if (isCircular) {
          drawCircularProgress(canvasContext, currentConfig, value, max, isIndeterminate, animationTime);
        } else {
          drawLinearProgress(
            canvasContext, 
            currentConfig, 
            value, 
            max, 
            buffer, 
            isIndeterminate, 
            animationTime,
            true,
            currentShape
          );
        }
        return;
      }
      
      // Use state values directly
      const max = state.max;
      const buffer = state.buffer;
      const isIndeterminate = state.indeterminate;
      
      // Use animated value for smooth transitions in determinate mode
      const value = isIndeterminate ? state.value : animatedValue;
      
      // Create a new config object with the current thickness and shape
      const currentConfig = {
        ...config,
        thickness: currentThickness,
        shape: currentShape,
        size: currentSize
      };
      
      // Always update dimensions to ensure correct thickness and shape
      updateCanvasDimensions(canvas, canvasContext, isCircular, currentConfig);
      
      if (isCircular) {
        drawCircularProgress(canvasContext, currentConfig, value, max, isIndeterminate, animationTime);
      } else {
        drawLinearProgress(
          canvasContext, 
          currentConfig, 
          value, 
          max, 
          buffer, 
          isIndeterminate, 
          animationTime,
          true,
          currentShape
        );
      }
    };
    
    // Animation loop for wavy progress (works for both determinate and indeterminate)
    const startWavyAnimation = (): void => {
      if (isCircular) return;
      
      // Stop any existing wavy animation
      if (component.wavyAnimationId) {
        cancelAnimationFrame(component.wavyAnimationId);
        component.wavyAnimationId = null;
      }
      
      const animate = (timestamp: number): void => {
        component.animationTime = timestamp;
        draw(timestamp);
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
    
    // Resize function
    const resize = (): void => {
      if (!canvasContext) return;
      
      try {
        const currentConfig = {
          ...config,
          thickness: currentThickness,
          size: currentSize
        };
        
        const newContext = setupCanvas(canvas, isCircular, currentConfig);
        component.ctx = newContext.ctx;
        Object.assign(canvasContext, newContext);
        draw();
      } catch (error) {
        console.warn('Canvas resize failed:', error);
      }
    };
    
    // Handle window resize with ResizeObserver
    const handleResize = (): void => {
      // Only resize if canvas is actually visible and has dimensions
      if (component.element.offsetWidth > 0 || isCircular) {
        resize();
      }
    };
    
    // Setup resize observer to watch the PROGRESS COMPONENT, not its parents
    resizeCleanup = observeCanvasResize(component.element, canvas, handleResize);
    
    // Setup theme change observer
    const handleThemeChange = (): void => {
      // Redraw with new theme colors
      draw();
    };
    
    // Register for theme changes and store cleanup function
    const cleanup = getThemeColor('sys-color-primary', {
      onThemeChange: handleThemeChange
    });
    
    // Store cleanup function if it's a function
    themeChangeCleanup = typeof cleanup === 'function' ? cleanup : (() => {});
    
    // Initial draw and setup animation if needed
    const initialDraw = (): void => {
      if (!canvasContext) {
        requestAnimationFrame(initialDraw);
        return;
      }
      
      draw();
      
      // Start appropriate animation based on state
      if (component.state?.indeterminate) {
        if (isCircular) {
          startIndeterminateAnimation();
        } else {
          startWavyAnimation();
        }
      } else if (!isCircular && currentShape === 'wavy') {
        // Only start wavy animation for linear progress with wavy shape
        startWavyAnimation();
      }
    };
    
    requestAnimationFrame(initialDraw);
    
    // Add setThickness method to component
    component.setThickness = (thickness: ProgressThickness) => {
      // Update current thickness
      currentThickness = thickness;
      
      // Update canvas dimensions and redraw
      if (canvasContext) {
        const currentConfig = {
          ...config,
          thickness
        };
        
        // Update dimensions with new thickness
        updateCanvasDimensions(canvas, canvasContext, isCircular, currentConfig);
        
        // Force redraw with new thickness
        draw();
      }
    };
    
    // Add setSize and getSize API to returned component
    component.setSize = (size: number) => {
      if (!isCircular) return;
      // Clamp size
      currentSize = Math.max(24, Math.min(size, 240));
      if (canvasContext) {
        const currentConfig = {
          ...config,
          thickness: currentThickness,
          size: currentSize
        };
        updateCanvasDimensions(canvas, canvasContext, isCircular, currentConfig);
        draw();
      }
    };
    component.getSize = () => isCircular ? currentSize : undefined;
    
    // Update currentShape in setShape
    component.setShape = (shape: ProgressShape) => {
      if (isCircular) return; // Shape only applies to linear variant
      
      // Update current shape
      currentShape = shape;
      
      // Update canvas dimensions and redraw
      if (canvasContext) {
        const currentConfig = {
          ...config,
          shape: currentShape,
          thickness: currentThickness,
          size: currentSize
        };
        
        // Update dimensions with new shape
        updateCanvasDimensions(canvas, canvasContext, isCircular, currentConfig);
        
        // Always start wavy animation - it will handle both shapes
        startWavyAnimation();
        
        // Force redraw with new shape
        draw();
      }
    };
    
    // Update setValue method to handle rapid updates better
    component.setValue = (value: number) => {
      // Store the target value
      targetValue = Math.max(0, Math.min(component.state.max, value));
      
      // If we're in indeterminate mode, exit it first
      if (component.state.indeterminate) {
        component.setIndeterminate(false);
      }

      // Cancel any existing VALUE animation (not wavy animation)
      if (component.valueAnimationId) {
        cancelAnimationFrame(component.valueAnimationId);
        component.valueAnimationId = null;
      }

      // Store the start value and time
      const startValue = animatedValue;
      const startTime = performance.now();
      const duration = 300; // Fixed duration for consistent behavior

      // Animation function with proper easing
      const animateValue = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use cubic-bezier easing for smooth acceleration and deceleration
        const easedProgress = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Update animated value
        animatedValue = startValue + (targetValue - startValue) * easedProgress;

        // Draw with current animated value
        draw(currentTime);

        // Continue animation if not complete
        if (progress < 1) {
          component.valueAnimationId = requestAnimationFrame(animateValue);
        } else {
          // Animation complete
          animatedValue = targetValue;
          component.valueAnimationId = null;
          draw(currentTime);
          
          // Restart wavy animation if shape is wavy and not indeterminate
          if (!isCircular && currentShape === 'wavy' && !component.state.indeterminate) {
            startWavyAnimation();
          }
        }
      };

      // Start animation
      component.valueAnimationId = requestAnimationFrame(animateValue);
    };

    // Add setIndeterminate method to component
    component.setIndeterminate = (indeterminate: boolean) => {
      if (!component.state) {
        console.warn('[Circular] No state available for setIndeterminate');
        return;
      }

      // Update the state first
      component.state.indeterminate = indeterminate;
      
      // Handle animation state changes
      if (indeterminate) {
        // Starting indeterminate mode
        if (isCircular) {
          // For circular, always start indeterminate animation
          stopWavyAnimation(); // Ensure wavy animation is stopped
          // Reset animation state
          isAnimating = false;
          lastAnimationTime = 0;
          if (component.animationId) {
            cancelAnimationFrame(component.animationId);
            component.animationId = null;
          }
          // Reset value animation state
          component.isAnimatingValue = false;
          animatedValue = component.state.value;
          // Start the animation immediately
          startIndeterminateAnimation();
        } else if (!component.isAnimatingValue) {
          // For linear, start wavy animation if not animating value
          startWavyAnimation();
        }
      } else {
        // Stopping indeterminate mode
        if (isCircular) {
          // For circular, stop indeterminate animation
          stopIndeterminateAnimation();
          // Reset value animation state
          component.isAnimatingValue = false;
          animatedValue = component.state.value;
          // Force redraw with current value
          draw();
        } else {
          // For linear, stop wavy animation
          stopWavyAnimation();
          // Force redraw with current value
          draw();
        }
      }
    };
    
    // Add hide method to component
    component.hide = () => {
      // Add transition class if not already present
      component.element.classList.add(component.getClass(PROGRESS_CLASSES.TRANSITION));
      
      // Set opacity to 0 and wait for transition
      component.element.style.opacity = '0';
      
      // After transition completes, set display to none
      const onTransitionEnd = () => {
        component.element.style.display = 'none';
        component.element.removeEventListener('transitionend', onTransitionEnd);
      };
      component.element.addEventListener('transitionend', onTransitionEnd);
      
      // Stop any running animations
      if (component.animationId) {
        cancelAnimationFrame(component.animationId);
        component.animationId = null;
      }
      if (component.wavyAnimationId) {
        cancelAnimationFrame(component.wavyAnimationId);
        component.wavyAnimationId = null;
      }
      if (component.valueAnimationId) {
        cancelAnimationFrame(component.valueAnimationId);
        component.valueAnimationId = null;
      }
      
      // Clean up animation state
      component.animationStartTime = undefined;
      component.animationDuration = undefined;
      component.animationStartValue = undefined;
      component.animationTargetValue = undefined;
      
      return component;
    };

    // Add show method to component
    component.show = () => {
      // Add transition class if not already present
      component.element.classList.add(component.getClass(PROGRESS_CLASSES.TRANSITION));
      
      // Set display to block first (but keep opacity 0)
      component.element.style.display = '';
      component.element.style.opacity = '0';
      
      // Force a reflow to ensure the transition works
      component.element.offsetHeight;
      
      // Set opacity to 1 to start transition
      component.element.style.opacity = '1';
      
      // Start appropriate animation based on state
      if (component.state?.indeterminate) {
        if (isCircular) {
          startIndeterminateAnimation();
        } else {
          startWavyAnimation();
        }
      } else if (!isCircular && currentShape === 'wavy') {
        // Restart wavy animation for determinate wavy progress
        startWavyAnimation();
      } else if (component.animationTargetValue !== undefined) {
        // Resume any pending animation
        component.startAnimation(component.animationStartValue || 0, component.animationTargetValue);
      }
      
      return component;
    };

    // Add isVisible method to component
    component.isVisible = () => {
      return component.element.style.display !== 'none' && component.element.style.opacity !== '0';
    };
    
    // Cleanup on destroy
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy || (() => {});
      component.lifecycle.destroy = () => {
        console.log('[Circular] Destroying component', {
          isCircular,
          isAnimating,
          hasAnimationId: !!component.animationId,
          hasWavyAnimationId: !!component.wavyAnimationId,
          hasValueAnimationId: !!component.valueAnimationId
        });
        if (resizeCleanup) resizeCleanup();
        if (themeChangeCleanup) themeChangeCleanup();
        // Stop any running animations
        stopIndeterminateAnimation();
        stopWavyAnimation();
        if (component.valueAnimationId) {
          cancelAnimationFrame(component.valueAnimationId);
          component.valueAnimationId = null;
        }
        component.isAnimatingValue = false;
        component.animationStartTime = 0;
        originalDestroy();
      };
    }
    
    // Add methods to start/stop indeterminate animation
    component.startWavyAnimation = startWavyAnimation;
    component.stopWavyAnimation = stopWavyAnimation;
    component.startIndeterminateAnimation = startIndeterminateAnimation;
    component.stopIndeterminateAnimation = stopIndeterminateAnimation;

    return {
      ...component,
      canvas,
      get ctx() { return canvasContext?.ctx; },
      draw,
      resize,
      setThickness: component.setThickness,
      setShape: component.setShape,
      startWavyAnimation,
      stopWavyAnimation,
      startIndeterminateAnimation,
      stopIndeterminateAnimation,
      hide: component.hide,
      show: component.show,
      isVisible: component.isVisible
    };
  };