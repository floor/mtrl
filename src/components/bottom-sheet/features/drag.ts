// src/components/bottom-sheet/features/drag.ts

import { BottomSheetConfig, BottomSheetState } from "../types";
import {
  BOTTOM_SHEET_DEFAULTS,
  BOTTOM_SHEET_EVENTS,
  BOTTOM_SHEET_STATES,
} from "../constants";

interface DragComponent {
  getClass: (name: string) => string;
  emit: (event: string, data?: unknown) => unknown;
  structure: { container: HTMLElement; handle: HTMLElement | null };
  state: {
    getState: () => BottomSheetState;
    setState: (next: BottomSheetState) => void;
    close: () => void;
  };
}

/**
 * Dragging the sheet between its heights.
 *
 * Where the sheet settles follows Compose's rule: a drag past the positional
 * threshold moves to the next anchor, and a flick past the velocity threshold
 * does the same however short it was, so a quick flick works without having to
 * cover the distance.
 */
export const withDrag =
  (config: BottomSheetConfig) =>
  <C extends DragComponent>(component: C) => {
    const { structure, state } = component;
    const handle = structure.handle;

    // No handle means nothing indicates the sheet is draggable, so it is not
    if (!handle) return { ...component, drag: { release: () => {} } };

    let startY = 0;
    let startTime = 0;
    let offset = 0;
    let dragging = false;

    /** Where a drag ends up, given how far and how fast it went */
    const settle = (distance: number, velocity: number): BottomSheetState => {
      const current = state.getState();
      const far = Math.abs(distance) >= BOTTOM_SHEET_DEFAULTS.POSITIONAL_THRESHOLD;
      const fast = Math.abs(velocity) >= BOTTOM_SHEET_DEFAULTS.VELOCITY_THRESHOLD;
      if (!far && !fast) return current;

      const downwards = distance > 0;
      if (current === BOTTOM_SHEET_STATES.EXPANDED) {
        return downwards ? BOTTOM_SHEET_STATES.PARTIAL : BOTTOM_SHEET_STATES.EXPANDED;
      }
      return downwards ? BOTTOM_SHEET_STATES.HIDDEN : BOTTOM_SHEET_STATES.EXPANDED;
    };

    const onPointerDown = (event: PointerEvent): void => {
      dragging = true;
      startY = event.clientY;
      startTime = Date.now();
      offset = 0;
      handle.setPointerCapture?.(event.pointerId);
      // the sheet should track the finger exactly, not ease behind it
      structure.container.style.transition = "none";
      component.emit(BOTTOM_SHEET_EVENTS.DRAG_START);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (!dragging) return;
      offset = event.clientY - startY;
      // upward drag is bounded: the sheet cannot go above its expanded height
      const shown = Math.max(offset, 0);
      structure.container.style.transform = `translateY(${shown}px)`;
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (!dragging) return;
      dragging = false;
      handle.releasePointerCapture?.(event.pointerId);

      const elapsed = Math.max(Date.now() - startTime, 1);
      const velocity = (offset / elapsed) * 1000; // px per second

      structure.container.style.transition = "";
      structure.container.style.transform = "";

      const previous = state.getState();
      const next = settle(offset, velocity);

      if (next === BOTTOM_SHEET_STATES.HIDDEN) state.close();
      else state.setState(next);

      component.emit(BOTTOM_SHEET_EVENTS.DRAG_END, { state: next, previous });
    };

    handle.addEventListener("pointerdown", onPointerDown);
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
    handle.addEventListener("pointercancel", onPointerUp);

    return {
      ...component,
      drag: {
        release: () => {
          handle.removeEventListener("pointerdown", onPointerDown);
          handle.removeEventListener("pointermove", onPointerMove);
          handle.removeEventListener("pointerup", onPointerUp);
          handle.removeEventListener("pointercancel", onPointerUp);
        },
      },
    };
  };
