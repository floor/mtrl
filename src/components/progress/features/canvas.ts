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
  
  // Calculate radius accounting for stroke width
  const radius = (Math.min(width, height) / 2) - (strokeWidth / 2);
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Calculate gap angle for a visible gap: 4px plus 2x strokeWidth (for both round caps)
  const gapPx = 4 + 2 * strokeWidth;
  const gapAngle = gapPx / radius;
  const startAngle = -Math.PI / 2; // 12 o'clock
  const maxAngle = 2 * Math.PI - gapAngle;

  // Set line properties
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';

  if (isIndeterminate) {
    // For indeterminate, draw a partial arc that CSS will rotate
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + (Math.PI * 2) / 3);
    ctx.stroke();
  } else {
    const percentage = value / max;
    // Arc length available for indicator + track
    const availableAngle = maxAngle;
    const indicatorAngle = availableAngle * percentage;
    const indicatorEnd = startAngle + indicatorAngle;
    const trackStart = indicatorEnd + gapAngle / 2;
    const trackEnd = startAngle + maxAngle + gapAngle / 2;

    if (percentage === 0) {
      // Draw a dot at the start position (12 o'clock)
      const dotX = centerX + radius * Math.cos(startAngle);
      const dotY = centerY + radius * Math.sin(startAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, strokeWidth / 2, 0, 2 * Math.PI);
      ctx.fillStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
      ctx.fill();
    } else if (percentage >= 1) {
      // Draw a full circle (no gap) for 100%
      ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (percentage > 0) {
      // Progress indicator (with gap)
      ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        radius,
        startAngle,
        indicatorEnd
      );
      ctx.stroke();
    }

    // Track (remaining part)
    if (percentage < 1) {
      ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', {
        alpha: 0.12,
        fallback: 'rgba(103, 80, 164, 0.12)'
      });
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        radius,
        trackStart,
        trackEnd
      );
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
  animationTime: number = 0,
  showStopIndicator: boolean = true
): void => {
  const { ctx, width, height } = context;
  const strokeWidth = getStrokeWidth(config.thickness);
  const centerY = height / 2;
  const isWavy = config.shape === 'wavy';

  // The gap at the start and end
  const edgeGap = strokeWidth / 2;
  // The available width for the indicator and track
  const availableWidth = width - (edgeGap * 2);

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (isIndeterminate) {
    // Material Design 3 indeterminate animation specs
    const cycleDuration = 2000; // 2s cycle (matching MD3)
    const normalizedTime = (animationTime % cycleDuration) / cycleDuration;
    
    // Draw the track first
    ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', { 
      alpha: 0.12,
      fallback: 'rgba(103, 80, 164, 0.12)'
    });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (isWavy) {
      for (let x = edgeGap; x <= width - edgeGap; x += 2) {
        const ripple = Math.cos(x * 0.15) * 2;
        const y = centerY + ripple;
        if (x === edgeGap) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    } else {
      ctx.moveTo(edgeGap, centerY);
      ctx.lineTo(width - edgeGap, centerY);
    }
    ctx.stroke();

    // Helper function to calculate scale based on MD3 keyframes
    const getPrimaryScale = (time: number): number => {
      if (time <= 0.3665) {
        // Start growing immediately from 0.08 to 0.661479
        // Cubic bezier: (0.334731, 0.12482, 0.785844, 1) to (0.06, 0.11, 0.6, 1)
        const t = time / 0.3665;
        return 0.08 + (0.661479 - 0.08) * t;
      } else if (time <= 0.6915) {
        // Hold at max size
        return 0.661479;
      }
      return 0.08;
    };

    const getSecondaryScale = (time: number): number => {
      // Temporarily disabled - always return 0
      return 0;
    };

    // Helper function to calculate translate based on MD3 keyframes
    const getPrimaryTranslate = (time: number): number => {
      if (time <= 0.2) {
        // Start much further off-screen on the left (-120%) and move to 0
        const t = time / 0.2;
        return -120 + (120 * t);
      } else if (time <= 0.5915) {
        // Continue from 0 to 83.6714%
        const t = (time - 0.2) / (0.5915 - 0.2);
        return 83.6714 * t;
      }
      return 83.6714 + (200.611 - 83.6714) * ((time - 0.5915) / (1 - 0.5915));
    };

    const getSecondaryTranslate = (time: number): number => {
      // Start when primary bar goes off-screen
      if (time < 0.5915) {
        return -50; // Off-screen
      }
      // Adjust time to start from 0 when secondary bar begins
      const adjustedTime = (time - 0.5915) / (1 - 0.5915);
      
      if (adjustedTime <= 0.25) {
        // Move from off-screen to 37.6519%
        // Cubic bezier: (0.15, 0, 0.515058, 0.409685) to (0.31033, 0.284058, 0.8, 0.733712)
        const t = adjustedTime / 0.25;
        return -50 + (37.6519 + 50) * t;
      } else if (adjustedTime <= 0.4835) {
        // Continue moving from 37.6519% to 84.3862%
        // Cubic bezier: (0.31033, 0.284058, 0.8, 0.733712) to (0.4, 0.627035, 0.6, 0.902026)
        const t = (adjustedTime - 0.25) / (0.4835 - 0.25);
        return 37.6519 + (84.3862 - 37.6519) * t;
      }
      return 84.3862 + (160.278 - 84.3862) * ((adjustedTime - 0.4835) / (1 - 0.4835));
    };

    // Draw primary bar
    const primaryScale = getPrimaryScale(normalizedTime);
    const primaryTranslate = getPrimaryTranslate(normalizedTime);
    const primaryWidth = availableWidth * primaryScale;
    const primaryStart = edgeGap + (availableWidth * primaryTranslate / 100);
    
    const visibleStart = Math.max(edgeGap, primaryStart);
    const visibleEnd = Math.min(width - edgeGap, primaryStart + primaryWidth);
    if (visibleEnd > visibleStart) {
      ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // if (isWavy) {
      //   for (let x = visibleStart; x <= visibleEnd; x += 2) {
      //     const ripple = Math.cos(x * 0.15) * 2;
      //     const y = centerY + ripple;
      //     if (x === visibleStart) {
      //       ctx.moveTo(x, y);
      //     } else {
      //       ctx.lineTo(x, y);
      //     }
      //   }
      // } else {
        ctx.moveTo(visibleStart, centerY);
        ctx.lineTo(visibleEnd, centerY);
      // }
      ctx.stroke();
    }

    // Secondary bar is completely removed
    return;
  }

  const percentage = value / max;
  const bufferPercentage = buffer / max;

  // --- Indicator ---
  const gapWidth = 4;
  const progressEnd = edgeGap + (availableWidth * percentage);
  if (percentage === 0) {
    // Special case: value is zero, draw a dot at the start
    ctx.beginPath();
    ctx.arc(edgeGap, centerY, strokeWidth / 2, 0, 2 * Math.PI);
    ctx.fillStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.fill();
  } else if (percentage >= 1) {
    // 100%: draw a full-width line, no gap, no stop indicator, no track
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (isWavy) {
      for (let x = edgeGap; x <= width - edgeGap; x += 2) {
        const ripple = Math.cos(x * 0.15) * 2;
        const y = centerY + ripple;
        if (x === edgeGap) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    } else {
      ctx.moveTo(edgeGap, centerY);
      ctx.lineTo(width - edgeGap, centerY);
    }
    ctx.stroke();
    return; // Do not draw stop indicator or track
  } else if (percentage > 0) {
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    // End the indicator before the gap, accounting for round cap
    const indicatorEnd = Math.max(edgeGap, progressEnd - (gapWidth + strokeWidth) / 2);
    ctx.beginPath();
    if (isWavy) {
      for (let x = edgeGap; x <= indicatorEnd; x += 2) {
        const ripple = Math.cos(x * 0.15) * 2;
        const y = centerY + ripple;
        if (x === edgeGap) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    } else {
      ctx.moveTo(edgeGap, centerY);
      ctx.lineTo(indicatorEnd, centerY);
    }
    ctx.stroke();
  }

  // --- Track (remaining line) ---
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', { 
    alpha: 0.12,
    fallback: 'rgba(103, 80, 164, 0.12)'
  });
  let trackStart;
  if (percentage === 0) {
    // For dot case, start track after the dot and gap
    trackStart = edgeGap + strokeWidth + gapWidth;
  } else {
    // For line case, start track after the indicator and gap
    trackStart = Math.min(progressEnd + (gapWidth + strokeWidth) / 2, width - edgeGap);
  }
  ctx.beginPath();
  if (isWavy) {
    for (let x = trackStart; x <= width - edgeGap; x += 2) {
      const ripple = Math.cos(x * 0.15) * 2;
      const y = centerY + ripple;
      if (x === trackStart) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
  } else {
    ctx.moveTo(trackStart, centerY);
    ctx.lineTo(width - edgeGap, centerY);
  }
  ctx.stroke();

  // --- Buffer ---
  if (buffer > 0 && bufferPercentage > percentage) {
    ctx.strokeStyle = getThemeColor('sys-color-secondary-container', { fallback: '#E8DEF8' });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    const bufferEnd = edgeGap + (availableWidth * bufferPercentage);
    ctx.beginPath();
    if (isWavy) {
      for (let x = progressEnd; x <= bufferEnd; x += 2) {
        const ripple = Math.cos(x * 0.15) * 2;
        const y = centerY + ripple;
        if (x === progressEnd) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    } else {
      ctx.moveTo(progressEnd, centerY);
      ctx.lineTo(bufferEnd, centerY);
    }
    ctx.stroke();
  }

  // --- Stop Indicator (dot) ---
  if (percentage < 1 && showStopIndicator) {
    // Center the dot at the end of the track, regardless of thickness
    const dotX = width - edgeGap;
    ctx.beginPath();
    ctx.arc(dotX, centerY, 2, 0, 2 * Math.PI); // Always radius 2px
    ctx.fillStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.fill();
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
    
    // Setup canvas context
    let canvasContext: CanvasContext | null = null;
    let resizeCleanup: (() => void) | null = null;
    let themeChangeCleanup: (() => void) | null = null;
    
    // Current thickness value - managed by API
    let currentThickness = config.thickness;
    
    // In withCanvas, manage currentSize for circular progress
    let currentSize = config.size ?? PROGRESS_MEASUREMENTS.CIRCULAR.SIZE;
    
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
          size: currentSize
        };
        
        updateCanvasDimensions(canvas, canvasContext, isCircular, currentConfig);
        
        if (isCircular) {
          drawCircularProgress(canvasContext, currentConfig, value, max, isIndeterminate);
        } else {
          drawLinearProgress(canvasContext, currentConfig, value, max, buffer, isIndeterminate, animationTime);
        }
        return;
      }
      
      // Use state values directly
      const value = state.value;
      const max = state.max;
      const buffer = state.buffer;
      const isIndeterminate = state.indeterminate;
      
      // Create a new config object with the current thickness
      const currentConfig = {
        ...config,
        thickness: currentThickness,
        size: currentSize
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
    
    // Animation loop for indeterminate progress
    const startIndeterminateAnimation = (): void => {
      if (!config.indeterminate || isCircular) return;
      
      const animate = (timestamp: number): void => {
        component.animationTime = timestamp;
        draw(timestamp);
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
      if (config.indeterminate) {
        if (config.shape === 'wavy' && !isCircular) {
          startWavyAnimation();
        } else if (!isCircular) {
          startIndeterminateAnimation();
        }
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
    
    // Cleanup on destroy
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy || (() => {});
      component.lifecycle.destroy = () => {
        if (resizeCleanup) resizeCleanup();
        if (themeChangeCleanup) themeChangeCleanup();
        stopWavyAnimation();
        stopIndeterminateAnimation();
        originalDestroy();
      };
    }
    
    // Add methods to start/stop indeterminate animation
    component.startIndeterminateAnimation = startIndeterminateAnimation;
    component.stopIndeterminateAnimation = stopIndeterminateAnimation;

    return {
      ...component,
      canvas,
      get ctx() { return canvasContext?.ctx; },
      draw,
      resize,
      setThickness: component.setThickness,
      startWavyAnimation,
      stopWavyAnimation,
      startIndeterminateAnimation,
      stopIndeterminateAnimation
    };
  };