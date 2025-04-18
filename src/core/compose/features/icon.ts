// src/core/compose/features/icon.ts

import { createIcon, IconManager } from '../../build/icon';
import { BaseComponent, ElementComponent } from '../component';

/**
 * Configuration for icon feature
 */
export interface IconConfig {
  icon?: string;
  iconPosition?: 'start' | 'end';
  iconSize?: string;
  prefix?: string;
  componentName?: string;
  text?: string;
  [key: string]: any;
}

/**
 * Component with icon capabilities
 */
export interface IconComponent extends BaseComponent {
  icon: IconManager;
}

/**
 * Updates the component's circular style based on content
 * Adds circular class if there's an icon but no text
 */
const updateCircularStyle = (component: ElementComponent, config: IconConfig): void => {
  const hasText = config.text;
  const hasIcon = config.icon;

  const circularClass = `${component.getClass('button')}--circular`;
  if (!hasText && hasIcon) {
    component.element.classList.add(circularClass);
  } else {
    component.element.classList.remove(circularClass);
  }
};

/**
 * Adds icon management to a component
 * @param config - Configuration object containing icon information
 * @returns Function that enhances a component with icon capabilities
 */
export const withIcon = <T extends IconConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & IconComponent => {
    // Create the icon with configuration settings
    const icon = createIcon(component.element, {
      prefix: config.prefix,
      type: config.componentName || 'component',
      position: config.iconPosition,
      iconSize: config.iconSize
    });
    
    // Set icon if provided in config
    config.icon && icon.setIcon(config.icon);
    
    // Apply button-specific styling if the component is a button
    if (component.componentName === 'button') {
      if (!config.text) {
        updateCircularStyle(component, config);
      } else if (config.icon && config.text) {
        component.element.classList.add(`${component.getClass('button')}--icon`);
      }
    }
    
    // Return enhanced component with icon capabilities
    return Object.assign(component, { icon });
  };
