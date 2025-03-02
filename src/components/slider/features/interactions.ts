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
  const {
    track, 
    thumb, 
    valueBubble, 
    secondThumb, 
    secondValueBubble
  } = state.component.structure;
  
  const {
    getValueFromPosition,
    roundToStep,
    clamp,
    showValueBubble,
    updateUi,
    triggerEvent
  } = handlers;
  
  // Event handlers
  const handleThumbMouseDown = (e, isSecondThumb = false) => {
    if (state.component.disabled && state.component.disabled.isDisabled()) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    state.dragging = true;
    state.activeThumb = isSecondThumb ? secondThumb : thumb;
    state.activeBubble = isSecondThumb ? secondValueBubble : valueBubble;
    
    // Show value bubble
    showValueBubble(state.activeBubble, true);
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
    
    // Trigger start event
    triggerEvent(SLIDER_EVENTS.START, e);
  };
  
  const handleTrackMouseDown = (e) => {
    if (state.component.disabled && state.component.disabled.isDisabled()) return;
    
    e.preventDefault();
    
    // Determine which thumb to move based on click position
    let isSecondThumb = false;
    
    if (config.range && state.secondValue !== null) {
      // For range slider, move the closest thumb
      const trackRect = track.getBoundingClientRect();
      const clickPosition = config.orientation === SLIDER_ORIENTATIONS.VERTICAL
        ? e.clientY
        : e.clientX;
      
      const clickValue = getValueFromPosition(clickPosition, config.orientation === SLIDER_ORIENTATIONS.VERTICAL);
      
      // Determine which thumb is closer to the click position
      const distToFirst = Math.abs(clickValue - state.value);
      const distToSecond = Math.abs(clickValue - state.secondValue);
      
      isSecondThumb = distToSecond < distToFirst;
    }
    
    state.activeThumb = isSecondThumb ? secondThumb : thumb;
    state.activeBubble = isSecondThumb ? secondValueBubble : valueBubble;
    
    // Update value based on click position
    handleMouseMove(e);
    
    // Call thumb mouse down to start dragging
    handleThumbMouseDown(e, isSecondThumb);
  };
  
  const handleMouseMove = (e) => {
    if (!state.dragging || !state.activeThumb) return;
    
    e.preventDefault();
    
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
  };
  
  const handleMouseUp = (e) => {
    if (!state.dragging) return;
    
    e.preventDefault();
    
    state.dragging = false;
    
    // Hide value bubble
    showValueBubble(state.activeBubble, false);
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('touchend', handleMouseUp);
    
    // Reset active elements
    state.activeThumb = null;
    state.activeBubble = null;
    
    // Trigger change event (only when done dragging)
    triggerEvent(SLIDER_EVENTS.CHANGE, e);
    
    // Trigger end event
    triggerEvent(SLIDER_EVENTS.END, e);
  };
  
  // Return handlers
  return {
    handleThumbMouseDown,
    handleTrackMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};