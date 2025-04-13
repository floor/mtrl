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
 * Adds prefix text to a textfield component
 * @param config - Configuration with prefix text settings
 * @returns Function that enhances a component with prefix text
 */
export const withPrefixText = <T extends { prefixText?: string; prefix?: string; componentName?: string }>(config: T) => 
  <C extends ElementComponent>(component: C): C & {
    prefixTextElement: HTMLElement | null;
    setPrefixText: (text: string) => any;
    removePrefixText: () => any;
  } => {
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
    
    // Calculate dynamic padding based on prefix width
    const updatePrefixPosition = () => {
      if (component.input && prefixElement.isConnected) {
        // Get the actual width of the prefix element + add spacing
        const prefixWidth = prefixElement.getBoundingClientRect().width + 4; // 4px spacing
        
        // Update input padding
        component.input.style.paddingLeft = `${prefixWidth + 12}px`; // 12px additional padding
      }
    };
    
    // Schedule the position update after rendering
    setTimeout(updatePrefixPosition, 10);
    
    // Update position if window is resized (for potential font-size changes)
    window.addEventListener('resize', updatePrefixPosition);
    
    // Add lifecycle integration
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        window.removeEventListener('resize', updatePrefixPosition);
        prefixElement.remove();
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      prefixTextElement: prefixElement,
      
      setPrefixText(text: string) {
        prefixElement.textContent = text;
        // Recalculate position when text changes
        setTimeout(updatePrefixPosition, 10);
        return this;
      },
      
      removePrefixText() {
        if (prefixElement.parentNode) {
          window.removeEventListener('resize', updatePrefixPosition);
          prefixElement.remove();
          component.element.classList.remove(`${PREFIX}-${config.componentName || 'textfield'}--with-prefix`);
          if (component.input) {
            component.input.style.paddingLeft = '';
          }
          this.prefixTextElement = null;
        }
        return this;
      }
    };
  };

/**
 * Adds suffix text to a textfield component
 * @param config - Configuration with suffix text settings
 * @returns Function that enhances a component with suffix text
 */
export const withSuffixText = <T extends { suffixText?: string; prefix?: string; componentName?: string }>(config: T) => 
  <C extends ElementComponent>(component: C): C & {
    suffixTextElement: HTMLElement | null;
    setSuffixText: (text: string) => any;
    removeSuffixText: () => any;
  } => {
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
    
    // Calculate dynamic padding based on suffix width
    const updateSuffixPosition = () => {
      if (component.input && suffixElement.isConnected) {
        // Get the actual width of the suffix element + add spacing
        const suffixWidth = suffixElement.getBoundingClientRect().width + 4; // 4px spacing
        
        // Update input padding
        component.input.style.paddingRight = `${suffixWidth + 12}px`; // 12px additional padding
      }
    };
    
    // Schedule the position update after rendering
    setTimeout(updateSuffixPosition, 10);
    
    // Update position if window is resized (for potential font-size changes)
    window.addEventListener('resize', updateSuffixPosition);
    
    // Add lifecycle integration
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        window.removeEventListener('resize', updateSuffixPosition);
        suffixElement.remove();
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      suffixTextElement: suffixElement,
      
      setSuffixText(text: string) {
        suffixElement.textContent = text;
        // Recalculate position when text changes
        setTimeout(updateSuffixPosition, 10);
        return this;
      },
      
      removeSuffixText() {
        if (suffixElement.parentNode) {
          window.removeEventListener('resize', updateSuffixPosition);
          suffixElement.remove();
          component.element.classList.remove(`${PREFIX}-${config.componentName || 'textfield'}--with-suffix`);
          if (component.input) {
            component.input.style.paddingRight = '';
          }
          this.suffixTextElement = null;
        }
        return this;
      }
    };
  };

/**
 * Adds leading icon to a textfield component
 * @param config - Configuration with leading icon settings
 * @returns Function that enhances a component with leading icon
 */
export const withLeadingIcon = <T extends { leadingIcon?: string; prefix?: string; componentName?: string }>(config: T) => 
  <C extends ElementComponent>(component: C): C & {
    leadingIcon: HTMLElement | null;
    setLeadingIcon: (html: string) => any;
    removeLeadingIcon: () => any;
  } => {
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
 * Adds trailing icon to a textfield component
 * @param config - Configuration with trailing icon settings
 * @returns Function that enhances a component with trailing icon
 */
export const withTrailingIcon = <T extends { trailingIcon?: string; prefix?: string; componentName?: string }>(config: T) => 
  <C extends ElementComponent>(component: C): C & {
    trailingIcon: HTMLElement | null;
    setTrailingIcon: (html: string) => any;
    removeTrailingIcon: () => any;
  } => {
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

/**
 * Adds supporting text to a textfield component
 * @param config - Configuration with supporting text settings
 * @returns Function that enhances a component with supporting text
 */
export const withSupportingText = <T extends { supportingText?: string; error?: boolean; prefix?: string; componentName?: string }>(config: T) => 
  <C extends ElementComponent>(component: C): C & {
    supportingTextElement: HTMLElement | null;
    setSupportingText: (text: string, isError?: boolean) => any;
    removeSupportingText: () => any;
  } => {
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