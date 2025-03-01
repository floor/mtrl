// src/core/compose/features/track.ts
/**
 * @module core/compose/features
 */

import { BaseComponent, ElementComponent } from '../component';

/**
 * Configuration for track feature
 */
export interface TrackConfig {
  /**
   * CSS class prefix
   */
  prefix: string;
  
  /**
   * Component name for class generation
   */
  componentName: string;
  
  /**
   * Custom icon HTML or 'none'
   */
  icon?: string;
  
  [key: string]: any;
}

/**
 * Component with track and thumb elements
 */
export interface TrackComponent extends BaseComponent {
  /**
   * Track element
   */
  track: HTMLElement;
  
  /**
   * Thumb element
   */
  thumb: HTMLElement;
}

/**
 * Default checkmark icon SVG
 * @private
 */
const DEFAULT_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

/**
 * Adds track and thumb elements to a component
 * 
 * @param config - Track configuration
 * @returns Function that enhances a component with track and thumb elements
 */
export const withTrack = <T extends TrackConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & TrackComponent => {
    const track = document.createElement('span');
    track.className = `${config.prefix}-${config.componentName}-track`;

    const thumb = document.createElement('span');
    thumb.className = `${config.prefix}-${config.componentName}-thumb`;
    track.appendChild(thumb);

    // Add icon inside thumb if provided or use default
    if (config.icon !== 'none') {
      const icon = document.createElement('span');
      icon.className = `${config.prefix}-${config.componentName}-thumb-icon`;
      icon.innerHTML = config.icon || DEFAULT_ICON;
      thumb.appendChild(icon);
    }

    component.element.appendChild(track);

    return {
      ...component,
      track,
      thumb
    };
  };