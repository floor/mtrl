// src/components/textfield/features/placement.ts

import { BaseComponent, ElementComponent } from '../../../core/compose/component';

/**
 * Component with placement management capabilities
 */
export interface PlacementComponent extends BaseComponent {
  /**
   * Updates positions of all elements in the textfield
   * @returns The component instance for chaining
   */
  updateElementPositions: () => PlacementComponent;
}

/**
 * Handles dynamic positioning of textfield elements (label, prefix, suffix)
 * This feature should be added last in the pipe to ensure all elements exist
 * 
 * @returns Function that enhances a component with dynamic positioning
 */
export const withPlacement = () => 
  <C extends ElementComponent>(component: C): C & PlacementComponent => {
    const PREFIX = component.config.prefix || 'mtrl';
    const COMPONENT = component.config.componentName || 'textfield';
    
    /**
     * Updates positions of labels and adjusts input padding
     * to accommodate prefix/suffix elements
     */
    const updateElementPositions = () => {
      if (!component.element || !component.element.isConnected) return component;
      
      // Get necessary elements
      const labelEl = component.element.querySelector(`.${PREFIX}-${COMPONENT}-label`) as HTMLElement;
      const prefixEl = component.element.querySelector(`.${PREFIX}-${COMPONENT}-prefix`);
      const suffixEl = component.element.querySelector(`.${PREFIX}-${COMPONENT}-suffix`);
      
      // Get component states
      const isOutlined = component.element.classList.contains(`${PREFIX}-${COMPONENT}--outlined`);
      const isFilled = component.element.classList.contains(`${PREFIX}-${COMPONENT}--filled`);
      const isFocused = component.element.classList.contains(`${PREFIX}-${COMPONENT}--focused`);
      const isEmpty = component.element.classList.contains(`${PREFIX}-${COMPONENT}--empty`);
      const hasLeadingIcon = component.element.classList.contains(`${PREFIX}-${COMPONENT}--with-leading-icon`);
      
      // Handle prefix positioning and input padding
      if (prefixEl && component.input) {
        const prefixWidth = prefixEl.getBoundingClientRect().width + 4; // 4px spacing
        const inputPadding = prefixWidth + 12; // 12px additional padding
        
        // Update input left padding
        component.input.style.paddingLeft = `${inputPadding}px`;
        
        // Update label position if present
        if (labelEl) {
          let labelPosition = inputPadding;
          
          // Account for leading icon if present
          if (hasLeadingIcon) {
            labelPosition = Math.max(labelPosition, 44);
          }
          
          // Different positioning strategy based on variant and state
          if (!isFocused && isEmpty) {
            // When unfocused and empty, align with prefix/input
            labelEl.style.left = `${labelPosition}px`;
          } else {
            // When focused or filled, move to default position
            labelEl.style.left = '12px';
          }
          
        }
      } else if (hasLeadingIcon && labelEl) {
        // Handle case with leading icon but no prefix
        if (isOutlined) {
          if (!isFocused && isEmpty) {
            // When unfocused and empty, align with icon
            labelEl.style.left = '44px';
          } else {
            // When focused or filled, move to default position
            labelEl.style.left = '12px';
          }
        }
        // For filled variant, the CSS handles this
      }
      
      // Handle suffix positioning and input padding
      if (suffixEl && component.input) {
        const suffixWidth = suffixEl.getBoundingClientRect().width + 4; // 4px spacing
        const inputPadding = suffixWidth + 12; // 12px additional padding
        
        // Update input right padding
        component.input.style.paddingRight = `${inputPadding}px`;
      }
      
      return component;
    };
    
    // Set up event listeners for dynamic positioning
    const setupEventListeners = () => {
      if (component.input) {
        // Update positions when focus state changes
        component.input.addEventListener('focus', () => {
          component.element.classList.add(`${PREFIX}-${COMPONENT}--focused`);
          setTimeout(updateElementPositions, 10);
        });
        
        component.input.addEventListener('blur', () => {
          component.element.classList.remove(`${PREFIX}-${COMPONENT}--focused`);
          setTimeout(updateElementPositions, 10);
        });
        
        // Update positions when empty state changes
        component.input.addEventListener('input', () => {
          const isEmpty = !component.input.value;
          component.element.classList.toggle(`${PREFIX}-${COMPONENT}--empty`, isEmpty);
          setTimeout(updateElementPositions, 10);
        });
        
        // Set initial empty state
        if (!component.input.value) {
          component.element.classList.add(`${PREFIX}-${COMPONENT}--empty`);
        }
      }
      
      // Update positions on window resize
      window.addEventListener('resize', updateElementPositions);
    };
    
    // Perform initial setup
    setTimeout(() => {
      setupEventListeners();
      updateElementPositions();
    }, 0);
    
    // Add lifecycle integration
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        window.removeEventListener('resize', updateElementPositions);
        originalDestroy.call(component.lifecycle);
      };
    }
    
    return {
      ...component,
      updateElementPositions
    };
  };