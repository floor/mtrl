// src/components/textfield/features/supporting-text.ts

import { BaseComponent, ElementComponent } from '../../../core/compose/component';

/**
 * Configuration for supporting text feature
 */
export interface SupportingTextConfig {
  /**
   * Supporting text content
   */
  supportingText?: string;
  
  /**
   * Whether supporting text indicates an error
   */
  error?: boolean;
  
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
 * Component with supporting text capabilities
 */
export interface SupportingTextComponent extends BaseComponent {
  /**
   * Supporting text element
   */
  supportingTextElement: HTMLElement | null;
  
  /**
   * Sets supporting text content
   * @param text - Text content
   * @param isError - Whether text represents an error
   * @returns Component instance for chaining
   */
  setSupportingText: (text: string, isError?: boolean) => SupportingTextComponent;
  
  /**
   * Removes supporting text
   * @returns Component instance for chaining
   */
  removeSupportingText: () => SupportingTextComponent;
}

/**
 * Adds supporting text to a textfield component
 * @param config - Configuration with supporting text settings
 * @returns Function that enhances a component with supporting text
 */
export const withSupportingText = <T extends SupportingTextConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & SupportingTextComponent => {
    if (!config.supportingText) {
      return component as any;
    }
    
    // Create supporting text element
    const PREFIX = config.prefix || 'mtrl';
    const supportingElement = document.createElement('div');
    supportingElement.className = `${PREFIX}-${config.componentName || 'textfield'}-helper`;
    supportingElement.textContent = config.supportingText;
    
    if (config.error) {
      supportingElement.classList.add(`${PREFIX}-${config.componentName || 'textfield'}-helper--error`);
      component.element.classList.add(`${PREFIX}-${config.componentName || 'textfield'}--error`);
    }
    
    // Add supporting text to the component
    component.element.appendChild(supportingElement);
    
    // Add lifecycle integration if available
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        supportingElement.remove();
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      supportingTextElement: supportingElement,
      
      setSupportingText(text: string, isError = false) {
        supportingElement.textContent = text;
        
        // Handle error state
        supportingElement.classList.toggle(`${PREFIX}-${config.componentName || 'textfield'}-helper--error`, isError);
        component.element.classList.toggle(`${PREFIX}-${config.componentName || 'textfield'}--error`, isError);
        
        return this;
      },
      
      removeSupportingText() {
        if (supportingElement.parentNode) {
          supportingElement.remove();
          this.supportingTextElement = null;
          component.element.classList.remove(`${PREFIX}-${config.componentName || 'textfield'}--error`);
        }
        return this;
      }
    };
  };