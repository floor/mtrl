// src/components/slider/features/slider.ts
import { SLIDER_EVENTS } from '../constants';
import { SliderConfig } from '../types';
import { createUiHelpers } from './ui';
import { createHandlers } from './handlers';

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
      on(event, handler) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(handler);
        return this;
      },
      off(event, handler) {
        if (this.listeners[event]) {
          this.listeners[event] = this.listeners[event].filter(h => h !== handler);
        }
        return this;
      },
      trigger(event, data) {
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
    activeHandle: null,
    ticks: [],
    valueHideTimer: null,
    component
  };
  
  // Create event helpers
  const eventHelpers = {
    triggerEvent(eventName, originalEvent = null) {
      const eventData = {
        slider: state.component,
        value: state.value,
        secondValue: state.secondValue,
        originalEvent,
        preventDefault: () => { eventData.defaultPrevented = true; },
        defaultPrevented: false
      };
      
      state.component.events.trigger(eventName, eventData);
      return eventData;
    }
  };
  
  // Create UI helpers and handlers
  const uiHelpers = createUiHelpers(config, state);
  const handlers = createHandlers(config, state, uiHelpers, eventHelpers);
  
  // Initialize slider
  const initSlider = () => {
    // Set ARIA attributes
    component.element.setAttribute('aria-valuemin', String(state.min));
    component.element.setAttribute('aria-valuemax', String(state.max));
    component.element.setAttribute('aria-valuenow', String(state.value));
    
    if (!component.structure) {
      console.warn('Cannot initialize slider: missing structure');
      return;
    }
    
    const { handle, secondHandle } = component.structure;
    
    if (handle) {
      handle.setAttribute('aria-valuemin', String(state.min));
      handle.setAttribute('aria-valuemax', String(state.max));
      handle.setAttribute('aria-valuenow', String(state.value));
      
      if (config.range && secondHandle && state.secondValue !== null) {
        secondHandle.setAttribute('aria-valuemin', String(state.min));
        secondHandle.setAttribute('aria-valuemax', String(state.max));
        secondHandle.setAttribute('aria-valuenow', String(state.secondValue));
      }
    }
    
    // Initial UI update
    uiHelpers.updateUi();
    
    // Generate ticks if needed
    if (config.ticks || config.tickLabels) {
      uiHelpers.generateTicks();
    }
    
    // Setup event listeners
    handlers.setupEventListeners();
    
    // Force one more UI update after a delay to ensure proper positioning
    setTimeout(() => {
      uiHelpers.updateUi();
    }, 50);
  };
  
  // Register with lifecycle if available
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    component.lifecycle.destroy = () => {
      handlers.cleanupEventListeners();
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
       * @returns Slider controller for chaining
       */
      setValue(value, triggerEvent = true) {
        const newValue = uiHelpers.clamp(value, state.min, state.max);
        state.value = newValue;
        uiHelpers.updateUi();
        
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
       * @returns Slider controller for chaining
       */
      setSecondValue(value, triggerEvent = true) {
        if (!config.range) return this;
        
        const newValue = uiHelpers.clamp(value, state.min, state.max);
        state.secondValue = newValue;
        uiHelpers.updateUi();
        
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
       * @returns Slider controller for chaining
       */
      setMin(min) {
        state.min = min;
        
        // Update ARIA attributes
        component.element.setAttribute('aria-valuemin', String(min));
        if (component.structure.handle) {
          component.structure.handle.setAttribute('aria-valuemin', String(min));
        }
        
        if (config.range && component.structure.secondHandle) {
          component.structure.secondHandle.setAttribute('aria-valuemin', String(min));
        }
        
        // Clamp values to new min
        if (state.value < min) state.value = min;
        if (config.range && state.secondValue !== null && state.secondValue < min) {
          state.secondValue = min;
        }
        
        // Regenerate ticks if needed
        if (config.ticks || config.tickLabels) {
          uiHelpers.generateTicks();
        }
        
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
       * @returns Slider controller for chaining
       */
      setMax(max) {
        state.max = max;
        
        // Update ARIA attributes
        component.element.setAttribute('aria-valuemax', String(max));
        if (component.structure.handle) {
          component.structure.handle.setAttribute('aria-valuemax', String(max));
        }
        
        if (config.range && component.structure.secondHandle) {
          component.structure.secondHandle.setAttribute('aria-valuemax', String(max));
        }
        
        // Clamp values to new max
        if (state.value > max) state.value = max;
        if (config.range && state.secondValue !== null && state.secondValue > max) {
          state.secondValue = max;
        }
        
        // Regenerate ticks if needed
        if (config.ticks || config.tickLabels) {
          uiHelpers.generateTicks();
        }
        
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
       * @returns Slider controller for chaining
       */
      setStep(step) {
        state.step = step;
        
        // Add or remove discrete class
        component.element.classList[step > 0 ? 'add' : 'remove'](
          `${component.getClass('slider')}--discrete`
        );
        
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
       * @returns Slider controller for chaining
       */
      regenerateTicks() {
        uiHelpers.generateTicks();
        uiHelpers.updateTicks();
        return this;
      },
      
      /**
       * Update all UI elements
       * @returns Slider controller for chaining
       */
      updateUi() {
        uiHelpers.updateUi();
        return this;
      }
    }
  };
};