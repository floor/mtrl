// src/core/compose/features/icon.ts

import { BaseComponent, ElementComponent } from "../component";

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
 * Configuration for icon feature
 */
export interface IconConfig {
  /**
   * Initial icon HTML content
   */
  icon?: string;

  /**
   * Icon position ('start' or 'end')
   */
  iconPosition?: "start" | "end";

  /**
   * Icon size variant
   */
  iconSize?: string;

  /**
   * CSS class prefix
   */
  prefix?: string;

  /**
   * Component name for class generation
   */
  componentName?: string;

  /**
   * Text content (for determining button styling)
   */
  text?: string;

  /**
   * Additional configuration options
   */
  [key: string]: any;
}

/**
 * Component with icon capabilities
 */
export interface IconComponent extends BaseComponent {
  /**
   * Icon manager
   */
  icon: IconManager;
}

/**
 * Creates an icon manager for a component
 *
 * @param element - Parent element
 * @param config - Icon configuration
 * @returns Icon manager interface
 * @private
 */
const createIcon = (
  element: HTMLElement,
  config: IconConfig = {}
): IconManager => {
  let iconElement: HTMLElement | null = null;
  const PREFIX = config.prefix || "mtrl";

  /**
   * Creates the actual icon DOM element
   */
  const createIconElement = (html: string): HTMLElement => {
    const iconEl = document.createElement("span");
    iconEl.className = `${PREFIX}-icon`;

    // Add component-specific class
    const componentClass = `${PREFIX}-${
      config.componentName || "component"
    }-icon`;
    iconEl.classList.add(componentClass);

    // Add position class if specified
    if (config.iconPosition) {
      iconEl.classList.add(`${componentClass}--${config.iconPosition}`);
    }

    // Add size class if specified
    if (config.iconSize) {
      iconEl.classList.add(`${PREFIX}-icon--${config.iconSize}`);
    }

    iconEl.innerHTML = html;
    return iconEl;
  };

  return {
    /**
     * Sets icon HTML content
     * @param html - Icon HTML content
     * @returns IconManager instance for chaining
     */
    setIcon(html: string): IconManager {
      if (!iconElement && html) {
        // Create new icon element
        iconElement = createIconElement(html);

        // Insert at the appropriate position
        if (config.iconPosition === "end") {
          element.appendChild(iconElement);
        } else {
          // For 'start' position, insert after any existing label
          const labelElement = element.querySelector(
            `[class*="${PREFIX}-${config.componentName || "component"}-label"]`
          );
          if (labelElement) {
            // Insert after the label
            if (labelElement.nextSibling) {
              element.insertBefore(iconElement, labelElement.nextSibling);
            } else {
              element.appendChild(iconElement);
            }
          } else {
            // No label found, insert as first child
            element.insertBefore(iconElement, element.firstChild);
          }
        }
      } else if (iconElement && html) {
        // Update existing icon
        iconElement.innerHTML = html;
      }
      return this;
    },

    /**
     * Gets current icon HTML content
     * @returns Current icon HTML
     */
    getIcon(): string {
      return iconElement ? iconElement.innerHTML : "";
    },

    /**
     * Gets icon element
     * @returns Icon element or null if not created
     */
    getElement(): HTMLElement | null {
      return iconElement;
    },
  };
};

/**
 * Updates the component's circular style based on content
 * Adds circular class if there's an icon but no text
 * @private
 */
const updateCircularStyle = (
  component: ElementComponent,
  config: IconConfig
): void => {
  const hasText = config.text;
  const hasIcon = config.icon;

  const circularClass = `${component.getClass("button")}--circular`;
  if (!hasText && hasIcon) {
    component.element.classList.add(circularClass);
  } else {
    component.element.classList.remove(circularClass);
  }
};

/**
 * Adds icon management to a component
 *
 * @param config - Configuration object containing icon information
 * @returns Function that enhances a component with icon capabilities
 */
export const withIcon =
  <T extends IconConfig>(config: T) =>
  <C extends ElementComponent>(component: C): C & IconComponent => {
    // Create the icon with configuration settings
    const icon = createIcon(component.element, {
      prefix: config.prefix,
      componentName: config.componentName || "component",
      iconPosition: config.iconPosition,
      iconSize: config.iconSize,
    });

    // Set icon if provided in config
    if (config.icon) {
      icon.setIcon(config.icon);
    }

    // Apply button-specific styling if the component is a button
    if (component.componentName === "button") {
      if (!config.text) {
        updateCircularStyle(component, config);
      } else if (config.icon && config.text) {
        component.element.classList.add(
          `${component.getClass("button")}--icon`
        );
      }
    }

    // Return enhanced component with icon capabilities
    return {
      ...component,
      icon,
    };
  };

