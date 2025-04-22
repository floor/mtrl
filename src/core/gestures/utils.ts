// src/core/gestures/utils.ts
/**
 * @module core/gestures
 * @description Utility functions for gesture detection
 */

import { GestureEvent, GestureState } from './types';

/**
 * Calculate distance between two points
 * 
 * @param x1 - X coordinate of first point
 * @param y1 - Y coordinate of first point
 * @param x2 - X coordinate of second point
 * @param y2 - Y coordinate of second point
 * @returns Distance between the points
 */
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calculate angle between two points in degrees (0-360)
 * 
 * @param x1 - X coordinate of first point
 * @param y1 - Y coordinate of first point
 * @param x2 - X coordinate of second point
 * @param y2 - Y coordinate of second point
 * @returns Angle in degrees
 */
export function getAngle(x1: number, y1: number, x2: number, y2: number): number {
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  return (angle < 0) ? angle + 360 : angle;
}

/**
 * Create a base gesture event
 * 
 * @param type - Type of gesture
 * @param originalEvent - Original DOM event
 * @param state - Current gesture state
 * @returns Base gesture event object
 */
export function createGestureEvent(
  type: string, 
  originalEvent: Event,
  state: GestureState
): GestureEvent {
  const endTime = Date.now();
  let defaultPrevented = false;
  
  const event: GestureEvent = {
    type,
    originalEvent,
    target: state.target || originalEvent.target,
    startTime: state.startTime,
    endTime,
    duration: endTime - state.startTime,
    defaultPrevented,
    preventDefault: () => {
      defaultPrevented = true;
      event.defaultPrevented = true;
      if (originalEvent.cancelable) {
        originalEvent.preventDefault();
      }
    },
    stopPropagation: () => {
      originalEvent.stopPropagation();
    }
  };
  
  return event;
}

/**
 * Detect if the device supports touch events
 * 
 * @returns Whether touch is supported
 */
export function hasTouchSupport(): boolean {
  return 'ontouchstart' in window || 
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
}

/**
 * Detect if the device supports pointer events
 * 
 * @returns Whether pointer events are supported
 */
export function hasPointerSupport(): boolean {
  return !!window.PointerEvent;
}

/**
 * Extract normalized touch coordinates from an event
 * Works with mouse events, touch events and pointer events
 * 
 * @param e - DOM event
 * @returns Object with clientX and clientY coordinates
 */
export function getTouchCoordinates(e: MouseEvent | TouchEvent | PointerEvent): { clientX: number, clientY: number } {
  if ('touches' in e && e.touches.length > 0) {
    return {
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY
    };
  }
  
  return {
    clientX: (e as MouseEvent | PointerEvent).clientX,
    clientY: (e as MouseEvent | PointerEvent).clientY
  };
}