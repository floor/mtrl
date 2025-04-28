// src/components/switch/features.ts
import { BaseComponent, ElementComponent } from '../../core/compose/component';
import { SWITCH_CLASSES } from './constants';

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
 * Helper to ensure the switch has the proper container/content structure
 * @param component - The component to enhance
 * @param prefix - CSS class prefix
 * @param componentName - Component name
 * @returns The container and content elements
 */
const ensureSwitchStructure = (
  component: ElementComponent, 
  prefix: string, 
  componentName: string
) => {
  const PREFIX = prefix || 'mtrl';
  const COMPONENT = componentName || 'switch';
  
  // Create or find container
  let container = component.element.querySelector(`.${PREFIX}-${COMPONENT}-container`);
  if (!container) {
    container = document.createElement('div');
    container.className = `${PREFIX}-${COMPONENT}-container`;
    
    // Find input and track to move them to container
    const input = component.element.querySelector(`.${PREFIX}-${COMPONENT}-input`);
    const track = component.element.querySelector(`.${PREFIX}-${COMPONENT}-track`);
    
    // Gather all elements except container
    const elementsToMove = [];
    if (input) elementsToMove.push(input);
    if (track) elementsToMove.push(track);
    
    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = `${PREFIX}-${COMPONENT}-content`;
    
    // Find label and move to content
    const label = component.element.querySelector(`.${PREFIX}-${COMPONENT}-label`);
    if (label) {
      contentWrapper.appendChild(label);
    }
    
    // Add content wrapper to container first
    container.appendChild(contentWrapper);
    
    // Add other elements to container
    elementsToMove.forEach(el => container.appendChild(el));
    
    // Add container to component
    component.element.appendChild(container);
    
    return { container, contentWrapper };
  }
  
  // Container exists, find or create content wrapper
  let contentWrapper = component.element.querySelector(`.${PREFIX}-${COMPONENT}-content`);
  if (!contentWrapper) {
    contentWrapper = document.createElement('div');
    contentWrapper.className = `${PREFIX}-${COMPONENT}-content`;
    
    // Find label to move to content
    const label = component.element.querySelector(`.${PREFIX}-${COMPONENT}-label`);
    if (label) {
      contentWrapper.appendChild(label);
    }
    
    // Insert content wrapper at beginning of container
    container.insertBefore(contentWrapper, container.firstChild);
  }
  
  return { container, contentWrapper };
};

/**
 * Creates and manages supporting text for a component
 * @param config - Configuration object with supporting text settings
 * @returns Function that enhances a component with supporting text functionality
 */
export const withSupportingText = <T extends SupportingTextConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & SupportingTextComponent => {
    const PREFIX = config.prefix || 'mtrl';
    const COMPONENT = config.componentName || 'switch';
    
    // Ensure we have the proper container/content structure
    const { contentWrapper } = ensureSwitchStructure(component, PREFIX, COMPONENT);
    
    // Create supporting text element if needed
    let supportingElement = null;
    if (config.supportingText) {
      supportingElement = document.createElement('div');
      supportingElement.className = `${PREFIX}-${COMPONENT}-helper`;
      supportingElement.textContent = config.supportingText;
      
      if (config.error) {
        supportingElement.classList.add(`${PREFIX}-${COMPONENT}-helper--error`);
        component.element.classList.add(`${PREFIX}-${COMPONENT}--error`);
      }
      
      // Add supporting text to the content wrapper
      contentWrapper.appendChild(supportingElement);
    }
    
    // Add lifecycle integration if available
    if ('lifecycle' in component && component.lifecycle?.destroy && supportingElement) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        if (supportingElement) supportingElement.remove();
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      supportingTextElement: supportingElement,
      
      setSupportingText(text: string, isError = false) {
        const { contentWrapper } = ensureSwitchStructure(component, PREFIX, COMPONENT);
        let supportingElement = this.supportingTextElement;
        
        if (!supportingElement) {
          // Create if it doesn't exist
          supportingElement = document.createElement('div');
          supportingElement.className = `${PREFIX}-${COMPONENT}-helper`;
          contentWrapper.appendChild(supportingElement);
          this.supportingTextElement = supportingElement;
        }
        
        supportingElement.textContent = text;
        
        // Handle error state
        supportingElement.classList.toggle(`${PREFIX}-${COMPONENT}-helper--error`, isError);
        component.element.classList.toggle(`${PREFIX}-${COMPONENT}--error`, isError);
        
        return this;
      },
      
      removeSupportingText() {
        if (this.supportingTextElement && this.supportingTextElement.parentNode) {
          this.supportingTextElement.remove();
          this.supportingTextElement = null;
          component.element.classList.remove(`${PREFIX}-${COMPONENT}--error`);
        }
        return this;
      }
    };
  };