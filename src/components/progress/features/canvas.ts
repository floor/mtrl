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
  isIndeterminate: boolean,
  animationTime: number = 0
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
  const gapPx = PROGRESS_MEASUREMENTS.CIRCULAR.GAP + 2 * strokeWidth;
  const gapAngle = gapPx / radius;
  const startAngle = -Math.PI / 2; // 12 o'clock
  const maxAngle = 2 * Math.PI - gapAngle;

  // Set line properties
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';

  if (isIndeterminate) {
    // Material Design 3 indeterminate animation specs
    const cycleDuration = 1333; // ~1.33s cycle (matching MD3)
    const normalizedTime = (animationTime % cycleDuration) / cycleDuration;
    
    // Draw the track first (always present)
    ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', {
      alpha: 0.12,
      fallback: 'rgba(103, 80, 164, 0.12)'
    });
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Helper functions for indeterminate animation
    const getArcLength = (time: number): number => {
      // Arc length varies between 0.05 and 0.75 of the circle
      if (time <= 0.5) {
        // Grow from 0.05 to 0.75 in first half
        return 0.05 + (0.7 * (time / 0.5));
      } else {
        // Shrink from 0.75 to 0.05 in second half
        return 0.75 - (0.7 * ((time - 0.5) / 0.5));
      }
    };

    const getRotation = (time: number): number => {
      // Full rotation every cycle, with easing
      const rotation = time * 2 * Math.PI;
      // Add a slight ease-in-out effect
      const eased = time < 0.5 
        ? 2 * time * time 
        : 1 - Math.pow(-2 * time + 2, 2) / 2;
      return rotation + (eased * 0.1); // Add a small boost to the rotation
    };

    // Calculate current arc length and rotation
    const arcLength = getArcLength(normalizedTime) * 2 * Math.PI;
    const rotation = getRotation(normalizedTime);
    
    // Draw the indeterminate arc
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.beginPath();
    
    // Start angle is based on rotation
    const arcStart = startAngle + rotation;
    // End angle is start angle plus arc length
    const arcEnd = arcStart + arcLength;
    
    // Draw the arc
    ctx.arc(centerX, centerY, radius, arcStart, arcEnd);
    ctx.stroke();
    
    return;
  }

  // Rest of the determinate drawing code
  const percentage = value / max;
  
  // Draw track first (always present except at 100%)
  if (percentage < 1) {
    ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', {
      alpha: 0.12,
      fallback: 'rgba(103, 80, 164, 0.12)'
    });
    ctx.beginPath();
    
    // Calculate track angles based on current progress
    const trackStart = startAngle + (maxAngle * percentage) + gapAngle / 2;
    const trackEnd = startAngle + maxAngle + gapAngle / 2;
    
    ctx.arc(centerX, centerY, radius, trackStart, trackEnd);
    ctx.stroke();
  }

  // Draw progress indicator
  if (percentage === 0) {
    // Draw a dot at the start position (12 o'clock)
    const dotX = centerX + radius * Math.cos(startAngle);
    const dotY = centerY + radius * Math.sin(startAngle);
    ctx.beginPath();
    ctx.arc(dotX, dotY, strokeWidth / 2, 0, 2 * Math.PI);
    ctx.fillStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.fill();
  } else if (percentage >= 0.995) {
    // Draw complete circle when very close to 100%
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  } else {
    // Normal progress indicator (with gap)
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + (maxAngle * percentage));
    ctx.stroke();
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
  showStopIndicator: boolean = true,
  currentShape: ProgressShape = 'line'
): void => {
  const { ctx, width, height } = context;
  const strokeWidth = getStrokeWidth(config.thickness);
  const centerY = height / 2;
  const isWavy = currentShape === 'wavy';

  // The gap at the start and end
  const edgeGap = strokeWidth / 2;
  // The available width for the indicator and track
  const availableWidth = width - (edgeGap * 2);
  const gapWidth = 4;
  const percentage = value / max;
  const bufferPercentage = buffer / max;
  const progressEnd = edgeGap + (availableWidth * percentage);

  // Transition points for shape changes
  const startTransitionEnd = 0.03; // Start flat and transition to wavy between 0-3%
  const endTransitionStart = 0.97; // End wavy and transition to flat between 97-100%

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (isIndeterminate) {
    // Material Design 3 indeterminate animation specs
    const cycleDuration = 2000; // 2s cycle (matching MD3)
    const normalizedTime = (animationTime % cycleDuration) / cycleDuration;
    
    // Draw the track first (always straight)
    ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', { 
      alpha: 0.12,
      fallback: 'rgba(103, 80, 164, 0.12)'
    });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(edgeGap, centerY);
    ctx.lineTo(width - edgeGap, centerY);
    ctx.stroke();

    // Helper functions for indeterminate animation
    const getPrimaryScale = (time: number): number => {
      if (time <= 0.3665) {
        const t = time / 0.3665;
        return 0.08 + (0.661479 - 0.08) * t;
      } else if (time <= 0.6915) {
        return 0.661479;
      }
      return 0.08;
    };

    const getPrimaryTranslate = (time: number): number => {
      if (time <= 0.2) {
        const t = time / 0.2;
        return -120 + (120 * t);
      } else if (time <= 0.5915) {
        const t = (time - 0.2) / (0.5915 - 0.2);
        return 83.6714 * t;
      }
      return 83.6714 + (200.611 - 83.6714) * ((time - 0.5915) / (1 - 0.5915));
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

      // Use wavy mechanism with appropriate amplitude
      const waveSpeed = 0;
      const waveAmplitude = isWavy ? 2 : 0; // Zero amplitude for line shape
      const waveFrequency = 0.35;
      
      for (let x = visibleStart; x <= visibleEnd; x += 2) {
        const waveOffset = (x * waveFrequency) + (animationTime * waveSpeed);
        const ripple = Math.sin(waveOffset) * waveAmplitude;
        const y = centerY + ripple;
        if (x === visibleStart) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    return;
  }

  // --- Track (remaining line) ---
  // Track is always straight
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.strokeStyle = getThemeColor('sys-color-primary-rgb', { 
    alpha: 0.12,
    fallback: 'rgba(103, 80, 164, 0.12)'
  });
  let trackStart;
  if (percentage === 0) {
    // At 0%, maintain full gap after the dot
    trackStart = edgeGap + strokeWidth + gapWidth;
  } else if (percentage <= startTransitionEnd) {
    // During the beginning transition, maintain the gap
    trackStart = Math.max(
      edgeGap + strokeWidth + gapWidth, // Minimum gap
      progressEnd + (gapWidth + strokeWidth) / 2 // Dynamic position
    );
  } else {
    trackStart = Math.min(progressEnd + (gapWidth + strokeWidth) / 2, width - edgeGap);
  }
  ctx.beginPath();
  ctx.moveTo(trackStart, centerY);
  ctx.lineTo(width - edgeGap, centerY);
  ctx.stroke();

  // --- Indicator ---
  if (percentage >= 0.995) {
    // Draw complete line when very close to 100%
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(edgeGap, centerY);
    ctx.lineTo(width - edgeGap, centerY);
    ctx.stroke();
  } else {
    // For all other cases (including the beginning transition)
    ctx.strokeStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    
    // Calculate indicator end with proper gap
    let indicatorEnd;
    if (percentage <= startTransitionEnd) {
      // During transition, ensure proper gap between indicator and track
      indicatorEnd = Math.min(
        progressEnd - (gapWidth + strokeWidth) / 2, // Dynamic position
        trackStart - (gapWidth + strokeWidth) // Maintain gap from track
      );
    } else {
      indicatorEnd = Math.max(edgeGap, progressEnd - (gapWidth + strokeWidth) / 2);
    }
    
    ctx.beginPath();

    if (isWavy) {
      const waveSpeed = 0.008;
      const baseAmplitude = 3;
      const waveFrequency = 0.15;
      
      // Calculate amplitude based on progress
      let waveAmplitude = baseAmplitude;
      
      // For very small percentages, start with a flat line
      if (percentage <= startTransitionEnd) {
        // Smoothly increase amplitude from 0% to 3%
        const transitionProgress = percentage / startTransitionEnd;
        // Use easeInQuad for smooth transition
        const easedProgress = transitionProgress * transitionProgress;
        waveAmplitude = baseAmplitude * easedProgress;
        
        // For very small percentages, ensure we start with a visible line
        const minLength = strokeWidth * 2;
        const actualLength = indicatorEnd - edgeGap;
        if (actualLength < minLength) {
          // Draw a small flat line first, maintaining gap
          const lineEnd = Math.min(edgeGap + minLength, trackStart - (gapWidth + strokeWidth));
          ctx.moveTo(edgeGap, centerY);
          ctx.lineTo(lineEnd, centerY);
          ctx.stroke();
          ctx.beginPath();
        }
      } else if (percentage >= endTransitionStart) {
        // Smoothly reduce amplitude from 97% to 100%
        const transitionProgress = (percentage - endTransitionStart) / (1 - endTransitionStart);
        // Use easeOutQuad for smooth transition
        const easedProgress = 1 - (1 - transitionProgress) * (1 - transitionProgress);
        waveAmplitude = baseAmplitude * (1 - easedProgress);
      }
      
      // Draw the wavy line
      for (let x = edgeGap; x <= indicatorEnd; x += 2) {
        const waveOffset = (x * waveFrequency) + (animationTime * waveSpeed);
        const ripple = Math.sin(waveOffset) * waveAmplitude;
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

  // --- Buffer ---
  if (buffer > 0 && bufferPercentage > percentage) {
    ctx.strokeStyle = getThemeColor('sys-color-secondary-container', { fallback: '#E8DEF8' });
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    const bufferEnd = edgeGap + (availableWidth * bufferPercentage);
    ctx.beginPath();
    ctx.moveTo(progressEnd, centerY);
    ctx.lineTo(bufferEnd, centerY);
    ctx.stroke();
  }

  // --- Stop Indicator (dot) ---
  if (percentage < 0.995 && showStopIndicator) {
    const dotX = width - edgeGap;
    ctx.beginPath();
    ctx.arc(dotX, centerY, 2, 0, 2 * Math.PI);
    ctx.fillStyle = getThemeColor('sys-color-primary', { fallback: '#6750A4' });
    ctx.fill();
  }
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
    let animationDuration = 300; // 300ms for value transitions
    
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
      } else if (!isCircular) {
        // Always start wavy animation for linear progress
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
    
    // Update setValue method to handle the final transition better
    component.setValue = (value: number) => {

      // Store the target value
      targetValue = Math.max(0, Math.min(component.state.max, value));
      
      // If we're in indeterminate mode, exit it first
      if (component.state.indeterminate) {
        component.setIndeterminate(false);
      }

      // Adjust animation duration based on the transition
      const isTransitioningToFull = targetValue === component.state.max && animatedValue < targetValue;
      const currentDuration = isTransitioningToFull ? animationDuration * 1.2 : animationDuration; // Slightly longer for final transition

      // Start value animation
      component.isAnimatingValue = true;
      component.animationStartTime = performance.now();

      const animateValue = (timestamp: number) => {
        if (!component.isAnimatingValue) {
          return;
        }

        const elapsed = timestamp - component.animationStartTime;
        const progress = Math.min(elapsed / currentDuration, 1);
        
        // Custom easing function for smoother animation
        const easedProgress = (() => {
          if (isTransitioningToFull) {
            // Special easing for transition to 100%
            if (progress < 0.7) {
              // First 70%: accelerate smoothly
              return (progress / 0.7) * (progress / 0.7) * 0.7;
            } else {
              // Last 30%: maintain momentum
              const t = (progress - 0.7) / 0.3;
              return 0.7 + (1 - Math.pow(1 - t, 2)) * 0.3;
            }
          } else {
            // Normal easing for other transitions
            return progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          }
        })();
        
        animatedValue = animatedValue + (targetValue - animatedValue) * easedProgress;

        // Draw with current animated value
        draw(timestamp);

        if (progress < 1) {
          component.animationId = requestAnimationFrame(animateValue);
        } else {
          // Animation complete
          animatedValue = targetValue;
          component.isAnimatingValue = false;
          component.animationId = null;
          
          // For wavy shape, restart the wavy animation after value animation completes
          if (!isCircular && currentShape === 'wavy') {
            setTimeout(() => {
              if (!component.isAnimatingValue && !component.state?.indeterminate) {
                startWavyAnimation();
              }
            }, 50);
          }
          
          draw(timestamp);
        }
      };

      // Start the animation
      if (component.animationId) {
        cancelAnimationFrame(component.animationId);
      }
      component.animationId = requestAnimationFrame(animateValue);
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
    
    // Cleanup on destroy
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy || (() => {});
      component.lifecycle.destroy = () => {
        console.log('[Circular] Destroying component', {
          isCircular,
          isAnimating,
          hasAnimationId: !!component.animationId
        });
        if (resizeCleanup) resizeCleanup();
        if (themeChangeCleanup) themeChangeCleanup();
        // Stop any running animations
        stopIndeterminateAnimation();
        component.isAnimatingValue = false;
        component.animationStartTime = 0;
        // Always stop wavy animation if it's running
        if (config.shape === 'wavy') {
          stopWavyAnimation();
        }
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
      stopIndeterminateAnimation
    };
  };