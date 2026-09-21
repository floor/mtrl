// src/components/textfield/features/supporting-text.ts

import {
  BaseComponent,
  ElementComponent,
} from "../../../core/compose/component";

/**
 * Extended element component with lifecycle
 */
interface LifecycleElementComponent extends ElementComponent {
  input?: HTMLInputElement | HTMLTextAreaElement;
  lifecycle?: {
    destroy: () => void;
  };
}

/** Adds one id to an ARIA id list, keeping the ids already there */
const addIdRef = (element: Element, attribute: string, id: string): void => {
  const ids = (element.getAttribute(attribute) || "").split(/\s+/).filter(Boolean);
  if (!ids.includes(id)) element.setAttribute(attribute, [...ids, id].join(" "));
};

/** Removes one id from an ARIA id list, and the attribute once it is empty */
const removeIdRef = (element: Element, attribute: string, id: string): void => {
  const ids = (element.getAttribute(attribute) || "").split(/\s+/).filter((ref) => ref && ref !== id);
  if (ids.length) element.setAttribute(attribute, ids.join(" "));
  else element.removeAttribute(attribute);
};

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
  // `& object` lets a component config that shares no key with SupportingTextConfig through.
  <T extends SupportingTextConfig & object>(config: T) =>
  <C extends LifecycleElementComponent>(
    component: C
  ): C & SupportingTextComponent => {
    const PREFIX = config.prefix || "mtrl";
    const COMPONENT = config.componentName || "textfield";
    let supportingElement: HTMLElement | null = null;
    // One id for the supporting text, whichever element currently shows it,
    // so the input's description follows the text as it is replaced
    const supportingId = `${PREFIX}-${COMPONENT}-supporting-${Math.random().toString(36).slice(2, 9)}`;
    const describe = (element: HTMLElement | null): void => {
      if (!component.input) return;
      if (element) addIdRef(component.input, "aria-describedby", supportingId);
      else removeIdRef(component.input, "aria-describedby", supportingId);
    };

    // Helper function to create supporting text element
    const createSupportingElement = (
      text: string,
      isError = false
    ): HTMLElement => {
      const element = document.createElement("div");
      element.className = `${PREFIX}-${COMPONENT}__helper`;
      element.id = supportingId;
      element.textContent = text;

      if (isError) {
        element.classList.add(`${PREFIX}-${COMPONENT}__helper--error`);
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
      describe(supportingElement);
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
        describe(supportingElement);

        return this;
      },

      removeSupportingText() {
        if (supportingElement) {
          supportingElement.remove();
          supportingElement = null;
          this.supportingTextElement = null;
          component.element.classList.remove(`${PREFIX}-${COMPONENT}--error`);
          describe(null);
        }
        return this;
      },
    };
  };
