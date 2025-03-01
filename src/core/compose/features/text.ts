// src/core/compose/features/text.ts

import { createText, TextManager } from '../../build/text';
import { BaseComponent, ElementComponent } from '../component';

/**
 * Configuration for text feature
 */
export interface TextConfig {
  text?: string;
  prefix?: string;
  componentName?: string;
  [key: string]: any;
}

/**
 * Component with text capabilities
 */
export interface TextComponent extends BaseComponent {
  text: TextManager;
}

/**
 * Adds text management to a component
 * 
 * @param config - Configuration object containing text information
 * @returns Function that enhances a component with text capabilities
 */
export const withText = <T extends TextConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & TextComponent => {
    const text = createText(component.element, {
      prefix: config.prefix,
      type: config.componentName || 'component'
    });

    if (config.text) {
      text.setText(config.text);
    }

    return {
      ...component,
      text
    };
  };