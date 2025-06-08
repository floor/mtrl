// src/core/gestures/pan.ts
/**
 * @module core/gestures
 * @description Pan gesture detection
 */

import { PanEvent, GestureDetectionContext } from "./types";
import { createGestureEvent } from "./utils";

/**
 * Detect pan gesture
 *
 * @param context - Gesture detection context
 * @returns Pan event or null if no significant movement
 */
export function detectPan(context: GestureDetectionContext): PanEvent | null {
  const { state, originalEvent } = context;

  // Calculate delta from start position
  const deltaX = state.currentX - state.startX;
  const deltaY = state.currentY - state.startY;

  // Calculate delta from last position to determine if there's significant movement
  const moveDeltaX = state.currentX - state.lastX;
  const moveDeltaY = state.currentY - state.lastY;
  const moveDelta = Math.sqrt(
    moveDeltaX * moveDeltaX + moveDeltaY * moveDeltaY
  );

  // Check if movement is significant
  if (moveDelta > 0) {
    // Create pan event
    const panEvent: PanEvent = {
      ...createGestureEvent("pan", originalEvent, state),
      type: "pan",
      deltaX,
      deltaY,
      startX: state.startX,
      startY: state.startY,
      currentX: state.currentX,
      currentY: state.currentY,
    };

    return panEvent;
  }

  return null;
}
