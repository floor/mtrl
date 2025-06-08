// src/components/slider/features/controller.ts
import { SLIDER_EVENTS } from "../types";
import { SliderConfig } from "../types";
import { SLIDER_MEASUREMENTS } from "../constants";
import { createHandlers } from "./handlers";

/**
 * Add controller functionality to slider component
 * Manages state, events, user interactions, and UI rendering
 *
 * @param config Slider configuration
 * @returns Component enhancer with slider controller functionality
 */
export const withController = (config: SliderConfig) => (component) => {
  // Ensure component has required properties
  if (!component.element || !component.components) {
    console.warn(
      "Cannot initialize slider controller: missing element or components"
    );
    return component;
  }

  // Initialize state with current config
  const state = {
    component,
    value: config.value !== undefined ? config.value : 0,
    secondValue: config.secondValue !== undefined ? config.secondValue : null,
    min: config.min !== undefined ? config.min : 0,
    max: config.max !== undefined ? config.max : 100,
    step: config.step !== undefined ? config.step : 1,
    dragging: false,
    pressed: false, // Track if handle is pressed (mouse down)
    activeHandle: null, // Track which handle is active (null, 'first', 'second')
    activeBubble: null,
    valueHideTimer: null,
  };

  // Create event helpers
  const eventHelpers = {
    triggerEvent(eventName, originalEvent = null) {
      const eventData = {
        slider: state.component,
        value: state.value,
        secondValue: state.secondValue,
        originalEvent,
        preventDefault: () => {
          eventData.defaultPrevented = true;
        },
        defaultPrevented: false,
      };

      state.component.emit(eventName, eventData);
      return eventData;
    },
  };

  //=============================================================================
  // UI RENDERING FUNCTIONS
  //=============================================================================

  /**
   * Gets required components from state, safely handling missing components
   */
  const getComponents = () => {
    // Return empty object if component or components are missing
    if (!state.component?.components) {
      return {};
    }

    // Get flattened components
    return state.component.components;
  };

  /**
   * Calculates percentage position for a value
   * Maps from value space (min-max) to percentage space (0-100)
   */
  const getPercentage = (value) => {
    const range = state.max - state.min;
    return range === 0 ? 0 : ((value - state.min) / range) * 100;
  };

  /**
   * Gets track dimensions and constraints for positioning calculations
   * Handles edge constraints and padding for proper handle positioning
   */
  const getTrackDimensions = () => {
    const components = getComponents();
    const { handle, container } = components;

    if (!handle || !container) return null;

    try {
      const handleRect = handle.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const handleSize = handleRect.width || SLIDER_MEASUREMENTS.HANDLE_SIZE;
      const trackSize = containerRect.width;

      // Use EDGE_PADDING for consistent edge constraints
      const edgeConstraint =
        (SLIDER_MEASUREMENTS.EDGE_PADDING / trackSize) * 100;
      const paddingPixels = state.activeHandle ? 6 : 8;
      const paddingPercent = (paddingPixels / trackSize) * 100;

      return { handleSize, trackSize, edgeConstraint, paddingPercent };
    } catch (error) {
      console.warn("Error calculating track dimensions:", error);
      return {
        handleSize: SLIDER_MEASUREMENTS.HANDLE_SIZE,
        trackSize: 200,
        edgeConstraint: 3, // 6px / 200px * 100
        paddingPercent: 4,
      };
    }
  };

  /**
   * Maps value percentage to visual position with edge constraints
   * Ensures handles stay within the visible track area
   */
  const mapValueToVisualPercent = (valuePercent, trackSize = 200) => {
    // Calculate edge constraint using EDGE_PADDING
    const edgeConstraint = (SLIDER_MEASUREMENTS.EDGE_PADDING / trackSize) * 100;
    const minEdge = edgeConstraint;
    const maxEdge = 100 - edgeConstraint;
    const visualRange = maxEdge - minEdge;

    if (valuePercent <= 0) return minEdge;
    if (valuePercent >= 100) return maxEdge;
    return minEdge + (valuePercent / 100) * visualRange;
  };

  /**
   * Gets slider value from a position on the track
   * Maps from pixel position to slider value
   */
  const getValueFromPosition = (position) => {
    const components = getComponents();
    const { handle, container } = components;

    if (!handle || !container) return state.min;

    try {
      const containerRect = container.getBoundingClientRect();
      const range = state.max - state.min;

      // Use EDGE_PADDING for consistent edge constraints
      const leftEdge = containerRect.left + SLIDER_MEASUREMENTS.EDGE_PADDING;
      const rightEdge = containerRect.right - SLIDER_MEASUREMENTS.EDGE_PADDING;
      const effectiveWidth = rightEdge - leftEdge;

      const adjustedPosition = Math.max(
        leftEdge,
        Math.min(rightEdge, position)
      );
      const percentageFromLeft = (adjustedPosition - leftEdge) / effectiveWidth;

      return state.min + percentageFromLeft * range;
    } catch (error) {
      console.warn("Error calculating value from position:", error);
      return state.min;
    }
  };

  /**
   * Rounds a value to the nearest step
   * Used for discrete sliders
   */
  const roundToStep = (value) => {
    const step = state.step;
    if (!step || step <= 0) return value;

    const steps = Math.round((value - state.min) / step);
    return state.min + steps * step;
  };

  /**
   * Clamps a value between min and max
   * Ensures values stay within valid range
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  /**
   * Updates handle and bubble positions
   * Positions elements according to current state values
   */
  const updateHandlePositions = () => {
    const components = getComponents();
    const { handle, container, valueBubble, secondHandle, secondValueBubble } =
      components;

    if (!handle || !container) return;

    const dims = getTrackDimensions();
    if (!dims) return;

    const { trackSize } = dims;

    // Update main handle position
    const percent = getPercentage(state.value);
    const adjustedPercent = mapValueToVisualPercent(percent, trackSize);

    handle.style.left = `${adjustedPercent}%`;
    handle.style.transform = "translate(-50%, -50%)";

    if (valueBubble) {
      valueBubble.style.left = `${adjustedPercent}%`;
      valueBubble.style.transform = "translateX(-50%)";
    }

    // Update second handle if range slider
    if (config.range && secondHandle && state.secondValue !== null) {
      const secondPercent = getPercentage(state.secondValue);
      const adjustedSecondPercent = mapValueToVisualPercent(
        secondPercent,
        trackSize
      );

      secondHandle.style.left = `${adjustedSecondPercent}%`;
      secondHandle.style.transform = "translate(-50%, -50%)";

      if (secondValueBubble) {
        secondValueBubble.style.left = `${adjustedSecondPercent}%`;
        secondValueBubble.style.transform = "translateX(-50%)";
      }
    }

    // Update ARIA attributes
    if (handle) {
      handle.setAttribute("aria-valuenow", String(state.value));
    }
  };

  /**
   * Updates value bubble content
   * Applies formatting to displayed values
   */
  const updateValueBubbles = () => {
    const components = getComponents();
    const { valueBubble, secondValueBubble } = components;

    if (!valueBubble) return;

    const formatter = config.valueFormatter || ((value) => value.toString());
    valueBubble.textContent = formatter(state.value);

    if (config.range && secondValueBubble && state.secondValue !== null) {
      secondValueBubble.textContent = formatter(state.secondValue);
    }
  };

  /**
   * Shows or hides value bubble
   * Controls visibility for value indicators
   */
  const showValueBubble = (bubbleElement, show) => {
    if (!bubbleElement || !config.showValue) return;

    const bubbleClass = state.component.getClass("slider-value");
    bubbleElement.classList[show ? "add" : "remove"](`${bubbleClass}--visible`);
  };

  /**
   * Generates tick marks
   * NOTE: Ticks are now rendered via canvas, this just clears any DOM ticks
   */
  const generateTicks = () => {
    // Canvas handles tick rendering - no DOM manipulation needed
  };

  /**
   * Updates active state of tick marks
   * NOTE: Ticks are now rendered via canvas, so this is no longer needed
   */
  const updateTicks = () => {
    // Canvas handles tick rendering - no DOM manipulation needed
  };

  /**
   * Renders all UI elements to match current state
   * Central method for keeping UI in sync with state
   */
  const render = () => {
    try {
      updateHandlePositions();
      updateValueBubbles();

      // Trigger canvas redraw if available
      if (component.drawCanvas) {
        // Pass the current state directly to canvas
        component.drawCanvas(state);
      }
    } catch (error) {
      console.warn("Error rendering UI:", error);
    }
  };

  // Create UI renderer interface for event handlers
  const uiRenderer = {
    getPercentage,
    getValueFromPosition,
    roundToStep,
    clamp,
    showValueBubble,
    updateUi: render, // For backward compatibility
    render,
  };

  // Create event handlers with our renderer
  const handlers = createHandlers(config, state, uiRenderer, eventHelpers);

  // Initialize slider controller
  const initController = () => {
    try {
      // Verify we have the necessary components
      if (!component.components || !component.components.handle) {
        console.warn(
          "Cannot initialize slider controller: missing required components"
        );
        return;
      }

      // Set ARIA attributes
      component.element.setAttribute("aria-valuemin", String(state.min));
      component.element.setAttribute("aria-valuemax", String(state.max));
      component.element.setAttribute("aria-valuenow", String(state.value));

      const { handle, secondHandle } = component.components;

      // Set handle attributes
      if (handle) {
        handle.setAttribute("aria-valuemin", String(state.min));
        handle.setAttribute("aria-valuemax", String(state.max));
        handle.setAttribute("aria-valuenow", String(state.value));

        if (config.range && secondHandle && state.secondValue !== null) {
          secondHandle.setAttribute("aria-valuemin", String(state.min));
          secondHandle.setAttribute("aria-valuemax", String(state.max));
          secondHandle.setAttribute("aria-valuenow", String(state.secondValue));
        }
      }

      // Setup event listeners
      handlers.setupEventListeners();

      // Initial UI update
      render();
    } catch (error) {
      console.error("Error initializing slider controller:", error);
    }
  };

  // Register with lifecycle if available
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    component.lifecycle.destroy = () => {
      handlers.cleanupEventListeners();
      originalDestroy();
    };
  }

  // Schedule initialization after current execution completes
  setTimeout(() => {
    initController();
  }, 0);

  // Return enhanced component
  return {
    ...component,
    // Provide controller API under 'slider' property for backward compatibility
    slider: {
      /**
       * Sets slider value
       * @param value New value
       * @param triggerEvent Whether to trigger change event
       * @returns Slider controller for chaining
       */
      setValue(value, triggerEvent = true) {
        const newValue = clamp(value, state.min, state.max);

        state.value = newValue;
        render();

        if (triggerEvent) {
          eventHelpers.triggerEvent(SLIDER_EVENTS.CHANGE);
        }

        return this;
      },

      /**
       * Gets slider value
       * @returns Current value
       */
      getValue() {
        return state.value;
      },

      /**
       * Sets secondary slider value (for range slider)
       * @param value New secondary value
       * @param triggerEvent Whether to trigger change event
       * @returns Slider controller for chaining
       */
      setSecondValue(value, triggerEvent = true) {
        if (!config.range) return this;

        const newValue = clamp(value, state.min, state.max);
        state.secondValue = newValue;
        render();

        if (triggerEvent) {
          eventHelpers.triggerEvent(SLIDER_EVENTS.CHANGE);
        }

        return this;
      },

      /**
       * Gets secondary slider value
       * @returns Current secondary value or null
       */
      getSecondValue() {
        return config.range ? state.secondValue : null;
      },

      /**
       * Sets slider minimum value
       * @param min New minimum value
       * @returns Slider controller for chaining
       */
      setMin(min) {
        state.min = min;

        // Update ARIA attributes if elements exist
        component.element.setAttribute("aria-valuemin", String(min));
        if (component.components?.handle) {
          component.components.handle.setAttribute(
            "aria-valuemin",
            String(min)
          );
        }

        if (config.range && component.components?.secondHandle) {
          component.components.secondHandle.setAttribute(
            "aria-valuemin",
            String(min)
          );
        }

        // Clamp values to new min
        if (state.value < min) state.value = min;
        if (
          config.range &&
          state.secondValue !== null &&
          state.secondValue < min
        ) {
          state.secondValue = min;
        }

        // Regenerate ticks if needed
        if (config.ticks || config.tickLabels) {
          generateTicks();
        }

        render();
        return this;
      },

      /**
       * Gets slider minimum value
       * @returns Current minimum value
       */
      getMin() {
        return state.min;
      },

      /**
       * Sets slider maximum value
       * @param max New maximum value
       * @returns Slider controller for chaining
       */
      setMax(max) {
        state.max = max;

        // Update ARIA attributes if elements exist
        component.element.setAttribute("aria-valuemax", String(max));
        if (component.components?.handle) {
          component.components.handle.setAttribute(
            "aria-valuemax",
            String(max)
          );
        }

        if (config.range && component.components?.secondHandle) {
          component.components.secondHandle.setAttribute(
            "aria-valuemax",
            String(max)
          );
        }

        // Clamp values to new max
        if (state.value > max) state.value = max;
        if (
          config.range &&
          state.secondValue !== null &&
          state.secondValue > max
        ) {
          state.secondValue = max;
        }

        // Regenerate ticks if needed
        if (config.ticks || config.tickLabels) {
          generateTicks();
        }

        render();
        return this;
      },

      /**
       * Gets slider maximum value
       * @returns Current maximum value
       */
      getMax() {
        return state.max;
      },

      /**
       * Sets slider step size
       * @param step New step size
       * @returns Slider controller for chaining
       */
      setStep(step) {
        state.step = step;

        // Add or remove discrete class
        component.element.classList[step > 0 ? "add" : "remove"](
          `${component.getClass("slider")}--discrete`
        );

        // Regenerate ticks if needed
        if (config.ticks || config.tickLabels) {
          generateTicks();
          updateTicks();
        }

        return this;
      },

      /**
       * Gets slider step size
       * @returns Current step size
       */
      getStep() {
        return state.step;
      },

      /**
       * Regenerate tick marks and labels
       * NOTE: Canvas handles tick rendering, this just triggers a redraw
       * @returns Slider controller for chaining
       */
      regenerateTicks() {
        render(); // Canvas will redraw ticks based on current state
        return this;
      },

      /**
       * Update all UI elements
       * @returns Slider controller for chaining
       */
      updateUi() {
        render();
        return this;
      },
    },
  };
};
