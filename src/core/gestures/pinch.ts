// src/core/gestures/pinch.ts
/**
 * @module core/gestures
 * @description Pinch gesture detection
 */

import { PinchEvent, GestureDetectionContext } from "./types";
import { createGestureEvent, getDistance } from "./utils";

/**
 * Detect pinch gesture
 *
 * @param context - Gesture detection context
 * @param touch1 - First touch point
 * @param touch2 - Second touch point
 * @returns Pinch event or null if no pinch detected
 */
export function detectPinch(
  context: GestureDetectionContext,
  touch1: Touch,
  touch2: Touch
): PinchEvent | null {
  const { state, originalEvent } = context;

  // Calculate current distance between touch points
  const currentDistance = getDistance(
    touch1.clientX,
    touch1.clientY,
    touch2.clientX,
    touch2.clientY
  );

  // Minimum movement threshold for pinch detection
  const PINCH_THRESHOLD = 10;

  // Check if the distance change is significant
  if (Math.abs(currentDistance - state.startDistance) > PINCH_THRESHOLD) {
    // Calculate scale factor
    const scale = currentDistance / state.startDistance;

    // Calculate center point
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;

    // Create pinch event
    const pinchEvent: PinchEvent = {
      ...createGestureEvent("pinch", originalEvent, state),
      type: "pinch",
      scale,
      centerX,
      centerY,
    };

    return pinchEvent;
  }

  return null;
}
