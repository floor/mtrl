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
const setupCanvas = (canvas: HTMLCanvasElement, isCircular: boolean): CanvasContext => {
  const pixelRatio = window.devicePixelRatio || 1;
  
  let width: number, height: number;
  
  if (isCircular) {
    // Square canvas for circular progress
    width = height = PROGRESS_MEASUREMENTS.CIRCULAR.SIZE;
  } else {
    // Get dimensions from parent or use defaults
    const rect = canvas.parentElement?.getBoundingClientRect();
    width = rect?.width || 200;
    height = getStrokeWidth() || PROGRESS_MEASUREMENTS.LINEAR.HEIGHT;
  }
  
  // Set display size
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  // Set actual canvas size accounting for pixel ratio
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  
  const ctx = canvas.getContext('2d')!;
  
  // Scale context to match pixel ratio
  ctx.scale(pixelRatio, pixelRatio);
  
  return { canvas, ctx, width, height, pixelRatio };
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
 * Draws linear progress on canvas
 */
const drawLinearProgress = (
  context: CanvasContext,
  config: ProgressConfig, 
  value: number,
  max: number,
  buffer: number,
  isIndeterminate: boolean
): void => {
  const { ctx, width, height } = context;
  const strokeWidth = getStrokeWidth(config.thickness);
  const y = height / 2;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  
  if (isIndeterminate) {
    // For indeterminate, draw a simple bar that CSS will animate
    // The animation is handled by CSS transform on the canvas element
    const barWidth = width * 0.4;
    
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--mtrl-primary') || '#6200ea';
    
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(barWidth, y);
    ctx.stroke();
  } else {
    const percentage = value / max;
    const bufferPercentage = buffer / max;
    
    // Don't draw background track - container CSS handles this
    
    // Buffer indicator (if applicable)
    if (buffer > 0 && bufferPercentage > percentage) {
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--mtrl-secondary-container') || '#e8f5e8';
      
      const bufferWidth = width * bufferPercentage;
      const progressWidth = width * percentage;
      
      ctx.beginPath();
      ctx.moveTo(progressWidth + 2, y); // Small gap after progress
      ctx.lineTo(bufferWidth, y);
      ctx.stroke();
    }
    
    // Progress indicator
    if (percentage > 0) {
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--mtrl-primary') || '#6200ea';
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width * percentage, y);
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
    
    // Add canvas to component element
    component.element.appendChild(canvas);
    
    // Setup canvas context
    const canvasContext = setupCanvas(canvas, isCircular);
    
    // Store canvas references
    component.canvas = canvas;
    component.ctx = canvasContext.ctx;
    
    // Drawing function
    const draw = (): void => {
      // Get current state values (these will be provided by withState)
      const value = component.state?.value || config.value || 0;
      const max = component.state?.max || config.max || 100;
      const buffer = component.state?.buffer || config.buffer || 0;
      const isIndeterminate = component.state?.indeterminate || config.indeterminate || false;
      
      if (isCircular) {
        drawCircularProgress(canvasContext, config, value, max, isIndeterminate);
      } else {
        drawLinearProgress(canvasContext, config, value, max, buffer, isIndeterminate);
      }
    };
    
    // Resize function
    const resize = (): void => {
      const newContext = setupCanvas(canvas, isCircular);
      component.ctx = newContext.ctx;
      Object.assign(canvasContext, newContext);
      draw();
    };
    
    // Handle window resize
    let resizeTimer: number;
    const handleResize = (): void => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial draw
    requestAnimationFrame(draw);
    
    // Cleanup on destroy
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy || (() => {});
      component.lifecycle.destroy = () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimer);
        originalDestroy();
      };
    }
    
    return {
      ...component,
      canvas,
      ctx: canvasContext.ctx,
      draw,
      resize
    };
  };