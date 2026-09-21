// src/components/slider/features/handlers.ts
import { SLIDER_EVENTS } from "../types";
import {
  SliderConfig,
  SliderEventHelpers,
  SliderState,
  SliderPointerEvent,
  SliderUiRenderer,
} from "../types";

/**
 * Create consolidated event handlers for slider component (mouse, touch, keyboard)
 *
 * @param config Slider configuration
 * @param state Slider state object
 * @param uiRenderer UI renderer interface from controller
 * @param eventHelpers Event helper methods
 * @returns Event handlers for all slider interactions
 */
/**
 * The x coordinate of whichever kind of pointer event this is.
 *
 * `"touches" in e` is a real type guard where `e.type.includes("touch")` is
 * only a string test, so the branches below could not be narrowed. Every
 * caller is a down or a move, where the touch list is non-empty.
 */
const clientXOf = (e: SliderPointerEvent): number =>
  "touches" in e ? e.touches[0].clientX : e.clientX;

export const createHandlers = (
  config: SliderConfig,
  state: SliderState,
  uiRenderer: Partial<SliderUiRenderer>,
  eventHelpers: SliderEventHelpers,
) => {
  // Get required elements from structure (with fallbacks)
  // Check both direct component properties (from withDom) and components object (legacy)
  // `|| {}` on the component was dead -- the controller always sets it -- and
  // the empty object made every lookup below a union no property existed on.
  const components = state.component.components || {};
  const component = state.component;

  // Extract needed components from both locations for backward compatibility
  const container = component.container || components.container || null;
  const handle = component.handle || components.handle || null;
  const valueBubble = component.valueBubble || components.valueBubble || null;
  const secondHandle =
    component.secondHandle || components.secondHandle || null;
  const secondValueBubble =
    component.secondValueBubble || components.secondValueBubble || null;

  // Get required helper methods (with fallbacks)
  const {
    getValueFromPosition = () => 0,
    roundToStep = (value: number) => value,
    clamp = (value: number) => value,
    showValueBubble = () => {},
    render = () => {},
  } = uiRenderer;

  const { triggerEvent = () => ({ defaultPrevented: false }) } = eventHelpers;

  // Track whether a real drag has started
  let hasActualDragStarted = false;
  let initialX = 0;
  const DRAG_THRESHOLD = 3;

  // Last focused handle tracker for keyboard navigation
  let lastFocusedHandle: HTMLElement | null = null;

  // Bubble management
  const clearBubbleHideTimer = () => {
    if (state.valueHideTimer) {
      clearTimeout(state.valueHideTimer);
      state.valueHideTimer = null;
    }
  };

  const hideAllBubbles = () => {
    clearBubbleHideTimer();
    if (valueBubble) showValueBubble(valueBubble, false);
    if (secondValueBubble) showValueBubble(secondValueBubble, false);
  };

  const showActiveBubble = (bubble: HTMLElement | null) => {
    hideAllBubbles();
    if (bubble && config.showValue) showValueBubble(bubble, true);
  };

  const hideActiveBubble = (bubble: HTMLElement | null, delay = 0) => {
    clearBubbleHideTimer();
    if (!bubble || !config.showValue) return;

    if (delay > 0) {
      state.valueHideTimer = setTimeout(() => {
        showValueBubble(bubble, false);
      }, delay);
    } else {
      showValueBubble(bubble, false);
    }
  };

  // Focus management
  const clearKeyboardFocus = () => {
    // Clear local focus indicators
    if (handle)
      handle.classList.remove(
        `${state.component.getClass("slider__handle")}--focused`,
      );
    if (secondHandle)
      secondHandle.classList.remove(
        `${state.component.getClass("slider__handle")}--focused`,
      );

    // Clear any focus indicator this slider still carries.
    //
    // This used to sweep the whole document, which stripped the focus ring
    // from every other slider on the page: touching one slider made a keyboard
    // user lose the indicator telling them where they were in another. It is
    // also redundant for this slider's own handles, which the two lines above
    // already clear.
    try {
      const focusClass = state.component.getClass("slider__handle--focused");
      state.component.element
        .querySelectorAll(`.${focusClass}`)
        .forEach((el: Element) => {
          el.classList.remove(focusClass);
        });

      // Only blur a handle belonging to this slider. Blurring on the strength
      // of a class name alone took focus off another component's handle.
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        state.component.element.contains(active) &&
        active.classList.contains(state.component.getClass("slider__handle"))
      ) {
        active.blur();
      }
    } catch (error) {
      console.warn("Error clearing keyboard focus:", error);
    }
  };

  /**
   * Handle mouse/touch down on a handle
   */
  const handleHandleMouseDown = (
    e: SliderPointerEvent,
    isSecondHandle = false,
  ) => {
    // Check if disabled
    if (
      !state.component ||
      (state.component.disabled && state.component.disabled.isDisabled())
    ) {
      return;
    }

    // Only preventDefault for mouse events to allow passive touchstart
    if (e.type === "mousedown") {
      e.preventDefault();
    }
    e.stopPropagation();

    hideAllBubbles();
    clearKeyboardFocus();

    // Capture initial position
    initialX = clientXOf(e);

    // Setup drag state
    state.dragging = false;
    state.pressed = true; // Set pressed state immediately
    hasActualDragStarted = false;
    state.activeHandle = isSecondHandle ? "second" : "first"; // Track which handle
    state.activeBubble = isSecondHandle ? secondValueBubble : valueBubble;

    // Show bubble immediately
    showActiveBubble(state.activeBubble);

    // Add global event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleMouseMove, { passive: false });
    document.addEventListener("touchend", handleMouseUp);

    render();
    triggerEvent(SLIDER_EVENTS.START, e);
  };

  /**
   * Handle mouse/touch down on the track
   */
  const handleTrackMouseDown = (e: SliderPointerEvent) => {
    // Check if disabled
    if (
      !state.component ||
      (state.component.disabled && state.component.disabled.isDisabled()) ||
      !container
    ) {
      return;
    }

    // Only preventDefault for mouse events to allow passive touchstart
    if (e.type === "mousedown") {
      e.preventDefault();
    }
    hideAllBubbles();
    clearKeyboardFocus();

    // Determine which handle to move
    let isSecondHandle = false;

    try {
      const position = clientXOf(e);

      // Calculate value at click position and apply constraints
      let newValue = getValueFromPosition(position);
      if (config.snapToSteps && state.step > 0)
        newValue = roundToStep(newValue);
      newValue = clamp(newValue, state.min, state.max);

      if (config.range && state.secondValue !== null) {
        // For range slider, move the closest handle
        const distToFirst = Math.abs(newValue - state.value);
        const distToSecond = Math.abs(newValue - state.secondValue);

        isSecondHandle = distToSecond < distToFirst;
        isSecondHandle
          ? (state.secondValue = newValue)
          : (state.value = newValue);
      } else {
        // Single handle slider - use setValue API for centered sliders to ensure animation
        if (
          config.centered &&
          state.component.slider &&
          state.component.slider.setValue
        ) {
          // Use the API method which handles previousValue tracking and animation
          state.component.slider.setValue(newValue, false); // false to not trigger event yet
        } else {
          // Regular slider - direct update
          state.value = newValue;
        }
      }

      // Update UI and trigger events
      render();
      triggerEvent(SLIDER_EVENTS.INPUT, e);
    } catch (error) {
      console.warn("Error handling track click:", error);
    }

    // Set active elements
    state.activeHandle = isSecondHandle ? "second" : "first";
    state.activeBubble = isSecondHandle ? secondValueBubble : valueBubble;

    // Store the initial position
    initialX = clientXOf(e);

    // For centered sliders, delay starting drag to allow animation
    if (config.centered && !config.range) {
      // Show bubble
      showActiveBubble(state.activeBubble);

      // Add event listeners but don't start dragging yet
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleMouseUp);

      // Don't set pressed state for track clicks
      state.pressed = false;

      triggerEvent(SLIDER_EVENTS.START, e);
    } else {
      // For non-centered sliders, start drag but don't set pressed since it's a track click
      state.dragging = false;
      state.pressed = false; // Don't set pressed for track clicks
      hasActualDragStarted = false;

      // Show bubble
      showActiveBubble(state.activeBubble);

      // Add event listeners
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleMouseUp);

      render();
      triggerEvent(SLIDER_EVENTS.START, e);
    }
  };

  /**
   * Handle mouse/touch move during drag
   */
  const handleMouseMove = (e: SliderPointerEvent) => {
    if (!state.activeHandle || !container) return;
    e.preventDefault();

    try {
      // Get current position
      const currentX = clientXOf(e);

      // Determine if we've started a real drag
      if (
        !hasActualDragStarted &&
        Math.abs(currentX - initialX) >= DRAG_THRESHOLD
      ) {
        hasActualDragStarted = true;
        state.dragging = true;
        state.component.element.classList.add(
          `${state.component.getClass("slider")}--dragging`,
        );
      }

      // Calculate new value and apply constraints
      let newValue = getValueFromPosition(currentX);
      if (config.snapToSteps && state.step > 0)
        newValue = roundToStep(newValue);
      newValue = clamp(newValue, state.min, state.max);

      // Handle crossing points and handle swapping for range sliders
      const isSecondHandle = state.activeHandle === "second";

      if (config.range && state.secondValue !== null) {
        if (isSecondHandle) {
          // Second handle is active
          if (newValue >= state.value) {
            state.secondValue = newValue;
          } else {
            // Handles are crossed, swap them
            hideActiveBubble(state.activeBubble, 0);
            state.secondValue = state.value;
            state.value = newValue;
            state.activeHandle = "first";
            state.activeBubble = valueBubble;
            showActiveBubble(state.activeBubble);
          }
        } else {
          // First handle is active
          if (newValue <= state.secondValue) {
            state.value = newValue;
          } else {
            // Handles are crossed, swap them
            hideActiveBubble(state.activeBubble, 0);
            state.value = state.secondValue;
            state.secondValue = newValue;
            state.activeHandle = "second";
            state.activeBubble = secondValueBubble;
            showActiveBubble(state.activeBubble);
          }
        }
      } else {
        // Regular slider - update previousValue for centered sliders
        if (config.centered) {
          state.previousValue = state.value;
        }
        state.value = newValue;
      }

      render();
      triggerEvent(SLIDER_EVENTS.INPUT, e);
    } catch (error) {
      console.warn("Error during slider drag:", error);
    }
  };

  /**
   * Handle mouse/touch up after drag
   */
  const handleMouseUp = (e: SliderPointerEvent) => {
    if (!state.activeHandle) return;
    e.preventDefault();

    // Reset drag states
    state.dragging = false;
    state.pressed = false; // Clear pressed state
    hasActualDragStarted = false;
    state.component.element.classList.remove(
      `${state.component.getClass("slider")}--dragging`,
    );

    // Hide bubble with delay
    hideActiveBubble(state.activeBubble, 1000);

    // Remove global event listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("touchmove", handleMouseMove);
    document.removeEventListener("touchend", handleMouseUp);

    // Reset active handle and update UI
    state.activeHandle = null;
    render();

    // Trigger events
    triggerEvent(SLIDER_EVENTS.CHANGE, e);
    triggerEvent(SLIDER_EVENTS.END, e);
  };

  /**
   * Handle keyboard input
   */
  const handleKeyDown = (e: KeyboardEvent, isSecondHandle = false) => {
    if (state.component.disabled && state.component.disabled.isDisabled())
      return;

    const step = state.step || 1;
    let newValue = isSecondHandle ? state.secondValue : state.value;
    // `range: true` with no `secondValue` gives a second handle and a null
    // second value. There is nothing to move, and arithmetic on null would
    // have produced a value out of nowhere.
    if (newValue === null) return;
    const stepSize = e.shiftKey ? step * 10 : step;

    // Handle tab key separately
    if (e.key === "Tab") return;

    let valueChanged = false;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        newValue = Math.min(newValue + stepSize, state.max);
        valueChanged = true;
        break;

      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        newValue = Math.max(newValue - stepSize, state.min);
        valueChanged = true;
        break;

      case "Home":
        e.preventDefault();
        newValue = state.min;
        valueChanged = true;
        break;

      case "End":
        e.preventDefault();
        newValue = state.max;
        valueChanged = true;
        break;

      case "PageUp":
        e.preventDefault();
        newValue = Math.min(newValue + step * 10, state.max);
        valueChanged = true;
        break;

      case "PageDown":
        e.preventDefault();
        newValue = Math.max(newValue - step * 10, state.min);
        valueChanged = true;
        break;

      default:
        return; // Exit if not a handled key
    }

    if (!valueChanged) return;

    // Update active bubble reference
    state.activeBubble = isSecondHandle ? secondValueBubble : valueBubble;

    // Show value bubble during keyboard interaction
    showActiveBubble(state.activeBubble);

    // Update the value
    if (isSecondHandle) {
      state.secondValue = newValue;
    } else {
      // Track previousValue for centered sliders
      if (config.centered) {
        state.previousValue = state.value;
      }
      state.value = newValue;
    }

    // Update UI and trigger events
    render();
    triggerEvent(SLIDER_EVENTS.INPUT, e);
    triggerEvent(SLIDER_EVENTS.CHANGE, e);
  };

  /**
   * Handle focus events
   */
  const handleFocus = (e: FocusEvent, isSecondHandle = false) => {
    if (state.component.disabled && state.component.disabled.isDisabled())
      return;

    // Track the currently focused handle
    const currentHandle = isSecondHandle ? secondHandle : handle;

    // Hide previous bubble if switching between handles
    if (lastFocusedHandle && lastFocusedHandle !== currentHandle) {
      hideAllBubbles();
    }

    if (!currentHandle) return;
    lastFocusedHandle = currentHandle;

    // Add focus class and show bubble
    currentHandle.classList.add(
      `${state.component.getClass("slider__handle")}--focused`,
    );
    showActiveBubble(isSecondHandle ? secondValueBubble : valueBubble);
    state.activeBubble = isSecondHandle ? secondValueBubble : valueBubble;

    triggerEvent(SLIDER_EVENTS.FOCUS, e);
  };

  /**
   * Handle blur events
   */
  const handleBlur = (e: FocusEvent, isSecondHandle = false) => {
    const handleElement = isSecondHandle ? secondHandle : handle;
    if (!handleElement) return;
    handleElement.classList.remove(
      `${state.component.getClass("slider__handle")}--focused`,
    );

    // Only hide bubble if not tabbing to another handle
    const relatedTarget = e.relatedTarget;
    const otherHandle = isSecondHandle ? handle : secondHandle;

    if (!relatedTarget || relatedTarget !== otherHandle) {
      hideActiveBubble(isSecondHandle ? secondValueBubble : valueBubble, 200);
    }

    triggerEvent(SLIDER_EVENTS.BLUR, e);
  };

  /**
   * Set up all event listeners
   */
  const setupEventListeners = () => {
    if (!handle || !container) {
      console.warn(
        "Cannot set up event listeners: missing container or handle",
      );
      return;
    }

    // Use container for track events instead of track for better UX
    container.addEventListener("mousedown", handleTrackMouseDown);
    container.addEventListener("touchstart", handleTrackMouseDown, {
      passive: true,
    });

    // Handle events
    handle.addEventListener("mousedown", (e) =>
      handleHandleMouseDown(e, false),
    );
    handle.addEventListener(
      "touchstart",
      (e) => handleHandleMouseDown(e, false),
      { passive: true },
    );
    handle.addEventListener("keydown", (e) => handleKeyDown(e, false));
    handle.addEventListener("focus", (e) => handleFocus(e, false));
    handle.addEventListener("blur", (e) => handleBlur(e, false));

    // Second handle events for range slider
    if (config.range && secondHandle) {
      secondHandle.addEventListener("mousedown", (e) =>
        handleHandleMouseDown(e, true),
      );
      secondHandle.addEventListener(
        "touchstart",
        (e) => handleHandleMouseDown(e, true),
        { passive: true },
      );
      secondHandle.addEventListener("keydown", (e) => handleKeyDown(e, true));
      secondHandle.addEventListener("focus", (e) => handleFocus(e, true));
      secondHandle.addEventListener("blur", (e) => handleBlur(e, true));
    }
  };

  /**
   * Clean up all event listeners
   */
  const cleanupEventListeners = () => {
    if (!state.component) return;

    // Clean up container listeners
    if (container) {
      container.removeEventListener("mousedown", handleTrackMouseDown);
      container.removeEventListener("touchstart", handleTrackMouseDown);
    }

    // Clean up handle listeners
    if (handle) {
      handle.removeEventListener("mousedown", (e) =>
        handleHandleMouseDown(e, false),
      );
      handle.removeEventListener("touchstart", (e) =>
        handleHandleMouseDown(e, false),
      );
      handle.removeEventListener("keydown", (e) => handleKeyDown(e, false));
      handle.removeEventListener("focus", (e) => handleFocus(e, false));
      handle.removeEventListener("blur", (e) => handleBlur(e, false));
    }

    // Clean up second handle listeners
    if (config.range && secondHandle) {
      secondHandle.removeEventListener("mousedown", (e) =>
        handleHandleMouseDown(e, true),
      );
      secondHandle.removeEventListener("touchstart", (e) =>
        handleHandleMouseDown(e, true),
      );
      secondHandle.removeEventListener("keydown", (e) =>
        handleKeyDown(e, true),
      );
      secondHandle.removeEventListener("focus", (e) => handleFocus(e, true));
      secondHandle.removeEventListener("blur", (e) => handleBlur(e, true));
    }

    // Clean up document listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("touchmove", handleMouseMove);
    document.removeEventListener("touchend", handleMouseUp);
  };

  // Return consolidated handlers
  return {
    // Mouse/Touch handlers
    handleHandleMouseDown,
    handleTrackMouseDown,
    handleMouseMove,
    handleMouseUp,

    // Keyboard handlers
    handleKeyDown,
    handleFocus,
    handleBlur,

    // Event management
    setupEventListeners,
    cleanupEventListeners,

    // Bubble management
    showActiveBubble,
    hideActiveBubble,
    hideAllBubbles,
    clearKeyboardFocus,
  };
};
