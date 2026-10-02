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
  label?: string | Node;

  /**
   * Alternative accessibility label
   */
  ariaLabel?: string;

  /**
   * Component name for classes
   */
  componentName?: string;

  /**
   * Whether Enter toggles the input as Space does
   * @default true
   */
  enterToggles?: boolean;
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
   * Gets the checked state: the `value` a `change` carries
   * @returns Whether the input is checked
   */
  getValue: () => boolean;

  /**
   * Checks or unchecks the input. Silent: only the user's change emits `change`
   * @param value - Whether the input is checked
   * @returns Component instance for chaining
   */
  setValue(value: boolean): this;

  /**
   * Gets the input's `value` attribute: the string a form submits while checked
   * @returns The input's string value
   */
  getValueAttribute: () => string;

  /**
   * Sets the input's `value` attribute. Silent
   * @param value - The string a form submits while checked
   * @returns Component instance for chaining
   */
  setValueAttribute(value: string): this;

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
 * `change` carries `{ checked, value, valueAttribute, nativeEvent }`: `value` is
 * the checked boolean, as the checkbox and the switch report it, and
 * `valueAttribute` the input's string value. The methods match: `getValue()`
 * and `setValue()` work on the checked boolean, `getValueAttribute()` and
 * `setValueAttribute()` on the string. Both setters are silent.
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
      // A node (the web component's <slot>) names the input through its <label>.
      "aria-label": config.ariaLabel || (typeof config.label === "string" ? config.label : undefined),
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
          // The checked state, as every model event's value; the HTML token is valueAttribute
          value: input.checked,
          valueAttribute: input.value,
          nativeEvent: event,
        });
      }
    });

    // Add keyboard handling
    input.addEventListener("keydown", (event) => {
      if (event.key === " " || (event.key === "Enter" && config.enterToggles !== false)) {
        event.preventDefault();
        // Native activation, as a click: it clears `indeterminate`, toggles
        // `checked` and fires input then change, and does nothing while
        // disabled. Flipping `checked` by hand left a mixed box mixed, with
        // its dash and class, and fired no input event (FLO-316).
        input.click();
      }
    });

    component.element.appendChild(input);

    return {
      ...component,
      input,

      // The checked boolean, as change.value; the string pair is the attribute's,
      // under the names the checkbox and the switch use. Setters are silent.
      getValue: () => input.checked,

      setValue(value: boolean) {
        input.checked = value;
        return this;
      },

      getValueAttribute: () => input.value,

      setValueAttribute(value: string) {
        input.value = value;
        return this;
      },
    };
  };
