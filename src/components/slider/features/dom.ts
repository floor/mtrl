import { createElement } from "../../../core/dom/create";
import { setStyles } from "../../../core/dom/utils";
import { SliderConfig } from "../types";
import { ElementComponent } from "../../../core/compose/component";

/**
 * Creates the inner slider DOM structure using optimized createElement
 * This works alongside withElement to create slider-specific inner elements
 *
 * @param config Slider configuration
 * @returns Component enhancement function
 */
export const withDom =
  (config: SliderConfig) =>
  <T extends ElementComponent>(
    component: T
  ): T & {
    container: HTMLElement;
    handle: HTMLElement;
    valueBubble: HTMLElement;
    secondHandle?: HTMLElement;
    secondValueBubble?: HTMLElement;
    getContainer: () => HTMLElement;
    getHandle: () => HTMLElement;
    getValueBubble: () => HTMLElement;
    getSecondHandle?: () => HTMLElement | null;
    getSecondValueBubble?: () => HTMLElement | null;
  } => {
    // Get prefixed class names
    const getClass = (className: string) => component.getClass(className);

    // Set default values
    const min = config.min || 0;
    const max = config.max || 100;
    const value = config.value !== undefined ? config.value : min;
    const isDisabled = config.disabled === true;
    const formatter = config.valueFormatter || ((val) => val.toString());

    // Calculate initial position
    const valuePercent = ((value - min) / (max - min)) * 100;

    // Create the slider container inside the main element
    const container = createElement({
      tag: "div",
      className: getClass("slider-container"),
      container: component.element,
    });

    // Apply styles using setStyles
    setStyles(container, {
      position: "relative", // For canvas absolute positioning
    });

    // Create the main handle (kept as DOM for accessibility)
    const handle = createElement({
      tag: "div",
      className: getClass("slider-handle"),
      attributes: {
        role: "slider",
        "aria-valuemin": String(min),
        "aria-valuemax": String(max),
        "aria-valuenow": String(value),
        "aria-orientation": "horizontal",
        tabindex: isDisabled ? "-1" : "0",
        "aria-disabled": isDisabled ? "true" : "false",
        "data-value": String(value),
        "data-handle-index": "0",
      },
      container: container,
    });

    // Apply handle positioning
    setStyles(handle, {
      left: `${valuePercent}%`,
    });

    // Create the value bubble (kept as DOM for text rendering)
    const valueBubble = createElement({
      tag: "div",
      className: getClass("slider-value"),
      attributes: {
        "aria-hidden": "true",
        "data-handle-index": "0",
      },
      text: formatter(value),
      container: container,
    });

    // Apply value bubble positioning
    setStyles(valueBubble, {
      left: `${valuePercent}%`,
    });

    // Create second handle and value bubble for range sliders
    let secondHandle: HTMLElement | undefined;
    let secondValueBubble: HTMLElement | undefined;

    if (config.range) {
      const secondValue =
        config.secondValue !== undefined ? config.secondValue : max;
      const secondValuePercent = ((secondValue - min) / (max - min)) * 100;

      // Create the second handle
      secondHandle = createElement({
        tag: "div",
        className: getClass("slider-handle"),
        attributes: {
          role: "slider",
          "aria-valuemin": String(min),
          "aria-valuemax": String(max),
          "aria-valuenow": String(secondValue),
          "aria-orientation": "horizontal",
          tabindex: isDisabled ? "-1" : "0",
          "aria-disabled": isDisabled ? "true" : "false",
          "data-value": String(secondValue),
          "data-handle-index": "1",
        },
        container: container,
      });

      // Apply second handle positioning
      setStyles(secondHandle, {
        left: `${secondValuePercent}%`,
      });

      // Create the second value bubble
      secondValueBubble = createElement({
        tag: "div",
        className: getClass("slider-value"),
        attributes: {
          "aria-hidden": "true",
          "data-handle-index": "1",
        },
        text: formatter(secondValue),
        container: container,
      });

      // Apply second value bubble positioning
      setStyles(secondValueBubble, {
        left: `${secondValuePercent}%`,
      });
    }

    // Return enhanced component with inner elements
    return {
      ...component,
      container,
      handle,
      valueBubble,
      secondHandle,
      secondValueBubble,

      // Add DOM query methods for compatibility
      getContainer: () => container,
      getHandle: () => handle,
      getValueBubble: () => valueBubble,
      getSecondHandle: () => secondHandle || null,
      getSecondValueBubble: () => secondValueBubble || null,
    };
  };
