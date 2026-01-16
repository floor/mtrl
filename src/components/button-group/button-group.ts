// src/components/button-group/button-group.ts

import { pipe } from '../../core/compose/pipe';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { createEmitter } from '../../core/state/emitter';
import createButton from '../button';
import {
  ButtonGroupConfig,
  ButtonGroupComponent,
  ButtonGroupVariant,
  ButtonGroupOrientation,
  ButtonGroupDensity,
  ButtonGroupEvent
} from './types';
import { ButtonComponent } from '../button/types';
import {
  createBaseConfig,
  getContainerConfig,
  getDensityStyles,
  getButtonConfig
} from './config';
import {
  BUTTON_GROUP_DEFAULTS,
  BUTTON_GROUP_DENSITY
} from './constants';

/**
 * Creates a new Button Group component
 *
 * The Button Group component provides a container for grouping related action buttons.
 * Unlike Segmented Buttons (used for selection), Button Groups are for grouping
 * related actions where each button triggers an independent action.
 *
 * Per Material Design 3 specifications:
 * - Buttons are visually connected with shared borders
 * - Only outer corners are rounded
 * - All buttons share the same variant for visual consistency
 * - Supports horizontal and vertical orientations
 * - Supports density scaling
 *
 * @param {ButtonGroupConfig} config - Button Group configuration
 * @returns {ButtonGroupComponent} Button Group component instance
 *
 * @example
 * // Create a horizontal button group for text formatting
 * const formattingTools = createButtonGroup({
 *   buttons: [
 *     { icon: boldIcon, ariaLabel: 'Bold' },
 *     { icon: italicIcon, ariaLabel: 'Italic' },
 *     { icon: underlineIcon, ariaLabel: 'Underline' }
 *   ],
 *   variant: 'outlined',
 *   ariaLabel: 'Text formatting options'
 * });
 *
 * // Listen for button clicks
 * formattingTools.on('click', (event) => {
 *   console.log('Button clicked:', event.index);
 * });
 *
 * @example
 * // Create a vertical button group with text labels
 * const navigationGroup = createButtonGroup({
 *   buttons: [
 *     { text: 'Previous', icon: prevIcon },
 *     { text: 'Play', icon: playIcon },
 *     { text: 'Next', icon: nextIcon }
 *   ],
 *   orientation: 'vertical',
 *   variant: 'tonal'
 * });
 *
 * @category Components
 */
const createButtonGroup = (config: ButtonGroupConfig = {}): ButtonGroupComponent => {
  // Process configuration
  const baseConfig = createBaseConfig(config);
  const emitter = createEmitter();

  // Track current state
  let currentVariant: ButtonGroupVariant = baseConfig.variant || BUTTON_GROUP_DEFAULTS.VARIANT;
  let currentOrientation: ButtonGroupOrientation = baseConfig.orientation || BUTTON_GROUP_DEFAULTS.ORIENTATION;
  let currentDensity: ButtonGroupDensity = baseConfig.density || BUTTON_GROUP_DEFAULTS.DENSITY;

  try {
    // Create the base component with container element
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getContainerConfig(baseConfig)),
      withLifecycle()
    )(baseConfig);

    // Apply density styles
    const densityStyles = getDensityStyles(currentDensity);
    Object.entries(densityStyles).forEach(([prop, value]) => {
      component.element.style.setProperty(prop, value);
    });

    // Create buttons
    const buttons: ButtonComponent[] = [];
    const buttonConfigs = baseConfig.buttons || [];
    const totalButtons = buttonConfigs.length;

    buttonConfigs.forEach((buttonConfig, index) => {
      // Get configuration for this button with group-specific settings
      const resolvedConfig = getButtonConfig(
        buttonConfig,
        index,
        totalButtons,
        baseConfig
      );

      // Create button component
      const button = createButton(resolvedConfig);

      // Store reference to original config for later use
      (button as any)._groupConfig = buttonConfig;
      (button as any)._groupIndex = index;

      // Add click handler that emits group event
      button.on('click', (originalEvent: Event) => {
        if (!button.disabled?.isDisabled()) {
          const groupEvent: ButtonGroupEvent = {
            buttonGroup: buttonGroup,
            button: button,
            index: index,
            originalEvent: originalEvent
          };
          emitter.emit('click', groupEvent);
        }
      });

      // Add focus handler
      button.on('focus', (originalEvent: Event) => {
        const groupEvent: ButtonGroupEvent = {
          buttonGroup: buttonGroup,
          button: button,
          index: index,
          originalEvent: originalEvent
        };
        emitter.emit('focus', groupEvent);
      });

      // Add blur handler
      button.on('blur', (originalEvent: Event) => {
        const groupEvent: ButtonGroupEvent = {
          buttonGroup: buttonGroup,
          button: button,
          index: index,
          originalEvent: originalEvent
        };
        emitter.emit('blur', groupEvent);
      });

      // Add to container
      component.element.appendChild(button.element);
      buttons.push(button);
    });

    /**
     * Updates the variant for all buttons
     * @param {ButtonGroupVariant} variant - New variant
     * @private
     */
    const updateVariant = (variant: ButtonGroupVariant) => {
      // Update container class
      const variantClasses = ['filled', 'tonal', 'outlined', 'elevated', 'text'];
      variantClasses.forEach(v => {
        component.element.classList.remove(`${baseConfig.prefix}-button-group--${v}`);
      });
      component.element.classList.add(`${baseConfig.prefix}-button-group--${variant}`);
      component.element.setAttribute('data-variant', variant);

      // Update each button's variant
      buttons.forEach(button => {
        button.setVariant(variant);
      });

      currentVariant = variant;
    };

    /**
     * Updates the orientation of the button group
     * @param {ButtonGroupOrientation} orientation - New orientation
     * @private
     */
    const updateOrientation = (orientation: ButtonGroupOrientation) => {
      component.element.classList.remove(
        `${baseConfig.prefix}-button-group--horizontal`,
        `${baseConfig.prefix}-button-group--vertical`
      );
      component.element.classList.add(`${baseConfig.prefix}-button-group--${orientation}`);
      component.element.setAttribute('data-orientation', orientation);
      currentOrientation = orientation;
    };

    /**
     * Updates the density of the button group
     * @param {ButtonGroupDensity} density - New density
     * @private
     */
    const updateDensity = (density: ButtonGroupDensity) => {
      // Remove existing density classes
      Object.values(BUTTON_GROUP_DENSITY).forEach(d => {
        if (d !== BUTTON_GROUP_DENSITY.DEFAULT) {
          component.element.classList.remove(`${baseConfig.prefix}-button-group--density-${d}`);
        }
      });

      // Add new density class if not default
      if (density !== BUTTON_GROUP_DENSITY.DEFAULT) {
        component.element.classList.add(`${baseConfig.prefix}-button-group--density-${density}`);
      }

      // Update data attribute
      component.element.setAttribute('data-density', density);

      // Apply density styles
      const densityStyles = getDensityStyles(density);
      Object.entries(densityStyles).forEach(([prop, value]) => {
        component.element.style.setProperty(prop, value);
      });

      currentDensity = density;
    };

    // Create the component API
    const buttonGroup: ButtonGroupComponent = {
      element: component.element,
      buttons,

      getButton(index: number) {
        return buttons[index];
      },

      getButtonById(id: string) {
        return buttons.find(button => {
          const config = (button as any)._groupConfig;
          return config?.id === id || config?.value === id;
        });
      },

      getVariant() {
        return currentVariant;
      },

      setVariant(variant: ButtonGroupVariant) {
        updateVariant(variant);
        return this;
      },

      getOrientation() {
        return currentOrientation;
      },

      setOrientation(orientation: ButtonGroupOrientation) {
        updateOrientation(orientation);
        return this;
      },

      getDensity() {
        return currentDensity;
      },

      setDensity(density: ButtonGroupDensity) {
        updateDensity(density);
        return this;
      },

      enable() {
        component.element.classList.remove(`${baseConfig.prefix}-button-group--disabled`);
        buttons.forEach(button => {
          // Only enable if not individually disabled
          const config = (button as any)._groupConfig;
          if (!config?.disabled) {
            button.enable();
          }
        });
        return this;
      },

      disable() {
        component.element.classList.add(`${baseConfig.prefix}-button-group--disabled`);
        buttons.forEach(button => {
          button.disable();
        });
        return this;
      },

      enableButton(index: number) {
        const button = buttons[index];
        if (button) {
          button.enable();
        }
        return this;
      },

      disableButton(index: number) {
        const button = buttons[index];
        if (button) {
          button.disable();
        }
        return this;
      },

      on(event, handler) {
        emitter.on(event, handler);
        return this;
      },

      off(event, handler) {
        emitter.off(event, handler);
        return this;
      },

      destroy() {
        // Destroy all buttons
        buttons.forEach(button => {
          button.destroy();
        });

        // Clear buttons array
        buttons.length = 0;

        // Clear emitter
        emitter.clear();

        // Destroy base component
        component.lifecycle.destroy();
      }
    };

    return buttonGroup;
  } catch (error) {
    console.error('Button Group creation error:', error);
    throw new Error(`Failed to create button group: ${(error as Error).message}`);
  }
};

export default createButtonGroup;
