// src/components/slider/features/interactions.ts
import { SLIDER_EVENTS } from '../constants';
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
    container = null,
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
  
  /**
   * Clear any existing bubble hide timers
   */
  const clearBubbleHideTimer = () => {
    if (state.valueHideTimer) {
      clearTimeout(state.valueHideTimer);
      state.valueHideTimer = null;
    }
  };
  
  /**
   * Hide all bubbles immediately
   */
  const hideAllBubbles = () => {
    // Clear any pending hide timers
    clearBubbleHideTimer();
    
    // Hide both bubbles immediately
    if (valueBubble) {
      showValueBubble(valueBubble, false);
    }
    if (secondValueBubble) {
      showValueBubble(secondValueBubble, false);
    }
  };
  
  /**
   * Clear keyboard focus indicators across all sliders in the document
   * Not just for this instance, but for any slider thumb
   */
  const clearGlobalKeyboardFocus = () => {
    // First clear local focus indicators
    if (thumb) {
      thumb.classList.remove(`${state.component.getClass('slider-thumb')}--focused`);
    }
    
    if (secondThumb) {
      secondThumb.classList.remove(`${state.component.getClass('slider-thumb')}--focused`);
    }
    
    // Now look for all slider thumbs in the document with the focused class
    // This covers cases where we switch between sliders
    try {
      const focusClass = state.component.getClass('slider-thumb--focused');
      const allFocusedThumbs = document.querySelectorAll(`.${focusClass}`);
      
      // Remove focus class from all thumbs
      allFocusedThumbs.forEach(element => {
        element.classList.remove(focusClass);
      });
      
      // Also blur the active element if it's a thumb
      if (document.activeElement && 
          document.activeElement.classList.contains(state.component.getClass('slider-thumb'))) {
        (document.activeElement as HTMLElement).blur();
      }
    } catch (error) {
      console.warn('Error clearing global keyboard focus:', error);
    }
  };
  
  /**
   * Show the active bubble with consistent behavior
   * @param bubble Bubble element to show
   */
  const showActiveBubble = (bubble) => {
    // First hide all bubbles
    hideAllBubbles();
    
    // Then show the active bubble if allowed by config
    if (bubble && config.showValue) {
      showValueBubble(bubble, true);
    }
  };
  
  /**
   * Hide the active bubble with optional delay
   * @param bubble Bubble element to hide
   * @param delay Delay in milliseconds before hiding
   */
  const hideActiveBubble = (bubble, delay = 0) => {
    // Clear any existing timers first
    clearBubbleHideTimer();
    
    if (!bubble || !config.showValue) return;
    
    if (delay > 0) {
      // Set delayed hide
      state.valueHideTimer = setTimeout(() => {
        showValueBubble(bubble, false);
      }, delay);
    } else {
      // Hide immediately
      showValueBubble(bubble, false);
    }
  };
  
  /**
   * Handle thumb mouse down with improved bubble handling
   */
  const handleThumbMouseDown = (e, isSecondThumb = false) => {
    // Verify component exists and check if disabled
    if (!state.component || (state.component.disabled && state.component.disabled.isDisabled())) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // First hide any existing visible bubbles
    hideAllBubbles();
    
    // Clear any keyboard focus indicators globally
    clearGlobalKeyboardFocus();
    
    state.dragging = true;
    state.activeThumb = isSecondThumb ? secondThumb : thumb;
    state.activeBubble = isSecondThumb ? secondValueBubble : valueBubble;
    
    // Add dragging class to component element to style the thumb differently
    state.component.element.classList.add(`${state.component.getClass('slider')}--dragging`);
    
    // Show active bubble
    showActiveBubble(state.activeBubble);
    
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
  
  /**
   * Handle track mouse down with improved bubble handling
   */
  const handleTrackMouseDown = (e) => {
    // Verify component exists and check if disabled
    if (!state.component || (state.component.disabled && state.component.disabled.isDisabled()) || !track || !container) {
      return;
    }
    
    e.preventDefault();
    
    // Hide any existing visible bubbles
    hideAllBubbles();
    
    // Clear any keyboard focus indicators globally
    clearGlobalKeyboardFocus();
    
    // Determine which thumb to move based on click position
    let isSecondThumb = false;
    
    try {
      // Get container rect for calculating position
      const containerRect = container.getBoundingClientRect();
      
      // Get position from mouse or touch event
      const position = e.type.includes('touch')
        ? e.touches[0].clientX
        : e.clientX;
      
      // Calculate value at click position
      let newValue = getValueFromPosition(position);
      
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
  
  /**
   * Handle mouse move with improved thumb and bubble switching
   */
  const handleMouseMove = (e) => {
    if (!state.dragging || !state.activeThumb || !container) return;
    
    e.preventDefault();
    
    try {
      // Get position
      const position = e.type.includes('touch')
        ? e.touches[0].clientX
        : e.clientX;
      
      // Calculate new value
      let newValue = getValueFromPosition(position);
      
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
          // Second thumb is active
          
          // Don't allow second thumb to go below first thumb
          if (newValue >= state.value) {
            state.secondValue = newValue;
          } else {
            // Thumbs are crossed, need to swap them
            
            // First hide current bubble
            hideActiveBubble(state.activeBubble, 0);
            
            // Swap values
            state.secondValue = state.value;
            state.value = newValue;
            
            // Swap active elements
            state.activeThumb = thumb;
            state.activeBubble = valueBubble;
            
            // Show new active bubble
            showActiveBubble(state.activeBubble);
          }
        } else {
          // First thumb is active
          
          // Don't allow first thumb to go above second thumb
          if (newValue <= state.secondValue) {
            state.value = newValue;
          } else {
            // Thumbs are crossed, need to swap them
            
            // First hide current bubble
            hideActiveBubble(state.activeBubble, 0);
            
            // Swap values
            state.value = state.secondValue;
            state.secondValue = newValue;
            
            // Swap active elements
            state.activeThumb = secondThumb;
            state.activeBubble = secondValueBubble;
            
            // Show new active bubble
            showActiveBubble(state.activeBubble);
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
  
  /**
   * Handle mouse up with consistent bubble hiding
   */
  const handleMouseUp = (e) => {
    if (!state.dragging) return;
    
    e.preventDefault();
    
    state.dragging = false;
    
    // Remove dragging class from component element
    state.component.element.classList.remove(`${state.component.getClass('slider')}--dragging`);
    
    // Hide bubble with delay
    const currentBubble = state.activeBubble;
    hideActiveBubble(currentBubble, 1000); // Hide after 1 second
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('touchend', handleMouseUp);
    
    // Reset active thumb
    state.activeThumb = null;
    
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