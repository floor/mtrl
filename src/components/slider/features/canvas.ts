import { SliderConfig, SliderColor } from '../types';
import { getThemeColor } from '../../../core/utils';
import { observeCanvasResize, clipRoundedRect, fillRoundedRectLR, clearCanvas, easeOutCubic, ANIMATION_DURATIONS } from '../../../core/canvas';
import { SLIDER_SIZES, SLIDER_MEASUREMENTS, SliderSize } from '../constants';

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
 * Animation state for smooth transitions
 */
interface AnimationState {
  // Current animated values
  animatedValue: number;
  animatedSecondValue: number | null;
  
  // Target values
  targetValue: number;
  targetSecondValue: number | null;
  
  // Start values for current animation
  startValue: number;
  startSecondValue: number | null;
  
  // Animation timing
  startTime: number;
  duration: number;
  animationFrame: number | null;
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
  animationState?: AnimationState;
  [key: string]: any;
}

/**
 * Converts a color to RGBA with specified opacity
 * Handles hex, rgb, rgba, and named colors
 */
const colorToRGBA = (color: string, opacity: number): string => {
  // Create a temporary canvas to get computed color
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return `rgba(0, 0, 0, ${opacity})`;
  
  // Set the color and get computed value
  ctx.fillStyle = color;
  const computedColor = ctx.fillStyle;
  
  // Handle hex colors
  if (computedColor.startsWith('#')) {
    const hex = computedColor.substring(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Handle rgb/rgba colors
  if (computedColor.startsWith('rgb')) {
    const match = computedColor.match(/\d+/g);
    if (match) {
      const [r, g, b] = match;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  // Fallback
  return `rgba(0, 0, 0, ${opacity})`;
};

/**
 * Gets the track height value from the size config
 */
export const getTrackHeight = (size?: SliderSize): number => {
  if (typeof size === 'number') {
    return Math.max(size, SLIDER_SIZES.XS);
  }
  
  if (typeof size === 'string' && size in SLIDER_SIZES) {
    return SLIDER_SIZES[size as keyof typeof SLIDER_SIZES];
  }
  
  return SLIDER_SIZES.XS; // Default to XS
};

/**
 * Gets the handle height based on the slider size
 */
export const getHandleHeight = (size?: SliderSize): number => {
  const trackHeight = getTrackHeight(size);
  
  // For XS and S sizes, use SMALL_HANDLE_HEIGHT constant
  if (trackHeight <= SLIDER_SIZES.S) {
    return SLIDER_MEASUREMENTS.SMALL_HANDLE_HEIGHT;
  }
  
  // For M, L, XL sizes, handle height is larger than track by HANDLE_HEIGHT_OFFSET
  return trackHeight + SLIDER_MEASUREMENTS.HANDLE_HEIGHT_OFFSET;
};

/**
 * Gets the external track radius based on the slider size
 */
export const getExternalTrackRadius = (size?: SliderSize): number => {
  const trackHeight = getTrackHeight(size);
  
  // For XS and S sizes, use SMALL_TRACK_EXTERNAL_RADIUS constant
  if (trackHeight <= SLIDER_SIZES.S) {
    return SLIDER_MEASUREMENTS.SMALL_TRACK_EXTERNAL_RADIUS;
  }
  
  // For M, L, XL sizes, use track height multiplied by ratio
  return trackHeight * SLIDER_MEASUREMENTS.LARGE_TRACK_RADIUS_RATIO;
};

/**
 * Updates canvas dimensions based on current size
 */
const updateCanvasDimensions = (
  canvas: HTMLCanvasElement,
  context: CanvasContext,
  config?: SliderConfig
): void => {
  const pixelRatio = window.devicePixelRatio || 1;
  const trackHeight = getTrackHeight(config?.size);
  const handleHeight = getHandleHeight(config?.size);
  const { ctx } = context;
  
  const sliderElement = canvas.parentElement;
  if (!sliderElement) return;
  
  const width = Math.max(sliderElement.getBoundingClientRect().width || sliderElement.offsetWidth, 200);
  // Use the larger of handle height + padding or minimum height
  const height = Math.max(handleHeight + 20, trackHeight + 32, SLIDER_MEASUREMENTS.MIN_HEIGHT);
  
  // Update canvas dimensions
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  
  // Update container height
  sliderElement.style.height = `${height}px`;
  
  context.width = width;
  context.height = height;
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(pixelRatio, pixelRatio);
};

/**
 * Sets up canvas with proper pixel ratio and dimensions
 */
const setupCanvas = (canvas: HTMLCanvasElement, config?: SliderConfig): CanvasContext => {
  const context: CanvasContext = {
    canvas,
    ctx: canvas.getContext('2d')!,
    width: 0,
    height: 0,
    pixelRatio: window.devicePixelRatio || 1
  };
  
  updateCanvasDimensions(canvas, context, config);
  return context;
};

/**
 * Maps value percentage to visual position with edge constraints
 */
const mapValueToVisualPercent = (valuePercent: number, trackWidth: number): number => {
  const edgeConstraint = SLIDER_MEASUREMENTS.EDGE_PADDING / trackWidth * 100;
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
  const trackHeight = getTrackHeight(config.size);
  const containerRadius = getExternalTrackRadius(config.size); // Container radius for clipping
  const trackRadius = SLIDER_MEASUREMENTS.TRACK_RADIUS; // Uniform 2px radius for all tracks
  
  // Create clipping region with container radius (mimics CSS overflow: hidden with border-radius)
  const restoreClip = clipRoundedRect(
    ctx, 
    0, 
    trackY - trackHeight/2, 
    width, 
    trackHeight, 
    containerRadius
  );
  
  // Get colors directly from theme
  const variant = config.color || 'primary';
  const primaryColor = getThemeColor(`sys-color-${variant}`, { fallback: '#1976d2' });
  const inactiveColor = colorToRGBA(primaryColor, 0.24);
  
  // Get value percentages
  const valuePercent = ((state.value - state.min) / (state.max - state.min)) * 100;
  const adjustedPercent = mapValueToVisualPercent(valuePercent, width);
  
  // Fixed pixel gaps - instantly reduce by HANDLE_GAP_PRESSED_REDUCTION when pressed
  const gapReduction = state.pressed ? SLIDER_MEASUREMENTS.HANDLE_GAP_PRESSED_REDUCTION : 0;
  const handleGapPixels = SLIDER_MEASUREMENTS.HANDLE_GAP - gapReduction;
  const centerGapPixels = SLIDER_MEASUREMENTS.CENTER_GAP;
  const halfCenterGapPercent = (centerGapPixels / 2 / width) * 100;
  const paddingPercent = (handleGapPixels / width) * 100;
  
  if (config.centered) {
    // Calculate center position
    const zeroPercent = ((0 - state.min) / (state.max - state.min)) * 100;
    const adjustedZeroPercent = mapValueToVisualPercent(zeroPercent, width);
    
    // Check if handle is near center
    const handleNearCenter = Math.abs(adjustedPercent - adjustedZeroPercent) < paddingPercent;
    const isPositive = state.value >= 0;
    
    if (handleNearCenter) {
      // Handle at center - draw start and remaining tracks only
      
      // Start track (left side)
      const startWidth = (adjustedPercent - paddingPercent) / 100 * width;
      if (startWidth > 0) {
        fillRoundedRectLR(ctx, 0, trackY - trackHeight/2, startWidth, trackHeight, trackRadius, trackRadius, inactiveColor);
      }
      
      // Remaining track (right side)
      const remainingX = (adjustedPercent + paddingPercent) / 100 * width;
      const remainingWidth = width - remainingX;
      if (remainingWidth > 0) {
        fillRoundedRectLR(ctx, remainingX, trackY - trackHeight/2, remainingWidth, trackHeight, trackRadius, trackRadius, inactiveColor);
      }
    } else if (isPositive) {
      // Positive value - active track from center to handle
      
      // Start track (from minimum to center)
      const startWidth = (adjustedZeroPercent - halfCenterGapPercent) / 100 * width;
      if (startWidth > 0) {
        fillRoundedRectLR(ctx, 0, trackY - trackHeight/2, startWidth, trackHeight, trackRadius, trackRadius, inactiveColor);
      }
      
      // Active track (from center to handle)
      const activeX = (adjustedZeroPercent + halfCenterGapPercent) / 100 * width;
      const activeWidth = (adjustedPercent - paddingPercent) / 100 * width - activeX;
      if (activeWidth > 0) {
        fillRoundedRectLR(ctx, activeX, trackY - trackHeight/2, activeWidth, trackHeight, trackRadius, trackRadius, primaryColor);
      }
      
      // Remaining track (from handle to maximum)
      const remainingX = (adjustedPercent + paddingPercent) / 100 * width;
      const remainingWidth = width - remainingX;
      if (remainingWidth > 0) {
        fillRoundedRectLR(ctx, remainingX, trackY - trackHeight/2, remainingWidth, trackHeight, trackRadius, trackRadius, inactiveColor);
      }
    } else {
      // Negative value - active track from handle to center
      
      // Start track (from minimum to handle)
      const startWidth = (adjustedPercent - paddingPercent) / 100 * width;
      if (startWidth > 0) {
        fillRoundedRectLR(ctx, 0, trackY - trackHeight/2, startWidth, trackHeight, trackRadius, trackRadius, inactiveColor);
      }
      
      // Active track (from handle to center)
      const activeX = (adjustedPercent + paddingPercent) / 100 * width;
      const activeWidth = (adjustedZeroPercent - halfCenterGapPercent) / 100 * width - activeX;
      if (activeWidth > 0) {
        fillRoundedRectLR(ctx, activeX, trackY - trackHeight/2, activeWidth, trackHeight, trackRadius, trackRadius, primaryColor);
      }
      
      // Remaining track (from center to maximum)
      const remainingX = (adjustedZeroPercent + halfCenterGapPercent) / 100 * width;
      const remainingWidth = width - remainingX;
      if (remainingWidth > 0) {
        fillRoundedRectLR(ctx, remainingX, trackY - trackHeight/2, remainingWidth, trackHeight, trackRadius, trackRadius, inactiveColor);
      }
    }
  } else if (config.range && state.secondValue !== null) {
    // Range slider
    const secondPercent = ((state.secondValue - state.min) / (state.max - state.min)) * 100;
    const adjustedSecondPercent = mapValueToVisualPercent(secondPercent, width);
    
    const lowerPercent = Math.min(adjustedPercent, adjustedSecondPercent);
    const higherPercent = Math.max(adjustedPercent, adjustedSecondPercent);
    
    // Determine which handle is at lower/higher position
    const firstHandleIsLower = adjustedPercent <= adjustedSecondPercent;
    
    // Apply gap reduction only to the active handle
    const firstHandleGapReduction = (state.pressed && state.activeHandle === 'first') ? SLIDER_MEASUREMENTS.HANDLE_GAP_PRESSED_REDUCTION : 0;
    const secondHandleGapReduction = (state.pressed && state.activeHandle === 'second') ? SLIDER_MEASUREMENTS.HANDLE_GAP_PRESSED_REDUCTION : 0;
    
    const firstHandleGapPixels = SLIDER_MEASUREMENTS.HANDLE_GAP - firstHandleGapReduction;
    const secondHandleGapPixels = SLIDER_MEASUREMENTS.HANDLE_GAP - secondHandleGapReduction;
    
    const lowerHandleGapPercent = firstHandleIsLower 
      ? (firstHandleGapPixels / width) * 100 
      : (secondHandleGapPixels / width) * 100;
      
    const higherHandleGapPercent = firstHandleIsLower 
      ? (secondHandleGapPixels / width) * 100 
      : (firstHandleGapPixels / width) * 100;
    
    // Inactive track before first handle
    const startWidth = (lowerPercent - lowerHandleGapPercent) / 100 * width;
    if (startWidth > 0) {
      fillRoundedRectLR(ctx, 0, trackY - trackHeight/2, startWidth, trackHeight, trackRadius, trackRadius, inactiveColor);
    }
    
    // Active track between handles
    const activeX = (lowerPercent + lowerHandleGapPercent) / 100 * width;
    const activeWidth = (higherPercent - higherHandleGapPercent) / 100 * width - activeX;
    
    if (activeWidth > trackHeight) { // Only show if handles aren't too close
      fillRoundedRectLR(ctx, activeX, trackY - trackHeight/2, activeWidth, trackHeight, trackRadius, trackRadius, primaryColor);
    }
    
    // Inactive track after second handle
    const remainingX = (higherPercent + higherHandleGapPercent) / 100 * width;
    const remainingWidth = width - remainingX;
    if (remainingWidth > 0) {
      fillRoundedRectLR(ctx, remainingX, trackY - trackHeight/2, remainingWidth, trackHeight, trackRadius, trackRadius, inactiveColor);
    }
  } else {
    // Single handle slider
    
    // Active track (from start to handle)
    const activeWidth = (adjustedPercent - paddingPercent) / 100 * width;
    if (activeWidth > 0) {
      fillRoundedRectLR(ctx, 0, trackY - trackHeight/2, activeWidth, trackHeight, trackRadius, trackRadius, primaryColor);
    }
    
    // Remaining track (from handle to end)
    const remainingX = (adjustedPercent + paddingPercent) / 100 * width;
    const remainingWidth = width - remainingX;
    if (remainingWidth > 0) {
      fillRoundedRectLR(ctx, remainingX, trackY - trackHeight/2, remainingWidth, trackHeight, trackRadius, trackRadius, inactiveColor);
    }
  }
  
  // Restore canvas state (removes clipping)
  restoreClip();
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
  
  const tickSize = SLIDER_MEASUREMENTS.TICK_SIZE;
  const y = height / 2;
  
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
    const adjustedPercent = mapValueToVisualPercent(percent, width);
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
  // Don't draw dots for discrete sliders (sliders with ticks)
  if (config.ticks) return;
  
  const dotSize = SLIDER_MEASUREMENTS.DOT_SIZE;
  const y = height / 2;
  const padding = SLIDER_MEASUREMENTS.EDGE_PADDING;
  
  // Get colors directly from theme
  const variant = config.color || 'primary';
  const dotColor = getThemeColor(`sys-color-${variant}`, { fallback: '#1976d2' });
  
  // For continuous sliders, only draw end dot
  ctx.fillStyle = dotColor;
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
  clearCanvas(ctx, width, height);
  
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
    
    // Current size - managed by API
    let currentSize = config.size || 'XS';
    
    // Store last known state for theme changes
    let lastKnownState = {
      value: config.value || 0,
      secondValue: config.secondValue || null,
      min: config.min || 0,
      max: config.max || 100,
      step: config.step || 1,
      pressed: false,
      activeHandle: null
    };
    
    // Initialize animation state
    const animationState: AnimationState = {
      animatedValue: config.value || 0,
      animatedSecondValue: config.secondValue || null,
      targetValue: config.value || 0,
      targetSecondValue: config.secondValue || null,
      startValue: config.value || 0,
      startSecondValue: config.secondValue || null,
      startTime: 0,
      duration: ANIMATION_DURATIONS.MEDIUM, // Material Design standard duration
      animationFrame: null
    };
    
    component.animationState = animationState;
    
    const initializeCanvas = (): boolean => {
      try {
        canvasContext = setupCanvas(canvas, {
          ...config,
          size: currentSize
        });
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
    
    // Set initial handle sizes
    const initialHandleHeight = getHandleHeight(currentSize);
    const components = component.components;
    if (components) {
      // Set main handle size
      if (components.handle) {
        components.handle.style.width = `${SLIDER_MEASUREMENTS.HANDLE_SIZE}px`; // Keep width constant
        components.handle.style.height = `${initialHandleHeight}px`;
      }
      
      // Set second handle size for range sliders
      if (components.secondHandle) {
        components.secondHandle.style.width = `${SLIDER_MEASUREMENTS.HANDLE_SIZE}px`; // Keep width constant
        components.secondHandle.style.height = `${initialHandleHeight}px`;
      }
    }
    
    // Store canvas reference
    component.canvas = canvas;
    
    // Animation loop function
    const animate = (currentTime?: number): void => {
      if (!canvasContext) return;
      
      // If no currentTime provided, use performance.now()
      const now = currentTime || performance.now();
      const elapsed = now - animationState.startTime;
      const progress = Math.min(elapsed / animationState.duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      // Update animated values
      const startValue = animationState.startValue;
      const targetValue = animationState.targetValue;
      animationState.animatedValue = startValue + (targetValue - startValue) * easedProgress;
      
      if (animationState.targetSecondValue !== null && animationState.animatedSecondValue !== null) {
        const startSecondValue = animationState.startSecondValue;
        const targetSecondValue = animationState.targetSecondValue;
        animationState.animatedSecondValue = startSecondValue + (targetSecondValue - startSecondValue) * easedProgress;
      }
      
      // Draw with animated values
      const animatedState = {
        ...lastKnownState,
        value: animationState.animatedValue,
        secondValue: animationState.animatedSecondValue
      };
      
      draw(canvasContext, {
        ...config,
        size: currentSize
      }, animatedState);
      
      // Continue animation if not complete
      if (progress < 1) {
        animationState.animationFrame = requestAnimationFrame((time) => animate(time));
      } else {
        animationState.animationFrame = null;
      }
    };
    
    // Drawing function
    const drawCanvas = (controllerState?: any): void => {
      if (!canvasContext) {
        console.warn('Canvas context not ready');
        return;
      }
      
      // Update dimensions in case size changed
      updateCanvasDimensions(canvas, canvasContext, {
        ...config,
        size: currentSize
      });
      
      // Get current state - prefer passed state, then slider API, then last known state
      let state;
      let isDragging = false;
      
      if (controllerState) {
        // Use state passed from controller and update last known state
        state = {
          value: controllerState.value,
          secondValue: controllerState.secondValue,
          min: controllerState.min,
          max: controllerState.max,
          step: controllerState.step,
          pressed: controllerState.pressed || false,
          activeHandle: controllerState.activeHandle || null
        };
        isDragging = controllerState.dragging || false;
        lastKnownState = { ...state };
      } else if (component.slider) {
        // Fallback to slider API and update last known state
        state = {
          value: component.slider.getValue(),
          secondValue: component.slider.getSecondValue(),
          min: component.slider.getMin(),
          max: component.slider.getMax(),
          step: component.slider.getStep()
        };
        lastKnownState = { ...state };
      } else {
        // Use last known state as fallback
        state = { ...lastKnownState };
      }
      
      // Check if we need to animate (skip animation when dragging)
      const valueChanged = state.value !== animationState.targetValue;
      const secondValueChanged = state.secondValue !== animationState.targetSecondValue;
      
      if ((valueChanged || secondValueChanged) && !isDragging) {
        // Capture start values before updating targets
        animationState.startValue = animationState.animatedValue;
        animationState.startSecondValue = animationState.animatedSecondValue;
        
        // Update target values
        animationState.targetValue = state.value;
        animationState.targetSecondValue = state.secondValue;
        
        // Cancel any existing animation
        if (animationState.animationFrame) {
          cancelAnimationFrame(animationState.animationFrame);
        }
        
        // Start new animation
        animationState.startTime = performance.now();
        
        // Draw first frame immediately to sync with handle movement
        animate();
      } else if (isDragging) {
        // When dragging, update values immediately without animation
        animationState.animatedValue = state.value;
        animationState.animatedSecondValue = state.secondValue;
        animationState.targetValue = state.value;
        animationState.targetSecondValue = state.secondValue;
        animationState.startValue = state.value;
        animationState.startSecondValue = state.secondValue;
        
        // Cancel any ongoing animation
        if (animationState.animationFrame) {
          cancelAnimationFrame(animationState.animationFrame);
          animationState.animationFrame = null;
        }
        
        // Draw immediately
        draw(canvasContext, {
          ...config,
          size: currentSize
        }, controllerState || state);
      } else {
        // No animation needed, draw current state
        draw(canvasContext, {
          ...config,
          size: currentSize
        }, controllerState || state);
      }
    };
    
    // Resize function
    const resize = (): void => {
      if (!canvasContext) return;
      
      try {
        const newContext = setupCanvas(canvas, {
          ...config,
          size: currentSize
        });
        component.ctx = newContext.ctx;
        Object.assign(canvasContext, newContext);
        
        // Redraw with current animated values
        const animatedState = {
          ...lastKnownState,
          value: animationState.animatedValue,
          secondValue: animationState.animatedSecondValue
        };
        draw(canvasContext, {
          ...config,
          size: currentSize
        }, animatedState);
      } catch (error) {
        console.warn('Slider canvas resize failed:', error);
      }
    };
    
    // Setup observers
    resizeCleanup = observeCanvasResize(component.element, canvas, resize);
    
    // Observe theme changes
    const cleanup = getThemeColor(`sys-color-${config.color || 'primary'}`, { 
      onThemeChange: () => {
        if (!canvasContext) return;
        // Redraw with current animated values
        const animatedState = {
          ...lastKnownState,
          value: animationState.animatedValue,
          secondValue: animationState.animatedSecondValue
        };
        draw(canvasContext, {
          ...config,
          size: currentSize
        }, animatedState);
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
    
    // Add setSize method
    component.setSize = (size: SliderSize) => {
      currentSize = size;
      if (canvasContext) {
        updateCanvasDimensions(canvas, canvasContext, {
          ...config,
          size: currentSize
        });
        // Redraw with current animated values
        const animatedState = {
          ...lastKnownState,
          value: animationState.animatedValue,
          secondValue: animationState.animatedSecondValue
        };
        draw(canvasContext, {
          ...config,
          size: currentSize
        }, animatedState);
      }
      
      // Update handle sizes
      const newHandleHeight = getHandleHeight(currentSize);
      const components = component.components;
      if (components) {
        // Update main handle
        if (components.handle) {
          components.handle.style.width = `${SLIDER_MEASUREMENTS.HANDLE_SIZE}px`; // Keep width constant
          components.handle.style.height = `${newHandleHeight}px`;
        }
        
        // Update second handle for range sliders
        if (components.secondHandle) {
          components.secondHandle.style.width = `${SLIDER_MEASUREMENTS.HANDLE_SIZE}px`; // Keep width constant
          components.secondHandle.style.height = `${newHandleHeight}px`;
        }
      }
    };
    
    // Add getSize method
    component.getSize = () => currentSize;
    
    // Update color method
    const originalSetColor = component.appearance?.setColor;
    if (originalSetColor) {
      component.appearance.setColor = (color: SliderColor) => {
        originalSetColor(color);
        config.color = color;
        
        // Clean up old theme observer
        if (themeCleanup) {
          themeCleanup();
          themeCleanup = null;
        }
        
        // Set up new theme observer for the new color
        const cleanup = getThemeColor(`sys-color-${color}`, { 
          onThemeChange: () => {
            if (!canvasContext) return;
            // Redraw with current animated values
            const animatedState = {
              ...lastKnownState,
              value: animationState.animatedValue,
              secondValue: animationState.animatedSecondValue
            };
            draw(canvasContext, {
              ...config,
              size: currentSize
            }, animatedState);
          }
        });
        themeCleanup = typeof cleanup === 'function' ? cleanup : null;
        
        // Redraw with new color
        drawCanvas();
      };
    }
    
    // Clean up on destroy
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy || (() => {});
      component.lifecycle.destroy = () => {
        if (resizeCleanup) resizeCleanup();
        if (themeCleanup) themeCleanup();
        if (animationState.animationFrame) {
          cancelAnimationFrame(animationState.animationFrame);
        }
        originalDestroy();
      };
    }
    
    return component as CanvasSliderComponent;
  }; 