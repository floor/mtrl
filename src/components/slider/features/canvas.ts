import { SliderConfig, SliderColor } from '../types';
import { getThemeColor } from '../../../core/utils';
import { observeCanvasResize } from '../../../core/canvas';

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
interface CanvasSliderComponent {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  getClass: (name: string) => string;
  drawCanvas: (state?: any) => void;
  resize: () => void;
  [key: string]: any;
}

/**
 * Sets up canvas with proper pixel ratio and dimensions
 */
const setupCanvas = (canvas: HTMLCanvasElement): CanvasContext => {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Ensure valid dimensions
  if (rect.width === 0 || rect.height === 0) {
    // This can happen during initialization, not a critical error
    return {
      canvas,
      ctx: canvas.getContext('2d')!,
      width: 0,
      height: 0,
      pixelRatio
    };
  }
  
  canvas.width = rect.width * pixelRatio;
  canvas.height = rect.height * pixelRatio;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(pixelRatio, pixelRatio);
  
  return {
    canvas,
    ctx,
    width: rect.width,
    height: rect.height,
    pixelRatio
  };
};

/**
 * Helper function for rounded rectangles
 */
const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  if (width < 0 || height < 0) return;
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

/**
 * Maps value percentage to visual position with edge constraints
 */
const mapValueToVisualPercent = (valuePercent: number, handleSize: number, trackWidth: number): number => {
  const edgeConstraint = (handleSize / 2) / trackWidth * 100;
  const minEdge = edgeConstraint;
  const maxEdge = 100 - edgeConstraint;
  const visualRange = maxEdge - minEdge;
  
  if (valuePercent <= 0) return minEdge;
  if (valuePercent >= 100) return maxEdge;
  return minEdge + (valuePercent / 100) * visualRange;
};

/**
 * Draws track segments on canvas
 */
const drawTracks = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: SliderConfig,
  state: any
) => {
  const trackY = height / 2;
  const trackHeight = 4;
  const borderRadius = 2;
  const handleSize = 20; // Standard handle size
  
  // Get colors directly from theme
  const variant = config.color || 'primary';
  const primaryColor = getThemeColor(`sys-color-${variant}`, { fallback: '#1976d2' });
  const inactiveColor = getThemeColor(`sys-color-${variant}-rgb`, { alpha: 0.24, fallback: 'rgba(25, 118, 210, 0.24)' });
  
  // Get value percentages
  const valuePercent = ((state.value - state.min) / (state.max - state.min)) * 100;
  const adjustedPercent = mapValueToVisualPercent(valuePercent, handleSize, width);
  
  // Fixed pixel gaps
  const handleGapPixels = 8;
  const centerGapPixels = 4;
  const halfCenterGapPercent = (centerGapPixels / 2 / width) * 100;
  const paddingPercent = (handleGapPixels / width) * 100;
  
  if (config.centered) {
    // Calculate center position
    const zeroPercent = ((0 - state.min) / (state.max - state.min)) * 100;
    const adjustedZeroPercent = mapValueToVisualPercent(zeroPercent, handleSize, width);
    
    // Check if handle is near center
    const handleNearCenter = Math.abs(adjustedPercent - adjustedZeroPercent) < paddingPercent;
    const isPositive = state.value >= 0;
    
    if (handleNearCenter) {
      // Handle at center - draw start and remaining tracks only
      
      // Start track (left side)
      ctx.fillStyle = inactiveColor;
      const startWidth = (adjustedPercent - paddingPercent) / 100 * width;
      if (startWidth > 0) {
        roundRect(ctx, 0, trackY - trackHeight/2, startWidth, trackHeight, borderRadius);
        ctx.fill();
      }
      
      // Remaining track (right side)
      const remainingX = (adjustedPercent + paddingPercent) / 100 * width;
      const remainingWidth = width - remainingX;
      if (remainingWidth > 0) {
        roundRect(ctx, remainingX, trackY - trackHeight/2, remainingWidth, trackHeight, borderRadius);
        ctx.fill();
      }
    } else if (isPositive) {
      // Positive value - active track from center to handle
      
      // Start track (from minimum to center)
      ctx.fillStyle = inactiveColor;
      const startWidth = (adjustedZeroPercent - halfCenterGapPercent) / 100 * width;
      if (startWidth > 0) {
        roundRect(ctx, 0, trackY - trackHeight/2, startWidth, trackHeight, borderRadius);
        ctx.fill();
      }
      
      // Active track (from center to handle)
      ctx.fillStyle = primaryColor;
      const activeX = (adjustedZeroPercent + halfCenterGapPercent) / 100 * width;
      const activeWidth = (adjustedPercent - paddingPercent) / 100 * width - activeX;
      if (activeWidth > 0) {
        roundRect(ctx, activeX, trackY - trackHeight/2, activeWidth, trackHeight, borderRadius);
        ctx.fill();
      }
      
      // Remaining track (from handle to maximum)
      ctx.fillStyle = inactiveColor;
      const remainingX = (adjustedPercent + paddingPercent) / 100 * width;
      const remainingWidth = width - remainingX;
      if (remainingWidth > 0) {
        roundRect(ctx, remainingX, trackY - trackHeight/2, remainingWidth, trackHeight, borderRadius);
        ctx.fill();
      }
    } else {
      // Negative value - active track from handle to center
      
      // Start track (from minimum to handle)
      ctx.fillStyle = inactiveColor;
      const startWidth = (adjustedPercent - paddingPercent) / 100 * width;
      if (startWidth > 0) {
        roundRect(ctx, 0, trackY - trackHeight/2, startWidth, trackHeight, borderRadius);
        ctx.fill();
      }
      
      // Active track (from handle to center)
      ctx.fillStyle = primaryColor;
      const activeX = (adjustedPercent + paddingPercent) / 100 * width;
      const activeWidth = (adjustedZeroPercent - halfCenterGapPercent) / 100 * width - activeX;
      if (activeWidth > 0) {
        roundRect(ctx, activeX, trackY - trackHeight/2, activeWidth, trackHeight, borderRadius);
        ctx.fill();
      }
      
      // Remaining track (from center to maximum)
      ctx.fillStyle = inactiveColor;
      const remainingX = (adjustedZeroPercent + halfCenterGapPercent) / 100 * width;
      const remainingWidth = width - remainingX;
      if (remainingWidth > 0) {
        roundRect(ctx, remainingX, trackY - trackHeight/2, remainingWidth, trackHeight, borderRadius);
        ctx.fill();
      }
    }
  } else if (config.range && state.secondValue !== null) {
    // Range slider
    const secondPercent = ((state.secondValue - state.min) / (state.max - state.min)) * 100;
    const adjustedSecondPercent = mapValueToVisualPercent(secondPercent, handleSize, width);
    
    const lowerPercent = Math.min(adjustedPercent, adjustedSecondPercent);
    const higherPercent = Math.max(adjustedPercent, adjustedSecondPercent);
    
    // Inactive track before first handle
    ctx.fillStyle = inactiveColor;
    const startWidth = (lowerPercent - paddingPercent) / 100 * width;
    if (startWidth > 0) {
      roundRect(ctx, 0, trackY - trackHeight/2, startWidth, trackHeight, borderRadius);
      ctx.fill();
    }
    
    // Active track between handles
    const activeX = (lowerPercent + paddingPercent) / 100 * width;
    const activeWidth = (higherPercent - paddingPercent) / 100 * width - activeX;
    
    if (activeWidth > trackHeight) { // Only show if handles aren't too close
      ctx.fillStyle = primaryColor;
      roundRect(ctx, activeX, trackY - trackHeight/2, activeWidth, trackHeight, borderRadius);
      ctx.fill();
    }
    
    // Inactive track after second handle
    ctx.fillStyle = inactiveColor;
    const remainingX = (higherPercent + paddingPercent) / 100 * width;
    const remainingWidth = width - remainingX;
    if (remainingWidth > 0) {
      roundRect(ctx, remainingX, trackY - trackHeight/2, remainingWidth, trackHeight, borderRadius);
      ctx.fill();
    }
  } else {
    // Single handle slider
    
    // Active track (from start to handle)
    ctx.fillStyle = primaryColor;
    const activeWidth = (adjustedPercent - paddingPercent) / 100 * width;
    if (activeWidth > 0) {
      roundRect(ctx, 0, trackY - trackHeight/2, activeWidth, trackHeight, borderRadius);
      ctx.fill();
    }
    
    // Remaining track (from handle to end)
    ctx.fillStyle = inactiveColor;
    const remainingX = (adjustedPercent + paddingPercent) / 100 * width;
    const remainingWidth = width - remainingX;
    if (remainingWidth > 0) {
      roundRect(ctx, remainingX, trackY - trackHeight/2, remainingWidth, trackHeight, borderRadius);
      ctx.fill();
    }
  }
};

/**
 * Draws tick marks on canvas
 */
const drawTicks = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: SliderConfig,
  state: any
) => {
  if (!config.ticks) return;
  
  const tickSize = 4;
  const y = height / 2;
  const handleSize = 20;
  
  // Get colors directly from theme
  const variant = config.color || 'primary';
  const tickActiveColor = getThemeColor(`sys-color-on-${variant}`, { fallback: '#ffffff' });
  const tickInactiveColor = getThemeColor(`sys-color-${variant}`, { fallback: '#1976d2' });
  
  // Calculate tick values
  const numSteps = Math.floor((state.max - state.min) / state.step);
  
  for (let i = 0; i <= numSteps; i++) {
    const value = state.min + (i * state.step);
    if (value > state.max) continue;
    
    // Get position with edge constraints
    const percent = ((value - state.min) / (state.max - state.min)) * 100;
    const adjustedPercent = mapValueToVisualPercent(percent, handleSize, width);
    const x = adjustedPercent / 100 * width;
    
    // Skip tick if it's at handle position
    const isAtHandle = Math.abs(value - state.value) < state.step * 0.1;
    const isAtSecondHandle = config.range && state.secondValue !== null && 
                            Math.abs(value - state.secondValue) < state.step * 0.1;
    
    if (isAtHandle || isAtSecondHandle) continue;
    
    // Determine if tick is active
    let isActive = false;
    
    if (config.centered) {
      isActive = state.value >= 0 
        ? (value >= 0 && value <= state.value)
        : (value >= state.value && value <= 0);
    } else if (config.range && state.secondValue !== null) {
      const lowerValue = Math.min(state.value, state.secondValue);
      const higherValue = Math.max(state.value, state.secondValue);
      isActive = value >= lowerValue && value <= higherValue;
    } else {
      isActive = value <= state.value;
    }
    
    // Draw tick
    ctx.fillStyle = isActive ? tickActiveColor : tickInactiveColor;
    ctx.globalAlpha = isActive ? 1 : 0.5;
    ctx.beginPath();
    ctx.arc(x, y, tickSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.globalAlpha = 1;
};

/**
 * Draws dots at track ends
 */
const drawDots = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: SliderConfig
) => {
  const dotSize = 4;
  const y = height / 2;
  const padding = 6;
  
  // Get colors directly from theme
  const variant = config.color || 'primary';
  const dotStartColor = getThemeColor(`sys-color-on-${variant}`, { fallback: '#ffffff' });
  const dotEndColor = getThemeColor(`sys-color-${variant}`, { fallback: '#1976d2' });
  
  // Start dot
  ctx.fillStyle = dotStartColor;
  ctx.beginPath();
  ctx.arc(padding, y, dotSize / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // End dot
  ctx.fillStyle = dotEndColor;
  ctx.beginPath();
  ctx.arc(width - padding, y, dotSize / 2, 0, Math.PI * 2);
  ctx.fill();
};

/**
 * Main drawing function
 */
const draw = (
  context: CanvasContext,
  config: SliderConfig,
  state: any
): void => {
  const { ctx, width, height } = context;
  
  // Skip drawing if canvas has no dimensions
  if (width === 0 || height === 0) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw in order: dots, tracks, ticks
  drawDots(ctx, width, height, config);
  drawTracks(ctx, width, height, config, state);
  drawTicks(ctx, width, height, config, state);
};

/**
 * Adds canvas functionality for slider visuals
 * Keeps handle and value bubble as DOM elements for accessibility
 */
export const withCanvas = (config: SliderConfig) => 
  (component: any): CanvasSliderComponent => {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.className = `${component.getClass('slider-canvas')}`;
    canvas.style.position = 'absolute';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none'; // Canvas doesn't handle interactions
    canvas.style.zIndex = '1'; // Ensure canvas is above track but below handle
    
    // Insert canvas as first child (behind interactive elements)
    const container = component.components?.container;
    if (container) {
      // Insert as first child of container
      if (container.firstChild) {
        container.insertBefore(canvas, container.firstChild);
      } else {
        container.appendChild(canvas);
      }
    } else {
      component.element.appendChild(canvas);
    }
    
    // Setup canvas context
    let canvasContext: CanvasContext | null = null;
    let resizeCleanup: (() => void) | null = null;
    let themeCleanup: (() => void) | null = null;
    
    const initializeCanvas = (): boolean => {
      try {
        canvasContext = setupCanvas(canvas);
        component.ctx = canvasContext.ctx;
        return true;
      } catch (error) {
        console.warn('Slider canvas initialization failed:', error);
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
    
    // Store canvas reference
    component.canvas = canvas;
    
    // Drawing function
    const drawCanvas = (controllerState?: any): void => {
      if (!canvasContext) {
        console.warn('Canvas context not ready');
        return;
      }
      
      // Get current state - prefer passed state, then slider API, then config
      let state;
      if (controllerState) {
        // Use state passed from controller
        state = {
          value: controllerState.value,
          secondValue: controllerState.secondValue,
          min: controllerState.min,
          max: controllerState.max,
          step: controllerState.step
        };
      } else if (component.slider) {
        // Fallback to slider API
        state = {
          value: component.slider.getValue(),
          secondValue: component.slider.getSecondValue(),
          min: component.slider.getMin(),
          max: component.slider.getMax(),
          step: component.slider.getStep()
        };
      } else {
        // Use config values as final fallback
        state = {
          value: config.value || 0,
          secondValue: config.secondValue || null,
          min: config.min || 0,
          max: config.max || 100,
          step: config.step || 1
        };
      }
      
      draw(canvasContext, config, state);
    };
    
    // Resize function
    const resize = (): void => {
      if (!canvasContext) return;
      
      try {
        const newContext = setupCanvas(canvas);
        component.ctx = newContext.ctx;
        Object.assign(canvasContext, newContext);
        drawCanvas();
      } catch (error) {
        console.warn('Slider canvas resize failed:', error);
      }
    };
    
    // Setup observers
    resizeCleanup = observeCanvasResize(component.element, canvas, resize);
    
    // Observe theme changes
    const cleanup = getThemeColor(`sys-color-${config.color || 'primary'}`, { 
      onThemeChange: () => {
        drawCanvas();
      }
    });
    themeCleanup = typeof cleanup === 'function' ? cleanup : null;
    
    // Initial draw
    requestAnimationFrame(() => {
      drawCanvas();
    });
    
    // Extend component with canvas methods
    component.drawCanvas = drawCanvas;
    component.resize = resize;
    
    // Update color method
    const originalSetColor = component.appearance?.setColor;
    if (originalSetColor) {
      component.appearance.setColor = (color: SliderColor) => {
        originalSetColor(color);
        config.color = color;
        drawCanvas();
      };
    }
    
    // Clean up on destroy
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy || (() => {});
      component.lifecycle.destroy = () => {
        if (resizeCleanup) resizeCleanup();
        if (themeCleanup) themeCleanup();
        originalDestroy();
      };
    }
    
    return component as CanvasSliderComponent;
  }; 