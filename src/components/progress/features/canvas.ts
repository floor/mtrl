// src/components/progress/features/canvas.ts

import { ProgressConfig, ProgressVariant, ProgressThickness } from '../types';
import { 
  PROGRESS_CLASSES, 
  PROGRESS_VARIANTS,
  PROGRESS_MEASUREMENTS,
  PROGRESS_THICKNESS
} from '../constants';
import { getThemeColor } from '../../../core/utils';
import { PREFIX } from '../../../core/config';

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
  console.log('getStrokeWidth called with thickness:', thickness);
  
  // Handle numeric values first
  if (typeof thickness === 'number') {
    const value = Math.max(thickness, PROGRESS_MEASUREMENTS.LINEAR.MIN_HEIGHT);
    console.log('Numeric thickness value:', value);
    return value;
  }
  
  // Handle string values (named presets)
  if (typeof thickness === 'string') {
    let value: number;
    switch (thickness) {
      case 'thin':
        value = PROGRESS_THICKNESS.THIN;
        break;
      case 'thick':
        value = PROGRESS_THICKNESS.THICK;
        break;
      default:
        // If it's a string that can be parsed as a number, use that
        const numValue = parseFloat(thickness);
        value = !isNaN(numValue) 
          ? Math.max(numValue, PROGRESS_MEASUREMENTS.LINEAR.MIN_HEIGHT)
          : PROGRESS_THICKNESS.THIN;
    }
    console.log('String thickness value:', value, 'from input:', thickness);
    return value;
  }
  
  // Default to thin if undefined or invalid
  console.log('Using default thickness:', PROGRESS_THICKNESS.THIN);
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
  console.log('updateCanvasDimensions called with config:', {
    thickness: config?.thickness,
    isCircular,
    currentCanvasHeight: canvas.style.height,
    currentCanvasWidth: canvas.style.width
  });

  const pixelRatio = window.devicePixelRatio || 1;
  const strokeWidth = getStrokeWidth(config?.thickness);
  
  console.log('Calculated dimensions:', {
    pixelRatio,
    strokeWidth,
    isCircular
  });

  if (isCircular) {
    // For circular progress, maintain square dimensions
    const size = PROGRESS_MEASUREMENTS.CIRCULAR.SIZE;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = Math.round(size * pixelRatio);
    canvas.height = Math.round(size * pixelRatio);
    context.width = size;
    context.height = size;
  } else {
    // For linear progress, update height based on thickness
    const progressElement = canvas.parentElement;
    if (!progressElement) {
      console.warn('No parent element found for canvas');
      return;
    }
    
    const progressWidth = progressElement.getBoundingClientRect().width || progressElement.offsetWidth;
    const width = Math.max(progressWidth, 200); // Ensure minimum width
    
    // Calculate height based on thickness and shape
    let height = strokeWidth;
    if (config?.shape === 'wavy') {
      // Add extra height for wavy shape to accommodate the wave
      height = Math.max(height + 6, 10);
    }
    
    console.log('Setting canvas dimensions:', {
      width,
      height,
      styleHeight: `${height}px`,
      actualHeight: Math.round(height * pixelRatio)
    });
    
    // Update canvas dimensions and style
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Set actual canvas dimensions accounting for pixel ratio
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    
    // Update context dimensions
    context.width = width;
    context.height = height;
    
    // Reset transform and scale context to match pixel ratio
    const ctx = context.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.scale(pixelRatio, pixelRatio);

    console.log('Final canvas dimensions:', {
      styleWidth: canvas.style.width,
      styleHeight: canvas.style.height,
      actualWidth: canvas.width,
      actualHeight: canvas.height,
      contextWidth: context.width,
      contextHeight: context.height
    });
  }
};

/**
 * Sets up canvas with proper pixel ratio and dimensions
 */
const setupCanvas = (canvas: HTMLCanvasElement, isCircular: boolean, config?: ProgressConfig): CanvasContext => {
  console.log('setupCanvas called with config:', {
    thickness: config?.thickness,
    isCircular
  });

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
  
  // Set initial dimensions with proper thickness
  updateCanvasDimensions(canvas, context, isCircular, {
    ...config,
    thickness: config?.thickness // Ensure thickness is passed through
  });
  
  return context;
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
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + Math.PI / 1.5);
    ctx.stroke();
  } else {
    // Draw track (background)
    const percentage = value / max;
    const progressAngle = maxAngle * percentage;
    
    // Track (remaining part)
    if (percentage < 1) {
      ctx.strokeStyle = getThemeColor('sys-color-outline-variant', { fallback: 'rgba(0,0,0,0.12)' });
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle + progressAngle, startAngle + maxAngle);
      ctx.stroke();
    }
    
    // Progress indicator
    if (percentage > 0) {
      ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
      
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
  const gap = PROGRESS_MEASUREMENTS.LINEAR.GAP;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  
  if (isIndeterminate) {
    // For indeterminate, draw animated bar
    const barWidth = width * 0.4;
    
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    
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
    
    // Progress indicator - draw first
    if (percentage > 0) {
      ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
      
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
    
    // Draw track (remaining part) with gap - draw after indicator
    if (percentage < 1) {
      // Use primary color with 12% opacity for track
      ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', { 
        alpha: 0.12,
        fallback: 'rgba(103, 80, 164, 0.12)'
      });
      
      const progressWidth = width * percentage;
      const trackStartX = progressWidth + gap; // Start track after progress + gap
      
      ctx.beginPath();
      if (isWavy) {
        // Wavy track
        for (let x = trackStartX; x <= width; x += 2) {
          const ripple = Math.cos(x * 0.15) * 2;
          const y = centerY + ripple;
          
          if (x === trackStartX) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      } else {
        // Straight track
        ctx.moveTo(trackStartX, centerY);
        ctx.lineTo(width, centerY);
      }
      ctx.stroke();
    }
    
    // Buffer indicator (if applicable) - draw last
    if (buffer > 0 && bufferPercentage > percentage) {
      ctx.strokeStyle = getThemeColor('sys-color-secondary-container', { fallback: '#E8DEF8' });
      
      const bufferWidth = width * bufferPercentage;
      const progressWidth = width * percentage;
      
      ctx.beginPath();
      if (isWavy) {
        // Wavy buffer line
        for (let x = progressWidth + gap; x <= bufferWidth; x += 2) {
          const ripple = Math.cos(x * 0.15) * 2;
          const y = centerY + ripple;
          
          if (x === progressWidth + gap) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      } else {
        ctx.moveTo(progressWidth + gap, centerY);
        ctx.lineTo(bufferWidth, centerY);
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
    console.log('withCanvas called with config:', {
      thickness: config.thickness,
      variant: config.variant
    });
    
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
    
    // Setup canvas context
    let canvasContext: CanvasContext | null = null;
    let resizeCleanup: (() => void) | null = null;
    let themeChangeCleanup: (() => void) | null = null;
    
    // Current thickness value - managed by API
    let currentThickness = config.thickness;
    
    const initializeCanvas = (): boolean => {
      try {
        console.log('Initializing canvas with thickness:', currentThickness);

        // Initialize with the current thickness
        canvasContext = setupCanvas(canvas, isCircular, {
          ...config,
          thickness: currentThickness
        });
        component.ctx = canvasContext.ctx;
        
        // Force initial dimensions update
        updateCanvasDimensions(canvas, canvasContext, isCircular, {
          ...config,
          thickness: currentThickness
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
    
    // Drawing function with animation support
    const draw = (animationTime: number = 0): void => {
      // Ensure canvas is initialized
      if (!canvasContext) return;
      
      // Get values from component API
      const value = component.getValue?.() ?? config.value ?? 0;
      const max = component.getMax?.() ?? config.max ?? 100;
      const buffer = component.getBuffer?.() ?? config.buffer ?? 0;
      const isIndeterminate = component.isIndeterminate?.() ?? config.indeterminate ?? false;
      
      console.log('Draw called with:', {
        thickness: currentThickness,
        value,
        max,
        buffer,
        isIndeterminate
      });
      
      // Create a new config object with the current thickness
      const currentConfig = {
        ...config,
        thickness: currentThickness
      };
      
      // Always update dimensions to ensure correct thickness
      updateCanvasDimensions(canvas, canvasContext, isCircular, currentConfig);
      
      if (isCircular) {
        drawCircularProgress(canvasContext, currentConfig, value, max, isIndeterminate);
      } else {
        drawLinearProgress(canvasContext, currentConfig, value, max, buffer, isIndeterminate, animationTime);
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
        // Get current thickness from state or config
        const currentThickness = component.state?.thickness ?? config.thickness;
        console.log('Resize called with state:', {
          stateThickness: component.state?.thickness,
          configThickness: config.thickness,
          currentThickness
        });
        
        // Create a new config object with the current thickness
        const currentConfig = {
          ...config,
          thickness: currentThickness
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
        console.log('Handle resize called with state:', {
          stateThickness: component.state?.thickness,
          configThickness: config.thickness
        });
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
    
    // Add setThickness method to component
    component.setThickness = (thickness: ProgressThickness) => {
      console.log('Canvas setThickness called with:', thickness);
      
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
    
    // Cleanup on destroy
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy || (() => {});
      component.lifecycle.destroy = () => {
        if (resizeCleanup) resizeCleanup();
        if (themeChangeCleanup) themeChangeCleanup();
        stopWavyAnimation();
        originalDestroy();
      };
    }
    
    return {
      ...component,
      canvas,
      get ctx() { return canvasContext?.ctx; },
      draw,
      resize,
      setThickness: component.setThickness,
      startWavyAnimation,
      stopWavyAnimation
    };
  };