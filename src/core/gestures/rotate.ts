// src/core/gestures/rotate.ts
/**
 * @module core/gestures
 * @description Rotate gesture detection
 */

import { RotateEvent, GestureDetectionContext } from "./types";
import { createGestureEvent, getAngle } from "./utils";

/**
 * Detect rotate gesture
 *
 * @param context - Gesture detection context
 * @param touch1 - First touch point
 * @param touch2 - Second touch point
 * @returns Rotate event or null if no rotation detected
 */
export function detectRotate(
  context: GestureDetectionContext,
  touch1: Touch,
  touch2: Touch
): RotateEvent | null {
  const { state, originalEvent } = context;

  // Calculate current angle between touch points
  const currentAngle = getAngle(
    touch1.clientX,
    touch1.clientY,
    touch2.clientX,
    touch2.clientY
  );

  // Minimum rotation threshold for detection
  const ROTATION_THRESHOLD = 10;

  // Calculate rotation difference
  const rotationDiff = currentAngle - state.startAngle;

  // Check if rotation is significant
  if (Math.abs(rotationDiff) > ROTATION_THRESHOLD) {
    // Calculate center point
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;

    // Create rotate event
    const rotateEvent: RotateEvent = {
      ...createGestureEvent("rotate", originalEvent, state),
      type: "rotate",
      rotation: rotationDiff,
      centerX,
      centerY,
    };

    return rotateEvent;
  }

  return null;
}
