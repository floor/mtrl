// src/core/compose/features/textinput.ts

import { ElementComponent } from "../component";
import { hasLifecycle, hasEmit } from "../utils/type-guards";

/**
 * Configuration for text input feature
 */
export interface TextInputConfig {
  /**
   * Input type (text, password, etc.)
   */
  type?: string;

  /**
   * Whether to use textarea instead of input
   */
  multiline?: boolean;

  /**
   * Input name attribute
   */
  name?: string;

  /**
   * Whether input is required
   */
  required?: boolean;

  /**
   * Whether input is disabled
   */
  disabled?: boolean;

  /**
   * Maximum allowed length
   */
  maxLength?: number;

  /**
   * Input validation pattern
   */
  pattern?: string;

  /**
   * Autocomplete setting
   */
  autocomplete?: string;

  /**
   * Initial input value
   */
  value?: string;

  /**
   * Placeholder attribute
   */
  placeholder?: string;

  [key: string]: any;
}

/**
 * Component with text input capabilities
 */
export interface TextInputComponent extends ElementComponent {
  /**
   * Input element
   */
  input: HTMLInputElement | HTMLTextAreaElement;

  /**
   * Sets the input value
   * @param value - Value to set
   * @returns Component instance for chaining
   */
  setValue: (value: string) => TextInputComponent;

  /**
   * Gets the current input value
   * @returns Current value
   */
  getValue: () => string;

  /**
   * Sets an attribute on the input
   * @param name - Attribute name
   * @param value - Attribute value
   * @returns Component instance for chaining
   */
  setAttribute: (name: string, value: string) => TextInputComponent;

  /**
   * Gets an attribute from the input
   * @param name - Attribute name
   * @returns Attribute value
   */
  getAttribute: (name: string) => string | null;

  /**
   * Removes an attribute from the input
   * @param name - Attribute name
   * @returns Component instance for chaining
   */
  removeAttribute: (name: string) => TextInputComponent;

  /**
   * Event emission method if available
   */
  emit?: (event: string, data: any) => TextInputComponent;
}

/**
 * Enhances a component with text input functionality
 *
 * @param config - Text input configuration
 * @returns Function that enhances a component with text input capabilities
 */
export const withTextInput =
  <T extends TextInputConfig>(config: T = {} as T) =>
  <C extends ElementComponent>(component: C): C & TextInputComponent => {
    const isMultiline = config.multiline || config.type === "multiline";
    const input = document.createElement(isMultiline ? "textarea" : "input") as
      | HTMLInputElement
      | HTMLTextAreaElement;

    input.className = `${component.getClass("textfield")}-input`;

    // Set input attributes
    const attributes: Record<string, string | number | boolean | undefined> = {
      name: config.name,
      required: config.required,
      disabled: config.disabled,
      maxLength: config.maxLength,
      pattern: config.pattern,
      autocomplete: config.autocomplete,
      value: config.value || "",
      placeholder: config.placeholder || " ", // Always set placeholder (space if empty) for CSS detection
    };

    // Only set type attribute for input elements, not for textarea
    if (!isMultiline) {
      attributes.type = config.type || "text";
    } else {
      // For textarea, add a data attribute to identify it as multiline
      attributes["data-type"] = "multiline";
    }

    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === "boolean") {
          if (value) {
            input.setAttribute(key, "");
          }
        } else {
          input.setAttribute(key, String(value));
        }
      }
    });

    // Handle input state changes
    const updateInputState = (): boolean => {
      const isEmpty = !input.value;
      component.element.classList.toggle(
        `${component.getClass("textfield")}--empty`,
        isEmpty
      );
      return isEmpty;
    };

    // Enhanced autofill detection function
    const checkForAutofill = (shouldEmit: boolean = true): void => {
      console.log("checkForAutofill");
      // Multiple detection methods for better browser compatibility

      // Method 1: Check for non-empty value (most reliable)
      // This catches cases where autofill happened before our listeners
      const hasValue = input.value && input.value.length > 0;

      // Method 2: Check webkit autofill pseudo-class
      const hasWebkitAutofill = input.matches(":-webkit-autofill");

      // Method 3: Check computed styles for autofill background colors
      const computedStyle = window.getComputedStyle(input);
      const bgColor = computedStyle.backgroundColor;
      const isAutofillBackground =
        bgColor === "rgb(250, 255, 189)" || // Chrome/Edge
        bgColor === "rgb(232, 240, 254)" || // Firefox
        bgColor === "rgb(250, 255, 0)" || // Safari
        bgColor === "rgba(255, 255, 0, 0.1)"; // Some browsers

      // If any detection method indicates autofill or value present
      if (hasValue || hasWebkitAutofill || isAutofillBackground) {
        component.element.classList.remove(
          `${component.getClass("textfield")}--empty`
        );

        // Emit event if value was autofilled (not just has value) and shouldEmit is true
        if (
          shouldEmit &&
          hasEmit(component) &&
          (hasWebkitAutofill || isAutofillBackground)
        ) {
          component.emit("input", {
            value: input.value,
            isEmpty: false,
            isAutofilled: true,
          });
        }
      }
    };

    // Set up MutationObserver to detect attribute changes (some browsers set attributes on autofill)
    let autofillObserver: MutationObserver | null = null;

    // Only set up MutationObserver if it's available (not in all test environments)
    if (typeof MutationObserver !== "undefined") {
      autofillObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            (mutation.attributeName === "value" ||
              mutation.attributeName === "data-autofilled")
          ) {
            checkForAutofill(true);
          }
        });
      });

      // Observe the input for attribute changes
      autofillObserver.observe(input, {
        attributes: true,
        attributeFilter: ["value", "data-autofilled", "autocomplete"],
      });
    }

    // Event listeners
    input.addEventListener("focus", () => {
      component.element.classList.add(
        `${component.getClass("textfield")}--focused`
      );
      if (hasEmit(component)) {
        component.emit("focus", { isEmpty: updateInputState() });
      }
      // Check for autofill on focus, but don't emit during focus
      checkForAutofill(false);
    });

    input.addEventListener("blur", () => {
      component.element.classList.remove(
        `${component.getClass("textfield")}--focused`
      );
      if (hasEmit(component)) {
        component.emit("blur", { isEmpty: updateInputState() });
      }
      // Final check on blur, but don't emit
      checkForAutofill(false);
    });

    input.addEventListener("input", () => {
      if (hasEmit(component)) {
        component.emit("input", {
          value: input.value,
          isEmpty: updateInputState(),
          isAutofilled: false,
        });
      } else {
        updateInputState();
      }
    });

    // Listen for change events (some browsers fire this on autofill)
    input.addEventListener("change", () => {
      const isEmpty = updateInputState();
      checkForAutofill(false);
      if (hasEmit(component)) {
        component.emit("change", {
          value: input.value,
          isEmpty,
          isAutofilled: input.matches?.(":-webkit-autofill") || false,
        });
      }
    });

    // Listen for animation events that indicate autofill (webkit browsers)
    input.addEventListener("animationstart", (e: AnimationEvent) => {
      if (
        e.animationName === "onAutoFillStart" ||
        e.animationName?.includes("autofill")
      ) {
        checkForAutofill();
      }
    });

    // Initial state setup
    updateInputState();

    // Check for autofill immediately (handles pre-filled values)
    // This catches autofill that happens before component initialization
    setTimeout(() => {
      checkForAutofill(false);
    }, 0);

    // Add multiline class to the component if it's a textarea
    if (isMultiline) {
      component.element.classList.add(
        `${component.getClass("textfield")}--multiline`
      );
    }

    component.element.appendChild(input);

    // Cleanup
    if (hasLifecycle(component)) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        // Clean up observer
        if (autofillObserver) {
          autofillObserver.disconnect();
        }
        input.remove();
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      input,
      setValue(value: string) {
        input.value = value || "";
        updateInputState();
        return this;
      },
      getValue() {
        return input.value;
      },
      setAttribute(name: string, value: string) {
        input.setAttribute(name, value);
        return this;
      },
      getAttribute(name: string) {
        return input.getAttribute(name);
      },
      removeAttribute(name: string) {
        input.removeAttribute(name);
        return this;
      },
    };
  };
