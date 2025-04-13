// src/components/textfield/features/prefix-text.ts

import { BaseComponent, ElementComponent } from '../../../core/compose/component';

/**
 * Configuration for prefix text feature
 */
export interface PrefixTextConfig {
  /**
   * Prefix text content to display before the input
   */
  prefixText?: string;
  
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
 * Component with prefix text capabilities
 */
export interface PrefixTextComponent extends BaseComponent {
  /**
   * Prefix text element
   */
  prefixTextElement: HTMLElement | null;
  
  /**
   * Sets prefix text content
   * @param text - Text content to display before the input
   * @returns Component instance for chaining
   */
  setPrefixText: (text: string) => PrefixTextComponent;
  
  /**
   * Removes prefix text
   * @returns Component instance for chaining
   */
  removePrefixText: () => PrefixTextComponent;
}

/**
 * Adds prefix text to a textfield component
 * @param config - Configuration with prefix text settings
 * @returns Function that enhances a component with prefix text
 */
export const withPrefixText = <T extends PrefixTextConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & PrefixTextComponent => {
    if (!config.prefixText) {
      return component as any;
    }
    
    // Create prefix text element
    const PREFIX = config.prefix || 'mtrl';
    const prefixElement = document.createElement('span');
    prefixElement.className = `${PREFIX}-${config.componentName || 'textfield'}-prefix`;
    prefixElement.textContent = config.prefixText;
    
    // Add prefix text to the component
    component.element.appendChild(prefixElement);
    
    // Add prefix class to the component
    component.element.classList.add(`${PREFIX}-${config.componentName || 'textfield'}--with-prefix`);
    
    // Add lifecycle integration
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        prefixElement.remove();
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      prefixTextElement: prefixElement,
      
      setPrefixText(text: string) {
        prefixElement.textContent = text;
        return this;
      },
      
      removePrefixText() {
        if (prefixElement.parentNode) {
          prefixElement.remove();
          component.element.classList.remove(`${PREFIX}-${config.componentName || 'textfield'}--with-prefix`);
          
          // Reset label position if no prefix
          const labelEl = component.element.querySelector(`.${PREFIX}-${config.componentName || 'textfield'}-label`);
          if (labelEl) {
            (labelEl as HTMLElement).style.left = '';
          }
          
          this.prefixTextElement = null;
        }
        return this;
      }
    };
  };