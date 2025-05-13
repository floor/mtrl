import { BaseComponent, ElementComponent } from '../../../core/compose/component';
import { getInheritedBackground } from '../../../core/utils/background';

/**
 * Extended element component with input field
 */
interface InputElementComponent extends ElementComponent {
  input?: HTMLInputElement | HTMLTextAreaElement;
  lifecycle?: {
    destroy: () => void;
  };
}

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
  <C extends InputElementComponent>(component: C): C & PlacementComponent => {
    const PREFIX = component.config.prefix || 'mtrl';
    const COMPONENT = component.config.componentName || 'textfield';
    
    // Use WeakMaps to store observers without extending HTMLElement
    const bgSourceObservers = new WeakMap<HTMLElement, MutationObserver>();
    const parentObservers = new WeakMap<HTMLElement, MutationObserver[]>();
    const themeChangeHandlers = new WeakMap<HTMLElement, EventListener>();
    
    /**
     * Updates positions of labels and adjusts input padding
     * to accommodate prefix/suffix elements
     */
    const updateElementPositions = () => {
      if (!component.element || !component.element.isConnected) return component as any;
      
      // Get necessary elements
      const labelEl = component.element.querySelector(`.${PREFIX}-${COMPONENT}-label`) as HTMLElement;
      const prefixEl = component.element.querySelector(`.${PREFIX}-${COMPONENT}-prefix`);
      const suffixEl = component.element.querySelector(`.${PREFIX}-${COMPONENT}-suffix`);
      
      // Get component states
      const isOutlined = component.element.classList.contains(`${PREFIX}-${COMPONENT}--outlined`);
      const isFocused = component.element.classList.contains(`${PREFIX}-${COMPONENT}--focused`);
      const isEmpty = component.element.classList.contains(`${PREFIX}-${COMPONENT}--empty`);
      const hasLeadingIcon = component.element.classList.contains(`${PREFIX}-${COMPONENT}--with-leading-icon`);
      
      // For outlined variant, set the label background color to match parent
      if (isOutlined && labelEl) {
        // Get the inherited background color and its source element
        const { color: parentBgColor, element: bgSourceElement } = getInheritedBackground(component.element);
        
        // Apply the background color to the label (only in focus/filled state)
        if (isFocused || !isEmpty) {
          labelEl.style.backgroundColor = parentBgColor;
          
          // Add padding to create the proper "floating label" appearance
          labelEl.style.paddingLeft = '4px';
          labelEl.style.paddingRight = '4px';
          
          // Set up observer for background source element if not already done
          if (bgSourceElement && !bgSourceObservers.has(component.element)) {
            const observer = new MutationObserver(() => {
              // Update label background when source element changes
              const { color } = getInheritedBackground(component.element);
              labelEl.style.backgroundColor = color;
            });
            
            observer.observe(bgSourceElement, { 
              attributes: true, 
              attributeFilter: ['style', 'class']
            });
            
            // Store the observer in our WeakMap
            bgSourceObservers.set(component.element, observer);
            
            // Observe parent nodes to catch theme changes, including dark mode
            let parent = bgSourceElement.parentElement;
            const observers: MutationObserver[] = [];
            
            while (parent && parent !== document.documentElement) {
              const parentObserver = new MutationObserver(() => {
                // Update label background when parent attributes change
                const { color: newColor } = getInheritedBackground(component.element);
                labelEl.style.backgroundColor = newColor;
              });
              
              parentObserver.observe(parent, {
                attributes: true,
                attributeFilter: ['style', 'class', 'data-theme', 'data-theme-mode']
              });
              
              observers.push(parentObserver);
              parent = parent.parentElement;
            }
            
            // Store parent observers
            if (observers.length) {
              parentObservers.set(component.element, observers);
            }
          }
          
          // Set up theme change listener if not already done
          if (!themeChangeHandlers.has(component.element)) {
            const themeChangeHandler = () => {
              // Update label background on theme change
              const { color } = getInheritedBackground(component.element);
              if (isFocused || !isEmpty) {
                labelEl.style.backgroundColor = color;
              }
            };
            
            // Only listen for themechange, as it's the event dispatched by theme-manager.js
            document.addEventListener('themechange', themeChangeHandler);
            
            themeChangeHandlers.set(component.element, themeChangeHandler);
          }
        } else {
          // Reset background when not floating
          labelEl.style.backgroundColor = '';
          labelEl.style.padding = '';
        }
      }
      
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
      
      return component as any;
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
      
      // Update positions when element is connected to DOM
      const domObserver = new MutationObserver(() => {
        if (component.element.isConnected) {
          updateElementPositions();
        }
      });
      domObserver.observe(document.body, { childList: true, subtree: true });
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
        
        // Disconnect background source observer
        const bgObserver = bgSourceObservers.get(component.element);
        if (bgObserver) {
          bgObserver.disconnect();
          bgSourceObservers.delete(component.element);
        }
        
        // Disconnect parent observers
        const observers = parentObservers.get(component.element);
        if (observers) {
          observers.forEach(observer => observer.disconnect());
          parentObservers.delete(component.element);
        }
        
        // Remove theme change listener
        const themeHandler = themeChangeHandlers.get(component.element);
        if (themeHandler) {
          document.removeEventListener('themechange', themeHandler);
          themeChangeHandlers.delete(component.element);
        }
        
        originalDestroy.call(component.lifecycle);
      };
    }
    
    return {
      ...component,
      updateElementPositions: () => {
        updateElementPositions();
        return component as unknown as C & PlacementComponent;
      }
    };
  };