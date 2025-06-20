// src/components/textfield/features/supporting-text.ts

import {
  BaseComponent,
  ElementComponent,
} from "../../../core/compose/component";

/**
 * Extended element component with lifecycle
 */
interface LifecycleElementComponent extends ElementComponent {
  lifecycle?: {
    destroy: () => void;
  };
}

/**
 * Configuration for supporting text feature
 */
export interface SupportingTextConfig {
  /**
   * Supporting text content
   */
  supportingText?: string;

  /**
   * Whether supporting text indicates an error
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

  [key: string]: any;
}

/**
 * Component with supporting text capabilities
 */
export interface SupportingTextComponent extends BaseComponent {
  /**
   * Supporting text element
   */
  supportingTextElement: HTMLElement | null;

  /**
   * Sets supporting text content
   * @param text - Text content
   * @param isError - Whether text represents an error
   * @returns Component instance for chaining
   */
  setSupportingText: (
    text: string,
    isError?: boolean
  ) => SupportingTextComponent;

  /**
   * Removes supporting text
   * @returns Component instance for chaining
   */
  removeSupportingText: () => SupportingTextComponent;
}

/**
 * Adds supporting text to a textfield component
 * @param config - Configuration with supporting text settings
 * @returns Function that enhances a component with supporting text
 */
export const withSupportingText =
  <T extends SupportingTextConfig>(config: T) =>
  <C extends LifecycleElementComponent>(
    component: C
  ): C & SupportingTextComponent => {
    const PREFIX = config.prefix || "mtrl";
    const COMPONENT = config.componentName || "textfield";
    let supportingElement: HTMLElement | null = null;

    // Helper function to create supporting text element
    const createSupportingElement = (
      text: string,
      isError = false
    ): HTMLElement => {
      const element = document.createElement("div");
      element.className = `${PREFIX}-${COMPONENT}-helper`;
      element.textContent = text;

      if (isError) {
        element.classList.add(`${PREFIX}-${COMPONENT}-helper--error`);
        component.element.classList.add(`${PREFIX}-${COMPONENT}--error`);
      }

      return element;
    };

    // Create initial supporting text element if provided
    if (config.supportingText) {
      supportingElement = createSupportingElement(
        config.supportingText,
        config.error
      );
      component.element.appendChild(supportingElement);
    }

    // Add lifecycle integration if available
    if ("lifecycle" in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy as Function;
      component.lifecycle.destroy = () => {
        if (supportingElement) {
          supportingElement.remove();
        }
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      supportingTextElement: supportingElement,

      setSupportingText(text: string, isError = false) {
        // Remove existing element if present
        if (supportingElement) {
          supportingElement.remove();
          component.element.classList.remove(`${PREFIX}-${COMPONENT}--error`);
        }

        // Create new element if text is provided
        if (text) {
          supportingElement = createSupportingElement(text, isError);
          component.element.appendChild(supportingElement);
          this.supportingTextElement = supportingElement;
        } else {
          supportingElement = null;
          this.supportingTextElement = null;
          component.element.classList.remove(`${PREFIX}-${COMPONENT}--error`);
        }

        return this;
      },

      removeSupportingText() {
        if (supportingElement) {
          supportingElement.remove();
          supportingElement = null;
          this.supportingTextElement = null;
          component.element.classList.remove(`${PREFIX}-${COMPONENT}--error`);
        }
        return this;
      },
    };
  };
