// src/components/textfield/api.ts
import type {
  BaseComponent,
  TextFieldComponent,
  ApiOptions,
  TextFieldVariant,
  TextFieldEvents,
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
  field?: HTMLElement;
  input?: HTMLInputElement | HTMLTextAreaElement;
  trailingIcon?: HTMLElement | null;
  setTrailingIcon?: (html: string, label?: string) => void;
  setRequired?: (required: boolean) => void;
  isRequired?: () => boolean;
};

/**
 * Enhances textfield component with API methods
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI =
  ({ disabled, lifecycle }: ApiOptions) =>
  (component: ComponentWithDensity): TextFieldComponent => {
    // A trailing icon button is disabled with the field (FLO-301)
    const setTrailingDisabled = (off: boolean): void => {
      // By tag, not instanceof: no global HTMLButtonElement is assumed (a server DOM)
      const icon = component.trailingIcon;
      if (icon?.tagName === "BUTTON") (icon as HTMLButtonElement).disabled = off;
    };
    return {
      element: component.element,
      // The container under the root: what a menu or popover anchors to, so the
      // supporting text row never pushes it down (FLO-300)
      field: component.field ?? component.element,
      input: component.input as HTMLInputElement | HTMLTextAreaElement,

      // Value management
      getValue: component.getValue || (() => ""),
      setValue(value: string): TextFieldComponent {
        component.setValue?.(value);
        return this;
      },

      // Attributes API
      setAttribute(name: string, value: string): TextFieldComponent {
        component.setAttribute?.(name, value);
        return this;
      },

      getAttribute(name: string): string | null {
        return component.getAttribute?.(name) || null;
      },

      removeAttribute(name: string): TextFieldComponent {
        component.removeAttribute?.(name);
        return this;
      },

      // Variant management
      setVariant(variant: TextFieldVariant): TextFieldComponent {
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

      getVariant(): TextFieldVariant {
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
      setLabel(text: string): TextFieldComponent {
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
      setLeadingIcon(html: string): TextFieldComponent {
        if (component.setLeadingIcon) {
          component.setLeadingIcon(html);
          // Update positions after changing icon
          if (component.updateElementPositions) {
            component.schedulePositionUpdate?.();
          }
        }
        return this;
      },

      removeLeadingIcon(): TextFieldComponent {
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
      setTrailingIcon(html: string, label?: string): TextFieldComponent {
        if (component.setTrailingIcon) {
          component.setTrailingIcon(html, label);
          // Update positions after changing icon
          if (component.updateElementPositions) {
            component.schedulePositionUpdate?.();
          }
        }
        return this;
      },

      removeTrailingIcon(): TextFieldComponent {
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
      // A live read, as for the icons: the features before this one spread the
      // component, so its supportingTextElement is a copy from when it was
      // spread; the element in the field is the one to report (FLO-303).
      get supportingTextElement(): HTMLElement | null {
        return component.element.querySelector<HTMLElement>(`.${component.getClass("textfield__helper")}`);
      },
      setSupportingText(text: string, isError?: boolean): TextFieldComponent {
        if (component.setSupportingText) {
          component.setSupportingText(text, isError);
        }
        return this;
      },

      removeSupportingText(): TextFieldComponent {
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
      setPrefixText(text: string): TextFieldComponent {
        if (component.setPrefixText) {
          component.setPrefixText(text);
          // Update positions after changing prefix
          if (component.updateElementPositions) {
            component.schedulePositionUpdate?.();
          }
        }
        return this;
      },

      removePrefixText(): TextFieldComponent {
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
      setSuffixText(text: string): TextFieldComponent {
        if (component.setSuffixText) {
          component.setSuffixText(text);
          // Update positions after changing suffix
          if (component.updateElementPositions) {
            component.schedulePositionUpdate?.();
          }
        }
        return this;
      },

      removeSuffixText(): TextFieldComponent {
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
      updatePositions(): TextFieldComponent {
        // Check for autofill before updating positions
        if (component.input && component.element) {
          const hasValue =
            component.input.value && component.input.value.length > 0;
          let isAutofilled = false;
          try {
            isAutofilled = component.input.matches?.(":-webkit-autofill") || false;
          } catch {
            // A selector engine without this vendor pseudo-class cannot report autofill.
          }

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
      setError(error: boolean, message?: string): TextFieldComponent {
        if (component.setError) {
          component.setError(error, message);
        }
        return this;
      },

      isError(): boolean {
        return component.isError?.() || false;
      },

      // Density management
      setDensity(density: string): TextFieldComponent {
        if (component.density?.set) {
          component.density.set(density);
        }
        // The density feature runs before placement exists, so its own call to
        // re-place never reached it; ask here, as the other setters do (FLO-378)
        component.schedulePositionUpdate?.();
        return this;
      },

      getDensity(): string {
        return component.density?.current || "default";
      },

      // Event handling
      on<K extends keyof TextFieldEvents>(event: K, handler: TextFieldEvents[K]): TextFieldComponent {
        component.on?.(event, handler);
        return this;
      },

      off<K extends keyof TextFieldEvents>(event: K, handler: TextFieldEvents[K]): TextFieldComponent {
        component.off?.(event, handler);
        return this;
      },

      // State management
      enable(): TextFieldComponent {
        disabled.enable();
        setTrailingDisabled(false);
        return this;
      },

      isDisabled(): boolean {

        return disabled.isDisabled();

      },


      disable(): TextFieldComponent {
        disabled.disable();
        setTrailingDisabled(true);
        return this;
      },

      // Required, with the label's asterisk (FLO-301)
      setRequired(required: boolean): TextFieldComponent {
        component.setRequired?.(required);
        // The asterisk widens the label, and the outlined notch with it
        component.schedulePositionUpdate?.();
        return this;
      },

      isRequired(): boolean {
        return component.isRequired?.() ?? Boolean(component.input?.required);
      },

      destroy(): void {
        lifecycle.destroy();
      },
    };
  };
