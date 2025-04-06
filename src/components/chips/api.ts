// src/components/chips/api.ts
import { ChipsComponent, ChipComponent } from './types';

/**
 * API options interface - structured by feature area
 */
interface ApiOptions {
  chips: {
    addChip: (chipConfig: any) => ChipComponent;
    removeChip: (chipOrIndex: ChipComponent | number) => void;
    getChips: () => ChipComponent[];
    getSelectedChips: () => ChipComponent[];
    getSelectedValues: () => (string | null)[];
    selectByValue: (values: string | string[], triggerEvent?: boolean) => void;
    clearSelection: () => void;
    scrollToChip: (chipOrIndex: ChipComponent | number) => void;
  };
  layout: {
    setScrollable: (isScrollable: boolean) => any;
    isScrollable: () => boolean;
    setVertical: (isVertical: boolean) => any;
    isVertical: () => boolean;
  };
  label: {
    setText: (text: string) => any;
    getText: () => string;
    setPosition: (position: 'start' | 'end') => any;
    getPosition: () => string;
  };
  keyboard: {
    enableKeyboardNavigation: () => void;
    disableKeyboardNavigation: () => void;
  };
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Enhances a chips component with a streamlined API
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Chips component
 */
export const withAPI = (options: ApiOptions) => 
  (component: { element: HTMLElement }): ChipsComponent => {
    return {
      ...component as any,
      
      // Element access
      element: component.element,
      
      // Chip management
      addChip(chipConfig) {
        if (options.chips && typeof options.chips.addChip === 'function') {
          options.chips.addChip(chipConfig);
        }
        return this;
      },
      
      removeChip(chipOrIndex) {
        if (options.chips && typeof options.chips.removeChip === 'function') {
          options.chips.removeChip(chipOrIndex);
        }
        return this;
      },
      
      getChips() {
        if (options.chips && typeof options.chips.getChips === 'function') {
          return options.chips.getChips();
        }
        return [];
      },
      
      getSelectedChips() {
        if (options.chips && typeof options.chips.getSelectedChips === 'function') {
          return options.chips.getSelectedChips();
        }
        return [];
      },
      
      getSelectedValues() {
        if (options.chips && typeof options.chips.getSelectedValues === 'function') {
          return options.chips.getSelectedValues();
        }
        return [];
      },
      
      /**
       * Selects chips by their values
       * @param values - Value or array of values to select
       * @param triggerEvent - Whether to trigger change event (default: true)
       * @returns The chips instance for chaining
       */
      selectByValue(values, triggerEvent = true) {
        if (options.chips && typeof options.chips.selectByValue === 'function') {
          options.chips.selectByValue(values, triggerEvent);
        }
        return this;
      },
      
      clearSelection() {
        if (options.chips && typeof options.chips.clearSelection === 'function') {
          options.chips.clearSelection();
        }
        return this;
      },
      
      // Layout management
      setScrollable(isScrollable) {
        if (options.layout && typeof options.layout.setScrollable === 'function') {
          options.layout.setScrollable(isScrollable);
        }
        return this;
      },
      
      setVertical(isVertical) {
        if (options.layout && typeof options.layout.setVertical === 'function') {
          options.layout.setVertical(isVertical);
        }
        return this;
      },
      
      // Label management
      setLabel(text) {
        if (options.label && typeof options.label.setText === 'function') {
          options.label.setText(text);
        }
        return this;
      },
      
      getLabel() {
        if (options.label && typeof options.label.getText === 'function') {
          return options.label.getText();
        }
        return '';
      },
      
      setLabelPosition(position) {
        if (options.label && typeof options.label.setPosition === 'function') {
          options.label.setPosition(position);
        }
        return this;
      },
      
      getLabelPosition() {
        if (options.label && typeof options.label.getPosition === 'function') {
          return options.label.getPosition();
        }
        return 'start';
      },
      
      // Navigation
      scrollToChip(chipOrIndex) {
        if (options.chips && typeof options.chips.scrollToChip === 'function') {
          options.chips.scrollToChip(chipOrIndex);
        }
        return this;
      },
      
      enableKeyboardNavigation() {
        if (options.keyboard && typeof options.keyboard.enableKeyboardNavigation === 'function') {
          options.keyboard.enableKeyboardNavigation();
        }
        return this;
      },
      
      // Event management
      on(event, handler) {
        if (options.events && typeof options.events.on === 'function') {
          options.events.on(event, handler);
        }
        return this;
      },
      
      off(event, handler) {
        if (options.events && typeof options.events.off === 'function') {
          options.events.off(event, handler);
        }
        return this;
      },
      
      // Lifecycle management
      destroy() {
        if (options.lifecycle && typeof options.lifecycle.destroy === 'function') {
          options.lifecycle.destroy();
        }
      }
    };
  };