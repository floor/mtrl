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