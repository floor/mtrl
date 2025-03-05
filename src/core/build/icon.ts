// src/core/build/icon.ts
/**
 * @module core/build
 */

/**
 * Options for creating an icon element
 */
export interface IconElementOptions {
  /**
   * CSS class prefix
   */
  prefix?: string;
  
  /**
   * Additional CSS class
   */
  class?: string;
  
  /**
   * Icon size variant
   */
  size?: string;
}

/**
 * Configuration for icon manager
 */
export interface IconConfig {
  /**
   * CSS class prefix
   */
  prefix?: string;
  
  /**
   * Component type
   */
  type?: string;
  
  /**
   * Icon position ('start' or 'end')
   */
  position?: 'start' | 'end';
  
  /**
   * Icon size
   */
  iconSize?: string;
}

/**
 * Icon manager interface
 */
export interface IconManager {
  /**
   * Sets icon HTML content
   * @param html - Icon HTML content
   * @returns IconManager instance for chaining
   */
  setIcon: (html: string) => IconManager;
  
  /**
   * Gets current icon HTML content
   * @returns Current icon HTML
   */
  getIcon: () => string;
  
  /**
   * Gets icon element
   * @returns Icon element or null if not created
   */
  getElement: () => HTMLElement | null;
}

/**
 * Creates an icon DOM element
 * 
 * @param html - Icon HTML content
 * @param options - Icon options
 * @returns Icon element
 * @private
 */
const createIconElement = (html: string, options: IconElementOptions = {}): HTMLElement => {
  const PREFIX = options.prefix || 'mtrl';
  const element = document.createElement('span');
  element.className = `${PREFIX}-icon`;

  if (options.class) {
    element.classList.add(options.class);
  }
  if (options.size) {
    element.classList.add(`${PREFIX}-icon--${options.size}`);
  }

  element.innerHTML = html;
  return element;
};

/**
 * Creates an icon manager for a component
 * 
 * @param element - Parent element
 * @param config - Icon configuration
 * @returns Icon manager interface
 */
export const createIcon = (element: HTMLElement, config: IconConfig = {}): IconManager => {
  let iconElement: HTMLElement | null = null;
  const PREFIX = config.prefix || 'mtrl';

  return {
    setIcon(html: string): IconManager {
      if (!iconElement && html) {
        iconElement = createIconElement(html, {
          prefix: PREFIX,
          class: `${PREFIX}-${config.type || 'component'}-icon`,
          size: config.iconSize
        });
        if (config.position === 'end') {
          element.appendChild(iconElement);
        } else {
          element.insertBefore(iconElement, element.firstChild);
        }
      } else if (iconElement && html) {
        iconElement.innerHTML = html;
      }
      return this;
    },

    getIcon(): string {
      return iconElement ? iconElement.innerHTML : '';
    },

    getElement(): HTMLElement | null {
      return iconElement;
    }
  };
};