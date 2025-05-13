// src/core/utils/mobile.ts

/**
 * Mobile device detection and capability checks
 * This provides a centralized way to handle mobile-specific features and behaviors
 */

/**
 * Interface for normalized event properties
 */
export interface NormalizedEvent {
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  target: EventTarget;
  preventDefault: () => void;
  stopPropagation: () => void;
  type: string;
}

/**
 * Detects if the current device is likely a mobile device
 * Uses a combination of user agent and screen size checks for reliability
 */
export const isMobileDevice = (): boolean => {
  const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const screenSize = window.innerWidth <= 768;
  return userAgent || screenSize;
};

/**
 * Options for passive event listeners
 */
export const PASSIVE_EVENTS: AddEventListenerOptions = { passive: true };

/**
 * Configuration constants for mobile interactions
 * Following WCAG guidelines and touch interaction best practices
 */
export const TOUCH_CONFIG = {
  TARGET_SIZE: 44, // Minimum touch target size in pixels (WCAG standard)
  FEEDBACK_DURATION: 200, // Duration of touch feedback animation in ms
  TAP_THRESHOLD: 250, // Maximum duration for a touch to be considered a tap
  SWIPE_THRESHOLD: 50 // Minimum distance for a touch to be considered a swipe
};

/**
 * Accessibility-minded touch target sizes
 * Based on WCAG guidelines for touch targets
 */
export const TOUCH_TARGETS = {
  MINIMUM: 44, // Minimum recommended size in pixels
  COMFORTABLE: 48, // Comfortable touch target size
  LARGE: 56 // Large touch target for primary actions
};

/**
 * Detects if the current device supports touch events
 */
export const hasTouchSupport = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Normalizes both mouse and touch events into a consistent format
 * This allows components to handle interactions uniformly
 */
export const normalizeEvent = (event: MouseEvent | TouchEvent): NormalizedEvent => {
  if ('touches' in event && event.touches.length > 0) {
    const touch = event.touches[0];
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
      pageY: touch.pageY,
      target: event.target as EventTarget,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
      type: event.type
    };
  }
  
  // For mouse events
  const mouseEvent = event as MouseEvent;
  return {
    clientX: mouseEvent.clientX,
    clientY: mouseEvent.clientY,
    pageX: mouseEvent.pageX,
    pageY: mouseEvent.pageY,
    target: mouseEvent.target as EventTarget,
    preventDefault: () => mouseEvent.preventDefault(),
    stopPropagation: () => mouseEvent.stopPropagation(),
    type: mouseEvent.type
  };
};