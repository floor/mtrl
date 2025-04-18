// src/components/slider/features/handlers.ts
import { SLIDER_EVENTS } from '../types';
import { SliderConfig, SliderEvent } from '../types';

/**
 * Create consolidated event handlers for slider component (mouse, touch, keyboard)
 * 
 * @param config Slider configuration
 * @param state Slider state object
 * @param uiRenderer UI renderer interface from controller
 * @param eventHelpers Event helper methods
 * @returns Event handlers for all slider interactions
 */
export const createHandlers = (config: SliderConfig, state, uiRenderer, eventHelpers) => {
  // Get required elements from structure (with fallbacks)
  const components = state.component?.components || {};
  
  // Extract needed components
  const {
    container = null,
    handle = null,
    track = null,
    valueBubble = null, 
    secondHandle = null, 
    secondValueBubble = null
  } = components;
  
  // Get required helper methods (with fallbacks)
  const {
    getValueFromPosition = () => 0,
    roundToStep = value => value,
    clamp = (value, min, max) => value,
    showValueBubble = () => {},
    render = () => {}
  } = uiRenderer;
  
  const { triggerEvent = () => ({ defaultPrevented: false }) } = eventHelpers;
  
  // Track whether a real drag has started
  let hasActualDragStarted = false;
  let initialX = 0;
  const DRAG_THRESHOLD = 3;
  
  // Last focused handle tracker for keyboard navigation
  let lastFocusedHandle = null;
  
  // Bubble management
  const clearBubbleHideTimer = () => {
    if (state.valueHideTimer) {
      clearTimeout(state.valueHideTimer);
      state.valueHideTimer = null;
    }
  };
  
  const hideAllBubbles = () => {
    clearBubbleHideTimer();
    if (valueBubble) showValueBubble(valueBubble, false);
    if (secondValueBubble) showValueBubble(secondValueBubble, false);
  };
  
  const showActiveBubble = (bubble) => {
    hideAllBubbles();
    if (bubble && config.showValue) showValueBubble(bubble, true);
  };
  
  const hideActiveBubble = (bubble, delay = 0) => {
    clearBubbleHideTimer();
    if (!bubble || !config.showValue) return;
    
    if (delay > 0) {
      state.valueHideTimer = setTimeout(() => {
        showValueBubble(bubble, false);
      }, delay);
    } else {
      showValueBubble(bubble, false);
    }
  };
  
  // Focus management
  const clearKeyboardFocus = () => {
    // Clear local focus indicators
    if (handle) handle.classList.remove(`${state.component.getClass('slider-handle')}--focused`);
    if (secondHandle) secondHandle.classList.remove(`${state.component.getClass('slider-handle')}--focused`);
    
    // Clear global focus indicators
    try {
      const focusClass = state.component.getClass('slider-handle--focused');
      document.querySelectorAll(`.${focusClass}`).forEach(el => {
        el.classList.remove(focusClass);
      });
      
      if (document.activeElement?.classList.contains(state.component.getClass('slider-handle'))) {
        (document.activeElement as HTMLElement).blur();
      }
    } catch (error) {
      console.warn('Error clearing keyboard focus:', error);
    }
  };
  
  /**
   * Handle mouse/touch down on a handle
   */
  const handleHandleMouseDown = (e, isSecondHandle = false) => {
    // Check if disabled
    if (!state.component || (state.component.disabled && state.component.disabled.isDisabled())) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    hideAllBubbles();
    clearKeyboardFocus();
    
    // Capture initial position
    initialX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    
    // Setup drag state
    state.dragging = false;
    hasActualDragStarted = false;
    state.activeHandle = isSecondHandle ? secondHandle : handle;
    state.activeBubble = isSecondHandle ? secondValueBubble : valueBubble;
    
    // Show bubble immediately
    showActiveBubble(state.activeBubble);
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
    
    render();
    triggerEvent(SLIDER_EVENTS.START, e);
  };
  
  /**
   * Handle mouse/touch down on the track
   */
  const handleTrackMouseDown = (e) => {
    // Check if disabled
    if (!state.component || (state.component.disabled && state.component.disabled.isDisabled()) || !track || !container) {
      return;
    }
    
    e.preventDefault();
    hideAllBubbles();
    clearKeyboardFocus();
    
    // Determine which handle to move
    let isSecondHandle = false;
    
    try {
      const containerRect = container.getBoundingClientRect();
      const position = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      
      // Calculate value at click position and apply constraints
      let newValue = getValueFromPosition(position);
      if (config.snapToSteps && state.step > 0) newValue = roundToStep(newValue);
      newValue = clamp(newValue, state.min, state.max);
      
      if (config.range && state.secondValue !== null) {
        // For range slider, move the closest handle
        const distToFirst = Math.abs(newValue - state.value);
        const distToSecond = Math.abs(newValue - state.secondValue);
        
        isSecondHandle = distToSecond < distToFirst;
        isSecondHandle ? (state.secondValue = newValue) : (state.value = newValue);
      } else {
        // Single handle slider - just update value
        state.value = newValue;
      }
      
      // Update UI and trigger events
      render();
      triggerEvent(SLIDER_EVENTS.INPUT, e);
    } catch (error) {
      console.warn('Error handling track click:', error);
    }
    
    // Set active elements
    state.activeHandle = isSecondHandle ? secondHandle : handle;
    state.activeBubble = isSecondHandle ? secondValueBubble : valueBubble;
    
    // Store the initial position and start dragging
    initialX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    handleHandleMouseDown(e, isSecondHandle);
  };
  
  /**
   * Handle mouse/touch move during drag
   */
  const handleMouseMove = (e) => {
    if (!state.activeHandle || !container) return;
    e.preventDefault();
    
    try {
      // Get current position
      const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      
      // Determine if we've started a real drag
      if (!hasActualDragStarted && Math.abs(currentX - initialX) >= DRAG_THRESHOLD) {
        hasActualDragStarted = true;
        state.dragging = true;
        state.component.element.classList.add(`${state.component.getClass('slider')}--dragging`);
      }
      
      // Calculate new value and apply constraints
      let newValue = getValueFromPosition(currentX);
      if (config.snapToSteps && state.step > 0) newValue = roundToStep(newValue);
      newValue = clamp(newValue, state.min, state.max);
      
      // Handle crossing points and handle swapping for range sliders
      const isSecondHandle = state.activeHandle === secondHandle;
      
      if (config.range && state.secondValue !== null) {
        if (isSecondHandle) {
          // Second handle is active
          if (newValue >= state.value) {
            state.secondValue = newValue;
          } else {
            // Handles are crossed, swap them
            hideActiveBubble(state.activeBubble, 0);
            state.secondValue = state.value;
            state.value = newValue;
            state.activeHandle = handle;
            state.activeBubble = valueBubble;
            showActiveBubble(state.activeBubble);
          }
        } else {
          // First handle is active
          if (newValue <= state.secondValue) {
            state.value = newValue;
          } else {
            // Handles are crossed, swap them
            hideActiveBubble(state.activeBubble, 0);
            state.value = state.secondValue;
            state.secondValue = newValue;
            state.activeHandle = secondHandle;
            state.activeBubble = secondValueBubble;
            showActiveBubble(state.activeBubble);
          }
        }
      } else {
        // Regular slider
        state.value = newValue;
      }
      
      render();
      triggerEvent(SLIDER_EVENTS.INPUT, e);
    } catch (error) {
      console.warn('Error during slider drag:', error);
    }
  };
  
  /**
   * Handle mouse/touch up after drag
   */
  const handleMouseUp = (e) => {
    if (!state.activeHandle) return;
    e.preventDefault();
    
    // Reset drag states
    state.dragging = false;
    hasActualDragStarted = false;
    state.component.element.classList.remove(`${state.component.getClass('slider')}--dragging`);
    
    // Hide bubble with delay
    hideActiveBubble(state.activeBubble, 1000);
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('touchend', handleMouseUp);
    
    // Reset active handle and update UI
    state.activeHandle = null;
    render();
    
    // Trigger events
    triggerEvent(SLIDER_EVENTS.CHANGE, e);
    triggerEvent(SLIDER_EVENTS.END, e);
  };
  
  /**
   * Handle keyboard input
   */
  const handleKeyDown = (e, isSecondHandle = false) => {
    if (state.component.disabled && state.component.disabled.isDisabled()) return;
    
    const step = state.step || 1;
    let newValue = isSecondHandle ? state.secondValue : state.value;
    let stepSize = e.shiftKey ? step * 10 : step;
    
    // Handle tab key separately
    if (e.key === 'Tab') return;
    
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
    state.activeBubble = isSecondHandle ? secondValueBubble : valueBubble;
    
    // Show value bubble during keyboard interaction
    showActiveBubble(state.activeBubble);
    
    // Update the value
    if (isSecondHandle) {
      state.secondValue = newValue;
    } else {
      state.value = newValue;
    }
    
    // Update UI and trigger events
    render();
    triggerEvent(SLIDER_EVENTS.INPUT, e);
    triggerEvent(SLIDER_EVENTS.CHANGE, e);
  };
  
  /**
   * Handle focus events
   */
  const handleFocus = (e, isSecondHandle = false) => {
    if (state.component.disabled && state.component.disabled.isDisabled()) return;
    
    // Track the currently focused handle
    const currentHandle = isSecondHandle ? secondHandle : handle;
    
    // Hide previous bubble if switching between handles
    if (lastFocusedHandle && lastFocusedHandle !== currentHandle) {
      hideAllBubbles();
    }
    
    lastFocusedHandle = currentHandle;
    
    // Add focus class and show bubble
    currentHandle.classList.add(`${state.component.getClass('slider-handle')}--focused`);
    showActiveBubble(isSecondHandle ? secondValueBubble : valueBubble);
    state.activeBubble = isSecondHandle ? secondValueBubble : valueBubble;
    
    triggerEvent(SLIDER_EVENTS.FOCUS, e);
  };
  
  /**
   * Handle blur events
   */
  const handleBlur = (e, isSecondHandle = false) => {
    const handleElement = isSecondHandle ? secondHandle : handle;
    handleElement.classList.remove(`${state.component.getClass('slider-handle')}--focused`);
    
    // Only hide bubble if not tabbing to another handle
    const relatedTarget = e.relatedTarget;
    const otherHandle = isSecondHandle ? handle : secondHandle;
    
    if (!relatedTarget || relatedTarget !== otherHandle) {
      hideActiveBubble(isSecondHandle ? secondValueBubble : valueBubble, 200);
    }
    
    triggerEvent(SLIDER_EVENTS.BLUR, e);
  };
  
  /**
   * Set up all event listeners
   */
  const setupEventListeners = () => {
    if (!state.component || !state.component.components) {
      console.warn('Cannot set up event listeners: missing component structure');
      return;
    }
    
    // Use container for track events instead of track for better UX
    container.addEventListener('mousedown', handleTrackMouseDown);
    container.addEventListener('touchstart', handleTrackMouseDown, { passive: false });
    
    // Handle events
    handle.addEventListener('mousedown', e => handleHandleMouseDown(e, false));
    handle.addEventListener('touchstart', e => handleHandleMouseDown(e, false), { passive: false });
    handle.addEventListener('keydown', e => handleKeyDown(e, false));
    handle.addEventListener('focus', e => handleFocus(e, false));
    handle.addEventListener('blur', e => handleBlur(e, false));
    
    // Second handle events for range slider
    if (config.range && secondHandle) {
      secondHandle.addEventListener('mousedown', e => handleHandleMouseDown(e, true));
      secondHandle.addEventListener('touchstart', e => handleHandleMouseDown(e, true), { passive: false });
      secondHandle.addEventListener('keydown', e => handleKeyDown(e, true));
      secondHandle.addEventListener('focus', e => handleFocus(e, true));
      secondHandle.addEventListener('blur', e => handleBlur(e, true));
    }
  };
  
  /**
   * Clean up all event listeners
   */
  const cleanupEventListeners = () => {
    if (!state.component || !state.component.components) return;
    
    // Clean up container listeners
    if (container) {
      container.removeEventListener('mousedown', handleTrackMouseDown);
      container.removeEventListener('touchstart', handleTrackMouseDown);
    }
    
    // Clean up handle listeners
    if (handle) {
      handle.removeEventListener('mousedown', e => handleHandleMouseDown(e, false));
      handle.removeEventListener('touchstart', e => handleHandleMouseDown(e, false));
      handle.removeEventListener('keydown', e => handleKeyDown(e, false));
      handle.removeEventListener('focus', e => handleFocus(e, false));
      handle.removeEventListener('blur', e => handleBlur(e, false));
    }
    
    // Clean up second handle listeners
    if (config.range && secondHandle) {
      secondHandle.removeEventListener('mousedown', e => handleHandleMouseDown(e, true));
      secondHandle.removeEventListener('touchstart', e => handleHandleMouseDown(e, true));
      secondHandle.removeEventListener('keydown', e => handleKeyDown(e, true));
      secondHandle.removeEventListener('focus', e => handleFocus(e, true));
      secondHandle.removeEventListener('blur', e => handleBlur(e, true));
    }
    
    // Clean up document listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('touchend', handleMouseUp);
  };
  
  // Return consolidated handlers
  return {
    // Mouse/Touch handlers
    handleHandleMouseDown,
    handleTrackMouseDown,
    handleMouseMove,
    handleMouseUp,
    
    // Keyboard handlers
    handleKeyDown,
    handleFocus,
    handleBlur,
    
    // Event management
    setupEventListeners,
    cleanupEventListeners,
    
    // Bubble management
    showActiveBubble,
    hideActiveBubble,
    hideAllBubbles,
    clearKeyboardFocus
  };
}