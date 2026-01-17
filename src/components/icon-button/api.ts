// src/components/icon-button/api.ts

import { IconButtonComponent } from "./types";
import {
  IconButtonVariant,
  IconButtonSize,
  IconButtonShape,
  IconButtonWidth,
} from "./constants";

/**
 * API configuration options for the IconButton component
 *
 * @category Components
 * @internal
 */
interface ApiOptions {
  /**
   * Disabled state management API
   */
  disabled: {
    /** Enables the component */
    enable: () => void;
    /** Disables the component */
    disable: () => void;
    /** Checks if component is disabled */
    isDisabled: () => boolean;
  };

  /**
   * Lifecycle management API
   */
  lifecycle: {
    /** Destroys the component */
    destroy: () => void;
  };

  /**
   * Toggle state management API (optional)
   */
  toggleState?: {
    select: () => unknown;
    deselect: () => unknown;
    toggle: () => unknown;
    isSelected: () => boolean;
    isToggle: () => boolean;
    setIcon: (html: string) => unknown;
    setSelectedIcon: (html: string) => unknown;
    getSelectedIcon: () => string;
  };
}

/**
 * Base component with element properties
 *
 * @category Components
 * @internal
 */
interface ComponentWithElements {
  /** The DOM element */
  element: HTMLElement;

  /** Icon management */
  icon: {
    /** Sets icon HTML content */
    setIcon: (html: string) => unknown;
    /** Gets icon HTML content */
    getIcon: () => string;
    /** Gets icon DOM element */
    getElement: () => HTMLElement | null;
  };

  /** Gets a class name with component's prefix */
  getClass: (name: string) => string;

  /** Component name */
  componentName?: string;

  /** Event listener methods */
  on?: (event: string, handler: Function) => unknown;
  off?: (event: string, handler: Function) => unknown;

  /** Class manipulation */
  addClass?: (...classes: string[]) => unknown;
  removeClass?: (...classes: string[]) => unknown;
}

/**
 * Enhances an IconButton component with public API methods
 *
 * Higher-order function that adds the full public API to the IconButton component,
 * exposing methods for changing appearance, handling state, and managing toggle behavior.
 *
 * @param options - API configuration options
 * @returns Higher-order function that adds API methods to component
 *
 * @category Components
 * @internal
 */
export const withAPI =
  ({ disabled, lifecycle, toggleState }: ApiOptions) =>
  (component: ComponentWithElements): IconButtonComponent => {
    const compName = component.componentName || "icon-button";
    const baseClass = component.getClass(compName);

    // Create the icon API wrapper
    const iconAPI = {
      setIcon: (html: string) => {
        component.icon.setIcon(html);
        return iconAPI;
      },
      getIcon: () => component.icon.getIcon(),
      getElement: () => component.icon.getElement(),
    };

    // Create the IconButton component with all API methods
    const iconButtonComponent: IconButtonComponent = {
      element: component.element as HTMLButtonElement,
      icon: iconAPI,

      disabled: {
        enable: () => disabled.enable(),
        disable: () => disabled.disable(),
        isDisabled: () => disabled.isDisabled(),
      },

      lifecycle: {
        destroy: () => lifecycle.destroy(),
      },

      getClass: component.getClass,

      getValue: () => (component.element as HTMLButtonElement).value,

      setValue(value: string) {
        (component.element as HTMLButtonElement).value = value;
        return iconButtonComponent;
      },

      getVariant() {
        const variants: IconButtonVariant[] = [
          "filled",
          "tonal",
          "outlined",
          "standard",
        ];
        for (const variant of variants) {
          if (
            component.element.classList.contains(`${baseClass}--${variant}`)
          ) {
            return variant;
          }
        }
        return "standard";
      },

      setVariant(variant: IconButtonVariant | string) {
        const variants = ["filled", "tonal", "outlined", "standard"];
        variants.forEach((v) => {
          component.element.classList.remove(`${baseClass}--${v}`);
        });
        component.element.classList.add(`${baseClass}--${variant}`);
        return iconButtonComponent;
      },

      getSize() {
        const sizes: IconButtonSize[] = ["xs", "s", "m", "l", "xl"];
        for (const size of sizes) {
          if (component.element.classList.contains(`${baseClass}--${size}`)) {
            return size;
          }
        }
        return "s";
      },

      setSize(size: IconButtonSize | string) {
        const sizes = ["xs", "s", "m", "l", "xl"];
        sizes.forEach((s) => {
          component.element.classList.remove(`${baseClass}--${s}`);
        });
        if (size !== "s") {
          component.element.classList.add(`${baseClass}--${size}`);
        }
        return iconButtonComponent;
      },

      getShape() {
        const shapes: IconButtonShape[] = ["round", "square"];
        for (const shape of shapes) {
          if (component.element.classList.contains(`${baseClass}--${shape}`)) {
            return shape;
          }
        }
        return "round";
      },

      setShape(shape: IconButtonShape | string) {
        const shapes = ["round", "square"];
        shapes.forEach((s) => {
          component.element.classList.remove(`${baseClass}--${s}`);
        });
        if (shape !== "round") {
          component.element.classList.add(`${baseClass}--${shape}`);
        }
        return iconButtonComponent;
      },

      getWidth() {
        const widths: IconButtonWidth[] = ["narrow", "default", "wide"];
        for (const width of widths) {
          if (component.element.classList.contains(`${baseClass}--${width}`)) {
            return width;
          }
        }
        return "default";
      },

      setWidth(width: IconButtonWidth | string) {
        const widths = ["narrow", "default", "wide"];
        widths.forEach((w) => {
          component.element.classList.remove(`${baseClass}--${w}`);
        });
        if (width !== "default") {
          component.element.classList.add(`${baseClass}--${width}`);
        }
        return iconButtonComponent;
      },

      enable() {
        disabled.enable();
        return iconButtonComponent;
      },

      disable() {
        disabled.disable();
        return iconButtonComponent;
      },

      setIcon(icon: string) {
        // If in toggle mode and not selected, update the unselected icon
        if (toggleState?.isToggle() && !toggleState.isSelected()) {
          toggleState.setIcon(icon);
        }
        component.icon.setIcon(icon);
        return iconButtonComponent;
      },

      getIcon() {
        return component.icon.getIcon();
      },

      setSelectedIcon(icon: string) {
        if (toggleState) {
          toggleState.setSelectedIcon(icon);
        }
        return iconButtonComponent;
      },

      getSelectedIcon() {
        return toggleState?.getSelectedIcon() || "";
      },

      isToggle() {
        return toggleState?.isToggle() || false;
      },

      select() {
        if (toggleState) {
          toggleState.select();
        }
        return iconButtonComponent;
      },

      deselect() {
        if (toggleState) {
          toggleState.deselect();
        }
        return iconButtonComponent;
      },

      toggleSelected() {
        if (toggleState) {
          toggleState.toggle();
        }
        return iconButtonComponent;
      },

      isSelected() {
        return toggleState?.isSelected() || false;
      },

      setAriaLabel(label: string) {
        component.element.setAttribute("aria-label", label);
        return iconButtonComponent;
      },

      destroy() {
        lifecycle.destroy();
      },

      on(event: string, handler: Function) {
        if (component.on) {
          component.on(event, handler);
        } else {
          component.element.addEventListener(event, handler as EventListener);
        }
        return iconButtonComponent;
      },

      off(event: string, handler: Function) {
        if (component.off) {
          component.off(event, handler);
        } else {
          component.element.removeEventListener(
            event,
            handler as EventListener,
          );
        }
        return iconButtonComponent;
      },

      addClass(...classes: string[]) {
        if (component.addClass) {
          component.addClass(...classes);
        } else {
          classes.forEach((cls) => component.element.classList.add(cls));
        }
        return iconButtonComponent;
      },

      removeClass(...classes: string[]) {
        if (component.removeClass) {
          component.removeClass(...classes);
        } else {
          classes.forEach((cls) => component.element.classList.remove(cls));
        }
        return iconButtonComponent;
      },
    };

    return iconButtonComponent;
  };
