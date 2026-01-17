// src/components/button/api.ts
import { ButtonComponent } from "./types";
import { addClass } from "../../core";
import { ProgressComponent } from "../progress/types";

/**
 * API configuration options for button component
 * @category Components
 * @internal
 */
interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Component with required elements and methods for API enhancement
 * @category Components
 * @internal
 */
interface ComponentWithElements {
  element: HTMLElement;
  text: {
    setText: (content: string) => void;
    getText: () => string;
    getElement: () => HTMLElement | null;
  };
  icon: {
    setIcon: (html: string) => void;
    getIcon: () => string;
    getElement: () => HTMLElement | null;
  };
  getClass: (name: string) => string;
  componentName?: string;
  on?: (event: string, handler: Function) => ComponentWithElements;
  off?: (event: string, handler: Function) => ComponentWithElements;
  addClass?: (...classes: string[]) => ComponentWithElements;

  // Progress methods (if withProgress was applied)
  progress?: ProgressComponent;
  showProgress?: () => Promise<ComponentWithElements>;
  showProgressSync?: () => ComponentWithElements;
  hideProgress?: () => Promise<ComponentWithElements>;
  hideProgressSync?: () => ComponentWithElements;
  setProgress?: (value: number) => Promise<ComponentWithElements>;
  setProgressSync?: (value: number) => ComponentWithElements;
  setIndeterminate?: (indeterminate: boolean) => Promise<ComponentWithElements>;
  setIndeterminateSync?: (indeterminate: boolean) => ComponentWithElements;
  setLoading?: (
    loading: boolean,
    text?: string,
  ) => Promise<ComponentWithElements>;
  setLoadingSync?: (loading: boolean, text?: string) => ComponentWithElements;
}

/**
 * Enhances a button component with API methods.
 * This follows the higher-order function pattern to add public API methods
 * to the component, making them available to the end user.
 *
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @category Components
 * @internal This is an internal utility for the Button component
 */
export const withAPI =
  ({ disabled, lifecycle }: ApiOptions) =>
  (component: ComponentWithElements): ButtonComponent => {
    // Create wrapper objects that match the expected API interfaces
    const textAPI = {
      setText: (content: string) => {
        component.text.setText(content);
        return textAPI;
      },
      getText: () => component.text.getText(),
      getElement: () => component.text.getElement(),
    };

    const iconAPI = {
      setIcon: (html: string) => {
        component.icon.setIcon(html);
        return iconAPI;
      },
      getIcon: () => component.icon.getIcon(),
      getElement: () => component.icon.getElement(),
    };

    const buttonComponent: ButtonComponent = {
      element: component.element as HTMLButtonElement,
      text: textAPI,
      icon: iconAPI,
      disabled,
      lifecycle,
      getClass: component.getClass,

      on: (event: string, handler: Function) => {
        if (component.on) {
          component.on(event, handler);
        }
        return buttonComponent;
      },

      off: (event: string, handler: Function) => {
        if (component.off) {
          component.off(event, handler);
        }
        return buttonComponent;
      },

      addClass: (...classes: string[]) => {
        if (component.addClass) {
          component.addClass(...classes);
        } else {
          addClass(component.element, ...classes);
        }
        return buttonComponent;
      },

      /**
       * Gets the button's value attribute
       * @returns Current value of the button
       */
      getValue: () => (component.element as HTMLButtonElement).value,

      /**
       * Sets the button's value attribute
       * @param value - New value to set
       * @returns Button component for method chaining
       */
      setValue(value: string) {
        (component.element as HTMLButtonElement).value = value;
        return buttonComponent;
      },

      /**
       * Enables the button, making it interactive
       * @returns Button component for method chaining
       */
      enable() {
        disabled.enable();
        return buttonComponent;
      },

      /**
       * Disables the button, making it non-interactive
       * @returns Button component for method chaining
       */
      disable() {
        disabled.disable();
        return buttonComponent;
      },

      /**
       * Sets the button's text content
       * @param content - Text content to display
       * @returns Button component for method chaining
       */
      setText(content: string) {
        component.text.setText(content);
        return buttonComponent;
      },

      /**
       * Gets the button's current text content
       * @returns Current text content
       */
      getText() {
        return component.text.getText();
      },

      /**
       * Checks if the button has an icon
       * @returns True if the button has an icon, false otherwise
       */
      hasIcon() {
        const iconElement = component.icon.getElement();
        return (
          !!iconElement &&
          !!iconElement.innerHTML.trim() &&
          !!iconElement.parentNode
        );
      },

      /**
       * Sets the button's icon HTML content
       * If empty string is provided, completely removes the icon
       * @param icon - HTML string for the icon, or empty string to remove
       * @returns Button component for method chaining
       */
      setIcon(icon: string) {
        const compName = component.componentName || "button";
        const buttonClass = component.getClass(compName);
        if (!icon) {
          // Remove the icon if it exists
          const iconElement = component.icon.getElement();
          if (iconElement && iconElement.parentNode) {
            iconElement.parentNode.removeChild(iconElement);

            // Override getElement to return null for removed icon
            component.icon.getElement = () => null;
            component.icon.getIcon = () => "";
          }

          component.element.classList.remove(`${buttonClass}--icon`);
        } else if (!buttonComponent.hasIcon()) {
          // Create new icon element when re-adding
          const newIconElement = document.createElement("span");
          newIconElement.className = `${component.getClass("button-icon")}`;
          newIconElement.innerHTML = icon;

          // Insert at the beginning of button
          if (component.element.firstChild) {
            component.element.insertBefore(
              newIconElement,
              component.element.firstChild,
            );
          } else {
            component.element.appendChild(newIconElement);
          }

          // Update component's reference to the new element
          component.icon.getElement = () => newIconElement;
          component.icon.getIcon = () => icon;
          component.element.classList.add(`${buttonClass}--icon`);
        } else {
          // Update existing icon without creating a new one
          const iconElement = component.icon.getElement();
          if (iconElement) {
            iconElement.innerHTML = icon;
          }
        }

        return buttonComponent;
      },

      /**
       * Gets the button's current icon HTML content
       * @returns Current icon HTML or empty string if removed
       */
      getIcon() {
        return buttonComponent.hasIcon() ? component.icon.getIcon() : "";
      },

      /**
       * Sets the button's variant (visual style)
       * @param variant - New variant to apply ('filled', 'outlined', 'text', etc.)
       * @returns Button component for method chaining
       */
      setVariant(variant: string) {
        const compName = component.componentName || "button";
        const buttonClass = component.getClass(compName);

        // First remove all existing variant classes
        const variantClasses = [
          "filled",
          "tonal",
          "outlined",
          "elevated",
          "text",
        ].map((v) => `${buttonClass}--${v}`);

        variantClasses.forEach((cls) => {
          component.element.classList.remove(cls);
        });

        component.element.classList.add(`${buttonClass}--${variant}`);
        return buttonComponent;
      },

      /**
       * Gets the button's current variant
       * @returns Current variant name ('filled', 'outlined', etc.)
       */
      getVariant() {
        const compName = component.componentName || "button";
        const buttonClass = component.getClass(compName);
        const variants = ["filled", "tonal", "outlined", "elevated", "text"];

        // Check which variant class is present on the element
        for (const variant of variants) {
          if (
            component.element.classList.contains(`${buttonClass}--${variant}`)
          ) {
            return variant;
          }
        }

        // If no variant class is found, return the default variant
        return "filled";
      },

      /**
       * Gets the button's current size
       * @returns Current size name ('xs', 's', 'm', 'l', 'xl')
       */
      getSize() {
        const compName = component.componentName || "button";
        const buttonClass = component.getClass(compName);
        const sizes = ["xs", "s", "m", "l", "xl"];

        // Check which size class is present on the element
        for (const size of sizes) {
          if (component.element.classList.contains(`${buttonClass}--${size}`)) {
            return size;
          }
        }

        // If no size class is found, return the default size
        return "s";
      },

      /**
       * Sets the button's size
       * @param size - New size to apply ('xs', 's', 'm', 'l', 'xl')
       * @returns Button component for method chaining
       */
      setSize(size: string) {
        const compName = component.componentName || "button";
        const buttonClass = component.getClass(compName);

        // First remove all existing size classes
        const sizeClasses = ["xs", "s", "m", "l", "xl"].map(
          (s) => `${buttonClass}--${s}`,
        );

        sizeClasses.forEach((cls) => {
          component.element.classList.remove(cls);
        });

        component.element.classList.add(`${buttonClass}--${size}`);
        return buttonComponent;
      },

      /**
       * Gets the button's current shape
       * @returns Current shape name ('round', 'square')
       */
      getShape() {
        const compName = component.componentName || "button";
        const buttonClass = component.getClass(compName);
        const shapes = ["round", "square"];

        // Check which shape class is present on the element
        for (const shape of shapes) {
          if (
            component.element.classList.contains(`${buttonClass}--${shape}`)
          ) {
            return shape;
          }
        }

        // If no shape class is found, return the default shape
        return "round";
      },

      /**
       * Sets the button's shape
       * @param shape - New shape to apply ('round', 'square')
       * @returns Button component for method chaining
       */
      setShape(shape: string) {
        const compName = component.componentName || "button";
        const buttonClass = component.getClass(compName);

        // First remove all existing shape classes
        const shapeClasses = ["round", "square"].map(
          (s) => `${buttonClass}--${s}`,
        );

        shapeClasses.forEach((cls) => {
          component.element.classList.remove(cls);
        });

        component.element.classList.add(`${buttonClass}--${shape}`);
        return buttonComponent;
      },

      /**
       * Sets the active state of the button
       * Used to visually indicate the button's active state, such as when it has a menu open
       *
       * @param active - Whether the button should appear active
       * @returns Button component for method chaining
       */
      setActive(active: boolean) {
        if (active) {
          component.element.classList.add(
            `${component.getClass("button")}--active`,
          );
        } else {
          component.element.classList.remove(
            `${component.getClass("button")}--active`,
          );
        }
        return buttonComponent;
      },

      /**
       * Sets the button's aria-label attribute for accessibility
       * @param label - Accessible label text
       * @returns Button component for method chaining
       */
      setAriaLabel(label: string) {
        component.element.setAttribute("aria-label", label);
        return buttonComponent;
      },

      /**
       * Destroys the button component and cleans up resources
       */
      destroy() {
        lifecycle.destroy();
      },
    };

    // Forward progress methods if they exist
    if (component.progress) {
      buttonComponent.progress = component.progress;
    }

    if (component.showProgress) {
      buttonComponent.showProgress = async () => {
        await component.showProgress!();
        return buttonComponent;
      };
    }

    if (component.showProgressSync) {
      buttonComponent.showProgressSync = () => {
        component.showProgressSync!();
        return buttonComponent;
      };
    }

    if (component.hideProgress) {
      buttonComponent.hideProgress = async () => {
        await component.hideProgress!();
        return buttonComponent;
      };
    }

    if (component.hideProgressSync) {
      buttonComponent.hideProgressSync = () => {
        component.hideProgressSync!();
        return buttonComponent;
      };
    }

    if (component.setProgress) {
      buttonComponent.setProgress = async (value: number) => {
        await component.setProgress!(value);
        return buttonComponent;
      };
    }

    if (component.setProgressSync) {
      buttonComponent.setProgressSync = (value: number) => {
        component.setProgressSync!(value);
        return buttonComponent;
      };
    }

    if (component.setIndeterminate) {
      buttonComponent.setIndeterminate = async (indeterminate: boolean) => {
        await component.setIndeterminate!(indeterminate);
        return buttonComponent;
      };
    }

    if (component.setIndeterminateSync) {
      buttonComponent.setIndeterminateSync = (indeterminate: boolean) => {
        component.setIndeterminateSync!(indeterminate);
        return buttonComponent;
      };
    }

    if (component.setLoading) {
      buttonComponent.setLoading = async (loading: boolean, text?: string) => {
        await component.setLoading!(loading, text);
        return buttonComponent;
      };
    }

    if (component.setLoadingSync) {
      buttonComponent.setLoadingSync = (loading: boolean, text?: string) => {
        component.setLoadingSync!(loading, text);
        return buttonComponent;
      };
    }

    return buttonComponent;
  };
