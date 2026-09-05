// src/components/button-group/button-group.ts

import { pipe } from '../../core/compose/pipe';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { createEmitter } from '../../core/state/emitter';
import createIconButton from '../icon-button/icon-button';
import createButton from '../button';
import {
  ButtonGroupConfig,
  ButtonGroupComponent,
  ButtonGroupVariant,
  ButtonGroupOrientation,
  ButtonGroupDensity,
  ButtonGroupEvent,
  ButtonGroupChangeEvent,
  ButtonGroupKind,
  ButtonGroupSelection
} from './types';
import { ButtonComponent } from '../button/types';
import {
  createBaseConfig,
  getContainerConfig,
  getSizeStyles,
  getButtonConfig
} from './config';
import {
  BUTTON_GROUP_DEFAULTS,
  BUTTON_GROUP_DENSITY,
  BUTTON_GROUP_EXPANDED_RATIO
} from './constants';

/**
 * Creates a new Button Group component
 *
 * The Button Group component provides a container for grouping related action buttons.
 * Unlike Segmented Buttons (used for selection), Button Groups are for grouping
 * related actions where each button triggers an independent action.
 *
 * Per Material Design 3 specifications:
 * - Standard groups space their buttons (18/12/8/8/8dp by size) and a
 *   pressed button briefly widens while its neighbours narrow
 * - Connected groups space their buttons 2dp apart with square inner
 *   corners and round outer corners; a selected button becomes a pill
 * - All buttons share the same variant, size and shape
 * - Supports horizontal and vertical orientations
 * - Supports density scaling (4dp per step)
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
  const kind: ButtonGroupKind = baseConfig.kind || BUTTON_GROUP_DEFAULTS.KIND;
  const selection: ButtonGroupSelection = baseConfig.selection || BUTTON_GROUP_DEFAULTS.SELECTION;
  const required = Boolean(baseConfig.required);
  const selectedValues = new Set<string>();

  try {
    // Create the base component with container element
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getContainerConfig(baseConfig)),
      withLifecycle()
    )(baseConfig);

    // Material 3 size, kind and density tokens (height, gap, corners)
    const applySizeStyles = (density: ButtonGroupDensity) => {
      Object.entries(getSizeStyles(baseConfig.size, kind, density)).forEach(([prop, value]) => {
        component.element.style.setProperty(prop, value);
      });
    };
    applySizeStyles(currentDensity);

    // Create buttons
    const buttons: ButtonComponent[] = [];
    const buttonConfigs = baseConfig.buttons || [];
    const totalButtons = buttonConfigs.length;

    const valueOf = (button: ButtonComponent): string => {
      const config = (button as any)._groupConfig;
      return String(config?.value ?? config?.id ?? (button as any)._groupIndex);
    };

    // The buttons carry the M3 toggle colours and shapes themselves; the group
    // only owns which of them is selected.
    const applySelectedState = (button: ButtonComponent, selected: boolean) => {
      const selectedClass = `${baseConfig.prefix}-button-group__button--selected`;
      button.element.classList.toggle(selectedClass, selected);
      button.element.setAttribute('aria-pressed', String(selected));
      const toggleState = (button as any).toggleState;
      if (toggleState?.isToggle?.()) {
        if (selected) toggleState.select();
        else toggleState.deselect();
      } else {
        button.setSelected?.(selected);
      }
    };

    // Standard groups: while pressed, a button widens by the expanded ratio
    // of its width and each neighbour gives up the same amount, limited to
    // the neighbour's padding on the facing side so its label never clips
    // (ButtonGroupDefaults.ExpandedRatio and the ButtonGroup measure policy;
    // m3.material.io button group states)
    const expandedRatio = baseConfig.expandedRatio ?? BUTTON_GROUP_EXPANDED_RATIO;
    const releasePress = () => {
      buttons.forEach(b => {
        b.element.style.width = '';
        b.element.style.paddingLeft = '';
        b.element.style.paddingRight = '';
      });
      document.removeEventListener('pointerup', releasePress);
      document.removeEventListener('pointercancel', releasePress);
    };
    const pressExpand = (index: number) => {
      if (kind !== 'standard' || expandedRatio <= 0 || currentOrientation !== 'horizontal') return;
      const widths = buttons.map(b => b.element.getBoundingClientRect().width);
      if (!widths[index]) return;
      const view = component.element.ownerDocument.defaultView;
      const padding = (i: number, side: 'paddingLeft' | 'paddingRight') =>
        view ? parseFloat(view.getComputedStyle(buttons[i].element)[side]) || 0 : 0;
      const previous = buttons[index - 1] ? index - 1 : -1;
      const next = buttons[index + 1] ? index + 1 : -1;
      const middle = previous >= 0 && next >= 0;
      // a middle button shares its growth between both sides, an end button
      // takes all of it from its only neighbour
      const share = expandedRatio * widths[index] / (middle ? 2 : 1);
      let growth = 0;
      const compress = (i: number, side: 'paddingLeft' | 'paddingRight') => {
        const limit = Math.min(share, padding(i, side), widths[i]);
        if (limit <= 0) return;
        buttons[i].element.style.width = `${widths[i] - limit}px`;
        buttons[i].element.style[side] = `${padding(i, side) - limit}px`;
        growth += limit;
      };
      if (previous >= 0) compress(previous, 'paddingRight');
      if (next >= 0) compress(next, 'paddingLeft');
      buttons[index].element.style.width = `${widths[index] + growth}px`;
      document.addEventListener('pointerup', releasePress);
      document.addEventListener('pointercancel', releasePress);
    };

    const emitChange = (button?: ButtonComponent, originalEvent?: Event) => {
      const selected = buttons.filter(b => selectedValues.has(valueOf(b)));
      const changeEvent: ButtonGroupChangeEvent = {
        buttonGroup,
        values: selected.map(valueOf),
        selected,
        button,
        originalEvent
      };
      emitter.emit('change', changeEvent);
    };

    /** Applies a selection change; returns false when nothing changed. */
    const setSelected = (value: string, selected: boolean, button?: ButtonComponent, originalEvent?: Event): boolean => {
      if (selection === 'none') return false;
      const target = buttons.find(b => valueOf(b) === value);
      if (!target) return false;
      if (selected === selectedValues.has(value)) return false;
      if (!selected && required && selectedValues.size === 1) return false;
      if (selected && selection === 'single') {
        for (const other of buttons) {
          const otherValue = valueOf(other);
          if (otherValue !== value && selectedValues.has(otherValue)) {
            selectedValues.delete(otherValue);
            applySelectedState(other, false);
          }
        }
      }
      if (selected) selectedValues.add(value);
      else selectedValues.delete(value);
      applySelectedState(target, selected);
      emitChange(button ?? target, originalEvent);
      return true;
    };

    buttonConfigs.forEach((buttonConfig, index) => {
      const resolvedConfig = getButtonConfig(
        buttonConfig,
        index,
        totalButtons,
        baseConfig
      );
      const selectable = selection !== 'none';
      const iconOnly = Boolean(buttonConfig.icon) && !buttonConfig.text;
      // Icon-only items are icon buttons (the Material spec allows both in a
      // group); they carry their own toggle state and selected icon.
      const button = (iconOnly
        ? createIconButton({
            ...resolvedConfig,
            toggle: selectable,
            toggleOnClick: false,
            selectedIcon: buttonConfig.selectedIcon,
            variant: resolvedConfig.variant === 'text' ? 'standard' : resolvedConfig.variant
          } as any)
        : createButton({
            ...resolvedConfig,
            toggle: selectable,
            toggleOnClick: false
          })) as unknown as ButtonComponent;
      (button as any)._groupConfig = buttonConfig;
      (button as any)._groupIndex = index;
      if (selectable) {
        button.element.setAttribute('aria-pressed', 'false');
      }
      button.element.addEventListener('pointerdown', () => {
        if (!button.disabled?.isDisabled()) pressExpand(index);
      });
      button.on('click', (originalEvent: Event) => {
        if (!button.disabled?.isDisabled()) {
          const groupEvent: ButtonGroupEvent = {
            buttonGroup: buttonGroup,
            button: button,
            index: index,
            originalEvent: originalEvent
          };
          emitter.emit('click', groupEvent);
          if (selection !== 'none') {
            const value = valueOf(button);
            const isSelected = selectedValues.has(value);
            if (selection === 'single') {
              if (!isSelected) setSelected(value, true, button, originalEvent);
              else if (!required) setSelected(value, false, button, originalEvent);
            } else {
              setSelected(value, !isSelected, button, originalEvent);
            }
          }
        }
      });
      button.on('focus', (originalEvent: Event) => {
        const groupEvent: ButtonGroupEvent = {
          buttonGroup: buttonGroup,
          button: button,
          index: index,
          originalEvent: originalEvent
        };
        emitter.emit('focus', groupEvent);
      });
      button.on('blur', (originalEvent: Event) => {
        const groupEvent: ButtonGroupEvent = {
          buttonGroup: buttonGroup,
          button: button,
          index: index,
          originalEvent: originalEvent
        };
        emitter.emit('blur', groupEvent);
      });
      component.element.appendChild(button.element);
      buttons.push(button);
    });

    // Initial selection, without events
    if (selection !== 'none') {
      buttons.forEach(button => {
        const config = (button as any)._groupConfig;
        if (config?.selected && (selection === 'multi' || selectedValues.size === 0)) {
          selectedValues.add(valueOf(button));
          applySelectedState(button, true);
        }
      });
    }

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

      applySizeStyles(density);
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
      getSelected() {
        return buttons.filter(b => selectedValues.has(valueOf(b))).map(valueOf);
      },
      isSelected(value: string) {
        return selectedValues.has(value);
      },
      select(value: string) {
        setSelected(value, true);
        return this;
      },
      deselect(value: string) {
        setSelected(value, false);
        return this;
      },
      toggle(value: string) {
        setSelected(value, !selectedValues.has(value));
        return this;
      },
      getKind() {
        return kind;
      },
      getSelection() {
        return selection;
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
        releasePress();

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
