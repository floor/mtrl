// src/core/utils/mobile.js

/**
 * Mobile device detection and capability checks
 * This provides a centralized way to handle mobile-specific features and behaviors
 */

/**
 * Detects if the current device is likely a mobile device
 * Uses a combination of user agent and screen size checks for reliability
 */
export const isMobileDevice = () => {
  const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
  const screenSize = window.innerWidth <= 768
  return userAgent || screenSize
}

export const PASSIVE_EVENTS = { passive: true }

/**
 * Configuration constants for mobile interactions
 * Following WCAG guidelines and touch interaction best practices
 */
export const TOUCH_CONFIG = {
  TARGET_SIZE: 44, // Minimum touch target size in pixels (WCAG standard)
  FEEDBACK_DURATION: 200, // Duration of touch feedback animation in ms
  TAP_THRESHOLD: 250, // Maximum duration for a touch to be considered a tap
  SWIPE_THRESHOLD: 50 // Minimum distance for a touch to be considered a swipe
}

/**
 * Accessibility-minded touch target sizes
 * Based on WCAG guidelines for touch targets
 */
export const TOUCH_TARGETS = {
  MINIMUM: 44, // Minimum recommended size in pixels
  COMFORTABLE: 48, // Comfortable touch target size
  LARGE: 56 // Large touch target for primary actions
}

/**
 * Default passive event configuration for touch events
 * Improves scroll performance on mobile devices
 */

/**
 * Detects if the current device supports touch events
 */
export const hasTouchSupport = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Normalizes both mouse and touch events into a consistent format
 * This allows components to handle interactions uniformly
 */
export const normalizeEvent = (event) => {
  if (event.touches) {
    const touch = event.touches[0]
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
      pageY: touch.pageY,
      target: event.target,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
      type: event.type
    }
  }
  return event
}
