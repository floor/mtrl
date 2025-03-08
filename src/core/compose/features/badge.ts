// src/core/compose/features/badge.ts

import { BaseComponent, ElementComponent } from '../component';
import createBadge from '../../../components/badge';
import { PREFIX } from '../../config';

/**
 * Configuration for badge feature
 */
export interface BadgeConfig {
  /**
   * Badge content to display
   */
  badge?: string | number;
  
  /**
   * Custom badge configuration
   */
  badgeConfig?: {
    variant?: string;
    color?: string;
    size?: string;
    position?: string;
    max?: number;
    [key: string]: any;
  };
  
  /**
   * CSS class prefix
   */
  prefix?: string;
  
  [key: string]: any;
}

/**
 * Component with badge capabilities
 */
export interface BadgeComponent extends BaseComponent {
  /**
   * Badge component instance
   */
  badge?: any;
}

/**
 * Adds badge functionality to a component
 * Creates and configures a badge component attached to the main component
 * 
 * @param {BadgeConfig} config - Badge configuration
 * @returns {Function} Component enhancer with badge functionality
 */
export const withBadge = <T extends BadgeConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & BadgeComponent => {
    // Only create badge if content is provided
    if (config.badge === undefined) {
      return component as C & BadgeComponent;
    }
    
    // Create badge configuration
    const badgeConfig = {
      content: config.badge,
      standalone: false,
      target: component.element,
      ...config.badgeConfig || {},
      // Default to top-right position if not specified
      position: config.badgeConfig?.position || 'top-right',
      // Set prefix to match parent component
      prefix: config.prefix || PREFIX
    };
    
    // Create badge component
    const badge = createBadge(badgeConfig);
    
    return {
      ...component,
      badge
    };
  };