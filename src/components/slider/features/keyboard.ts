// src/components/slider/features/keyboard.ts
import { SLIDER_EVENTS } from '../constants';

/**
 * Add keyboard interaction handlers to slider component
 * 
 * @param state Slider state object
 * @param handlers Object containing handler methods
 * @returns Event handlers for keyboard interactions
 */
export const createKeyboardHandlers = (state, handlers) => {
  const {
    secondThumb,
    secondValueBubble,
    valueBubble
  } = state.component.structure;
  
  const {
    showValueBubble,
    updateUi,
    triggerEvent
  } = handlers;
  
  // Last focused handle tracker to handle tab sequences properly
  let lastFocusedThumb = null;
  
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
   * Shows a bubble element with consistent behavior
   */
  const showBubble = (bubble) => {
    // First hide all bubbles
    hideAllBubbles();
    
    // Then show the active bubble
    if (bubble) {
      showValueBubble(bubble, true);
    }
  };
  
  /**
   * Hides a bubble element with optional delay
   */
  const hideBubble = (bubble, delay = 0) => {
    // Clear any existing timers
    clearBubbleHideTimer();
    
    if (!bubble) return;
    
    if (delay > 0) {
      state.valueHideTimer = setTimeout(() => {
        showValueBubble(bubble, false);
      }, delay);
    } else {
      showValueBubble(bubble, false);
    }
  };
  
  // Event handlers
  const handleKeyDown = (e, isSecondThumb = false) => {
    if (state.component.disabled && state.component.disabled.isDisabled()) return;
    
    const step = state.step || 1;
    let newValue;
    let stepSize = step;
    
    // Determine which value to modify
    if (isSecondThumb) {
      newValue = state.secondValue;
    } else {
      newValue = state.value;
    }
    
    // Handle tab key specifically for range sliders
    if (e.key === 'Tab') {
      // Let the browser handle the tab navigation
      // We'll deal with showing/hiding bubbles in the focus/blur handlers
      return;
    }
    
    // Determine step size based on modifier keys
    if (e.shiftKey) {
      stepSize = step * 10; // Large step when Shift is pressed
    }
    
    let valueChanged = false;
    
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newValue = Math.min(newValue + stepSize, state.max);
        valueChanged = true;
        break;
        
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newValue = Math.max(newValue - stepSize, state.min);
        valueChanged = true;
        break;
        
      case 'Home':
        e.preventDefault();
        newValue = state.min;
        valueChanged = true;
        break;
        
      case 'End':
        e.preventDefault();
        newValue = state.max;
        valueChanged = true;
        break;
        
      case 'PageUp':
        e.preventDefault();
        newValue = Math.min(newValue + (step * 10), state.max);
        valueChanged = true;
        break;
        
      case 'PageDown':
        e.preventDefault();
        newValue = Math.max(newValue - (step * 10), state.min);
        valueChanged = true;
        break;
        
      default:
        return; // Exit if not a handled key
    }
    
    if (!valueChanged) return;
    
    // Update active bubble reference
    state.activeBubble = isSecondThumb ? secondValueBubble : valueBubble;
    
    // Show value bubble during keyboard interaction
    showBubble(state.activeBubble);
    
    // Update the value
    if (isSecondThumb) {
      state.secondValue = newValue;
    } else {
      state.value = newValue;
    }
    
    // Update UI
    updateUi();
    
    // Trigger events
    triggerEvent(SLIDER_EVENTS.INPUT, e);
    triggerEvent(SLIDER_EVENTS.CHANGE, e);
  };
  
  const handleFocus = (e, isSecondThumb = false) => {
    if (state.component.disabled && state.component.disabled.isDisabled()) return;
    
    // Track the currently focused handle for tab sequence handling
    const currentThumb = isSecondThumb ? secondThumb : state.component.structure.handle;
    
    // If we're tabbing between handles, hide the previous bubble immediately
    if (lastFocusedThumb && lastFocusedThumb !== currentThumb) {
      hideAllBubbles();
    }
    
    // Update the last focused handle
    lastFocusedThumb = currentThumb;
    
    // Add a class to indicate keyboard focus
    currentThumb.classList.add(`${state.component.getClass('slider-handle')}--focused`);
    
    // Show value bubble on focus
    const bubble = isSecondThumb ? secondValueBubble : valueBubble;
    showBubble(bubble);
    
    // Update active bubble reference
    state.activeBubble = bubble;
    
    // Trigger focus event
    triggerEvent(SLIDER_EVENTS.FOCUS, e);
  };
  
  const handleBlur = (e, isSecondThumb = false) => {
    // Remove keyboard focus class
    const handle = isSecondThumb ? secondThumb : state.component.structure.handle;
    handle.classList.remove(`${state.component.getClass('slider-handle')}--focused`);
    
    // Only hide the bubble if we're not tabbing to another handle
    // This check prevents the bubble from flickering when tabbing between handles
    const relatedTarget = e.relatedTarget;
    const otherThumb = isSecondThumb ? state.component.structure.handle : secondThumb;
    
    if (!relatedTarget || relatedTarget !== otherThumb) {
      // We're not tabbing to the other handle, so we can hide the bubble
      const bubble = isSecondThumb ? secondValueBubble : valueBubble;
      hideBubble(bubble, 200);
    }
    
    // Trigger blur event
    triggerEvent(SLIDER_EVENTS.BLUR, e);
  };
  
  // Return handlers
  return {
    handleKeyDown,
    handleFocus,
    handleBlur
  };
};