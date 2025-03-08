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
    
    // Determine which value to modify
    if (isSecondThumb) {
      newValue = state.secondValue;
    } else {
      newValue = state.value;
    }
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newValue = Math.min(newValue + step, state.max);
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        newValue = Math.max(newValue - step, state.min);
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
    
    // Show value bubble
    showValueBubble(isSecondThumb ? secondValueBubble : valueBubble, true);
    
    // Trigger focus event
    triggerEvent(SLIDER_EVENTS.FOCUS, e);
  };
  
  const handleBlur = (e, isSecondThumb = false) => {
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