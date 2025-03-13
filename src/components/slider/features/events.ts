// src/components/slider/features/events.ts
import { SliderEvent } from '../types';

/**
 * Create event helper functions for the slider component
 * 
 * @param state Slider state object
 * @returns Event helper methods
 */
export const createEventHelpers = (state) => {
  /**
   * Triggers a slider event
   * @param eventName Name of the event to trigger
   * @param originalEvent Original DOM event if applicable
   * @returns Event data object
   */
  const triggerEvent = (eventName, originalEvent = null) => {
    // Create event data object
    const eventData: SliderEvent = {
      slider: state.component,
      value: state.value,
      secondValue: state.secondValue,
      originalEvent,
      preventDefault: () => { eventData.defaultPrevented = true; },
      defaultPrevented: false
    };
    
    // Add a component events facade if it doesn't exist
    if (!state.component.events) {
      state.component.events = {
        trigger: () => {},
        on: () => {},
        off: () => {}
      };
    }
    
    // Now we can safely trigger the event
    state.component.events.trigger(eventName, eventData);
    
    return eventData;
  };
  
  /**
   * Set up event listeners for slider elements
   * @param interactionHandlers Mouse/touch interaction handlers
   * @param keyboardHandlers Keyboard interaction handlers
   */
  const setupEventListeners = (interactionHandlers, keyboardHandlers) => {
    // Ensure needed component parts exist
    if (!state.component || !state.component.structure) {
      console.warn('Cannot set up event listeners: component structure is missing');
      return;
    }
    
    const { 
      container = null,
      track = null, 
      handle = null, 
      secondThumb = null 
    } = state.component.structure;
    
    if (!container || !track || !handle) {
      console.warn('Cannot set up event listeners: container, track, or handle is missing');
      return;
    }
    
    const {
      handleThumbMouseDown,
      handleTrackMouseDown
    } = interactionHandlers;
    
    const {
      handleKeyDown,
      handleFocus,
      handleBlur
    } = keyboardHandlers;
    
    // Track events - using the container instead of track for better UX
    container.addEventListener('mousedown', handleTrackMouseDown);
    container.addEventListener('touchstart', handleTrackMouseDown, { passive: false });
    
    // Thumb events
    handle.addEventListener('mousedown', (e) => handleThumbMouseDown(e, false));
    handle.addEventListener('touchstart', (e) => handleThumbMouseDown(e, false), { passive: false });
    handle.addEventListener('keydown', (e) => handleKeyDown(e, false));
    handle.addEventListener('focus', (e) => handleFocus(e, false));
    handle.addEventListener('blur', (e) => handleBlur(e, false));
    
    // Second handle events for range slider
    if (state.component.config && state.component.config.range && secondThumb) {
      secondThumb.addEventListener('mousedown', (e) => handleThumbMouseDown(e, true));
      secondThumb.addEventListener('touchstart', (e) => handleThumbMouseDown(e, true), { passive: false });
      secondThumb.addEventListener('keydown', (e) => handleKeyDown(e, true));
      secondThumb.addEventListener('focus', (e) => handleFocus(e, true));
      secondThumb.addEventListener('blur', (e) => handleBlur(e, true));
    }
  };
  
  /**
   * Clean up event listeners
   * @param interactionHandlers Mouse/touch interaction handlers
   * @param keyboardHandlers Keyboard interaction handlers
   */
  const cleanupEventListeners = (interactionHandlers, keyboardHandlers) => {
    // Ensure needed component parts exist
    if (!state.component || !state.component.structure) {
      return;
    }
    
    const { 
      container = null,
      track = null, 
      handle = null, 
      secondThumb = null 
    } = state.component.structure;
    
    if (!container || !track || !handle) {
      return;
    }
    
    const {
      handleThumbMouseDown,
      handleTrackMouseDown,
      handleMouseMove,
      handleMouseUp
    } = interactionHandlers;
    
    const {
      handleKeyDown,
      handleFocus,
      handleBlur
    } = keyboardHandlers;
    
    // Track events - using container instead of track
    container.removeEventListener('mousedown', handleTrackMouseDown);
    container.removeEventListener('touchstart', handleTrackMouseDown);
    
    // Thumb events
    handle.removeEventListener('mousedown', (e) => handleThumbMouseDown(e, false));
    handle.removeEventListener('touchstart', (e) => handleThumbMouseDown(e, false));
    handle.removeEventListener('keydown', (e) => handleKeyDown(e, false));
    handle.removeEventListener('focus', (e) => handleFocus(e, false));
    handle.removeEventListener('blur', (e) => handleBlur(e, false));
    
    // Second handle events
    if (state.component.config && state.component.config.range && secondThumb) {
      secondThumb.removeEventListener('mousedown', (e) => handleThumbMouseDown(e, true));
      secondThumb.removeEventListener('touchstart', (e) => handleThumbMouseDown(e, true));
      secondThumb.removeEventListener('keydown', (e) => handleKeyDown(e, true));
      secondThumb.removeEventListener('focus', (e) => handleFocus(e, true));
      secondThumb.removeEventListener('blur', (e) => handleBlur(e, true));
    }
    
    // Global events
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('touchend', handleMouseUp);
  };
  
  return {
    triggerEvent,
    setupEventListeners,
    cleanupEventListeners
  };
};