// src/core/build/text.ts
/**
 * @module core/build
 */

/**
 * Configuration for text manager
 */
export interface TextConfig {
  /**
   * CSS class prefix
   */
  prefix?: string;
  
  /**
   * Component type
   */
  type?: string;
  
  /**
   * Element to insert before
   */
  beforeElement?: HTMLElement;
}

/**
 * Text manager interface
 */
export interface TextManager {
  /**
   * Sets text content
   * @param text - Text content to set
   * @returns TextManager instance for chaining
   */
  setText: (text: string) => TextManager;
  
  /**
   * Gets current text content
   * @returns Current text
   */
  getText: () => string;
  
  /**
   * Gets text element
   * @returns Text element or null if not created
   */
  getElement: () => HTMLElement | null;
}

/**
 * Creates a text manager for a component
 * 
 * @param element - Parent element
 * @param config - Text configuration
 * @returns Text manager interface
 */
export const createText = (element: HTMLElement, config: TextConfig = {}): TextManager => {
  let textElement: HTMLElement | null = null;
  const PREFIX = config.prefix || 'mtrl';

  const createElement = (content: string): HTMLElement => {
    const span = document.createElement('span');
    span.className = `${PREFIX}-${config.type || 'component'}-text`;
    span.textContent = content;
    return span;
  };

  return {
    setText(text: string): TextManager {
      if (!textElement && text) {
        textElement = createElement(text);
        if (config.beforeElement) {
          element.insertBefore(textElement, config.beforeElement);
        } else {
          element.appendChild(textElement);
        }
      } else if (textElement) {
        textElement.textContent = text;
      }
      return this;
    },

    getText(): string {
      return textElement ? textElement.textContent || '' : '';
    },

    getElement(): HTMLElement | null {
      return textElement;
    }
  };
};