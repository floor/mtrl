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
      handleHandleMouseDown: () => {},
      handleTrackMouseDown: () => {},
      handleMouseMove: () => {},
      handleMouseUp: () => {}
    };
  }
  
  // Get required elements from structure (with fallbacks)
  const {
    container = null,
    track = null, 
    handle = null, 
    valueBubble = null, 
    secondHandle = null, 
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
   * Not just for this instance, but for any slider handle
   */
  const clearGlobalKeyboardFocus = () => {
    // First clear local focus indicators
    if (handle) {
      handle.classList.remove(`${state.component.getClass('slider-handle')}--focused`);
    }
    
    if (secondHandle) {
      secondHandle.classList.remove(`${state.component.getClass('slider-handle')}--focused`);
    }
    
    // Now look for all slider handles in the document with the focused class
    // This covers cases where we switch between sliders
    try {
      const focusClass = state.component.getClass('slider-handle--focused');
      const allFocusedHandles = document.querySelectorAll(`.${focusClass}`);
      
      // Remove focus class from all handles
      allFocusedHandles.forEach(element => {
        element.classList.remove(focusClass);
      });
      
      // Also blur the active element if it's a handle
      if (document.activeElement && 
          document.activeElement.classList.contains(state.component.getClass('slider-handle'))) {
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
  
  // Track whether a real drag has started
  let hasActualDragStarted = false;
  
  // Track the initial position on mousedown
  let initialX = 0;
  
  // Minimum distance to consider as a drag (in pixels)
  const DRAG_THRESHOLD = 3;
  
  /**
   * Handle handle mouse down with improved bubble handling
   */
  const handleHandleMouseDown = (e, isSecondHandle = false) => {
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
    
    // Capture initial mouse position but don't set dragging yet
    initialX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    
    // Only set ready-to-drag state
    state.dragging = false;
    hasActualDragStarted = false;
    
    state.activeHandle = isSecondHandle ? secondHandle : handle;
    state.activeBubble = isSecondHandle ? secondValueBubble : valueBubble;
    
    // Show active bubble immediately on mousedown
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
    
    // Determine which handle to move based on click position
    let isSecondHandle = false;
    
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
        // For range slider, determine which handle to move (closest to click position)
        const distToFirst = Math.abs(newValue - state.value);
        const distToSecond = Math.abs(newValue - state.secondValue);
        
        isSecondHandle = distToSecond < distToFirst;
        
        // Update the appropriate value
        if (isSecondHandle) {
          state.secondValue = newValue;
        } else {
          state.value = newValue;
        }
      } else {
        // Single handle slider - just update the value
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
    state.activeHandle = isSecondHandle ? secondHandle : handle;
    state.activeBubble = isSecondHandle ? secondValueBubble : valueBubble;
    
    // Store the initial position for drag detection
    initialX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    
    // Call handle mouse down to start dragging
    handleHandleMouseDown(e, isSecondHandle);
  };
  
  /**
   * Handle mouse move with improved handle and bubble switching
   */
  const handleMouseMove = (e) => {
    if (!state.activeHandle || !container) return;
    
    e.preventDefault();
    
    try {
      // Get current position
      const currentX = e.type.includes('touch')
        ? e.touches[0].clientX
        : e.clientX;
      
      // Check if we've moved enough to consider it a drag
      if (!hasActualDragStarted && Math.abs(currentX - initialX) >= DRAG_THRESHOLD) {
        // Now we're officially dragging
        hasActualDragStarted = true;
        state.dragging = true;
        
        // Add dragging class to component element to style the handle differently
        // This only happens after the user has moved the handle by the threshold amount
        state.component.element.classList.add(`${state.component.getClass('slider')}--dragging`);
      }
      
      // Calculate new value
      let newValue = getValueFromPosition(currentX);
      
      // Round to step if needed
      if (config.snapToSteps && state.step > 0) {
        newValue = roundToStep(newValue);
      }
      
      // Clamp value to min/max
      newValue = clamp(newValue, state.min, state.max);
      
      // Check if this is the second handle
      const isSecondHandle = state.activeHandle === secondHandle;
      
      // For range slider, ensure handles don't cross
      if (config.range && state.secondValue !== null) {
        if (isSecondHandle) {
          // Second handle is active
          
          // Don't allow second handle to go below first handle
          if (newValue >= state.value) {
            state.secondValue = newValue;
          } else {
            // Handles are crossed, need to swap them
            
            // First hide current bubble
            hideActiveBubble(state.activeBubble, 0);
            
            // Swap values
            state.secondValue = state.value;
            state.value = newValue;
            
            // Swap active elements
            state.activeHandle = handle;
            state.activeBubble = valueBubble;
            
            // Show new active bubble
            showActiveBubble(state.activeBubble);
          }
        } else {
          // First handle is active
          
          // Don't allow first handle to go above second handle
          if (newValue <= state.secondValue) {
            state.value = newValue;
          } else {
            // Handles are crossed, need to swap them
            
            // First hide current bubble
            hideActiveBubble(state.activeBubble, 0);
            
            // Swap values
            state.value = state.secondValue;
            state.secondValue = newValue;
            
            // Swap active elements
            state.activeHandle = secondHandle;
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
    if (!state.activeHandle) return;
    
    e.preventDefault();
    
    // Reset drag states
    state.dragging = false;
    hasActualDragStarted = false;
    
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
    
    // Reset active handle
    state.activeHandle = null;
    
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
    handleHandleMouseDown,
    handleTrackMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};