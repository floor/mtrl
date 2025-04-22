// src/core/compose/features/gesture.ts
/**
 * @module core/compose/features
 * @description Adds gesture recognition capabilities to components
 */

import { BaseComponent, ElementComponent } from '../component';
import { 
  createGestureManager, 
  GestureManager, 
  GestureConfig,
  GestureHandler,
  AnyGestureEvent
} from '../../gesture/manager';

/**
 * Configuration for gesture feature
 */
export interface GestureFeatureConfig extends GestureConfig {
  /**
   * Whether to enable gesture recognition immediately
   * @default true
   */
  enableGestures?: boolean;
  
  /**
   * Initial gesture event handlers
   */
  gestureHandlers?: Record<string, GestureHandler>;
  
  [key: string]: any;
}

/**
 * Component with gesture recognition capabilities
 */
export interface GestureComponent extends BaseComponent {
  /**
   * Gesture manager instance
   */
  gestures: GestureManager;
  
  /**
   * Add a gesture event handler
   * @param eventType - Type of gesture event
   * @param handler - Event handler function
   * @returns GestureComponent for chaining
   */
  onGesture: (eventType: string, handler: GestureHandler) => GestureComponent;
  
  /**
   * Remove a gesture event handler
   * @param eventType - Type of gesture event
   * @param handler - Event handler function
   * @returns GestureComponent for chaining
   */
  offGesture: (eventType: string, handler: GestureHandler) => GestureComponent;
  
  /**
   * Check if a gesture type is supported on the current device
   * @param gestureType - Type of gesture to check
   * @returns Whether the gesture is supported
   */
  isGestureSupported: (gestureType: string) => boolean;
  
  /**
   * Enable gesture recognition
   * @returns GestureComponent for chaining
   */
  enableGestures: () => GestureComponent;
  
  /**
   * Disable gesture recognition
   * @returns GestureComponent for chaining
   */
  disableGestures: () => GestureComponent;
}

/**
 * Adds gesture recognition capabilities to a component
 * 
 * @param config - Configuration object containing gesture settings
 * @returns Function that enhances a component with gesture capabilities
 * 
 * @example
 * ```ts
 * // Add gesture recognition to a component
 * const component = pipe(
 *   createBase,
 *   withElement(...),
 *   withGesture({
 *     swipeThreshold: 50,
 *     gestureHandlers: {
 *       'tap': (e) => handleTap(e),
 *       'swipeleft': (e) => navigateForward(e),
 *       'swiperight': (e) => navigateBack(e)
 *     }
 *   })
 * )(config);
 * ```
 */
export const withGesture = (config: GestureFeatureConfig = {}) => 
  <C extends ElementComponent>(component: C): C & GestureComponent => {
    if (!component.element) {
      console.warn('Cannot add gesture recognition: missing element');
      return component as C & GestureComponent;
    }
    
    // Default configuration
    const { 
      enableGestures = true,
      gestureHandlers = {},
      ...gestureConfig 
    } = config;
    
    // Create gesture manager
    const gestureManager = createGestureManager(component.element, gestureConfig);
    
    // Add initial gesture handlers
    Object.entries(gestureHandlers).forEach(([eventType, handler]) => {
      gestureManager.on(eventType, handler);
    });
    
    // Enable/disable based on config
    if (!enableGestures) {
      gestureManager.disable();
    }
    
    // Connect with existing event system if available
    if ('emit' in component) {
      // Forward gesture events to the component's event system
      const forwardGestureEvents = (event: AnyGestureEvent) => {
        (component as any).emit(event.type, event);
      };
      
      // Register forwarder for common gesture types
      [
        'tap', 'swipe', 'swipeleft', 'swiperight', 'swipeup', 'swipedown',
        'longpress', 'pinch', 'rotate', 'pan'
      ].forEach(type => {
        gestureManager.on(type, forwardGestureEvents);
      });
    }
    
    // Handle lifecycle integration
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      
      component.lifecycle.destroy = () => {
        // Clean up gesture manager
        gestureManager.destroy();
        
        // Call original destroy method
        originalDestroy.call(component.lifecycle);
      };
    }
    
    // Create enhanced component
    return {
      ...component,
      gestures: gestureManager,
      
      /**
       * Add a gesture event handler
       * @param eventType - Type of gesture event
       * @param handler - Event handler function
       * @returns GestureComponent for chaining
       */
      onGesture(eventType: string, handler: GestureHandler) {
        gestureManager.on(eventType, handler);
        return this;
      },
      
      /**
       * Remove a gesture event handler
       * @param eventType - Type of gesture event
       * @param handler - Event handler function
       * @returns GestureComponent for chaining
       */
      offGesture(eventType: string, handler: GestureHandler) {
        gestureManager.off(eventType, handler);
        return this;
      },
      
      /**
       * Check if a gesture type is supported on the current device
       * @param gestureType - Type of gesture to check
       * @returns Whether the gesture is supported
       */
      isGestureSupported(gestureType: string) {
        return gestureManager.isSupported(gestureType);
      },
      
      /**
       * Enable gesture recognition
       * @returns GestureComponent for chaining
       */
      enableGestures() {
        gestureManager.enable();
        return this;
      },
      
      /**
       * Disable gesture recognition
       * @returns GestureComponent for chaining
       */
      disableGestures() {
        gestureManager.disable();
        return this;
      }
    };
  };

export default withGesture;