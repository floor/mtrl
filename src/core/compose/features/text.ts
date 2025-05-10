// src/core/compose/features/text.ts

import { BaseComponent, ElementComponent } from '../component';

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
 * Configuration for text feature
 */
export interface TextConfig {
  /**
   * Initial text content
   */
  text?: string;
  
  /**
   * CSS class prefix
   */
  prefix?: string;
  
  /**
   * Component name for class generation
   */
  componentName?: string;
  
  /**
   * Element to insert text before (optional)
   */
  beforeElement?: HTMLElement;
  
  /**
   * Additional configuration options
   */
  [key: string]: any;
}

/**
 * Component with text capabilities
 */
export interface TextComponent extends BaseComponent {
  /**
   * Text manager
   */
  text: TextManager;
}

/**
 * Creates a text manager for a component
 * 
 * @param element - Parent element
 * @param config - Text configuration
 * @returns Text manager interface
 * @private
 */
const createText = (element: HTMLElement, config: TextConfig = {}): TextManager => {
  let textElement: HTMLElement | null = null;
  const PREFIX = config.prefix || 'mtrl';

  /**
   * Creates a text element with the given content
   */
  const createElement = (content: string): HTMLElement => {
    const span = document.createElement('span');
    span.className = `${PREFIX}-${config.componentName || 'component'}-text`;
    span.textContent = content;
    return span;
  };

  return {
    /**
     * Sets text content
     * @param text - Text content to set
     * @returns TextManager instance for chaining
     */
    setText(text: string): TextManager {
      if (!textElement && text) {
        // Create new text element
        textElement = createElement(text);
        
        // Insert at the appropriate position
        if (config.beforeElement) {
          element.insertBefore(textElement, config.beforeElement);
        } else {
          element.appendChild(textElement);
        }
      } else if (textElement) {
        // Update existing text
        textElement.textContent = text;
      }
      return this;
    },

    /**
     * Gets current text content
     * @returns Current text
     */
    getText(): string {
      return textElement ? textElement.textContent || '' : '';
    },

    /**
     * Gets text element
     * @returns Text element or null if not created
     */
    getElement(): HTMLElement | null {
      return textElement;
    }
  };
};

/**
 * Adds text management to a component
 * 
 * @param config - Configuration object containing text information
 * @returns Function that enhances a component with text capabilities
 */
export const withText = <T extends TextConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & TextComponent => {
    // Create the text manager with configuration settings
    const text = createText(component.element, {
      prefix: config.prefix,
      componentName: config.componentName || 'component'
    });

    // Set text if provided in config
    if (config.text) {
      text.setText(config.text);
    }

    // Return enhanced component with text capabilities
    return {
      ...component,
      text
    };
  };