// src/components/slider/features/slider.ts - fix initialization issue
import { SLIDER_EVENTS } from '../constants';
import { SliderConfig } from '../types';
import { createUiHelpers } from './ui';
import { createInteractionHandlers } from './interactions';
import { createKeyboardHandlers } from './keyboard';
import { createEventHelpers } from './events';

/**
 * Add main slider functionality to component
 * @param config Slider configuration
 * @returns Component enhancer with slider functionality
 */
export const withSlider = (config: SliderConfig) => component => {
  // Ensure component has events
  if (!component.events) {
    component.events = {
      listeners: {},
      on: function(event, handler) {
        if (!this.listeners[event]) {
          this.listeners[event] = [];
        }
        this.listeners[event].push(handler);
        return this;
      },
      off: function(event, handler) {
        if (this.listeners[event]) {
          this.listeners[event] = this.listeners[event].filter(h => h !== handler);
        }
        return this;
      },
      trigger: function(event, data) {
        if (this.listeners[event]) {
          this.listeners[event].forEach(handler => handler(data));
        }
        return this;
      }
    };
  }
  
  // Initialize state
  const state = {
    value: config.value !== undefined ? config.value : 0,
    secondValue: config.secondValue !== undefined ? config.secondValue : null,
    min: config.min !== undefined ? config.min : 0,
    max: config.max !== undefined ? config.max : 100,
    step: config.step !== undefined ? config.step : 1,
    dragging: false,
    activeBubble: null,
    activeThumb: null,
    ticks: [],
    tickLabels: [],
    component
  };
  
  // Create helper functions
  const uiHelpers = createUiHelpers(config, state);
  const eventHelpers = createEventHelpers(state);
  
  // Combine helpers for event handlers
  const handlers = {
    ...uiHelpers,
    triggerEvent: eventHelpers.triggerEvent
  };
  
  // Create event handlers
  const interactionHandlers = createInteractionHandlers(config, state, handlers);
  const keyboardHandlers = createKeyboardHandlers(state, handlers);
  
  // Initialize slider
  const initSlider = () => {
    // Set ARIA attributes
    component.element.setAttribute('aria-valuemin', String(state.min));
    component.element.setAttribute('aria-valuemax', String(state.max));
    component.element.setAttribute('aria-valuenow', String(state.value));
    
    const { thumb, secondThumb } = component.structure;
    
    thumb.setAttribute('aria-valuemin', String(state.min));
    thumb.setAttribute('aria-valuemax', String(state.max));
    thumb.setAttribute('aria-valuenow', String(state.value));
    
    if (config.range && secondThumb && state.secondValue !== null) {
      secondThumb.setAttribute('aria-valuemin', String(state.min));
      secondThumb.setAttribute('aria-valuemax', String(state.max));
      secondThumb.setAttribute('aria-valuenow', String(state.secondValue));
    }
    
    // Setup initial positions - ensure this happens synchronously during initialization
    uiHelpers.updateThumbPositions();
    uiHelpers.updateActiveTrack();
    uiHelpers.updateRemainingTrack(); // Explicitly call during initialization
    uiHelpers.updateValueBubbles();
    
    // Generate ticks if needed
    if (config.ticks || config.tickLabels) {
      uiHelpers.generateTicks();
      uiHelpers.updateTicks();
    }
    
    // Setup event listeners
    eventHelpers.setupEventListeners(interactionHandlers, keyboardHandlers);
  };
  
  // Cleanup event listeners
  const cleanup = () => {
    eventHelpers.cleanupEventListeners(interactionHandlers, keyboardHandlers);
  };
  
  // Register with lifecycle
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    component.lifecycle.destroy = () => {
      cleanup();
      originalDestroy();
    };
  }
  
  // Initialize slider
  initSlider();
  
  // Return enhanced component
  return {
    ...component,
    slider: {
      /**
       * Sets slider value
       * @param value New value
       * @param triggerEvent Whether to trigger change event
       */
      setValue(value, triggerEvent = true) {
        // Validate and set value
        const newValue = uiHelpers.clamp(value, state.min, state.max);
        state.value = newValue;
        
        // Update UI
        uiHelpers.updateUi();
        
        // Trigger events if needed
        if (triggerEvent) {
          eventHelpers.triggerEvent(SLIDER_EVENTS.CHANGE);
        }
        
        return this;
      },
      
      /**
       * Gets slider value
       * @returns Current value
       */
      getValue() {
        return state.value;
      },
      
      /**
       * Sets secondary slider value (for range slider)
       * @param value New secondary value
       * @param triggerEvent Whether to trigger change event
       */
      setSecondValue(value, triggerEvent = true) {
        if (!config.range) return this;
        
        // Validate and set value
        const newValue = uiHelpers.clamp(value, state.min, state.max);
        state.secondValue = newValue;
        
        // Update UI
        uiHelpers.updateUi();
        
        // Trigger events if needed
        if (triggerEvent) {
          eventHelpers.triggerEvent(SLIDER_EVENTS.CHANGE);
        }
        
        return this;
      },
      
      /**
       * Gets secondary slider value
       * @returns Current secondary value or null
       */
      getSecondValue() {
        return config.range ? state.secondValue : null;
      },
      
      /**
       * Sets slider minimum value
       * @param min New minimum value
       */
      setMin(min) {
        state.min = min;
        
        // Update ARIA attributes
        component.element.setAttribute('aria-valuemin', String(min));
        component.structure.thumb.setAttribute('aria-valuemin', String(min));
        
        if (config.range && component.structure.secondThumb) {
          component.structure.secondThumb.setAttribute('aria-valuemin', String(min));
        }
        
        // Clamp values to new min
        if (state.value < min) {
          state.value = min;
        }
        
        if (config.range && state.secondValue !== null && state.secondValue < min) {
          state.secondValue = min;
        }
        
        // Regenerate ticks if needed
        if (config.ticks || config.tickLabels) {
          uiHelpers.generateTicks();
        }
        
        // Update UI
        uiHelpers.updateUi();
        
        return this;
      },
      
      /**
       * Gets slider minimum value
       * @returns Current minimum value
       */
      getMin() {
        return state.min;
      },
      
      /**
       * Sets slider maximum value
       * @param max New maximum value
       */
      setMax(max) {
        state.max = max;
        
        // Update ARIA attributes
        component.element.setAttribute('aria-valuemax', String(max));
        component.structure.thumb.setAttribute('aria-valuemax', String(max));
        
        if (config.range && component.structure.secondThumb) {
          component.structure.secondThumb.setAttribute('aria-valuemax', String(max));
        }
        
        // Clamp values to new max
        if (state.value > max) {
          state.value = max;
        }
        
        if (config.range && state.secondValue !== null && state.secondValue > max) {
          state.secondValue = max;
        }
        
        // Regenerate ticks if needed
        if (config.ticks || config.tickLabels) {
          uiHelpers.generateTicks();
        }
        
        // Update UI
        uiHelpers.updateUi();
        
        return this;
      },
      
      /**
       * Gets slider maximum value
       * @returns Current maximum value
       */
      getMax() {
        return state.max;
      },
      
      /**
       * Sets slider step size
       * @param step New step size
       */
      setStep(step) {
        state.step = step;
        
        // Add or remove discrete class
        if (step > 0) {
          component.element.classList.add(`${component.getClass('slider')}--discrete`);
        } else {
          component.element.classList.remove(`${component.getClass('slider')}--discrete`);
        }
        
        // Regenerate ticks if needed
        if (config.ticks || config.tickLabels) {
          uiHelpers.generateTicks();
          uiHelpers.updateTicks();
        }
        
        return this;
      },
      
      /**
       * Gets slider step size
       * @returns Current step size
       */
      getStep() {
        return state.step;
      },
      
      /**
       * Regenerate tick marks and labels
       */
      regenerateTicks() {
        uiHelpers.generateTicks();
        uiHelpers.updateTicks();
        return this;
      }
    }
  };
};