// src/core/compose/features/input.ts

import { omitsAttribute } from "../../utils/attributes";
import { ElementComponent } from "../component";

/**
 * Input configuration options
 */
export interface InputConfig {
  /**
   * Input name attribute
   */
  name?: string;

  /**
   * Initial checked state
   */
  checked?: boolean;

  /**
   * Whether input is required
   */
  required?: boolean;

  /**
   * Whether input is disabled
   */
  disabled?: boolean;

  /**
   * Input value attribute
   */
  value?: string;

  /**
   * Accessibility label text
   */
  label?: string;

  /**
   * Alternative accessibility label
   */
  ariaLabel?: string;

  /**
   * Component name for classes
   */
  componentName?: string;
}

/**
 * Interface for components with emit capability
 */
interface ComponentWithEmit extends ElementComponent {
  emit: (event: string, data: unknown) => unknown;
}

/**
 * Type guard to check if a component has emit capability
 */
function hasEmit(component: object): component is ComponentWithEmit {
  return "emit" in component && typeof component.emit === "function";
}

/**
 * What withInput adds to a component.
 *
 * Declared apart from InputComponent because the enhancer returns
 * `C & InputFeature`, and C -- the component being enhanced -- already carries
 * the element half. Naming the whole of InputComponent on the way out is what
 * narrowed `addClass` back to a bare ElementComponent. It has to be its own
 * interface rather than a Pick of InputComponent: an indexed access binds
 * `this` to the type being indexed, so the methods below would report
 * InputComponent and the polymorphism would be lost at the step that needs it.
 */
export interface InputFeature {
  /**
   * Input element
   */
  input: HTMLInputElement;

  /**
   * Gets the current input value
   * @returns Current value
   */
  getValue: () => string;

  /**
   * Sets the input value and emits a value event
   * @param value - New value to set
   * @returns Component instance for chaining
   */
  setValue(value: string): this;

  /**
   * Event emission method if available
   */
  emit?(event: string, data: unknown): this;
}

/**
 * Component with input element and related methods
 */
export interface InputComponent extends ElementComponent, InputFeature {}

/**
 * Creates an input element and adds it to a component
 * Handles both input creation and event emission for state changes
 *
 * @param config - Input configuration
 * @returns Function that enhances a component with input functionality
 */
export const withInput =
  // `& object` lets a component config that shares no key with InputConfig through.
  <T extends InputConfig & object>(config: T = {} as T) =>
  <C extends ElementComponent>(component: C): C & InputFeature => {
    const input = document.createElement("input");
    const name = component.componentName || "component";
    input.type = "checkbox";
    input.className = `${component.getClass(name)}__input`;

    // Ensure input can receive focus
    input.style.position = "absolute";
    input.style.opacity = "0";
    input.style.cursor = "pointer";
    // Don't use display: none or visibility: hidden as they prevent focus

    // The input itself should be focusable, not the wrapper
    component.element.setAttribute("role", "presentation");
    input.setAttribute("role", name);

    const attributes: Record<string, string | boolean | undefined> = {
      name: config.name,
      checked: config.checked,
      required: config.required,
      disabled: config.disabled,
      value: config.value || "on",
      // an explicit ariaLabel is a choice; the label text is only a fallback
      "aria-label": config.ariaLabel || config.label,
    };

    Object.entries(attributes).forEach(([key, value]) => {
      // `false` on a boolean attribute fell through to String(value) below
      // and wrote "false", which is present and therefore true. FLO-240.
      if (value !== null && value !== undefined && !omitsAttribute(key, value)) {
        if (key === "disabled" && value === true) {
          input.disabled = true;
          input.setAttribute("disabled", "true");
          // Note: We don't add the class here because that's handled by withDisabled
        } else if (value === true) {
          input.setAttribute(key, key);
        } else {
          input.setAttribute(key, String(value));
        }
      }
    });

    // Bridge native checkbox events to our event system
    input.addEventListener("change", (event) => {
      if (hasEmit(component)) {
        component.emit("change", {
          checked: input.checked,
          value: input.value,
          nativeEvent: event,
        });
      }
    });

    // Add keyboard handling
    input.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (!input.disabled) {
          input.checked = !input.checked;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    });

    component.element.appendChild(input);

    return {
      ...component,
      input,

      /**
       * Gets the current input value
       * @returns Current value
       */
      getValue: () => input.value,

      /**
       * Sets the input value and emits a value event
       * @param value - New value to set
       * @returns Component instance for chaining
       */
      setValue(value: string) {
        input.value = value;
        if (hasEmit(component)) {
          component.emit("value", { value });
        }
        return this;
      },
    };
  };
