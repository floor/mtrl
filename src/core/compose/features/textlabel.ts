// src/core/compose/features/textlabel.ts

import { BaseComponent, ElementComponent } from '../component';

/**
 * Configuration for text label feature
 */
export interface TextLabelConfig {
  /**
   * Label text
   */
  label?: string;
  
  /**
   * CSS class prefix
   */
  prefix?: string;
  
  /**
   * Component name for class generation
   */
  componentName?: string;
  
  [key: string]: any;
}

/**
 * Label manager interface
 */
export interface LabelManager {
  /**
   * Sets the label text
   * @param text - Text to set
   * @returns LabelManager instance for chaining
   */
  setText: (text: string) => LabelManager;
  
  /**
   * Gets the current label text
   * @returns Current text
   */
  getText: () => string;
  
  /**
   * Gets the label element
   * @returns Label element
   */
  getElement: () => HTMLElement;
}

/**
 * Component with label capabilities
 */
export interface LabelComponent extends BaseComponent {
  label: LabelManager;
}

/**
 * Adds a text label to a component
 * 
 * @param config - Configuration object containing label information
 * @returns Function that enhances a component with a label
 */
export const withTextLabel = <T extends TextLabelConfig>(config: T = {} as T) => 
  <C extends ElementComponent>(component: C): C & LabelComponent => {
    if (!config.label) return component as C & LabelComponent;

    const labelElement = document.createElement('label');
    labelElement.className = `${config.prefix}-${config.componentName}-label`;
    labelElement.textContent = config.label;

    // Insert label after input for proper z-index stacking
    component.element.appendChild(labelElement);

    const label: LabelManager = {
      setText(text: string) {
        labelElement.textContent = text;
        return this;
      },
      getText() {
        return labelElement.textContent || '';
      },
      getElement() {
        return labelElement;
      }
    };

    return {
      ...component,
      label
    };
  };