// src/components/sheet/features/gestures.ts
import { SHEET_EVENTS, SHEET_POSITIONS } from "../types";

/**
 * Adds gesture support to a component
 * @param {Object} config - Component configuration
 * @returns {Function} Higher-order function that adds gestures to a component
 */
export const withGestures = (config) => (component) => {
  // Skip if gestures are disabled
  if (config.enableGestures === false) {
    return component;
  }

  const position = config.position || SHEET_POSITIONS.BOTTOM;
  let startY = 0;
  let startX = 0;
  let isDragging = false;

  // Find drag handle if exists
  const dragHandle = component.dragHandle?.element || component.element;

  /**
   * Handles the start of a drag gesture
   * @param {TouchEvent|MouseEvent} event - The event object
   */
  const handleDragStart = (event) => {
    if (!component.state.isOpen()) return;

    isDragging = true;
    document.body.style.userSelect = "none";

    // Get start position
    if (event.type === "touchstart") {
      startY = event.touches[0].clientY;
      startX = event.touches[0].clientX;
    } else {
      startY = event.clientY;
      startX = event.clientX;

      // Add mouse move and up listeners
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
    }

    // Emit event
    component.events.emit(SHEET_EVENTS.DRAG_START);
  };

  /**
   * Handles the drag movement
   * @param {TouchEvent|MouseEvent} event - The event object
   */
  const handleDragMove = (event) => {
    if (!isDragging) return;

    let currentY, currentX;

    if (event.type === "touchmove") {
      currentY = event.touches[0].clientY;
      currentX = event.touches[0].clientX;
    } else {
      currentY = event.clientY;
      currentX = event.clientX;
    }

    // Calculate delta based on position
    let delta = 0;

    switch (position) {
      case SHEET_POSITIONS.BOTTOM:
        delta = currentY - startY;
        if (delta < 0) delta = 0; // Prevent dragging beyond fully open state
        component.element.style.transform = `translateY(${delta}px)`;
        break;

      case SHEET_POSITIONS.TOP:
        delta = startY - currentY;
        if (delta < 0) delta = 0;
        component.element.style.transform = `translateY(-${delta}px)`;
        break;

      case SHEET_POSITIONS.LEFT:
        delta = startX - currentX;
        if (delta < 0) delta = 0;
        component.element.style.transform = `translateX(-${delta}px)`;
        break;

      case SHEET_POSITIONS.RIGHT:
        delta = currentX - startX;
        if (delta < 0) delta = 0;
        component.element.style.transform = `translateX(${delta}px)`;
        break;
    }

    // Adjust opacity based on drag progress
    const elementSize =
      position === SHEET_POSITIONS.BOTTOM || position === SHEET_POSITIONS.TOP
        ? component.element.offsetHeight
        : component.element.offsetWidth;

    const dragProgress = Math.min(delta / elementSize, 1);
    const scrimElement = component.element.nextElementSibling;
    if (
      scrimElement &&
      scrimElement.classList.contains(`${component.getClass("sheet")}-scrim`)
    ) {
      scrimElement.style.opacity = `${0.32 * (1 - dragProgress)}`;
    }
  };

  /**
   * Handles the end of a drag gesture
   */
  const handleDragEnd = () => {
    if (!isDragging) return;

    isDragging = false;
    document.body.style.userSelect = "";

    // Remove mouse event listeners
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);

    // Determine final position
    const elementSize =
      position === SHEET_POSITIONS.BOTTOM || position === SHEET_POSITIONS.TOP
        ? component.element.offsetHeight
        : component.element.offsetWidth;

    let transform = 0;
    if (component.element.style.transform) {
      const match = component.element.style.transform.match(
        /translate[XY]\(([^p]+)px\)/
      );
      transform = match ? parseFloat(match[1]) : 0;
    }

    // Close if dragged more than 30% of the way
    if (transform > elementSize * 0.3) {
      component.state.close();
    } else {
      // Reset position and opacity
      component.element.style.transform = "";
      const scrimElement = component.element.nextElementSibling;
      if (
        scrimElement &&
        scrimElement.classList.contains(`${component.getClass("sheet")}-scrim`)
      ) {
        scrimElement.style.opacity = "";
      }
    }

    // Emit event
    component.events.emit(SHEET_EVENTS.DRAG_END);
  };

  // Add event listeners to drag handle
  dragHandle.addEventListener("touchstart", handleDragStart);
  dragHandle.addEventListener("touchmove", handleDragMove);
  dragHandle.addEventListener("touchend", handleDragEnd);
  dragHandle.addEventListener("mousedown", handleDragStart);

  // Clean up function
  const cleanup = () => {
    dragHandle.removeEventListener("touchstart", handleDragStart);
    dragHandle.removeEventListener("touchmove", handleDragMove);
    dragHandle.removeEventListener("touchend", handleDragEnd);
    dragHandle.removeEventListener("mousedown", handleDragStart);
    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
  };

  // Add cleanup to component lifecycle
  const originalDestroy = component.lifecycle?.destroy || (() => {});
  component.lifecycle = {
    ...component.lifecycle,
    destroy: () => {
      cleanup();
      originalDestroy();
    },
  };

  return component;
};
