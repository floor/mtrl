// src/components/slider/features/controller.ts
import { SLIDER_EVENTS } from '../types';
import { SliderConfig } from '../types';
import { createHandlers } from './handlers';

/**
 * Add controller functionality to slider component
 * Manages state, events, user interactions, and UI rendering
 * 
 * @param config Slider configuration
 * @returns Component enhancer with slider controller functionality
 */
export const withController = (config: SliderConfig) => component => {
  // Ensure component has required properties
  if (!component.element || !component.components) {
    console.warn('Cannot initialize slider controller: missing element or components');
    return component;
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
    component,
    // For centered slider animations
    previousValue: config.value !== undefined ? config.value : 0,
    isAnimatingThroughCenter: false
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
      
      state.component.emit(eventName, eventData);
      return eventData;
    }
  };

  //=============================================================================
  // UI RENDERING FUNCTIONS
  //=============================================================================
  
  /**
   * Gets required components from state, safely handling missing components
   */
  const getComponents = () => {
    // Return empty object if component or components are missing
    if (!state.component?.components) {
      return {};
    }
    
    // Get flattened components
    return state.component.components;
  };
  
  /**
   * Calculates percentage position for a value
   * Maps from value space (min-max) to percentage space (0-100)
   */
  const getPercentage = (value) => {
    const range = state.max - state.min;
    return range === 0 ? 0 : ((value - state.min) / range) * 100;
  };
  
  /**
   * Gets track dimensions and constraints for positioning calculations
   * Handles edge constraints and padding for proper handle positioning
   */
  const getTrackDimensions = () => {
    const components = getComponents();
    const { handle, container, track } = components;
    
    if (!handle || !container || !track) return null;
    
    try {
      const handleRect = handle.getBoundingClientRect();
      const trackRect = container.getBoundingClientRect();
      const handleSize = handleRect.width || 20;
      const trackSize = trackRect.width;
      
      const edgeConstraint = (handleSize / 2) / trackSize * 100;
      const paddingPixels = state.activeHandle ? 6 : 8; 
      const paddingPercent = (paddingPixels / trackSize) * 100;
      
      return { handleSize, trackSize, edgeConstraint, paddingPercent };
    } catch (error) {
      console.warn('Error calculating track dimensions:', error);
      return {
        handleSize: 20,
        trackSize: 200,
        edgeConstraint: 5,
        paddingPercent: 4
      };
    }
  };
  
  /**
   * Maps value percentage to visual position with edge constraints
   * Ensures handles stay within the visible track area
   */
  const mapValueToVisualPercent = (valuePercent, edgeConstraint) => {
    const minEdge = edgeConstraint;
    const maxEdge = 100 - edgeConstraint;
    const visualRange = maxEdge - minEdge;
    
    if (valuePercent <= 0) return minEdge;
    if (valuePercent >= 100) return maxEdge;
    return minEdge + (valuePercent / 100) * visualRange;
  };
  
  /**
   * Gets slider value from a position on the track
   * Maps from pixel position to slider value
   */
  const getValueFromPosition = (position) => {
    const components = getComponents();
    const { handle, container } = components;
    
    if (!handle || !container) return state.min;
    
    try {
      const containerRect = container.getBoundingClientRect();
      const range = state.max - state.min;
      const handleWidth = handle.getBoundingClientRect().width || 20;
      
      const leftEdge = containerRect.left + (handleWidth / 2);
      const rightEdge = containerRect.right - (handleWidth / 2);
      const effectiveWidth = rightEdge - leftEdge;
      
      const adjustedPosition = Math.max(leftEdge, Math.min(rightEdge, position));
      const percentageFromLeft = (adjustedPosition - leftEdge) / effectiveWidth;
      
      return state.min + percentageFromLeft * range;
    } catch (error) {
      console.warn('Error calculating value from position:', error);
      return state.min;
    }
  };
  
  /**
   * Rounds a value to the nearest step
   * Used for discrete sliders
   */
  const roundToStep = (value) => {
    const step = state.step;
    if (!step || step <= 0) return value;
    
    const steps = Math.round((value - state.min) / step);
    return state.min + (steps * step);
  };
  
  /**
   * Clamps a value between min and max
   * Ensures values stay within valid range
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  
  /**
   * Updates handle and bubble positions
   * Positions elements according to current state values
   */
  const updateHandlePositions = () => {
    const components = getComponents();
    const { handle, container, valueBubble, secondHandle, secondValueBubble } = components;
    
    if (!handle || !container) return;
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    const { edgeConstraint } = dims;
    
    // Update main handle position
    const percent = getPercentage(state.value);
    const adjustedPercent = mapValueToVisualPercent(percent, edgeConstraint);
    
    handle.style.left = `${adjustedPercent}%`;
    handle.style.transform = 'translate(-50%, -50%)';
    
    if (valueBubble) {
      valueBubble.style.left = `${adjustedPercent}%`;
      valueBubble.style.transform = 'translateX(-50%)';
    }
    
    // Update second handle if range slider
    if (config.range && secondHandle && state.secondValue !== null) {
      const secondPercent = getPercentage(state.secondValue);
      const adjustedSecondPercent = mapValueToVisualPercent(secondPercent, edgeConstraint);
      
      secondHandle.style.left = `${adjustedSecondPercent}%`;
      secondHandle.style.transform = 'translate(-50%, -50%)';
      
      if (secondValueBubble) {
        secondValueBubble.style.left = `${adjustedSecondPercent}%`;
        secondValueBubble.style.transform = 'translateX(-50%)';
      }
    }
    
    // Update ARIA attributes
    if (handle) {
      handle.setAttribute('aria-valuenow', String(state.value));
    }
  };
  
  /**
   * Updates all track segments
   * Handles different rendering for single and range sliders
   */
  const updateTrackSegments = () => {
    const components = getComponents();
    const { track, container, handle, startTrack, activeTrack, remainingTrack } = components;
    
    if (!track || !container || !handle) return;
    
    // Safety check for required elements
    if (!activeTrack || !remainingTrack) {
      console.warn('Missing track segments, cannot update track display');
      return;
    }
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    const { handleSize, trackSize, paddingPercent } = dims;
    const edgeConstraint = (handleSize / 2) / trackSize * 100;
    
    if (config.centered) {
      // Centered slider setup
      const valuePercent = getPercentage(state.value);
      const adjustedPercent = mapValueToVisualPercent(valuePercent, edgeConstraint);
      
      // Calculate center position (where zero value is)
      const zeroPercent = getPercentage(0);
      const adjustedZeroPercent = mapValueToVisualPercent(zeroPercent, edgeConstraint);
      
      // Fixed pixel gaps
      const centerGapPixels = 4; // Total gap at center
      const halfCenterGapPercent = (centerGapPixels / 2 / trackSize) * 100; // Split in half
      
      // Check if handle is very close to center
      const handleNearCenter = Math.abs(adjustedPercent - adjustedZeroPercent) < paddingPercent;
      
      // Determine if value is positive or negative relative to zero
      const isPositive = state.value >= 0;
      const wasPositive = state.previousValue >= 0;
      
      // Check if we're crossing the center (sign change)
      const crossingCenter = isPositive !== wasPositive && !state.dragging;
      
      // Debug logging
      console.log('[Centered Slider Debug]', {
        value: state.value,
        previousValue: state.previousValue,
        isPositive,
        wasPositive,
        crossingCenter,
        dragging: state.dragging,
        isAnimatingThroughCenter: state.isAnimatingThroughCenter
      });
      
      // Handle center-crossing animation
      if (crossingCenter && !state.isAnimatingThroughCenter && Math.abs(state.value) > 0.1 && Math.abs(state.previousValue) > 0.1) {
        console.log('[Animation] Starting center-crossing animation');
        state.isAnimatingThroughCenter = true;
        
        // Step 1: Animate active track to zero width at center
        activeTrack.style.display = 'block';
        if (wasPositive) {
          // Was on right side, shrink from right
          activeTrack.style.left = `${adjustedZeroPercent + halfCenterGapPercent}%`;
          activeTrack.style.right = `${100 - (adjustedZeroPercent + halfCenterGapPercent)}%`;
        } else {
          // Was on left side, shrink from left
          activeTrack.style.left = `${adjustedZeroPercent - halfCenterGapPercent}%`;
          activeTrack.style.right = `${100 - (adjustedZeroPercent - halfCenterGapPercent)}%`;
        }
        
        // After the shrink animation completes, expand in new direction
        setTimeout(() => {
          console.log('[Animation] Expanding in new direction');
          if (isPositive) {
            activeTrack.style.left = `${adjustedZeroPercent + halfCenterGapPercent}%`;
            activeTrack.style.right = `${100 - (adjustedPercent - paddingPercent)}%`;
          } else {
            activeTrack.style.left = `${adjustedPercent + paddingPercent}%`;
            activeTrack.style.right = `${100 - (adjustedZeroPercent - halfCenterGapPercent)}%`;
          }
          
          // Reset animation flag after expansion
          setTimeout(() => {
            state.isAnimatingThroughCenter = false;
            console.log('[Animation] Center-crossing animation complete');
          }, 100);
        }, 100);
        
        // Update other tracks with proper timing
        if (startTrack) {
          startTrack.style.display = 'block';
          startTrack.style.left = '0';
          
          if (isPositive) {
            // Going positive: start track stays at center initially
            startTrack.style.right = `${100 - (adjustedZeroPercent - halfCenterGapPercent)}%`;
          } else {
            // Going negative: start track needs to wait then shrink to handle
            // Keep it at center initially
            startTrack.style.right = `${100 - (adjustedZeroPercent - halfCenterGapPercent)}%`;
            
            // After active track shrinks, update start track
            setTimeout(() => {
              startTrack.style.right = `${100 - (adjustedPercent - paddingPercent)}%`;
            }, 100);
          }
        }
        
        remainingTrack.style.display = 'block';
        remainingTrack.style.right = '0';
        
        if (isPositive) {
          // Going positive: remaining track needs to wait then expand from center
          // Keep it at center initially
          remainingTrack.style.left = `${adjustedZeroPercent + halfCenterGapPercent}%`;
          
          // After active track shrinks, update remaining track
          setTimeout(() => {
            remainingTrack.style.left = `${adjustedPercent + paddingPercent}%`;
          }, 100);
        } else {
          // Going negative: remaining track stays at center
          remainingTrack.style.left = `${adjustedZeroPercent + halfCenterGapPercent}%`;
        }
        
        // Update handle position immediately
        const { handle, valueBubble } = getComponents();
        if (handle) {
          handle.style.left = `${adjustedPercent}%`;
          handle.style.transform = 'translate(-50%, -50%)';
        }
        
        if (valueBubble) {
          valueBubble.style.left = `${adjustedPercent}%`;
          valueBubble.style.transform = 'translateX(-50%)';
        }
        
        // Update ARIA attributes
        if (handle) {
          handle.setAttribute('aria-valuenow', String(state.value));
        }
        
        // Update previous value
        state.previousValue = state.value;
        return; // Exit early during animation
      }
      
      // Update previous value for next comparison
      if (!state.dragging) {
        state.previousValue = state.value;
      }
      
      // Skip normal rendering if we're animating
      if (state.isAnimatingThroughCenter) {
        console.log('[Animation] Skipping normal track update during animation');
        return;
      }
      
      if (handleNearCenter) {
        // Handle is at or near center - ensure handle gaps are visible
        activeTrack.style.display = 'none'; // No active track when at center
        
        // Start track ends before handle gap
        if (startTrack) {
          startTrack.style.display = 'block';
          startTrack.style.left = '0';
          startTrack.style.right = `${100 - (adjustedPercent - paddingPercent)}%`;
          startTrack.style.width = 'auto';
        }
        
        // Remaining track starts after handle gap
        remainingTrack.style.display = 'block';
        remainingTrack.style.left = `${adjustedPercent + paddingPercent}%`;
        remainingTrack.style.right = '0';
        remainingTrack.style.width = 'auto';
      } else if (isPositive) {
        // Positive value: active track from center to handle
        activeTrack.style.display = 'block';
        activeTrack.style.left = `${adjustedZeroPercent + halfCenterGapPercent}%`;
        activeTrack.style.right = `${100 - (adjustedPercent - paddingPercent)}%`;
        activeTrack.style.width = 'auto';
        
        // Start track from minimum to center (minus half gap)
        if (startTrack) {
          startTrack.style.display = 'block';
          startTrack.style.left = '0';
          startTrack.style.right = `${100 - (adjustedZeroPercent - halfCenterGapPercent)}%`;
          startTrack.style.width = 'auto';
        }
        
        // Remaining track from handle to maximum
        remainingTrack.style.display = 'block';
        remainingTrack.style.left = `${adjustedPercent + paddingPercent}%`;
        remainingTrack.style.right = '0';
        remainingTrack.style.width = 'auto';
      } else {
        // Negative value: active track from handle to center
        activeTrack.style.display = 'block';
        activeTrack.style.left = `${adjustedPercent + paddingPercent}%`;
        activeTrack.style.right = `${100 - (adjustedZeroPercent - halfCenterGapPercent)}%`;
        activeTrack.style.width = 'auto';
        
        // Start track from minimum to handle
        if (startTrack) {
          startTrack.style.display = 'block';
          startTrack.style.left = '0';
          startTrack.style.right = `${100 - (adjustedPercent - paddingPercent)}%`;
          startTrack.style.width = 'auto';
        }
        
        // Remaining track from center to maximum
        remainingTrack.style.display = 'block';
        remainingTrack.style.left = `${adjustedZeroPercent + halfCenterGapPercent}%`;
        remainingTrack.style.right = '0';
        remainingTrack.style.width = 'auto';
      }
    } else if (config.range && state.secondValue !== null) {
      // Range slider setup
      const lowerValue = Math.min(state.value, state.secondValue);
      const higherValue = Math.max(state.value, state.secondValue);
      const lowerPercent = getPercentage(lowerValue);
      const higherPercent = getPercentage(higherValue);
      
      const adjustedLower = mapValueToVisualPercent(lowerPercent, edgeConstraint);
      const adjustedHigher = mapValueToVisualPercent(higherPercent, edgeConstraint);
      
      // Start track (before first handle)
      if (startTrack) {
        if (lowerPercent > 1) {
          startTrack.style.display = 'block';
          startTrack.style.left = '0';
          startTrack.style.right = `${100 - (adjustedLower - paddingPercent)}%`;
          startTrack.style.width = 'auto';
        } else {
          startTrack.style.display = 'none';
        }
      }
      
      // Active track (between handles)
      const valueDiffPercent = Math.abs(higherPercent - lowerPercent);
      const hideThreshold = (handleSize / trackSize) * 100;
      
      if (valueDiffPercent <= hideThreshold) {
        activeTrack.style.display = 'none';
      } else {
        activeTrack.style.display = 'block';
        activeTrack.style.left = `${adjustedLower + paddingPercent}%`;
        activeTrack.style.right = `${100 - (adjustedHigher - paddingPercent)}%`;
        activeTrack.style.width = 'auto';
      }
      
      // Remaining track (after second handle)
      remainingTrack.style.display = 'block';
      remainingTrack.style.left = `${adjustedHigher + paddingPercent}%`;
      remainingTrack.style.right = '0';
      remainingTrack.style.width = 'auto';
    } else {
      // Single handle slider
      const valuePercent = getPercentage(state.value);
      const adjustedPercent = mapValueToVisualPercent(valuePercent, edgeConstraint);
      
      // Hide start track for single slider
      if (startTrack) {
        startTrack.style.display = 'none';
      }
      
      // Active track (filled part)
      activeTrack.style.display = 'block';
      activeTrack.style.left = '0';
      activeTrack.style.right = `${100 - (adjustedPercent - paddingPercent)}%`;
      activeTrack.style.width = 'auto';
      
      // Remaining track (unfilled part)
      remainingTrack.style.display = 'block';
      remainingTrack.style.left = `${adjustedPercent + paddingPercent}%`;
      remainingTrack.style.right = '0';
      remainingTrack.style.width = 'auto';
    }
  };
  
  /**
   * Updates value bubble content
   * Applies formatting to displayed values
   */
  const updateValueBubbles = () => {
    const components = getComponents();
    const { valueBubble, secondValueBubble } = components;
    
    if (!valueBubble) return;
    
    const formatter = config.valueFormatter || (value => value.toString());
    valueBubble.textContent = formatter(state.value);
    
    if (config.range && secondValueBubble && state.secondValue !== null) {
      secondValueBubble.textContent = formatter(state.secondValue);
    }
  };
  
  /**
   * Shows or hides value bubble
   * Controls visibility for value indicators
   */
  const showValueBubble = (bubbleElement, show) => {
    if (!bubbleElement || !config.showValue) return;
    
    const bubbleClass = state.component.getClass('slider-value');
    bubbleElement.classList[show ? 'add' : 'remove'](`${bubbleClass}--visible`);
  };
  
  /**
   * Generates tick marks
   * Creates visual indicators for discrete values
   */
  const generateTicks = () => {
    const components = getComponents();
    const { ticksContainer, container } = components;
    
    if (!ticksContainer || !container) return;
    
    // Clear existing ticks
    while (ticksContainer.firstChild) {
      ticksContainer.removeChild(ticksContainer.firstChild);
    }
    
    state.ticks = [];
    if (!config.ticks) return;
    
    const numSteps = Math.floor((state.max - state.min) / state.step);
    const tickValues = [];
    
    // Generate tick values
    for (let i = 0; i <= numSteps; i++) {
      const value = state.min + (i * state.step);
      if (value <= state.max) tickValues.push(value);
    }
    
    // Ensure max value is included
    if (tickValues[tickValues.length - 1] !== state.max) {
      tickValues.push(state.max);
    }
    
    // CSS classes
    const tickClass = state.component.getClass('slider-tick');
    const activeClass = `${tickClass}--active`;
    const inactiveClass = `${tickClass}--inactive`;
    const hiddenClass = `${tickClass}--hidden`;
    
    // Create tick elements
    tickValues.forEach(value => {
      const percent = getPercentage(value);
      const tick = document.createElement('div');
      tick.classList.add(tickClass);
      tick.style.left = `${percent}%`;
      
      // Determine tick active state
      const isExactlySelected = (value === state.value || 
                               (config.range && state.secondValue !== null && value === state.secondValue));
      
      if (isExactlySelected) {
        tick.classList.add(hiddenClass);
      } else if (config.range && state.secondValue !== null) {
        const lowerValue = Math.min(state.value, state.secondValue);
        const higherValue = Math.max(state.value, state.secondValue);
        
        tick.classList.add(value >= lowerValue && value <= higherValue ? activeClass : inactiveClass);
      } else {
        tick.classList.add(value <= state.value ? activeClass : inactiveClass);
      }
      
      ticksContainer.appendChild(tick);
      state.ticks.push(tick);
    });
  };
  
  /**
   * Updates active state of tick marks
   * Sets visual state based on current values
   */
  const updateTicks = () => {
    if (!state.ticks || state.ticks.length === 0) return;
    
    const tickClass = state.component.getClass('slider-tick');
    const activeClass = `${tickClass}--active`;
    const inactiveClass = `${tickClass}--inactive`;
    const hiddenClass = `${tickClass}--hidden`;
    
    state.ticks.forEach((tick, index) => {
      // Safety check for null tick
      if (!tick) return;
      
      // Calculate the value for this tick
      const tickValue = state.min + (index * state.step);
      
      // Reset visibility first
      tick.classList.remove(hiddenClass);
      
      // Check if this tick should be hidden (matches exactly a selected value)
      const isExactlySelected = (tickValue === state.value || 
                              (config.range && state.secondValue !== null && tickValue === state.secondValue));
      
      if (isExactlySelected) {
        tick.classList.add(hiddenClass);
      } else if (config.centered) {
        // Centered slider - ticks between zero and value should be active
        const isPositive = state.value >= 0;
        
        if (isPositive) {
          // Value is positive, ticks between 0 and value are active
          if (tickValue >= 0 && tickValue <= state.value) {
            tick.classList.add(activeClass);
            tick.classList.remove(inactiveClass);
          } else {
            tick.classList.remove(activeClass);
            tick.classList.add(inactiveClass);
          }
        } else {
          // Value is negative, ticks between value and 0 are active
          if (tickValue >= state.value && tickValue <= 0) {
            tick.classList.add(activeClass);
            tick.classList.remove(inactiveClass);
          } else {
            tick.classList.remove(activeClass);
            tick.classList.add(inactiveClass);
          }
        }
      } else if (config.range && state.secondValue !== null) {
        // Range slider - ticks between values should be active
        const lowerValue = Math.min(state.value, state.secondValue);
        const higherValue = Math.max(state.value, state.secondValue);
        
        if (tickValue >= lowerValue && tickValue <= higherValue) {
          tick.classList.add(activeClass);
          tick.classList.remove(inactiveClass);
        } else {
          tick.classList.remove(activeClass);
          tick.classList.add(inactiveClass);
        }
      } else {
        // Single slider - ticks below value should be active
        if (tickValue <= state.value) {
          tick.classList.add(activeClass);
          tick.classList.remove(inactiveClass);
        } else {
          tick.classList.remove(activeClass);
          tick.classList.add(inactiveClass);
        }
      }
    });
  };
  
  /**
   * Renders all UI elements to match current state
   * Central method for keeping UI in sync with state
   */
  const render = () => {
    try {
      updateHandlePositions();
      updateTrackSegments();
      updateValueBubbles();
      updateTicks();
    } catch (error) {
      console.warn('Error rendering UI:', error);
    }
  };

  // Create UI renderer interface for event handlers
  const uiRenderer = {
    getPercentage,
    getValueFromPosition,
    roundToStep,
    clamp,
    showValueBubble,
    generateTicks,
    updateTicks,
    updateUi: render, // For backward compatibility
    render
  };
  
  // Create event handlers with our renderer
  const handlers = createHandlers(config, state, uiRenderer, eventHelpers);
  
  // Initialize slider controller
  const initController = () => {
    try {
      // Verify we have the necessary components
      if (!component.components || !component.components.handle) {
        console.warn('Cannot initialize slider controller: missing required components');
        return;
      }
      
      // Set ARIA attributes
      component.element.setAttribute('aria-valuemin', String(state.min));
      component.element.setAttribute('aria-valuemax', String(state.max));
      component.element.setAttribute('aria-valuenow', String(state.value));
      
      const { handle, secondHandle } = component.components;
      
      // Set handle attributes
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
      
      // Setup event listeners
      handlers.setupEventListeners();
      
      // Initially generate ticks if needed
      if (config.ticks || config.tickLabels) {
        generateTicks();
      }
      
      // Initial UI update
      render();
      
      // Force one more UI update after a delay to ensure proper positioning
      setTimeout(() => {
        render();
      }, 50);
    } catch (error) {
      console.error('Error initializing slider controller:', error);
    }
  };
  
  // Register with lifecycle if available
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    component.lifecycle.destroy = () => {
      handlers.cleanupEventListeners();
      originalDestroy();
    };
  }
  
  // Schedule initialization after current execution completes
  setTimeout(() => {
    initController();
  }, 0);
  
  // Return enhanced component
  return {
    ...component,
    // Provide controller API under 'slider' property for backward compatibility
    slider: {
      /**
       * Sets slider value
       * @param value New value
       * @param triggerEvent Whether to trigger change event
       * @returns Slider controller for chaining
       */
      setValue(value, triggerEvent = true) {
        const newValue = clamp(value, state.min, state.max);
        
        // Debug logging for centered sliders
        if (config.centered) {
          console.log('[setValue Debug]', {
            oldValue: state.value,
            newValue,
            previousValue: state.previousValue,
            willCrossCenter: (state.value >= 0) !== (newValue >= 0),
            triggerEvent
          });
        }
        
        // Track previous value for centered slider animations
        if (config.centered) {
          state.previousValue = state.value;
        }
        
        state.value = newValue;
        render();
        
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
        
        const newValue = clamp(value, state.min, state.max);
        state.secondValue = newValue;
        render();
        
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
        
        // Update ARIA attributes if elements exist
        component.element.setAttribute('aria-valuemin', String(min));
        if (component.components?.handle) {
          component.components.handle.setAttribute('aria-valuemin', String(min));
        }
        
        if (config.range && component.components?.secondHandle) {
          component.components.secondHandle.setAttribute('aria-valuemin', String(min));
        }
        
        // Clamp values to new min
        if (state.value < min) state.value = min;
        if (config.range && state.secondValue !== null && state.secondValue < min) {
          state.secondValue = min;
        }
        
        // Regenerate ticks if needed
        if (config.ticks || config.tickLabels) {
          generateTicks();
        }
        
        render();
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
        
        // Update ARIA attributes if elements exist
        component.element.setAttribute('aria-valuemax', String(max));
        if (component.components?.handle) {
          component.components.handle.setAttribute('aria-valuemax', String(max));
        }
        
        if (config.range && component.components?.secondHandle) {
          component.components.secondHandle.setAttribute('aria-valuemax', String(max));
        }
        
        // Clamp values to new max
        if (state.value > max) state.value = max;
        if (config.range && state.secondValue !== null && state.secondValue > max) {
          state.secondValue = max;
        }
        
        // Regenerate ticks if needed
        if (config.ticks || config.tickLabels) {
          generateTicks();
        }
        
        render();
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
          generateTicks();
          updateTicks();
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
        generateTicks();
        updateTicks();
        return this;
      },
      
      /**
       * Update all UI elements
       * @returns Slider controller for chaining
       */
      updateUi() {
        render();
        return this;
      }
    }
  };
};