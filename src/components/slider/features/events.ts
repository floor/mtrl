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
      track = null, 
      thumb = null, 
      secondThumb = null 
    } = state.component.structure;
    
    if (!track || !thumb) {
      console.warn('Cannot set up event listeners: track or thumb is missing');
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
    
    // Track events
    track.addEventListener('mousedown', handleTrackMouseDown);
    track.addEventListener('touchstart', handleTrackMouseDown, { passive: false });
    
    // Thumb events
    thumb.addEventListener('mousedown', (e) => handleThumbMouseDown(e, false));
    thumb.addEventListener('touchstart', (e) => handleThumbMouseDown(e, false), { passive: false });
    thumb.addEventListener('keydown', (e) => handleKeyDown(e, false));
    thumb.addEventListener('focus', (e) => handleFocus(e, false));
    thumb.addEventListener('blur', (e) => handleBlur(e, false));
    
    // Second thumb events for range slider
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
      track = null, 
      thumb = null, 
      secondThumb = null 
    } = state.component.structure;
    
    if (!track || !thumb) {
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
    
    // Track events
    track.removeEventListener('mousedown', handleTrackMouseDown);
    track.removeEventListener('touchstart', handleTrackMouseDown);
    
    // Thumb events
    thumb.removeEventListener('mousedown', (e) => handleThumbMouseDown(e, false));
    thumb.removeEventListener('touchstart', (e) => handleThumbMouseDown(e, false));
    thumb.removeEventListener('keydown', (e) => handleKeyDown(e, false));
    thumb.removeEventListener('focus', (e) => handleFocus(e, false));
    thumb.removeEventListener('blur', (e) => handleBlur(e, false));
    
    // Second thumb events
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