// src/components/timepicker/clockdial.ts

import { TimeValue, TIME_FORMAT, TIME_PICKER_TYPE, TIME_PERIOD } from './types';
import { TIMEPICKER_DIAL, TIMEPICKER_VALUES } from './constants';
import { padZero } from './utils';

/**
 * Interface for Clock Dial rendering options
 */
export interface ClockDialOptions {
  type: TIME_PICKER_TYPE;
  format: TIME_FORMAT;
  showSeconds: boolean;
  prefix: string;
  activeSelector: 'hour' | 'minute' | 'second';
}

/**
 * Theme colors interface
 */
interface ThemeColors {
  primaryColor: string;
  onPrimaryColor: string;
  onSurfaceColor: string;
  selectedBgColor: string;
  bgColor: string;
}

/**
 * Updated constants for clock dial rendering
 */
const CLOCK_CONSTANTS = {
  ...TIMEPICKER_DIAL,
  KNOB_SIZE: 45, // Large hand knob size
  CENTER_SIZE: 8,
  NUMBER_SIZE: 24, // Same size for all numbers
  INNER_RADIUS: 75, // for 24h inner ring
  OUTER_RADIUS: 100, // for main ring
  TRACK_WIDTH: 1.5,
  HAND_WIDTH: 2
};

/**
 * Get theme colors from CSS variables
 * @param {string} prefix - Component prefix (e.g., 'mtrl')
 * @returns {ThemeColors} Object with theme colors
 */
function getThemeColors(prefix: string): ThemeColors {
  const root = document.documentElement;
  const styles = getComputedStyle(root);

  // Extract primary color
  const primaryColor = styles.getPropertyValue(`--${prefix}-sys-color-primary`).trim() || '#6750A4';

  // Extract on-primary color
  const onPrimaryColor = styles.getPropertyValue(`--${prefix}-sys-color-on-primary`).trim() || '#FFFFFF';
  
  // Extract on-surface color
  const onSurfaceColor = styles.getPropertyValue(`--${prefix}-sys-color-on-surface`).trim() || '#1C1B1F';
  
  // Get RGB values for primary (for alpha calculations)
  const primaryRgb = styles.getPropertyValue(`--${prefix}-sys-color-primary-rgb`).trim() || '103, 80, 164';
  
  // Get RGB values for on-surface (for alpha calculations)
  const onSurfaceRgb = styles.getPropertyValue(`--${prefix}-sys-color-on-surface-rgb`).trim() || '28, 27, 31';
  
  // Create background with alpha
  const bgColor = `rgba(${onSurfaceRgb}, 0.05)`;
  
  // Create selected background with alpha
  const selectedBgColor = `rgba(${primaryRgb}, 0.1)`;
  
  return {
    primaryColor,
    onPrimaryColor,
    onSurfaceColor,
    bgColor,
    selectedBgColor
  };
}

/**
 * Renders a clock dial on canvas with improved visual design
 * @param {HTMLCanvasElement} canvas - Canvas element to render on
 * @param {TimeValue} timeValue - Current time value
 * @param {ClockDialOptions} options - Rendering options
 */
export const renderClockDial = (
  canvas: HTMLCanvasElement,
  timeValue: TimeValue,
  options: ClockDialOptions
): void => {
  // Get the drawing context
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get canvas context');
    return;
  }
  
  // Get theme colors on each render (to support theme changes)
  const colors = getThemeColors(options.prefix);
  
  // Ensure canvas dimensions are set correctly
  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = CLOCK_CONSTANTS.DIAMETER * devicePixelRatio;
  canvas.height = CLOCK_CONSTANTS.DIAMETER * devicePixelRatio;
  
  // Scale all drawing operations by the device pixel ratio
  ctx.scale(devicePixelRatio, devicePixelRatio);
  
  const centerX = CLOCK_CONSTANTS.DIAMETER / 2;
  const centerY = CLOCK_CONSTANTS.DIAMETER / 2;
  const radius = CLOCK_CONSTANTS.DIAMETER / 2;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw clock face (outer circle)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 2, 0, 2 * Math.PI);
  ctx.fillStyle = colors.bgColor;
  ctx.fill();
  
  // Draw center dot
  ctx.beginPath();
  ctx.arc(centerX, centerY, CLOCK_CONSTANTS.CENTER_SIZE / 2, 0, 2 * Math.PI);
  ctx.fillStyle = colors.primaryColor;
  ctx.fill();
  
  // Draw numbers based on the active selector
  if (options.activeSelector === 'hour') {
    // For hour selector
    if (options.format === TIME_FORMAT.MILITARY) {
      // 24-hour clock face
      drawHourNumbers24(ctx, centerX, centerY, radius, timeValue.hours, colors);
    } else {
      // 12-hour clock face
      drawHourNumbers12(ctx, centerX, centerY, radius, timeValue.hours % 12 || 12, colors);
    }
  } else if (options.activeSelector === 'minute') {
    // For minute selector
    drawMinuteNumbers(ctx, centerX, centerY, radius, timeValue.minutes, colors);
  } else if (options.activeSelector === 'second' && options.showSeconds) {
    // For second selector
    drawMinuteNumbers(ctx, centerX, centerY, radius, timeValue.seconds || 0, colors);
  }
  
  // Draw clock hand
  drawClockHand(ctx, centerX, centerY, timeValue, options, colors);
};

/**
 * Draws 12-hour clock numbers
 */
const drawHourNumbers12 = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  selectedHour: number,
  colors: ThemeColors
): void => {
  const numbersRadius = CLOCK_CONSTANTS.OUTER_RADIUS;
  
  for (let hour = 1; hour <= 12; hour++) {
    const angle = (hour / 6) * Math.PI - Math.PI / 2; // Convert to radians, 0 at 12 o'clock
    const x = centerX + numbersRadius * Math.cos(angle);
    const y = centerY + numbersRadius * Math.sin(angle);
    
    const isSelected = hour === selectedHour;
    
    // Draw number background circle if it's the selected hour
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, CLOCK_CONSTANTS.NUMBER_SIZE / 2, 0, 2 * Math.PI);
      ctx.fillStyle = colors.selectedBgColor;
      ctx.fill();
    }
    
    // Draw number text - same size for all, only color changes for selected
    ctx.font = `16px Roboto, Arial, sans-serif`;
    ctx.fillStyle = isSelected ? colors.primaryColor : colors.onSurfaceColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hour.toString(), x, y + 2);
  }
};

/**
 * Draws 24-hour clock numbers (two rings)
 */
const drawHourNumbers24 = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  selectedHour: number,
  colors: ThemeColors
): void => {
  // Outer ring (1-12)
  const outerRadius = CLOCK_CONSTANTS.OUTER_RADIUS;
  
  for (let hour = 1; hour <= 12; hour++) {
    const angle = (hour / 6) * Math.PI - Math.PI / 2; // Convert to radians, 0 at 12 o'clock
    const x = centerX + outerRadius * Math.cos(angle);
    const y = centerY + outerRadius * Math.sin(angle);
    
    const isSelected = hour === selectedHour;
    
    // Draw number background circle if it's the selected hour
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, CLOCK_CONSTANTS.NUMBER_SIZE / 2, 0, 2 * Math.PI);
      ctx.fillStyle = colors.selectedBgColor;
      ctx.fill();
    }
    
    // Draw number text - same size for all
    ctx.font = `16px Roboto, Arial, sans-serif`;
    ctx.fillStyle = isSelected ? colors.primaryColor : colors.onSurfaceColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hour.toString(), x, y + 2);
  }
  
  // Inner ring (13-24/0)
  const innerRadius = CLOCK_CONSTANTS.INNER_RADIUS;
  
  for (let hour = 13; hour <= 24; hour++) {
    const displayHour = hour === 24 ? 0 : hour; // Show 0 instead of 24
    const angle = ((hour - 12) / 6) * Math.PI - Math.PI / 2; // Convert to radians, 0 at 12 o'clock
    const x = centerX + innerRadius * Math.cos(angle);
    const y = centerY + innerRadius * Math.sin(angle);
    
    const isSelected = displayHour === selectedHour;
    
    // Draw number background circle if it's the selected hour
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, CLOCK_CONSTANTS.NUMBER_SIZE / 2, 0, 2 * Math.PI);
      ctx.fillStyle = colors.selectedBgColor;
      ctx.fill();
    }
    
    // Draw number text - same size but slightly smaller for inner ring
    ctx.font = `14px Roboto, Arial, sans-serif`;
    ctx.fillStyle = isSelected ? colors.primaryColor : colors.onSurfaceColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(padZero(displayHour), x, y + 2);
  }
};

/**
 * Draws minute numbers (0, 5, 10, ..., 55)
 */
const drawMinuteNumbers = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  selectedMinute: number,
  colors: ThemeColors
): void => {
  const numbersRadius = CLOCK_CONSTANTS.OUTER_RADIUS;
  
  // Draw minute markers in 5-minute increments
  for (let i = 0; i < 60; i += 5) {
    const angle = (i / 30) * Math.PI - Math.PI / 2; // Convert to radians, 0 at 12 o'clock
    const x = centerX + numbersRadius * Math.cos(angle);
    const y = centerY + numbersRadius * Math.sin(angle);
    
    const isSelected = i === selectedMinute;
    
    // Draw number background circle if it's the selected minute
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, CLOCK_CONSTANTS.NUMBER_SIZE / 2, 0, 2 * Math.PI);
      ctx.fillStyle = colors.selectedBgColor;
      ctx.fill();
    }
    
    // Draw number text - same size for all
    ctx.font = `16px Roboto, Arial, sans-serif`;
    ctx.fillStyle = isSelected ? colors.primaryColor : colors.onSurfaceColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(padZero(i), x, y);
  }
  
  // If selected minute is not a multiple of 5, draw a special marker for it
  if (selectedMinute % 5 !== 0) {
    const angle = (selectedMinute / 30) * Math.PI - Math.PI / 2;
    const x = centerX + numbersRadius * Math.cos(angle);
    const y = centerY + numbersRadius * Math.sin(angle);
    
    // Draw selected minute background
    ctx.beginPath();
    ctx.arc(x, y, CLOCK_CONSTANTS.NUMBER_SIZE / 2, 0, 2 * Math.PI);
    ctx.fillStyle = colors.selectedBgColor;
    ctx.fill();
    
    // Draw selected minute text
    ctx.font = `16px Roboto, Arial, sans-serif`;
    ctx.fillStyle = colors.primaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(padZero(selectedMinute), x, y);
  }
};

/**
 * Draws the clock hand
 */
const drawClockHand = (
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  timeValue: TimeValue,
  options: ClockDialOptions,
  colors: ThemeColors
): void => {
  let angle: number, handLength: number;
  
  // Calculate angle based on active selector
  if (options.activeSelector === 'hour') {
    if (options.format === TIME_FORMAT.MILITARY) {
      // 24-hour format
      if (timeValue.hours >= 12) {
        // Inner ring (12-23)
        const hour12 = timeValue.hours % 12 || 12;
        angle = (hour12 / 6) * Math.PI - Math.PI / 2;
        handLength = CLOCK_CONSTANTS.INNER_RADIUS;
      } else {
        // Outer ring (0-11)
        let hour12 = timeValue.hours;
        if (hour12 === 0) hour12 = 12;
        angle = (hour12 / 6) * Math.PI - Math.PI / 2;
        handLength = CLOCK_CONSTANTS.OUTER_RADIUS;
      }
    } else {
      // 12-hour format
      const hour12 = timeValue.hours % 12 || 12;
      angle = (hour12 / 6) * Math.PI - Math.PI / 2;
      handLength = CLOCK_CONSTANTS.OUTER_RADIUS;
    }
  } else if (options.activeSelector === 'minute') {
    // Minutes (0-59)
    angle = (timeValue.minutes / 30) * Math.PI - Math.PI / 2;
    handLength = CLOCK_CONSTANTS.OUTER_RADIUS;
  } else if (options.activeSelector === 'second') {
    // Seconds (0-59)
    angle = ((timeValue.seconds || 0) / 30) * Math.PI - Math.PI / 2;
    handLength = CLOCK_CONSTANTS.OUTER_RADIUS;
  } else {
    return; // No valid selector
  }
  
  // Draw hand line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(
    centerX + handLength * Math.cos(angle),
    centerY + handLength * Math.sin(angle)
  );
  ctx.lineWidth = CLOCK_CONSTANTS.HAND_WIDTH;
  ctx.strokeStyle = colors.primaryColor;
  ctx.stroke();
  
  // Draw hand knob at the end (large as in second image)
  const knobX = centerX + handLength * Math.cos(angle);
  const knobY = centerY + handLength * Math.sin(angle);
  
  // Draw the background for the knob
  ctx.beginPath();
  ctx.arc(knobX, knobY, CLOCK_CONSTANTS.KNOB_SIZE / 2, 0, 2 * Math.PI);
  ctx.fillStyle = colors.primaryColor;
  ctx.fill();
  
  // Draw the selected value in the knob
  ctx.font = `16px Roboto, Arial, sans-serif`;
  ctx.fillStyle = colors.onPrimaryColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Display the appropriate value based on active selector
  let displayValue = '';
  if (options.activeSelector === 'hour') {
    if (options.format === TIME_FORMAT.MILITARY) {
      displayValue = padZero(timeValue.hours);
    } else {
      displayValue = String(timeValue.hours % 12 || 12);
    }
  } else if (options.activeSelector === 'minute') {
    displayValue = padZero(timeValue.minutes);
  } else if (options.activeSelector === 'second') {
    displayValue = padZero(timeValue.seconds || 0);
  }
  
  ctx.fillText(displayValue, knobX, knobY);
};

/**
 * Get time value from click coordinates on the canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} x - Click X coordinate relative to canvas
 * @param {number} y - Click Y coordinate relative to canvas
 * @param {ClockDialOptions} options - Clock dial options
 * @returns {number | null} Selected value or null if not valid
 */
export const getTimeValueFromClick = (
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  options: ClockDialOptions
): number | null => {
  const centerX = CLOCK_CONSTANTS.DIAMETER / 2;
  const centerY = CLOCK_CONSTANTS.DIAMETER / 2;
  
  // Calculate click position relative to center
  const relX = x - centerX;
  const relY = y - centerY;
  
  // Calculate distance from center
  const distance = Math.sqrt(relX * relX + relY * relY);
  
  // Calculate angle in radians (0 at 12 o'clock, clockwise)
  let angle = Math.atan2(relY, relX) + Math.PI / 2;
  if (angle < 0) angle += 2 * Math.PI;
  
  // Convert angle to value based on active selector
  if (options.activeSelector === 'hour') {
    if (options.format === TIME_FORMAT.MILITARY) {
      // 24-hour format
      const innerThreshold = (CLOCK_CONSTANTS.INNER_RADIUS + CLOCK_CONSTANTS.OUTER_RADIUS) / 2;
      const isInnerRing = distance < innerThreshold;
      
      // Get base hour (0-11)
      let hour = Math.round(angle / (Math.PI / 6)) % 12;
      
      // Add 12 for inner ring (except for 12/0)
      if (isInnerRing && hour !== 0) {
        hour += 12;
      } else if (!isInnerRing && hour === 0) {
        hour = 12;
      } else if (isInnerRing && hour === 0) {
        hour = 0; // 12 AM is 0 in 24h format
      }
      
      return hour;
    } else {
      // 12-hour format
      let hour = Math.round(angle / (Math.PI / 6)) % 12;
      if (hour === 0) hour = 12;
      return hour;
    }
  } else if (options.activeSelector === 'minute' || options.activeSelector === 'second') {
    // Minutes or seconds (0-59)
    const value = Math.round(angle / (Math.PI / 30)) % 60;
    return value;
  }
  
  return null;
};

/**
 * Update the clock dial when theme changes (to be called by external code)
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {TimeValue} timeValue - Current time value
 * @param {ClockDialOptions} options - Rendering options
 */
export const updateClockDialTheme = (
  canvas: HTMLCanvasElement,
  timeValue: TimeValue,
  options: ClockDialOptions
): void => {
  // Simply re-render with current state
  renderClockDial(canvas, timeValue, options);
};