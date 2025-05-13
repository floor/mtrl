// src/components/textfield/features/suffix-text.ts

import { BaseComponent, ElementComponent } from '../../../core/compose/component';

/**
 * Extended element component with lifecycle
 */
interface LifecycleElementComponent extends ElementComponent {
  lifecycle?: {
    destroy: () => void;
  };
}

/**
 * Configuration for suffix text feature
 */
export interface SuffixTextConfig {
  /**
   * Suffix text content to display after the input
   */
  suffixText?: string;
  
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
 * Component with suffix text capabilities
 */
export interface SuffixTextComponent extends BaseComponent {
  /**
   * Suffix text element
   */
  suffixTextElement: HTMLElement | null;
  
  /**
   * Sets suffix text content
   * @param text - Text content to display after the input
   * @returns Component instance for chaining
   */
  setSuffixText: (text: string) => SuffixTextComponent;
  
  /**
   * Removes suffix text
   * @returns Component instance for chaining
   */
  removeSuffixText: () => SuffixTextComponent;
}

/**
 * Adds suffix text to a textfield component
 * @param config - Configuration with suffix text settings
 * @returns Function that enhances a component with suffix text
 */
export const withSuffixText = <T extends SuffixTextConfig>(config: T) => 
  <C extends LifecycleElementComponent>(component: C): C & SuffixTextComponent => {
    if (!config.suffixText) {
      return component as any;
    }
    
    // Create suffix text element
    const PREFIX = config.prefix || 'mtrl';
    const suffixElement = document.createElement('span');
    suffixElement.className = `${PREFIX}-${config.componentName || 'textfield'}-suffix`;
    suffixElement.textContent = config.suffixText;
    
    // Add suffix text to the component
    component.element.appendChild(suffixElement);
    
    // Add suffix class to the component
    component.element.classList.add(`${PREFIX}-${config.componentName || 'textfield'}--with-suffix`);
    
    // Add lifecycle integration
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy as Function;
      component.lifecycle.destroy = () => {
        suffixElement.remove();
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      suffixTextElement: suffixElement,
      
      setSuffixText(text: string) {
        suffixElement.textContent = text;
        return this;
      },
      
      removeSuffixText() {
        if (suffixElement.parentNode) {
          suffixElement.remove();
          component.element.classList.remove(`${PREFIX}-${config.componentName || 'textfield'}--with-suffix`);
          this.suffixTextElement = null;
        }
        return this;
      }
    };
  };