// src/components/timepicker/utils.ts

import { TimeValue, TIME_PERIOD, TIME_FORMAT } from './types';

/**
 * Pads a number with leading zeros to ensure two-digit format
 * @param {number} num - Number to pad
 * @returns {string} Padded number string
 */
export const padZero = (num: number): string => {
  return num.toString().padStart(2, '0');
};

/**
 * Converts a time string to a TimeValue object
 * @param {string} timeString - Time string in 24-hour format (HH:MM or HH:MM:SS)
 * @param {TIME_FORMAT} format - Time format (12h or 24h)
 * @returns {TimeValue} Parsed time value
 */
export const parseTime = (timeString: string, format: TIME_FORMAT): TimeValue => {
  try {
    const parts = timeString.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
    
    // Validate time components
    if (
      isNaN(hours) || hours < 0 || hours > 23 ||
      isNaN(minutes) || minutes < 0 || minutes > 59 ||
      isNaN(seconds) || seconds < 0 || seconds > 59
    ) {
      throw new Error('Invalid time format');
    }
    
    // Determine period for 12-hour format
    const period = hours >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM;
    
    return { hours, minutes, seconds, period };
  } catch (error) {
    console.error('Error parsing time:', error);
    
    // Return current time as fallback
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const period = hours >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM;
    
    return { hours, minutes, seconds, period };
  }
};

/**
 * Formats a TimeValue object as a time string
 * @param {TimeValue} timeValue - Time value to format
 * @param {boolean} use24HourFormat - Whether to use 24-hour format
 * @returns {string} Formatted time string
 */
export const formatTime = (timeValue: TimeValue, use24HourFormat: boolean): string => {
  const { hours, minutes, seconds } = timeValue;
  
  if (use24HourFormat) {
    if (seconds !== undefined) {
      return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
    }
    return `${padZero(hours)}:${padZero(minutes)}`;
  } else {
    // Convert 24-hour to 12-hour display format
    let displayHours = hours % 12;
    if (displayHours === 0) {
      displayHours = 12;
    }
    
    if (seconds !== undefined) {
      return `${padZero(displayHours)}:${padZero(minutes)}:${padZero(seconds)} ${timeValue.period}`;
    }
    return `${padZero(displayHours)}:${padZero(minutes)} ${timeValue.period}`;
  }
};

/**
 * Converts 12-hour format to 24-hour format
 * @param {number} hours - Hours in 12-hour format (1-12)
 * @param {TIME_PERIOD} period - Period (AM or PM)
 * @returns {number} Hours in 24-hour format (0-23)
 */
export const convertTo24Hour = (hours: number, period: TIME_PERIOD): number => {
  if (period === TIME_PERIOD.AM) {
    return hours === 12 ? 0 : hours;
  } else {
    return hours === 12 ? 12 : hours + 12;
  }
};

/**
 * Converts 24-hour format to 12-hour format
 * @param {number} hours24 - Hours in 24-hour format (0-23)
 * @returns {object} Object with hours in 12-hour format and period
 */
export const convertTo12Hour = (hours24: number): { hours: number; period: TIME_PERIOD } => {
  const period = hours24 >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM;
  let hours12 = hours24 % 12;
  if (hours12 === 0) {
    hours12 = 12;
  }
  
  return { hours: hours12, period };
};

/**
 * Calculates angle for clock dial based on time value
 * @param {number} value - Time value (hour 0-23 or minute/second 0-59)
 * @param {number} max - Maximum value (12 for hours in 12h format, 24 for 24h, 60 for minutes/seconds)
 * @returns {number} Angle in degrees
 */
export const getAngle = (value: number, max: number): number => {
  return (value / max) * 360;
};

/**
 * Calculates coordinates for a point on a circle
 * @param {number} radius - Circle radius
 * @param {number} angle - Angle in degrees
 * @returns {object} Coordinates { x, y }
 */
export const getCoordinates = (radius: number, angle: number): { x: number; y: number } => {
  // Convert angle to radians and adjust to start from top (subtract 90 degrees)
  // In CSS, 0 degrees is at 3 o'clock position, so we subtract 90 to start from 12 o'clock
  const radians = ((angle - 90) * Math.PI) / 180;
  
  return {
    x: radius * Math.cos(radians),
    y: radius * Math.sin(radians)
  };
};

/**
 * Calculates time value from click position on dial
 * @param {number} centerX - X coordinate of the dial center
 * @param {number} centerY - Y coordinate of the dial center
 * @param {number} clickX - X coordinate of the click position
 * @param {number} clickY - Y coordinate of the click position
 * @param {number} max - Maximum value (12 for hours in 12h format, 24 for 24h, 60 for minutes/seconds)
 * @param {number} innerRadius - Inner radius for 24-hour clock inner ring
 * @param {number} outerRadius - Outer radius for dial
 * @returns {number} Calculated time value
 */
export const getTimeFromPosition = (
  centerX: number,
  centerY: number,
  clickX: number,
  clickY: number,
  max: number,
  innerRadius?: number,
  outerRadius?: number
): number => {
  // Calculate angle from center to click position
  const deltaX = clickX - centerX;
  const deltaY = clickY - centerY;
  
  // Calculate angle in degrees (0 at top, clockwise)
  let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
  if (angle < 0) {
    angle += 360;
  }
  
  // Calculate distance from center
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // For 24h clock, check if click is in inner or outer ring
  if (max === 24 && innerRadius && outerRadius) {
    const isInnerRing = distance < (innerRadius + outerRadius) / 2;
    
    // Calculate value based on angle
    let value = Math.round((angle / 360) * 12);
    if (value === 0) {
      value = 12;
    }
    
    // Adjust for inner ring (add 12 hours)
    if (isInnerRing) {
      value = value === 12 ? 0 : value + 12;
    }
    
    return value;
  }
  
  // For standard 12h clock or minutes/seconds
  let value = Math.round((angle / 360) * max);
  if (value === max) {
    value = 0;
  }
  
  return value;
};

/**
 * Checks if a time is within min/max constraints
 * @param {TimeValue} time - Time value to check
 * @param {string} minTime - Minimum time in 24-hour format (HH:MM or HH:MM:SS)
 * @param {string} maxTime - Maximum time in 24-hour format (HH:MM or HH:MM:SS)
 * @returns {boolean} Whether the time is within constraints
 */
export const isTimeWithinConstraints = (
  time: TimeValue,
  minTime?: string,
  maxTime?: string
): boolean => {
  if (!minTime && !maxTime) {
    return true;
  }
  
  const timeToCheck = time.hours * 3600 + time.minutes * 60 + (time.seconds || 0);
  
  if (minTime) {
    const minParts = minTime.split(':');
    const minHours = parseInt(minParts[0], 10);
    const minMinutes = parseInt(minParts[1], 10);
    const minSeconds = minParts[2] ? parseInt(minParts[2], 10) : 0;
    const minValue = minHours * 3600 + minMinutes * 60 + minSeconds;
    
    if (timeToCheck < minValue) {
      return false;
    }
  }
  
  if (maxTime) {
    const maxParts = maxTime.split(':');
    const maxHours = parseInt(maxParts[0], 10);
    const maxMinutes = parseInt(maxParts[1], 10);
    const maxSeconds = maxParts[2] ? parseInt(maxParts[2], 10) : 0;
    const maxValue = maxHours * 3600 + maxMinutes * 60 + maxSeconds;
    
    if (timeToCheck > maxValue) {
      return false;
    }
  }
  
  return true;
};