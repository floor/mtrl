// src/components/textfield/features/multiline.ts

import { BaseComponent, ElementComponent } from '../../../core/compose/component';

/**
 * Configuration for multiline feature
 */
export interface MultilineConfig {
  /**
   * Whether to use textarea instead of input
   */
  multiline?: boolean;
  
  /**
   * Minimum number of rows for textarea
   */
  rows?: number;
  
  /**
   * Initial height in pixels
   */
  initialHeight?: number;
  
  /**
   * Whether to automatically grow textarea as content increases
   */
  autoGrow?: boolean;
  
  /**
   * Maximum height for auto-growing textarea in pixels
   */
  maxHeight?: number;
  
  /**
   * CSS class prefix
   */
  prefix?: string;
  
  /**
   * Component name
   */
  componentName?: string;
  
  /**
   * Type of the input field
   */
  type?: string;
  
  [key: string]: any;
}

/**
 * Component with multiline capabilities
 */
export interface MultilineComponent extends BaseComponent {
  /**
   * Updates the height of the textarea based on content
   * @returns Component instance for chaining
   */
  updateHeight: () => MultilineComponent;
  
  /**
   * Sets minimum number of rows
   * @param rows - Number of rows
   * @returns Component instance for chaining 
   */
  setRows: (rows: number) => MultilineComponent;
}

/**
 * Enhances a textfield component with multiline capabilities
 * Replaces input with textarea when multiline is enabled
 * 
 * @param config - Configuration with multiline settings
 * @returns Function that enhances a component with multiline capabilities
 */
export const withMultiline = <T extends MultilineConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & MultilineComponent => {
    // Determine if component should use multiline
    const isMultiline = config.multiline === true || config.type === 'multiline';
    
    if (!isMultiline) {
      return component as any;
    }
    
    const PREFIX = config.prefix || 'mtrl';
    const COMPONENT = config.componentName || 'textfield';
    const rows = config.rows || 3;
    const initialHeight = config.initialHeight || 0;
    const maxHeight = config.maxHeight || 0;
    const autoGrow = config.autoGrow !== false; // Default to true if not specified
    
    // Add multiline class to the component
    component.element.classList.add(`${PREFIX}-${COMPONENT}--multiline`);
    
    /**
     * Updates the height of the textarea based on content
     */
    const updateHeight = () => {
      if (!component.input || !(component.input instanceof HTMLTextAreaElement)) {
        return component;
      }
      
      const textarea = component.input;
      
      if (autoGrow) {
        // Reset height to auto to measure content height accurately
        textarea.style.height = 'auto';
        
        // Calculate the new height based on scrollHeight
        let newHeight = textarea.scrollHeight;
        
        // Apply max height constraint if specified
        if (maxHeight > 0 && newHeight > maxHeight) {
          newHeight = maxHeight;
          textarea.style.overflowY = 'auto';
        } else {
          textarea.style.overflowY = 'hidden';
        }
        
        // Apply the new height
        textarea.style.height = `${newHeight}px`;
      }
      
      return component;
    };
    
    /**
     * Sets the minimum number of rows
     */
    const setRows = (newRows: number) => {
      if (component.input && component.input instanceof HTMLTextAreaElement) {
        component.input.rows = newRows;
      }
      return component;
    };
    
    // Setup event listeners for auto-grow
    const setupEventListeners = () => {
      if (autoGrow && component.input instanceof HTMLTextAreaElement) {
        // Initial height setup
        setTimeout(updateHeight, 0);
        
        // Update height on input changes
        component.input.addEventListener('input', () => {
          updateHeight();
        });
        
        // Update height on window resize
        window.addEventListener('resize', () => {
          updateHeight();
        });
      }
    };
    
    // Set initial rows if component.input is a textarea
    if (component.input instanceof HTMLTextAreaElement) {
      component.input.rows = rows;
      
      if (initialHeight > 0) {
        component.input.style.height = `${initialHeight}px`;
      }
      
      setupEventListeners();
    }
    
    // Add lifecycle integration
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        if (autoGrow && component.input instanceof HTMLTextAreaElement) {
          window.removeEventListener('resize', updateHeight);
        }
        originalDestroy.call(component.lifecycle);
      };
    }
    
    return {
      ...component,
      updateHeight,
      setRows
    };
  };