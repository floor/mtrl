// src/components/slider/features/controller.ts
import type { SliderComponent } from "../types";
import { SLIDER_EVENTS } from "../types";
import {
  SliderConfig,
  SliderEventHelpers,
  SliderState,
  SliderElements,
  SliderStateComponent,
  SliderUiRenderer,
} from "../types";
import { SLIDER_MEASUREMENTS } from "../constants";
import { defaultConfig } from "../config";
import { createHandlers } from "./handlers";
import { setFormValue } from "../../../core/dom/form-value";

/**
 * Add controller functionality to slider component
 * Manages state, events, user interactions, and UI rendering
 *
 * @param config Slider configuration
 * @returns Component enhancer with slider controller functionality
 */
export const withController =
  (config: SliderConfig, getComponent: () => SliderComponent) =>
  // Generic, so the accumulated pipeline type survives to whatever follows.
  // There used to be a `if (!component.element)` guard here, warning and
  // returning the component untouched: withElement runs before this in the
  // only pipe that calls it, so it could not fire, and an early return makes
  // the return type a union that collapses to C.
  <C extends SliderStateComponent>(component: C) => {
  // Initialize state with current config
  const max = config.max !== undefined ? config.max : 100;
  const state: SliderState = {
    component,
    value: config.value !== undefined ? config.value : 0,
    // A range slider's second value defaults to max, which is what withDom
    // already renders the second handle at. The two disagreed: the handle went
    // up with `aria-valuenow="100"` while the state said null, so the component
    // gave three answers at once -- the picture said 20 to 100, the screen
    // reader said 20 to 100, and getSecondValue() said there was no second
    // value. Outside a range there is genuinely no second handle, so null.
    secondValue:
      config.secondValue !== undefined
        ? config.secondValue
        : config.range
          ? max
          : null,
    min: config.min !== undefined ? config.min : 0,
    max,
    step: config.step !== undefined ? config.step : 1,
    dragging: false,
    pressed: false, // Track if handle is pressed (mouse down)
    activeHandle: null, // Track which handle is active (null, 'first', 'second')
    activeBubble: null,
    valueHideTimer: null,
  };

  // Create event helpers
  const eventHelpers: SliderEventHelpers = {
    triggerEvent(eventName: string, originalEvent: Event | null = null) {
      const eventData = {
        slider: getComponent(),
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
  const getComponents = (): SliderElements => {
    // The `if (!state.component) return {}` that used to open this could not
    // fire -- the controller is handed the component -- and the empty object
    // made the return a union that no caller could destructure.
    // Get components from both direct properties (withDom) and components object (legacy)
    const components = state.component.components || {};
    const component = state.component;

    return {
      container: component.container || components.container,
      handle: component.handle || components.handle,
      valueBubble: component.valueBubble || components.valueBubble,
      secondHandle: component.secondHandle || components.secondHandle,
      secondValueBubble:
        component.secondValueBubble || components.secondValueBubble,
      // Include any other components that might exist
      ...components,
    };
  };

  /**
   * Calculates percentage position for a value
   * Maps from value space (min-max) to percentage space (0-100)
   */
  const getPercentage = (value: number): number => {
    const range = state.max - state.min;
    return range === 0 ? 0 : ((value - state.min) / range) * 100;
  };

  // Percentage plus a fixed inset stays aligned when the container resizes.
  const visualPosition = (percent: number) => {
    const ratio = Math.min(1, Math.max(0, percent / 100));
    return `calc(${ratio * 100}% + ${SLIDER_MEASUREMENTS.EDGE_PADDING * (1 - 2 * ratio)}px)`;
  };

  /**
   * Gets slider value from a position on the track
   * Maps from pixel position to slider value
   */
  const getValueFromPosition = (position: number): number => {
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
        Math.min(rightEdge, position),
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
  const roundToStep = (value: number): number => {
    const step = state.step;
    if (!step || step <= 0) return value;

    const steps = Math.round((value - state.min) / step);
    return state.min + steps * step;
  };

  /**
   * Clamps a value between min and max
   * Ensures values stay within valid range
   */
  const clamp = (value: number, min = state.min, max = state.max): number =>
    Math.min(Math.max(value, min), max);

  /**
   * Updates handle and bubble positions
   * Positions elements according to current state values
   */
  const updateHandlePositions = () => {
    const components = getComponents();
    const { handle, container, valueBubble, secondHandle, secondValueBubble } =
      components;

    if (!handle || !container) return;

    handle.style.left = visualPosition(getPercentage(state.value));
    handle.style.transform = "translate(-50%, -50%)";

    if (valueBubble) {
      valueBubble.style.left = visualPosition(getPercentage(state.value));
      valueBubble.style.transform = "translateX(-50%)";
    }

    // Update second handle if range slider
    if (config.range && secondHandle && state.secondValue !== null) {
      secondHandle.style.left = visualPosition(getPercentage(state.secondValue));
      secondHandle.style.transform = "translate(-50%, -50%)";

      if (secondValueBubble) {
        secondValueBubble.style.left = visualPosition(getPercentage(state.secondValue));
        secondValueBubble.style.transform = "translateX(-50%)";
      }
    }

    // Update ARIA attributes
    updateHandleAria(handle, state.value);
    if (config.range && secondHandle && state.secondValue !== null) {
      updateHandleAria(secondHandle, state.secondValue);
    }
  };

  /**
   * Syncs a handle's current value attributes; aria-valuetext only
   * carries a custom valueFormatter's text (the default adds nothing).
   */
  const updateHandleAria = (handleElement: HTMLElement, value: number) => {
    handleElement.setAttribute("aria-valuenow", String(value));
    if (
      config.valueFormatter &&
      config.valueFormatter !== defaultConfig.valueFormatter
    ) {
      handleElement.setAttribute("aria-valuetext", config.valueFormatter(value));
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
  const showValueBubble = (
    bubbleElement: HTMLElement | null,
    show: boolean,
  ): void => {
    if (!bubbleElement || !config.showValue) return;

    const bubbleClass = state.component.getClass("slider__value");
    bubbleElement.classList[show ? "add" : "remove"](`${bubbleClass}--visible`);
  };

  /**
   * Generates tick marks
   * NOTE: Ticks are now rendered via track, this just clears any DOM ticks
   */
  const generateTicks = () => {
    // Track handles tick rendering - no DOM manipulation needed
  };

  /**
   * Updates active state of tick marks
   * NOTE: Ticks are now rendered via track, so this is no longer needed
   */
  const updateTicks = () => {
    // Track handles tick rendering - no DOM manipulation needed
  };

  /**
   * Renders all UI elements to match current state
   * Central method for keeping UI in sync with state
   */
  const render = () => {
    try {
      updateHandlePositions();
      updateValueBubbles();

      // Every path that moves the slider ends here — drag, keyboard, both
      // setters whether or not they trigger an event, and min/max clamping —
      // so this is the one place the submitted value has to be kept in step.
      if (component.formFields) {
        setFormValue(component.formFields[0], String(state.value));
        if (state.secondValue !== null) {
          setFormValue(component.formFields[1], String(state.secondValue));
        }
      }

      // Trigger track redraw if available
      if (component.renderTracks) {
        // Pass the current state directly to track
        component.renderTracks(state);
      }
    } catch (error) {
      console.warn("Error rendering UI:", error);
    }
  };

  // Create UI renderer interface for event handlers
  const uiRenderer: SliderUiRenderer = {
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
      const components = getComponents();

      if (!components.handle) {
        console.warn(
          "Cannot initialize slider controller: missing required handle component",
        );
        return;
      }

      const { handle, secondHandle } = components;

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

  const initialization = setTimeout(initController, 0);

  // Register with lifecycle if available
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    component.lifecycle.destroy = () => {
      clearTimeout(initialization);
      handlers.cleanupEventListeners();
      originalDestroy.call(component.lifecycle);
    };
  }


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
      setValue(value: number, triggerEvent = true) {
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
      setSecondValue(value: number, triggerEvent = true) {
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
      setMin(min: number) {
        state.min = min;

        // Update ARIA attributes on handles
        const components = getComponents();
        if (components.handle) {
          components.handle.setAttribute("aria-valuemin", String(min));
        }

        if (config.range && components.secondHandle) {
          components.secondHandle.setAttribute("aria-valuemin", String(min));
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
      setMax(max: number) {
        state.max = max;

        // Update ARIA attributes on handles
        const components = getComponents();
        if (components.handle) {
          components.handle.setAttribute("aria-valuemax", String(max));
        }

        if (config.range && components.secondHandle) {
          components.secondHandle.setAttribute("aria-valuemax", String(max));
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
      setStep(step: number) {
        state.step = step;
        render();

        // Add or remove discrete class
        component.element.classList[step > 0 ? "add" : "remove"](
          `${component.getClass("slider")}--discrete`,
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
       * NOTE: Track handles tick rendering, this just triggers a redraw
       * @returns Slider controller for chaining
       */
      regenerateTicks() {
        render(); // Track will redraw ticks based on current state
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
