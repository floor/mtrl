// src/components/textfield/features/leading-icon.ts

import { BaseComponent, ElementComponent } from '../../../core/compose/component';

/**
 * Configuration for leading icon feature
 */
export interface LeadingIconConfig {
  /**
   * Leading icon HTML content
   */
  leadingIcon?: string;
  
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
 * Component with leading icon capabilities
 */
export interface LeadingIconComponent extends BaseComponent {
  /**
   * Leading icon element
   */
  leadingIcon: HTMLElement | null;
  
  /**
   * Sets leading icon content
   * @param html - HTML content for the icon
   * @returns Component instance for chaining
   */
  setLeadingIcon: (html: string) => LeadingIconComponent;
  
  /**
   * Removes leading icon
   * @returns Component instance for chaining
   */
  removeLeadingIcon: () => LeadingIconComponent;
}

/**
 * Adds leading icon to a textfield component
 * @param config - Configuration with leading icon settings
 * @returns Function that enhances a component with leading icon
 */
export const withLeadingIcon = <T extends LeadingIconConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & LeadingIconComponent => {
    if (!config.leadingIcon) {
      return component as any;
    }
    
    // Create icon element
    const PREFIX = config.prefix || 'mtrl';
    const iconElement = document.createElement('span');
    iconElement.className = `${PREFIX}-${config.componentName || 'textfield'}-leading-icon`;
    iconElement.innerHTML = config.leadingIcon;
    
    // Add leading icon to the component
    component.element.appendChild(iconElement);
    
    // Add leading-icon class to the component
    component.element.classList.add(`${PREFIX}-${config.componentName || 'textfield'}--with-leading-icon`);
    
    // When there's a leading icon, adjust input padding
    if (component.input) {
      component.input.classList.add(`${PREFIX}-${config.componentName || 'textfield'}-input--with-leading-icon`);
    }
    
    // Add lifecycle integration if available
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        iconElement.remove();
        originalDestroy.call(component.lifecycle);
      };
    }
    
    // Update label position based on icon
    setTimeout(() => {
      const labelEl = component.element.querySelector(`.${PREFIX}-${config.componentName || 'textfield'}-label`);
      if (labelEl) {
        if (!component.element.classList.contains(`${PREFIX}-${config.componentName || 'textfield'}--with-prefix`)) {
          (labelEl as HTMLElement).style.left = '44px';
        }
      }
    }, 10);

    return {
      ...component,
      leadingIcon: iconElement,
      
      setLeadingIcon(html: string) {
        iconElement.innerHTML = html;
        return this;
      },
      
      removeLeadingIcon() {
        if (iconElement.parentNode) {
          iconElement.remove();
          component.element.classList.remove(`${PREFIX}-${config.componentName || 'textfield'}--with-leading-icon`);
          if (component.input) {
            component.input.classList.remove(`${PREFIX}-${config.componentName || 'textfield'}-input--with-leading-icon`);
          }
          
          // Reset label position if no prefix
          if (!component.element.classList.contains(`${PREFIX}-${config.componentName || 'textfield'}--with-prefix`)) {
            const labelEl = component.element.querySelector(`.${PREFIX}-${config.componentName || 'textfield'}-label`);
            if (labelEl) {
              (labelEl as HTMLElement).style.left = '';
            }
          }
          
          this.leadingIcon = null;
        }
        return this;
      }
    };
  };