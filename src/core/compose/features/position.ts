// src/core/compose/features/position.ts

import { BaseComponent, ElementComponent } from '../component';

/**
 * Available position values
 */
export enum POSITIONS {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom',
  START = 'start',
  END = 'end',
  CENTER = 'center'
}

/**
 * Configuration for position feature
 */
export interface PositionConfig {
  position?: string;
  prefix?: string;
  componentName?: string;
  [key: string]: any;
}

/**
 * Position manager interface
 */
export interface PositionManager {
  /**
   * Sets the component's position
   * @param newPosition - New position value
   * @returns Position manager for chaining
   */
  setPosition: (newPosition: string) => PositionManager;
  
  /**
   * Gets the current position
   * @returns Current position
   */
  getPosition: () => string;
}

/**
 * Component with position capabilities
 */
export interface PositionComponent extends BaseComponent {
  position: PositionManager;
}

/**
 * Adds positioning functionality to a component
 * 
 * @param config - Configuration object containing position information
 * @returns Function that enhances a component with position capabilities
 */
export const withPosition = <T extends PositionConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & PositionComponent => {
    if (!config.position || !component.element) {
      return component as C & PositionComponent;
    }

    // Get the position value, normalizing from enum if provided as uppercase
    const position = 
      POSITIONS[config.position.toUpperCase() as keyof typeof POSITIONS] || 
      config.position;
      
    const className = `${config.prefix}-${config.componentName}--${position}`;
    component.element.classList.add(className);

    const positionManager: PositionManager = {
      setPosition(newPosition: string) {
        const oldPosition = position;
        const oldClassName = `${config.prefix}-${config.componentName}--${oldPosition}`;
        const newClassName = `${config.prefix}-${config.componentName}--${newPosition}`;

        component.element.classList.remove(oldClassName);
        component.element.classList.add(newClassName);

        return this;
      },

      getPosition() {
        return position;
      }
    };

    return {
      ...component,
      position: positionManager
    };
  };