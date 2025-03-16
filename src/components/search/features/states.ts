// src/components/search/features/states.ts
import { SEARCH_VARIANTS } from '../constants';
import { SearchConfig } from '../types';

/**
 * Add state management features to search component
 * 
 * @param config Search configuration
 * @returns Component enhancer with state management features
 */
export const withStates = (config: SearchConfig) => component => {
  // Track initial disabled state
  const isDisabled = config.disabled === true;
  
  // Apply initial disabled state if needed
  if (isDisabled) {
    setTimeout(() => {
      disableComponent();
    }, 0);
  }
  
  /**
   * Disables the component
   */
  function disableComponent() {
    component.element.classList.add(`${component.getClass('search')}--disabled`);
    component.element.setAttribute('aria-disabled', 'true');
    
    // Disable input - important to use the disabled property not the attribute
    if (component.structure?.input) {
      component.structure.input.disabled = true;
    }
    
    // Ensure buttons cannot receive focus when disabled
    const buttons = [
      component.structure?.leadingIcon,
      component.structure?.clearButton,
      component.structure?.trailingIcon,
      component.structure?.trailingIcon2
    ].filter(Boolean);
    
    buttons.forEach(button => {
      button.tabIndex = -1;
      button.setAttribute('aria-disabled', 'true');
    });
  }
  
  /**
   * Enables the component
   */
  function enableComponent() {
    component.element.classList.remove(`${component.getClass('search')}--disabled`);
    component.element.setAttribute('aria-disabled', 'false');
    
    // Enable input - important to use the disabled property not the attribute
    if (component.structure?.input) {
      component.structure.input.disabled = false;
    }
    
    // Re-enable buttons
    const buttons = [
      component.structure?.leadingIcon,
      component.structure?.clearButton,
      component.structure?.trailingIcon,
      component.structure?.trailingIcon2
    ].filter(Boolean);
    
    buttons.forEach(button => {
      button.tabIndex = 0;
      button.setAttribute('aria-disabled', 'false');
    });
    
    // Clear button special case - only enable if there's text
    if (component.structure?.clearButton && 
        component.structure.input && 
        !component.structure.input.value) {
      component.structure.clearButton.tabIndex = -1;
    }
  }
  
  /**
   * Gets the active variant
   */
  function getActiveVariant() {
    return Object.values(SEARCH_VARIANTS).find(variantName => 
      component.element.classList.contains(`${component.getClass('search')}--${variantName}`)
    ) || SEARCH_VARIANTS.BAR;
  }
  
  // Return enhanced component
  return {
    ...component,
    
    // Disabled state management
    disabled: {
      /**
       * Enables the component
       * @returns Disabled manager for chaining
       */
      enable() {
        enableComponent();
        return this;
      },
      
      /**
       * Disables the component
       * @returns Disabled manager for chaining
       */
      disable() {
        disableComponent();
        return this;
      },
      
      /**
       * Checks if component is disabled
       * @returns True if disabled
       */
      isDisabled() {
        return component.element.classList.contains(`${component.getClass('search')}--disabled`);
      }
    },
    
    // Appearance management
    appearance: {
      /**
       * Sets search variant
       * @param variant Variant name
       * @returns Appearance manager for chaining
       */
      setVariant(variant) {
        const currentVariant = getActiveVariant();
        
        // If already this variant, do nothing
        if (currentVariant === variant) {
          return this;
        }
        
        // Remove existing variant classes
        Object.values(SEARCH_VARIANTS).forEach(variantName => {
          component.element.classList.remove(`${component.getClass('search')}--${variantName}`);
        });
        
        // Add new variant class
        component.element.classList.add(`${component.getClass('search')}--${variant}`);
        
        // Toggle expanded state class
        if (variant === SEARCH_VARIANTS.VIEW) {
          component.element.classList.add(`${component.getClass('search')}--expanded`);
        } else {
          component.element.classList.remove(`${component.getClass('search')}--expanded`);
        }
        
        return this;
      },
      
      /**
       * Gets search variant
       * @returns Current variant name
       */
      getVariant() {
        return getActiveVariant();
      }
    }
  };
};