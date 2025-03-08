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
    
    // Determine step size based on modifier keys
    if (e.shiftKey) {
      stepSize = step * 10; // Large step when Shift is pressed
    }
    
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newValue = Math.min(newValue + stepSize, state.max);
        break;
        
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newValue = Math.max(newValue - stepSize, state.min);
        break;
        
      case 'Home':
        e.preventDefault();
        newValue = state.min;
        break;
        
      case 'End':
        e.preventDefault();
        newValue = state.max;
        break;
        
      case 'PageUp':
        e.preventDefault();
        newValue = Math.min(newValue + (step * 10), state.max);
        break;
        
      case 'PageDown':
        e.preventDefault();
        newValue = Math.max(newValue - (step * 10), state.min);
        break;
        
      default:
        return; // Exit if not a handled key
    }
    
    // Show value bubble during keyboard interaction
    showValueBubble(isSecondThumb ? secondValueBubble : valueBubble, true);
    
    // Clear any existing hide timer
    if (state.valueHideTimer) {
      clearTimeout(state.valueHideTimer);
    }
    
    // Set timer to hide the value bubble after interaction
    state.valueHideTimer = setTimeout(() => {
      showValueBubble(isSecondThumb ? secondValueBubble : valueBubble, false);
    }, 1500);
    
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
    
    // Add a class to indicate keyboard focus
    const thumb = isSecondThumb ? secondThumb : state.component.structure.thumb;
    thumb.classList.add(`${state.component.getClass('slider-thumb')}--focused`);
    
    // Show value bubble
    showValueBubble(isSecondThumb ? secondValueBubble : valueBubble, true);
    
    // Trigger focus event
    triggerEvent(SLIDER_EVENTS.FOCUS, e);
  };
  
  const handleBlur = (e, isSecondThumb = false) => {
    // Remove keyboard focus class
    const thumb = isSecondThumb ? secondThumb : state.component.structure.thumb;
    thumb.classList.remove(`${state.component.getClass('slider-thumb')}--focused`);
    
    // Hide value bubble
    showValueBubble(isSecondThumb ? secondValueBubble : valueBubble, false);
    
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