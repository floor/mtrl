// src/components/textfield/features.ts
import { BaseComponent, ElementComponent } from '../../core/compose/component';

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
 * Creates and manages a leading icon for a component
 * @param config - Configuration object with leading icon settings
 * @returns Function that enhances a component with leading icon functionality
 */
export const withLeadingIcon = <T extends LeadingIconConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & LeadingIconComponent => {
    if (!config.leadingIcon) {
      return component as C & LeadingIconComponent;
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
          this.leadingIcon = null;
        }
        return this;
      }
    };
  };

/**
 * Creates and manages a trailing icon for a component
 * @param config - Configuration object with trailing icon settings
 * @returns Function that enhances a component with trailing icon functionality
 */
export const withTrailingIcon = <T extends TrailingIconConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & TrailingIconComponent => {
    if (!config.trailingIcon) {
      return component as C & TrailingIconComponent;
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

/**
 * Creates and manages supporting text for a component
 * @param config - Configuration object with supporting text settings
 * @returns Function that enhances a component with supporting text functionality
 */
export const withSupportingText = <T extends SupportingTextConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & SupportingTextComponent => {
    if (!config.supportingText) {
      return component as C & SupportingTextComponent;
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

/**
 * Creates and manages prefix text for a component
 * @param config - Configuration object with prefix text settings
 * @returns Function that enhances a component with prefix text functionality
 */
export const withPrefixText = <T extends PrefixTextConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & PrefixTextComponent => {
    if (!config.prefixText) {
      return component as C & PrefixTextComponent;
    }
    
    // Create prefix text element
    const PREFIX = config.prefix || 'mtrl';
    const prefixElement = document.createElement('span');
    prefixElement.className = `${PREFIX}-${config.componentName || 'textfield'}-prefix`;
    prefixElement.textContent = config.prefixText;
    
    // Add prefix text to the component - insert before input but after label
    if (component.input) {
      component.element.insertBefore(prefixElement, component.input);
    } else {
      component.element.appendChild(prefixElement);
    }
    
    // Add prefix class to the component
    component.element.classList.add(`${PREFIX}-${config.componentName || 'textfield'}--with-prefix`);
    
    // When there's a prefix, adjust input padding
    if (component.input) {
      component.input.classList.add(`${PREFIX}-${config.componentName || 'textfield'}-input--with-prefix`);
    }
    
    // Add lifecycle integration if available
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
          if (component.input) {
            component.input.classList.remove(`${PREFIX}-${config.componentName || 'textfield'}-input--with-prefix`);
          }
          this.prefixTextElement = null;
        }
        return this;
      }
    };
  };

/**
 * Creates and manages suffix text for a component
 * @param config - Configuration object with suffix text settings
 * @returns Function that enhances a component with suffix text functionality
 */
export const withSuffixText = <T extends SuffixTextConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & SuffixTextComponent => {
    if (!config.suffixText) {
      return component as C & SuffixTextComponent;
    }
    
    // Create suffix text element
    const PREFIX = config.prefix || 'mtrl';
    const suffixElement = document.createElement('span');
    suffixElement.className = `${PREFIX}-${config.componentName || 'textfield'}-suffix`;
    suffixElement.textContent = config.suffixText;
    
    // Add suffix text to the component - insert after input
    if (component.input) {
      component.element.insertBefore(suffixElement, component.input.nextSibling);
    } else {
      component.element.appendChild(suffixElement);
    }
    
    // Add suffix class to the component
    component.element.classList.add(`${PREFIX}-${config.componentName || 'textfield'}--with-suffix`);
    
    // When there's a suffix, adjust input padding
    if (component.input) {
      component.input.classList.add(`${PREFIX}-${config.componentName || 'textfield'}-input--with-suffix`);
    }
    
    // Add lifecycle integration if available
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
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
          if (component.input) {
            component.input.classList.remove(`${PREFIX}-${config.componentName || 'textfield'}-input--with-suffix`);
          }
          this.suffixTextElement = null;
        }
        return this;
      }
    };
  };