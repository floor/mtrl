import {
  BaseComponent,
  ElementComponent,
} from "../../../core/compose/component";

/**
 * Configuration for error feature
 */
export interface ErrorConfig {
  /**
   * Initial error state
   */
  error?: boolean;

  /**
   * CSS class prefix
   */
  prefix?: string;

  /**
   * Component name
   */
  componentName?: string;
}

/**
 * Component with supporting text capabilities (if available)
 */
interface ComponentWithSupportingText extends ElementComponent {
  input?: HTMLInputElement | HTMLTextAreaElement;
  setSupportingText?: (text: string, isError?: boolean) => void;
  removeSupportingText?: () => void;
  supportingTextElement?: HTMLElement | null;
}

/**
 * Component with error state capabilities
 */
export interface ErrorComponent extends BaseComponent {
  /**
   * Current error state
   */
  errorState: boolean;

  /**
   * Sets error state
   * @param error - Whether to show error state
   * @param message - Optional error message to display
   * @returns Component instance for chaining
   */
  setError: (error: boolean, message?: string) => ErrorComponent;

  /**
   * Gets current error state
   * @returns Whether component is in error state
   */
  isError: () => boolean;
}

/**
 * Adds error state management to a component
 * @param config - Configuration with error settings
 * @returns Function that enhances a component with error state
 */
export const withError =
  // `& object` lets a component config that shares no key with ErrorConfig through.
  <T extends ErrorConfig & object>(config: T) =>
  <C extends ComponentWithSupportingText>(component: C): C & ErrorComponent => {
    const PREFIX = config.prefix || "mtrl";
    const COMPONENT = config.componentName || "textfield";

    // Track error state
    let errorState = config.error || false;
    // The supporting text an error message displaced, so ending the error can put
    // it back. Without this, setError(false) re-applied whatever was showing --
    // the error message itself -- as ordinary helper text.
    let displacedText: string | null = null;

    // The error class is only seen; aria-invalid is what a screen reader
    // announces with the field, together with the message it describes
    const markInvalid = (invalid: boolean): void => {
      if (!component.input) return;
      if (invalid) component.input.setAttribute("aria-invalid", "true");
      else component.input.removeAttribute("aria-invalid");
    };

    // Apply initial error state if configured
    if (errorState) {
      component.element.classList.add(`${PREFIX}-${COMPONENT}--error`);
    }
    markInvalid(errorState);

    return {
      ...component,
      errorState,

      setError(error: boolean, message?: string) {
        errorState = error;

        // Toggle error class on the component
        component.element.classList.toggle(
          `${PREFIX}-${COMPONENT}--error`,
          error
        );
        markInvalid(error);

        // If message is provided and component has supporting text capability
        if (message !== undefined && component.setSupportingText) {
          if (message) {
            if (error && displacedText === null) {
              displacedText = component.supportingTextElement?.textContent ?? "";
            }
            component.setSupportingText(message, error);
          } else if (!error) {
            // Clear supporting text if removing error with empty message
            component.setSupportingText("", false);
            displacedText = null;
          }
        } else if (!error && displacedText !== null && component.setSupportingText) {
          // Ending an error that replaced the helper text: restore what was there.
          if (displacedText) component.setSupportingText(displacedText, false);
          else component.removeSupportingText?.();
          displacedText = null;
        } else if (
          component.supportingTextElement &&
          component.setSupportingText
        ) {
          // If no message but component has existing supporting text, update its error state
          const currentText = component.supportingTextElement.textContent || "";
          if (currentText) {
            component.setSupportingText(currentText, error);
          }
        }

        return this;
      },

      isError() {
        return errorState;
      },
    };
  };
