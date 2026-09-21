// src/components/textfield/api.ts
import type {
  BaseComponent,
  TextfieldComponent,
  ApiOptions,
  TextfieldVariant,
  TextfieldEvents,
} from "./types";

/**
 * Component interface with density feature
 */
type ComponentWithDensity = BaseComponent & {
  density?: {
    current: string;
    set: (density: string) => void;
  };
  updateElementPositions?: () => void;
  schedulePositionUpdate?: () => void;
  setError?: (error: boolean, message?: string) => void;
  isError?: () => boolean;
};

/**
 * Enhances textfield component with API methods
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI =
  ({ disabled, lifecycle }: ApiOptions) =>
  (component: ComponentWithDensity): TextfieldComponent => ({
    element: component.element,
    input: component.input as HTMLInputElement | HTMLTextAreaElement,

    // Value management
    getValue: component.getValue || (() => ""),
    setValue(value: string): TextfieldComponent {
      component.setValue?.(value);
      return this;
    },

    // Attributes API
    setAttribute(name: string, value: string): TextfieldComponent {
      component.setAttribute?.(name, value);
      return this;
    },

    getAttribute(name: string): string | null {
      return component.getAttribute?.(name) || null;
    },

    removeAttribute(name: string): TextfieldComponent {
      component.removeAttribute?.(name);
      return this;
    },

    // Variant management
    setVariant(variant: TextfieldVariant): TextfieldComponent {
      const PREFIX = component.config?.prefix || "mtrl";
      const COMPONENT = component.config?.componentName || "textfield";

      // Remove existing variant classes
      component.element.classList.remove(
        `${PREFIX}-${COMPONENT}--filled`,
        `${PREFIX}-${COMPONENT}--outlined`
      );

      // Add the new variant class
      component.element.classList.add(`${PREFIX}-${COMPONENT}--${variant}`);

      // Update positioning after variant change
      if (component.updateElementPositions) {
        component.schedulePositionUpdate?.();
      }

      return this;
    },

    getVariant(): TextfieldVariant {
      const PREFIX = component.config?.prefix || "mtrl";
      const COMPONENT = component.config?.componentName || "textfield";

      if (
        component.element.classList.contains(`${PREFIX}-${COMPONENT}--outlined`)
      ) {
        return "outlined";
      }

      return "filled"; // Default to filled if no class found
    },

    // Label management
    setLabel(text: string): TextfieldComponent {
      component.label?.setText(text);
      // Update positions after changing label
      if (component.updateElementPositions) {
        component.schedulePositionUpdate?.();
      }
      return this;
    },

    getLabel(): string {
      return component.label?.getText() || "";
    },

    // Leading icon management (if present)
    // A live read, not a snapshot. This used to be captured once when the
    // API object was built, so it still named the element the field was
    // created with — or null — however many times the slot had been set or
    // removed since. This object is the final return and is not spread
    // again, so an accessor survives here where it would not in the
    // feature pipe.
    get leadingIcon() {
      return component.leadingIcon ?? null;
    },
    setLeadingIcon(html: string): TextfieldComponent {
      if (component.setLeadingIcon) {
        component.setLeadingIcon(html);
        // Update positions after changing icon
        if (component.updateElementPositions) {
          component.schedulePositionUpdate?.();
        }
      }
      return this;
    },

    removeLeadingIcon(): TextfieldComponent {
      if (component.removeLeadingIcon) {
        component.removeLeadingIcon();
        // Update positions after removing icon
        if (component.updateElementPositions) {
          component.schedulePositionUpdate?.();
        }
      }
      return this;
    },

    // Trailing icon management (if present)
    // A live read, not a snapshot. This used to be captured once when the
    // API object was built, so it still named the element the field was
    // created with — or null — however many times the slot had been set or
    // removed since. This object is the final return and is not spread
    // again, so an accessor survives here where it would not in the
    // feature pipe.
    get trailingIcon() {
      return component.trailingIcon ?? null;
    },
    setTrailingIcon(html: string): TextfieldComponent {
      if (component.setTrailingIcon) {
        component.setTrailingIcon(html);
        // Update positions after changing icon
        if (component.updateElementPositions) {
          component.schedulePositionUpdate?.();
        }
      }
      return this;
    },

    removeTrailingIcon(): TextfieldComponent {
      if (component.removeTrailingIcon) {
        component.removeTrailingIcon();
        // Update positions after removing icon
        if (component.updateElementPositions) {
          component.schedulePositionUpdate?.();
        }
      }
      return this;
    },

    // Supporting text management (if present)
    supportingTextElement: component.supportingTextElement || null,
    setSupportingText(text: string, isError?: boolean): TextfieldComponent {
      if (component.setSupportingText) {
        component.setSupportingText(text, isError);
      }
      return this;
    },

    removeSupportingText(): TextfieldComponent {
      if (component.removeSupportingText) {
        component.removeSupportingText();
      }
      return this;
    },

    // Prefix text management (if present)
    // A live read, not a snapshot. This used to be captured once when the
    // API object was built, so it still named the element the field was
    // created with — or null — however many times the slot had been set or
    // removed since. This object is the final return and is not spread
    // again, so an accessor survives here where it would not in the
    // feature pipe.
    get prefixTextElement() {
      return component.prefixTextElement ?? null;
    },
    setPrefixText(text: string): TextfieldComponent {
      if (component.setPrefixText) {
        component.setPrefixText(text);
        // Update positions after changing prefix
        if (component.updateElementPositions) {
          component.schedulePositionUpdate?.();
        }
      }
      return this;
    },

    removePrefixText(): TextfieldComponent {
      if (component.removePrefixText) {
        component.removePrefixText();
        // Update positions after removing prefix
        if (component.updateElementPositions) {
          component.schedulePositionUpdate?.();
        }
      }
      return this;
    },

    // Suffix text management (if present)
    // A live read, not a snapshot. This used to be captured once when the
    // API object was built, so it still named the element the field was
    // created with — or null — however many times the slot had been set or
    // removed since. This object is the final return and is not spread
    // again, so an accessor survives here where it would not in the
    // feature pipe.
    get suffixTextElement() {
      return component.suffixTextElement ?? null;
    },
    setSuffixText(text: string): TextfieldComponent {
      if (component.setSuffixText) {
        component.setSuffixText(text);
        // Update positions after changing suffix
        if (component.updateElementPositions) {
          component.schedulePositionUpdate?.();
        }
      }
      return this;
    },

    removeSuffixText(): TextfieldComponent {
      if (component.removeSuffixText) {
        component.removeSuffixText();
        // Update positions after removing suffix
        if (component.updateElementPositions) {
          component.schedulePositionUpdate?.();
        }
      }
      return this;
    },

    // Update positioning manually (useful after DOM updates)
    updatePositions(): TextfieldComponent {
      // Check for autofill before updating positions
      if (component.input && component.element) {
        const hasValue =
          component.input.value && component.input.value.length > 0;
        const isAutofilled =
          component.input.matches?.(":-webkit-autofill") || false;

        // Update empty state based on value or autofill
        if (hasValue || isAutofilled) {
          component.element.classList.remove(
            `${component.config?.prefix || "mtrl"}-textfield--empty`
          );
        } else {
          component.element.classList.add(
            `${component.config?.prefix || "mtrl"}-textfield--empty`
          );
        }
      }

      if (component.updateElementPositions) {
        component.updateElementPositions();
      }
      return this;
    },

    // Error state management
    setError(error: boolean, message?: string): TextfieldComponent {
      if (component.setError) {
        component.setError(error, message);
      }
      return this;
    },

    isError(): boolean {
      return component.isError?.() || false;
    },

    // Density management
    setDensity(density: string): TextfieldComponent {
      if (component.density?.set) {
        component.density.set(density);
      }
      return this;
    },

    getDensity(): string {
      return component.density?.current || "default";
    },

    // Event handling
    on<K extends keyof TextfieldEvents>(event: K, handler: TextfieldEvents[K]): TextfieldComponent {
      component.on?.(event, handler);
      return this;
    },

    off<K extends keyof TextfieldEvents>(event: K, handler: TextfieldEvents[K]): TextfieldComponent {
      component.off?.(event, handler);
      return this;
    },

    // State management
    enable(): TextfieldComponent {
      disabled.enable();
      return this;
    },

    disable(): TextfieldComponent {
      disabled.disable();
      return this;
    },

    destroy(): void {
      lifecycle.destroy();
    },
  });
