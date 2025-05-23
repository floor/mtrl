// src/components/progress/features/canvas.ts

import { ProgressConfig, ProgressVariant } from '../types';
import { 
  PROGRESS_CLASSES, 
  PROGRESS_VARIANTS,
  PROGRESS_MEASUREMENTS,
  PROGRESS_THICKNESS
} from '../constants';

/**
 * Canvas dimensions and drawing context
 */
interface CanvasContext {
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
const getStrokeWidth = (thickness?: string | number): number => {
  if (thickness === undefined || thickness === 'default') {
    return PROGRESS_MEASUREMENTS.COMMON.STROKE_WIDTH;
  }
  
  if (typeof thickness === 'number') {
    return thickness;
  }
  
  // Handle named presets
  switch (thickness) {
    case 'thin':
      return PROGRESS_THICKNESS.THIN;
    case 'thick':
      return PROGRESS_THICKNESS.THICK;
    default:
      return PROGRESS_MEASUREMENTS.COMMON.STROKE_WIDTH;
  }
};

/**
 * Sets up canvas with proper pixel ratio and dimensions
 */
const setupCanvas = (canvas: HTMLCanvasElement, isCircular: boolean, config?: ProgressConfig): CanvasContext => {
  const pixelRatio = window.devicePixelRatio || 1;
  
  let width: number, height: number;
  
  if (isCircular) {
    // Square canvas for circular progress
    width = height = PROGRESS_MEASUREMENTS.CIRCULAR.SIZE;
  } else {
    // For linear progress, get dimensions from the PROGRESS COMPONENT itself, not parent
    const progressElement = canvas.parentElement; // This should be the .mtrl-progress element
    if (!progressElement) {
      throw new Error('Canvas must have a progress parent element');
    }
    
    // Get the progress component's dimensions, not its parent
    const progressRect = progressElement.getBoundingClientRect();
    const progressWidth = progressRect.width || progressElement.offsetWidth;
    
    // If progress element has no width, look at computed styles
    if (progressWidth === 0) {
      const computedStyle = window.getComputedStyle(progressElement);
      const computedWidth = parseFloat(computedStyle.width);
      width = computedWidth > 0 ? computedWidth : 200; // Fallback to 200px
    } else {
      width = progressWidth;
    }
    
    // Ensure minimum width for linear progress
    if (width < 50) {
      width = 200; // Reasonable default
    }
    
    // Height based on thickness configuration
    height = getStrokeWidth(config?.thickness) || PROGRESS_MEASUREMENTS.LINEAR.HEIGHT;
    
    // For wavy shape, use slightly more height
    if (config?.shape === 'wavy') {
      height = Math.max(height, 10);
    }
    
    console.log(`Canvas setup: progress element width=${progressWidth}px, final width=${width}px`);
  }
  
  // Set display size (what user sees)
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Set actual canvas resolution accounting for pixel ratio
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  
  const ctx = canvas.getContext('2d')!;
  
  // Scale context to match pixel ratio for crisp rendering
  ctx.scale(pixelRatio, pixelRatio);
  
  return { canvas, ctx, width, height, pixelRatio };
};

/**
 * Simple resize observer for canvas dimensions
 * Watches the PROGRESS ELEMENT specifically, not its parents
 */
const observeCanvasResize = (
  progressElement: HTMLElement, // The .mtrl-progress element
  canvas: HTMLCanvasElement,
  onResize: () => void
): (() => void) => {
  
  let timeoutId: number | null = null;
  
  // Debounced resize handler
  const debouncedResize = (): void => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      console.log('Progress element resized, updating canvas...');
      onResize();
    }, 100);
  };
  
  // Use ResizeObserver if available - watch the progress element specifically
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const currentWidth = parseFloat(canvas.style.width || '0');
        
        // Only trigger if the progress element actually changed size significantly
        if (Math.abs(width - currentWidth) > 2) {
          console.log(`Progress element size changed: ${currentWidth}px -> ${width}px`);
          debouncedResize();
        }
      }
    });
    
    // Observe the PROGRESS element specifically
    observer.observe(progressElement);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  } else {
    // Fallback to window resize
    window.addEventListener('resize', debouncedResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }
};

/**
 * Draws circular progress on canvas
 */
const drawCircularProgress = (
  context: CanvasContext, 
  config: ProgressConfig,
  value: number,
  max: number,
  isIndeterminate: boolean
): void => {
  const { ctx, width, height } = context;
  const strokeWidth = getStrokeWidth(config.thickness);
  const radius = (Math.min(width, height) / 2) - (strokeWidth / 2);
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Calculate angles
  const gapAngle = PROGRESS_MEASUREMENTS.CIRCULAR.GAP_ANGLE * (Math.PI / 180);
  const startAngle = -Math.PI / 2 + gapAngle / 2;
  const maxAngle = 2 * Math.PI - gapAngle;
  
  // Set line properties
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  
  if (isIndeterminate) {
    // For indeterminate, draw a partial arc that CSS will rotate
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--mtrl-primary') || '#6200ea';
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + Math.PI / 1.5);
    ctx.stroke();
  } else {
    // Draw track (background)
    const percentage = value / max;
    const progressAngle = maxAngle * percentage;
    
    // Track (remaining part)
    if (percentage < 1) {
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--mtrl-outline-variant') || 'rgba(0,0,0,0.12)';
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle + progressAngle, startAngle + maxAngle);
      ctx.stroke();
    }
    
    // Progress indicator
    if (percentage > 0) {
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--mtrl-primary') || '#6200ea';
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + progressAngle);
      ctx.stroke();
    }
  }
};

/**
 * Draws linear progress on canvas with shape support
 */
const drawLinearProgress = (
  context: CanvasContext,
  config: ProgressConfig, 
  value: number,
  max: number,
  buffer: number,
  isIndeterminate: boolean,
  animationTime: number = 0
): void => {
  const { ctx, width, height } = context;
  const strokeWidth = getStrokeWidth(config.thickness);
  const centerY = height / 2;
  const isWavy = config.shape === 'wavy';
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  
  if (isIndeterminate) {
    // For indeterminate, draw animated bar
    const barWidth = width * 0.4;
    
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--mtrl-primary') || '#6200ea';
    
    if (isWavy) {
      // Wavy indeterminate animation
      ctx.beginPath();
      for (let x = 0; x <= barWidth; x += 2) {
        const ripple = Math.cos((x * 0.1) + (animationTime * 0.05)) * 3;
        const y = centerY + ripple;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    } else {
      // Straight line indeterminate
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(barWidth, centerY);
      ctx.stroke();
    }
  } else {
    const percentage = value / max;
    const bufferPercentage = buffer / max;
    
    // Buffer indicator (if applicable)
    if (buffer > 0 && bufferPercentage > percentage) {
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--mtrl-secondary-container') || '#e8f5e8';
      
      const bufferWidth = width * bufferPercentage;
      const progressWidth = width * percentage;
      
      ctx.beginPath();
      if (isWavy) {
        // Wavy buffer line
        for (let x = progressWidth + 2; x <= bufferWidth; x += 2) {
          const ripple = Math.cos(x * 0.15) * 2;
          const y = centerY + ripple;
          
          if (x === progressWidth + 2) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      } else {
        ctx.moveTo(progressWidth + 2, centerY);
        ctx.lineTo(bufferWidth, centerY);
      }
      ctx.stroke();
    }
    
    // Progress indicator
    if (percentage > 0) {
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--mtrl-primary') || '#6200ea';
      
      const progressWidth = width * percentage;
      
      ctx.beginPath();
      if (isWavy) {
        // Wavy progress line
        for (let x = 0; x <= progressWidth; x += 2) {
          const ripple = Math.cos(x * 0.15) * 2;
          const y = centerY + ripple;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      } else {
        ctx.moveTo(0, centerY);
        ctx.lineTo(progressWidth, centerY);
      }
      ctx.stroke();
    }
  }
};

/**
 * Adds canvas functionality to replace complex DOM structure
 */
export const withCanvas = (config: ProgressConfig) => 
  (component: any): CanvasComponent => {
    
    const isCircular = config.variant === PROGRESS_VARIANTS.CIRCULAR;
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.className = `${component.getClass(PROGRESS_CLASSES.CONTAINER)}-canvas`;
    
    // IMPORTANT: Constrain canvas to its immediate parent only
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
    canvas.style.boxSizing = 'border-box';
    
    // Add canvas to component element
    component.element.appendChild(canvas);
    
    // Setup canvas context - make sure we target the right element
    let canvasContext: CanvasContext | null = null;
    let resizeCleanup: (() => void) | null = null;
    
    const initializeCanvas = (): boolean => {
      try {
        // Make sure we're getting dimensions from the progress element, not its container
        console.log(`Initializing canvas for progress element:`, {
          progressWidth: component.element.offsetWidth,
          progressHeight: component.element.offsetHeight,
          progressClass: component.element.className
        });
        
        canvasContext = setupCanvas(canvas, isCircular, config);
        component.ctx = canvasContext.ctx;
        return true;
      } catch (error) {
        console.warn('Canvas initialization failed, retrying...', error);
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
    
    // Drawing function with animation support
    const draw = (animationTime: number = 0): void => {
      // Ensure canvas is initialized
      if (!canvasContext) return;
      
      // Get current state values (these will be provided by withState)
      const value = component.state?.value || config.value || 0;
      const max = component.state?.max || config.max || 100;
      const buffer = component.state?.buffer || config.buffer || 0;
      const isIndeterminate = component.state?.indeterminate || config.indeterminate || false;
      
      if (isCircular) {
        drawCircularProgress(canvasContext, config, value, max, isIndeterminate);
      } else {
        drawLinearProgress(canvasContext, config, value, max, buffer, isIndeterminate, animationTime);
      }
    };
    
    // Animation loop for wavy indeterminate progress
    const startWavyAnimation = (): void => {
      if (!config.indeterminate || config.shape !== 'wavy' || isCircular) return;
      
      const animate = (timestamp: number): void => {
        component.animationTime = timestamp;
        draw(timestamp);
        component.animationId = requestAnimationFrame(animate);
      };
      
      component.animationId = requestAnimationFrame(animate);
    };
    
    const stopWavyAnimation = (): void => {
      if (component.animationId) {
        cancelAnimationFrame(component.animationId);
        component.animationId = null;
      }
    };
    
    // Resize function
    const resize = (): void => {
      if (!canvasContext) return;
      
      try {
        const newContext = setupCanvas(canvas, isCircular, config);
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
    
    // Initial draw and setup wavy animation if needed
    // Use a slight delay to ensure the canvas is properly initialized
    const initialDraw = (): void => {
      if (!canvasContext) {
        requestAnimationFrame(initialDraw);
        return;
      }
      
      draw();
      if (config.indeterminate && config.shape === 'wavy' && !isCircular) {
        startWavyAnimation();
      }
    };
    
    requestAnimationFrame(initialDraw);
    
    // Cleanup on destroy
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy || (() => {});
      component.lifecycle.destroy = () => {
        if (resizeCleanup) resizeCleanup();
        stopWavyAnimation();
        originalDestroy();
      };
    }
    
    return {
      ...component,
      canvas,
      get ctx() { return canvasContext?.ctx; }, // Getter to ensure context exists
      draw,
      resize,
      startWavyAnimation,
      stopWavyAnimation
    };
  };