// src/components/icon-button/features/toggle.ts

import { ElementComponent } from "../../../core/compose/component";

/**
 * Configuration for toggle feature
 */
export interface ToggleConfig {
  /**
   * Whether toggle mode is enabled
   */
  toggle?: boolean;

  /**
   * Whether clicking toggles the state automatically
   * Set to false to control selection programmatically only
   * @default true
   */
  toggleOnClick?: boolean;

  /**
   * Initial selected state
   */
  selected?: boolean;

  /**
   * Icon HTML for unselected state
   */
  icon?: string;

  /**
   * Icon HTML for selected state
   */
  selectedIcon?: string;

  /**
   * Component prefix for class names
   */
  prefix?: string;

  /**
   * Component name for class generation
   */
  componentName?: string;

  /**
   * Additional configuration options
   */
  [key: string]: unknown;
}

/**
 * Toggle state manager interface
 */
export interface ToggleManager {
  /**
   * Selects the component (toggle on)
   * @returns ToggleManager instance for chaining
   */
  select: () => ToggleManager;

  /**
   * Deselects the component (toggle off)
   * @returns ToggleManager instance for chaining
   */
  deselect: () => ToggleManager;

  /**
   * Toggles the selection state
   * @returns ToggleManager instance for chaining
   */
  toggle: () => ToggleManager;

  /**
   * Checks if the component is currently selected
   * @returns true if selected
   */
  isSelected: () => boolean;

  /**
   * Checks if toggle mode is enabled
   * @returns true if toggle mode is enabled
   */
  isToggle: () => boolean;

  /**
   * Sets the icon for unselected state
   * @param html - Icon HTML content
   * @returns ToggleManager instance for chaining
   */
  setIcon: (html: string) => ToggleManager;

  /**
   * Sets the icon for selected state
   * @param html - Icon HTML content
   * @returns ToggleManager instance for chaining
   */
  setSelectedIcon: (html: string) => ToggleManager;

  /**
   * Gets the selected state icon
   * @returns Selected icon HTML or empty string
   */
  getSelectedIcon: () => string;
}

/**
 * Component with toggle capabilities
 */
export interface ToggleComponent {
  toggleState: ToggleManager;
}

/**
 * Component with icon capabilities (for updating icon on toggle)
 */
interface ComponentWithIcon extends ElementComponent {
  icon?: {
    setIcon: (html: string) => unknown;
    getIcon: () => string;
    getElement: () => HTMLElement | null;
  };
  lifecycle?: {
    mount: () => void;
    destroy: () => void;
  };
}

/**
 * Adds toggle (selection) state management to a component
 *
 * This feature enables icon buttons to function as toggle buttons,
 * switching between selected and unselected states. Following MD3 guidelines:
 * - Unselected state uses outlined icon style
 * - Selected state uses filled icon style
 * - Shape can morph on selection (handled by CSS)
 *
 * @param config - Configuration object
 * @returns Function that enhances a component with toggle capabilities
 *
 * @example
 * ```typescript
 * const iconButton = pipe(
 *   createBase,
 *   withElement(config),
 *   withIcon(config),
 *   withToggle({
 *     toggle: true,
 *     selected: false,
 *     icon: '<svg>...</svg>', // outlined heart
 *     selectedIcon: '<svg>...</svg>' // filled heart
 *   })
 * )(config);
 * ```
 */
export const withToggle =
  <T extends ToggleConfig>(config: T) =>
  <C extends ComponentWithIcon>(component: C): C & ToggleComponent => {
    // If toggle is not enabled, return component with minimal toggle interface
    if (!config.toggle) {
      return {
        ...component,
        toggleState: {
          select: function () {
            return this;
          },
          deselect: function () {
            return this;
          },
          toggle: function () {
            return this;
          },
          isSelected: () => false,
          isToggle: () => false,
          setIcon: function () {
            return this;
          },
          setSelectedIcon: function () {
            return this;
          },
          getSelectedIcon: () => "",
        },
      };
    }

    const prefix = config.prefix || "mtrl";
    const componentName = config.componentName || "icon-button";
    const selectedClass = `${prefix}-${componentName}--selected`;

    // Internal state
    let isSelected = config.selected || false;
    let unselectedIcon = config.icon || "";
    let selectedIcon = config.selectedIcon || "";

    /**
     * Updates the icon based on current selection state
     */
    const updateIcon = (): void => {
      if (!component.icon) return;

      const iconToShow =
        isSelected && selectedIcon ? selectedIcon : unselectedIcon;
      if (iconToShow) {
        component.icon.setIcon(iconToShow);
      }
    };

    /**
     * Updates aria-pressed attribute for accessibility
     */
    const updateAriaPressed = (): void => {
      component.element.setAttribute("aria-pressed", String(isSelected));
    };

    // Create toggle manager
    const toggleState: ToggleManager = {
      select() {
        if (!isSelected) {
          isSelected = true;
          component.element.classList.add(selectedClass);
          updateIcon();
          updateAriaPressed();
        }
        return this;
      },

      deselect() {
        if (isSelected) {
          isSelected = false;
          component.element.classList.remove(selectedClass);
          updateIcon();
          updateAriaPressed();
        }
        return this;
      },

      toggle() {
        if (isSelected) {
          this.deselect();
        } else {
          this.select();
        }
        return this;
      },

      isSelected() {
        return isSelected;
      },

      isToggle() {
        return true;
      },

      setIcon(html: string) {
        unselectedIcon = html;
        if (!isSelected) {
          updateIcon();
        }
        return this;
      },

      setSelectedIcon(html: string) {
        selectedIcon = html;
        if (isSelected) {
          updateIcon();
        }
        return this;
      },

      getSelectedIcon() {
        return selectedIcon;
      },
    };

    // Initialize state
    if (isSelected) {
      component.element.classList.add(selectedClass);
      updateAriaPressed();
      updateIcon();
    } else {
      updateAriaPressed();
    }

    // Add click handler for toggle behavior (unless toggleOnClick is false)
    const toggleOnClick = config.toggleOnClick !== false;

    const handleClick = (): void => {
      toggleState.toggle();

      // Emit custom toggle event
      const event = new CustomEvent("toggle", {
        bubbles: true,
        detail: { selected: isSelected },
      });
      component.element.dispatchEvent(event);
    };

    if (toggleOnClick) {
      component.element.addEventListener("click", handleClick);
    }

    // Store cleanup handler if lifecycle exists
    const originalDestroy = component.lifecycle?.destroy;
    if (component.lifecycle) {
      component.lifecycle.destroy = () => {
        if (toggleOnClick) {
          component.element.removeEventListener("click", handleClick);
        }
        if (originalDestroy) {
          originalDestroy();
        }
      };
    }

    return {
      ...component,
      toggleState,
    };
  };
