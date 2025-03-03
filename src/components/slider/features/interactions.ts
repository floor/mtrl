// src/components/slider/features/interactions.ts
import { SLIDER_EVENTS, SLIDER_ORIENTATIONS } from '../constants';
import { SliderConfig, SliderEvent } from '../types';

/**
 * Add interaction event handlers to slider component
 * This function contains the core event handlers for mouse/touch interactions
 * 
 * @param config Slider configuration
 * @param state Slider state object
 * @param handlers Object containing handler methods
 * @returns Event handlers for slider interactions
 */
export const createInteractionHandlers = (config: SliderConfig, state, handlers) => {
  // Ensure state and handlers exist
  if (!state || !handlers) {
    console.error('Cannot create interaction handlers: state or handlers missing');
    return {
      handleThumbMouseDown: () => {},
      handleTrackMouseDown: () => {},
      handleMouseMove: () => {},
      handleMouseUp: () => {}
    };
  }
  
  // Get required elements from structure (with fallbacks)
  const {
    track = null, 
    thumb = null, 
    valueBubble = null, 
    secondThumb = null, 
    secondValueBubble = null
  } = state.component?.structure || {};
  
  // Get required handler methods (with fallbacks)
  const {
    getValueFromPosition = () => 0,
    roundToStep = value => value,
    clamp = (value, min, max) => value,
    showValueBubble = () => {},
    updateUi = () => {},
    triggerEvent = () => ({ defaultPrevented: false })
  } = handlers;
  
  // Event handlers
  const handleThumbMouseDown = (e, isSecondThumb = false) => {
    // Verify component exists and check if disabled
    if (!state.component || (state.component.disabled && state.component.disabled.isDisabled())) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    state.dragging = true;
    state.activeThumb = isSecondThumb ? secondThumb : thumb;
    state.activeBubble = isSecondThumb ? secondValueBubble : valueBubble;
    
    // Show value bubble if it exists
    if (state.activeBubble) {
      showValueBubble(state.activeBubble, true);
    }
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
    
    // Try to trigger start event (with error handling)
    try {
      triggerEvent(SLIDER_EVENTS.START, e);
    } catch (error) {
      console.warn('Error triggering START event:', error);
    }
  };
  
  const handleTrackMouseDown = (e) => {
    // Verify component exists and check if disabled
    if (!state.component || (state.component.disabled && state.component.disabled.isDisabled()) || !track) {
      return;
    }
    
    e.preventDefault();
    
    // Determine which thumb to move based on click position
    let isSecondThumb = false;
    
    try {
      // Get track rect for calculating position
      const trackRect = track.getBoundingClientRect();
      const isVertical = config.orientation === SLIDER_ORIENTATIONS.VERTICAL;
      
      // Get position from mouse or touch event
      const position = e.type.includes('touch')
        ? isVertical ? e.touches[0].clientY : e.touches[0].clientX
        : isVertical ? e.clientY : e.clientX;
      
      // Calculate value at click position
      let newValue = getValueFromPosition(position, isVertical);
      
      // Round to step if needed
      if (config.snapToSteps && state.step > 0) {
        newValue = roundToStep(newValue);
      }
      
      // Clamp value to min/max
      newValue = clamp(newValue, state.min, state.max);
      
      if (config.range && state.secondValue !== null) {
        // For range slider, determine which thumb to move (closest to click position)
        const distToFirst = Math.abs(newValue - state.value);
        const distToSecond = Math.abs(newValue - state.secondValue);
        
        isSecondThumb = distToSecond < distToFirst;
        
        // Update the appropriate value
        if (isSecondThumb) {
          state.secondValue = newValue;
        } else {
          state.value = newValue;
        }
      } else {
        // Single thumb slider - just update the value
        state.value = newValue;
      }
      
      // Update UI immediately
      updateUi();
      
      // Trigger events
      triggerEvent(SLIDER_EVENTS.INPUT, e);
      triggerEvent(SLIDER_EVENTS.CHANGE, e);
    } catch (error) {
      console.warn('Error handling track click:', error);
    }
    
    // Set active elements
    state.activeThumb = isSecondThumb ? secondThumb : thumb;
    state.activeBubble = isSecondThumb ? secondValueBubble : valueBubble;
    
    // Call thumb mouse down to start dragging
    handleThumbMouseDown(e, isSecondThumb);
  };
  
  const handleMouseMove = (e) => {
    if (!state.dragging || !state.activeThumb) return;
    
    e.preventDefault();
    
    try {
      // Get position
      const isVertical = config.orientation === SLIDER_ORIENTATIONS.VERTICAL;
      const position = e.type.includes('touch')
        ? isVertical ? e.touches[0].clientY : e.touches[0].clientX
        : isVertical ? e.clientY : e.clientX;
      
      // Calculate new value
      let newValue = getValueFromPosition(position, isVertical);
      
      // Round to step if needed
      if (config.snapToSteps && state.step > 0) {
        newValue = roundToStep(newValue);
      }
      
      // Clamp value to min/max
      newValue = clamp(newValue, state.min, state.max);
      
      // Check if this is the second thumb
      const isSecondThumb = state.activeThumb === secondThumb;
      
      // For range slider, ensure thumbs don't cross
      if (config.range && state.secondValue !== null) {
        if (isSecondThumb) {
          // Don't allow second thumb to go below first thumb
          if (newValue < state.value) {
            state.secondValue = newValue;
          } else {
            // Thumbs are crossed, swap them
            state.secondValue = state.value;
            state.value = newValue;
            
            // Swap active thumb and bubble
            state.activeThumb = thumb;
            state.activeBubble = valueBubble;
          }
        } else {
          // Don't allow first thumb to go above second thumb
          if (newValue > state.secondValue) {
            state.value = newValue;
          } else {
            // Thumbs are crossed, swap them
            state.value = state.secondValue;
            state.secondValue = newValue;
            
            // Swap active thumb and bubble
            state.activeThumb = secondThumb;
            state.activeBubble = secondValueBubble;
          }
        }
      } else {
        // Regular slider
        state.value = newValue;
      }
      
      // Update UI
      updateUi();
      
      // Trigger input event (continuously while dragging)
      triggerEvent(SLIDER_EVENTS.INPUT, e);
    } catch (error) {
      console.warn('Error during slider drag:', error);
    }
  };
  
  const handleMouseUp = (e) => {
    if (!state.dragging) return;
    
    e.preventDefault();
    
    state.dragging = false;
    
    // Hide value bubble
    if (state.activeBubble) {
      showValueBubble(state.activeBubble, false);
    }
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('touchend', handleMouseUp);
    
    // Reset active elements
    state.activeThumb = null;
    state.activeBubble = null;
    
    try {
      // Trigger change event (only when done dragging)
      triggerEvent(SLIDER_EVENTS.CHANGE, e);
      
      // Trigger end event
      triggerEvent(SLIDER_EVENTS.END, e);
    } catch (error) {
      console.warn('Error triggering events on mouse up:', error);
    }
  };
  
  // Return handlers
  return {
    handleThumbMouseDown,
    handleTrackMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};