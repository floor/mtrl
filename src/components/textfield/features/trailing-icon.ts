// src/components/textfield/features/trailing-icon.ts

import { BaseComponent, ElementComponent } from '../../../core/compose/component';

/**
 * Configuration for trailing icon feature
 */
export interface TrailingIconConfig {
  /**
   * Trailing icon HTML content
   */
  trailingIcon?: string;
  
  /**
   * CSS class prefix
   */
  prefix?: string;
  
  /**
   * Component name
   */
  componentName?: string;
  
  [key: string]: any;
}

/**
 * Component with trailing icon capabilities
 */
export interface TrailingIconComponent extends BaseComponent {
  /**
   * Trailing icon element
   */
  trailingIcon: HTMLElement | null;
  
  /**
   * Sets trailing icon content
   * @param html - HTML content for the icon
   * @returns Component instance for chaining
   */
  setTrailingIcon: (html: string) => TrailingIconComponent;
  
  /**
   * Removes trailing icon
   * @returns Component instance for chaining
   */
  removeTrailingIcon: () => TrailingIconComponent;
}

/**
 * Adds trailing icon to a textfield component
 * @param config - Configuration with trailing icon settings
 * @returns Function that enhances a component with trailing icon
 */
export const withTrailingIcon = <T extends TrailingIconConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & TrailingIconComponent => {
    if (!config.trailingIcon) {
      return component as any;
    }
    
    // Create icon element
    const PREFIX = config.prefix || 'mtrl';
    const iconElement = document.createElement('span');
    iconElement.className = `${PREFIX}-${config.componentName || 'textfield'}-trailing-icon`;
    iconElement.innerHTML = config.trailingIcon;
    
    // Add trailing icon to the component
    component.element.appendChild(iconElement);
    
    // Add trailing-icon class to the component
    component.element.classList.add(`${PREFIX}-${config.componentName || 'textfield'}--with-trailing-icon`);
    
    // When there's a trailing icon, adjust input padding
    if (component.input) {
      component.input.classList.add(`${PREFIX}-${config.componentName || 'textfield'}-input--with-trailing-icon`);
    }
    
    // Add lifecycle integration if available
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        iconElement.remove();
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      trailingIcon: iconElement,
      
      setTrailingIcon(html: string) {
        iconElement.innerHTML = html;
        return this;
      },
      
      removeTrailingIcon() {
        if (iconElement.parentNode) {
          iconElement.remove();
          component.element.classList.remove(`${PREFIX}-${config.componentName || 'textfield'}--with-trailing-icon`);
          if (component.input) {
            component.input.classList.remove(`${PREFIX}-${config.componentName || 'textfield'}-input--with-trailing-icon`);
          }
          this.trailingIcon = null;
        }
        return this;
      }
    };
  };