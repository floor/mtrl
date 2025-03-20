// src/components/slider/features/ui.ts
import { SliderConfig } from '../types';

/**
 * Create optimized UI update helpers for slider component
 * 
 * @param config Slider configuration
 * @param state Slider state object
 * @returns UI update helper methods
 */
export const createUiHelpers = (config: SliderConfig, state) => {
  // Return empty implementations if component components are missing
  if (!state.component?.components) {
    console.error('Cannot create UI helpers: component structure is missing');
    return {
      getPercentage: () => 0,
      getValueFromPosition: () => 0,
      roundToStep: v => v,
      clamp: (v, min, max) => Math.min(Math.max(v, min), max),
      updateUi: () => {},
      showValueBubble: () => {},
      generateTicks: () => {},
      updateTicks: () => {}
    };
  }
  
  // Get flattened components
  const components = state.component.components;
  
  // Extract all needed elements with simple destructuring
  const {
    container = null,
    handle = null, 
    valueBubble = null, 
    secondHandle = null, 
    secondValueBubble = null, 
    ticksContainer = null,
    track = null,
    startTrack = null,
    activeTrack = null,
    remainingTrack = null
  } = components;
  
  /**
   * Calculates percentage position for a value
   */
  const getPercentage = (value) => {
    const range = state.max - state.min;
    return range === 0 ? 0 : ((value - state.min) / range) * 100;
  };
  
  /**
   * Gets track dimensions and constraints for positioning calculations
   */
  const getTrackDimensions = () => {
    if (!track || !handle || !container) return null;
    
    const handleRect = handle.getBoundingClientRect();
    const trackRect = container.getBoundingClientRect();
    const handleSize = handleRect.width || 20;
    const trackSize = trackRect.width;
    
    const edgeConstraint = (handleSize / 2) / trackSize * 100;
    const paddingPixels = state.activeHandle ? 6 : 8; 
    const paddingPercent = (paddingPixels / trackSize) * 100;
    
    return { handleSize, trackSize, edgeConstraint, paddingPercent };
  };
  
  /**
   * Maps value percentage to visual position with edge constraints
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
   */
  const getValueFromPosition = (position) => {
    if (!track || !container) return state.min;
    
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
   */
  const roundToStep = (value) => {
    const step = state.step;
    if (step <= 0) return value;
    
    const steps = Math.round((value - state.min) / step);
    return state.min + (steps * step);
  };
  
  /**
   * Clamps a value between min and max
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  
  /**
   * Updates handle and bubble positions and transforms
   */
  const updateHandlePositions = () => {
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
    handle.setAttribute('aria-valuenow', String(state.value));
    if (config.range && secondHandle && state.secondValue !== null) {
      secondHandle.setAttribute('aria-valuenow', String(state.secondValue));
    }
  };
  
  /**
   * Updates all track segments at once with optimized positioning
   */
  const updateTrackSegments = () => {
    if (!track || !container || !handle) return;
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    const { handleSize, trackSize, paddingPercent } = dims;
    const edgeConstraint = (handleSize / 2) / trackSize * 100;
    
    if (config.range && state.secondValue !== null) {
      // Range slider setup
      const lowerValue = Math.min(state.value, state.secondValue);
      const higherValue = Math.max(state.value, state.secondValue);
      const lowerPercent = getPercentage(lowerValue);
      const higherPercent = getPercentage(higherValue);
      
      const adjustedLower = mapValueToVisualPercent(lowerPercent, edgeConstraint);
      const adjustedHigher = mapValueToVisualPercent(higherPercent, edgeConstraint);
      
      // Start track (before first handle)
      if (lowerPercent > 1) {
        startTrack.style.display = 'block';
        startTrack.style.left = '0';
        startTrack.style.right = `${100 - (adjustedLower - paddingPercent)}%`;
        startTrack.style.width = 'auto';
      } else {
        startTrack.style.display = 'none';
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
      startTrack.style.display = 'none';
      
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
   */
  const updateValueBubbles = () => {
    if (!valueBubble) return;
    
    const formatter = config.valueFormatter || (value => value.toString());
    valueBubble.textContent = formatter(state.value);
    
    if (config.range && secondValueBubble && state.secondValue !== null) {
      secondValueBubble.textContent = formatter(state.secondValue);
    }
  };
  
  /**
   * Shows or hides value bubble
   */
  const showValueBubble = (bubbleElement, show) => {
    if (!bubbleElement || !config.showValue) return;
    
    bubbleElement.classList[show ? 'add' : 'remove'](`${state.component.getClass('slider-value')}--visible`);
  };
  
  /**
   * Generates tick marks
   */
  const generateTicks = () => {
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
   */
  const updateTicks = () => {
    if (!state.ticks || state.ticks.length === 0) return;
    
    const tickClass = state.component.getClass('slider-tick');
    const activeClass = `${tickClass}--active`;
    const inactiveClass = `${tickClass}--inactive`;
    const hiddenClass = `${tickClass}--hidden`;
    
    state.ticks.forEach((tick, index) => {
      // Calculate the value for this tick
      const tickValue = state.min + (index * state.step);
      
      // Reset visibility first
      tick.classList.remove(hiddenClass);
      
      // Check if this tick should be hidden (matches exactly a selected value)
      const isExactlySelected = (tickValue === state.value || 
                              (config.range && state.secondValue !== null && tickValue === state.secondValue));
      
      if (isExactlySelected) {
        tick.classList.add(hiddenClass);
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
   * Updates all UI elements
   */
  const updateUi = () => {
    updateHandlePositions();
    updateTrackSegments();
    updateValueBubbles();
    updateTicks();
  };
  
  // Return consolidated helper methods
  return {
    getPercentage,
    getValueFromPosition,
    roundToStep,
    clamp,
    showValueBubble,
    generateTicks,
    updateTicks,
    updateUi
  };
}