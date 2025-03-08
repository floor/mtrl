// src/components/slider/features/ui.ts
import { SLIDER_ORIENTATIONS } from '../constants';
import { SliderConfig } from '../types';

/**
 * Create UI update helpers for slider component with MD3 enhancements
 * 
 * @param config Slider configuration
 * @param state Slider state object
 * @returns UI update helper methods
 */
export const createUiHelpers = (config: SliderConfig, state) => {
  // Return empty implementations if component structure is missing
  if (!state.component?.structure) {
    console.error('Cannot create UI helpers: component structure is missing');
    return Object.fromEntries(['getPercentage', 'getValueFromPosition', 'roundToStep', 
      'clamp', 'setThumbPosition', 'updateActiveTrack', 'updateStartTrack', 
      'updateRemainingTrack', 'updateThumbPositions', 'updateValueBubbles', 
      'showValueBubble', 'generateTicks', 'updateTicks', 'updateUi']
      .map(method => [method, method === 'clamp' ? (v, min, max) => Math.min(Math.max(v, min), max) : 
                              method === 'roundToStep' ? v => v : 
                              method === 'getPercentage' || method === 'getValueFromPosition' ? () => 0 : 
                              () => {}]));
  }
  
  const {
    track, activeTrack, startTrack, remainingTrack, thumb, 
    valueBubble, secondThumb, secondValueBubble, ticksContainer
  } = state.component.structure;
  
  const isVertical = config.orientation === SLIDER_ORIENTATIONS.VERTICAL;
  
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
    if (!track || !thumb) return null;
    
    const thumbRect = thumb.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const thumbSize = isVertical ? thumbRect.height || 20 : thumbRect.width || 20;
    const trackSize = isVertical ? trackRect.height : trackRect.width;
    
    const edgeConstraint = (thumbSize / 2) / trackSize * 100;
    const paddingPercent = (8 / trackSize) * 100; // 8px padding
    
    return { thumbSize, trackSize, edgeConstraint, paddingPercent };
  };
  
  /**
   * Map value percentage to visual position with edge constraints
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
  const getValueFromPosition = (position, vertical = false) => {
    if (!track) return state.min;
    
    try {
      const trackRect = track.getBoundingClientRect();
      const range = state.max - state.min;
      
      const thumbRect = thumb.getBoundingClientRect();
      const thumbWidth = thumbRect.width || 20;
      const thumbHeight = vertical ? thumbRect.width || 20 : thumbRect.height || 20;
      
      if (vertical) {
        const topEdge = trackRect.top + (thumbWidth / 2);
        const bottomEdge = trackRect.bottom - (thumbWidth / 2);
        const effectiveHeight = bottomEdge - topEdge;
        
        const adjustedPosition = Math.max(topEdge, Math.min(bottomEdge, position));
        const percentageFromTop = (adjustedPosition - topEdge) / effectiveHeight;
        
        return state.min + (1 - percentageFromTop) * range;
      } else {
        const leftEdge = trackRect.left + (thumbWidth / 2);
        const rightEdge = trackRect.right - (thumbWidth / 2);
        const effectiveWidth = rightEdge - leftEdge;
        
        const adjustedPosition = Math.max(leftEdge, Math.min(rightEdge, position));
        const percentageFromLeft = (adjustedPosition - leftEdge) / effectiveWidth;
        
        return state.min + percentageFromLeft * range;
      }
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
   * Sets thumb position based on a value percentage with proper edge mapping
   */
  const setThumbPosition = (thumbElement, bubbleElement, valuePercent) => {
    if (!thumbElement || !track) return;
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    const { thumbSize, trackSize } = dims;
    const edgeConstraint = (thumbSize / 2) / trackSize * 100;
    const adjustedPercent = mapValueToVisualPercent(valuePercent, edgeConstraint);
    
    if (isVertical) {
      thumbElement.style.bottom = `${adjustedPercent}%`;
      thumbElement.style.left = '50%';
      thumbElement.style.top = 'auto';
      thumbElement.style.transform = 'translate(-50%, 50%)';
      
      if (bubbleElement) {
        bubbleElement.style.bottom = `${adjustedPercent}%`;
        bubbleElement.style.top = 'auto';
        bubbleElement.style.transform = 'translateY(50%)';
      }
    } else {
      thumbElement.style.left = `${adjustedPercent}%`;
      thumbElement.style.transform = 'translate(-50%, -50%)';
      
      if (bubbleElement) {
        bubbleElement.style.left = `${adjustedPercent}%`;
        bubbleElement.style.transform = 'translateX(-50%)';
      }
    }
  };

  /**
   * Updates start track styles
   */
  const updateStartTrack = () => {
    if (!startTrack || !track || !thumb) return;
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    const { thumbSize, trackSize, paddingPercent } = dims;
    
    if (config.range && state.secondValue !== null) {
      const lowerValue = Math.min(state.value, state.secondValue);
      const lowerPercent = getPercentage(lowerValue);
      
      const edgeConstraint = (thumbSize / 2) / trackSize * 100;
      const adjustedPercent = mapValueToVisualPercent(lowerPercent, edgeConstraint);
      const finalPercent = Math.max(0, adjustedPercent - paddingPercent);
      
      startTrack.style.display = 'block';
      
      if (isVertical) {
        startTrack.style.height = `${finalPercent}%`;
        startTrack.style.bottom = '0';
        startTrack.style.top = 'auto';
        startTrack.style.width = '100%';
        startTrack.style.left = '0';
      } else {
        startTrack.style.width = `${finalPercent}%`;
        startTrack.style.left = '0';
        startTrack.style.height = '100%';
      }
    } else {
      startTrack.style.display = 'none';
    }
  };

  /**
   * Updates active track styles
   */
  const updateActiveTrack = () => {
    if (!activeTrack || !track || !thumb) return;
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    const { thumbSize, trackSize, paddingPercent } = dims;
    const edgeConstraint = (thumbSize / 2) / trackSize * 100;
    
    if (config.range && state.secondValue !== null) {
      // Range slider (two thumbs)
      const lowerValue = Math.min(state.value, state.secondValue);
      const higherValue = Math.max(state.value, state.secondValue);
      const lowerPercent = getPercentage(lowerValue);
      const higherPercent = getPercentage(higherValue);
      
      const adjustedLower = mapValueToVisualPercent(lowerPercent, edgeConstraint) + paddingPercent;
      const adjustedHigher = mapValueToVisualPercent(higherPercent, edgeConstraint) - paddingPercent;
      
      let trackLength = Math.max(0, adjustedHigher - adjustedLower);
      if (higherPercent - lowerPercent < paddingPercent * 2) {
        trackLength = Math.max(0, higherPercent - lowerPercent);
      }
      
      activeTrack.style.display = 'block';
      
      if (isVertical) {
        activeTrack.style.height = `${trackLength}%`;
        activeTrack.style.bottom = `${adjustedLower}%`;
        activeTrack.style.top = 'auto';
        activeTrack.style.width = '100%';
      } else {
        activeTrack.style.width = `${trackLength}%`;
        activeTrack.style.left = `${adjustedLower}%`;
        activeTrack.style.height = '100%';
      }
    } else {
      // Single thumb slider
      const valuePercent = getPercentage(state.value);
      const adjustedPercent = mapValueToVisualPercent(valuePercent, edgeConstraint);
      const adjustedWidth = Math.max(0, adjustedPercent - paddingPercent);
      
      activeTrack.style.display = 'block';
      
      if (isVertical) {
        activeTrack.style.height = `${adjustedWidth}%`;
        activeTrack.style.bottom = '0';
        activeTrack.style.top = 'auto';
        activeTrack.style.width = '100%';
      } else {
        activeTrack.style.width = `${adjustedWidth}%`;
        activeTrack.style.left = '0';
        activeTrack.style.height = '100%';
      }
    }
  };

  /**
   * Updates remaining track styles
   */
  const updateRemainingTrack = () => {
    if (!remainingTrack || !track || !thumb) return;
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    const { thumbSize, trackSize, paddingPercent } = dims;
    const edgeConstraint = (thumbSize / 2) / trackSize * 100;
    
    // Find the highest thumb value
    const highValue = config.range && state.secondValue !== null ? 
      Math.max(state.value, state.secondValue) : state.value;
    
    const valuePercent = getPercentage(highValue);
    
    // Map percentage to visual range
    const adjustedPercent = mapValueToVisualPercent(valuePercent, edgeConstraint) + paddingPercent;
    const remainingSize = Math.max(0, 100 - adjustedPercent);
    
    remainingTrack.style.display = 'block';
    
    if (isVertical) {
      remainingTrack.style.height = `${remainingSize}%`;
      remainingTrack.style.bottom = `${adjustedPercent}%`;
      remainingTrack.style.top = 'auto';
      remainingTrack.style.width = '100%';
    } else {
      remainingTrack.style.width = `${remainingSize}%`;
      remainingTrack.style.left = `${adjustedPercent}%`;
      remainingTrack.style.height = '100%';
    }
  };
  
  /**
   * Updates thumb positions
   */
  const updateThumbPositions = () => {
    if (!thumb) return;
    
    // Update main thumb
    const percent = getPercentage(state.value);
    setThumbPosition(thumb, valueBubble, percent);
    
    // Update second thumb if range slider
    if (config.range && secondThumb && secondValueBubble && state.secondValue !== null) {
      const secondPercent = getPercentage(state.secondValue);
      setThumbPosition(secondThumb, secondValueBubble, secondPercent);
    }
    
    // Update ARIA attributes
    thumb.setAttribute('aria-valuenow', String(state.value));
    if (config.range && secondThumb && state.secondValue !== null) {
      secondThumb.setAttribute('aria-valuenow', String(state.secondValue));
    }
  };
  
  /**
   * Updates value bubble content
   */
  const updateValueBubbles = () => {
    if (!valueBubble) return;
    
    // Format the values
    const formatter = config.valueFormatter || (value => value.toString());
    
    // Update main and second value bubble if needed
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
    
    const visibleClass = `${state.component.getClass('slider-value')}--visible`;
    bubbleElement.classList[show ? 'add' : 'remove'](visibleClass);
  };
  
  /**
   * Generates tick marks and labels
   */
  const generateTicks = () => {
    if (!ticksContainer) {
      console.warn('Ticks container not found in component structure');
      return;
    }
    
    // Clear existing ticks and labels
    const sliderElement = state.component.element;
    sliderElement.querySelectorAll(`.${state.component.getClass('slider-tick')}`)
      .forEach(tick => tick.parentNode.removeChild(tick));
    
    while (ticksContainer.firstChild) {
      ticksContainer.removeChild(ticksContainer.firstChild);
    }
    
    // Clear existing labels
    state.tickLabels?.forEach(label => label.parentNode?.removeChild(label));
    
    // Reset ticks and labels arrays
    state.ticks = [];
    state.tickLabels = [];
    
    if (!config.ticks && !config.tickLabels) return;
    
    // Generate tick values
    const numSteps = Math.floor((state.max - state.min) / state.step);
    const tickValues = [];
    
    for (let i = 0; i <= numSteps; i++) {
      const value = state.min + (i * state.step);
      if (value <= state.max) {
        tickValues.push(value);
      }
    }
    
    // Ensure max value is included
    if (tickValues[tickValues.length - 1] !== state.max) {
      tickValues.push(state.max);
    }
    
    // CSS classes
    const activeClass = `${state.component.getClass('slider-tick')}--active`;
    const inactiveClass = `${state.component.getClass('slider-tick')}--inactive`;
    const hiddenClass = `${state.component.getClass('slider-tick')}--hidden`;
    const labelClass = state.component.getClass('slider-label');
    const tickClass = state.component.getClass('slider-tick');
    
    // Create ticks and labels
    tickValues.forEach(value => {
      const percent = getPercentage(value);
      
      // Create tick mark if enabled
      if (config.ticks) {
        const tick = document.createElement('div');
        tick.classList.add(tickClass);
        
        // Position tick based on orientation
        if (isVertical) {
          tick.style.bottom = `${percent}%`;
        } else {
          tick.style.left = `${percent}%`;
        }
        
        // Check if this tick should be hidden (matches exactly a selected value)
        const isExactlySelected = value === state.value || 
          (config.range && state.secondValue !== null && value === state.secondValue);
        
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
      }
      
      // Create label if enabled
      if (config.tickLabels) {
        const label = document.createElement('div');
        label.classList.add(labelClass);
        
        // Position label
        if (isVertical) {
          label.style.bottom = `${percent}%`;
        } else {
          label.style.left = `${percent}%`;
        }
        
        // Set label text
        if (Array.isArray(config.tickLabels) && config.tickLabels[tickValues.indexOf(value)]) {
          label.textContent = config.tickLabels[tickValues.indexOf(value)];
        } else {
          const formatter = config.valueFormatter || (value => value.toString());
          label.textContent = formatter(value);
        }
        
        state.component.element.appendChild(label);
        state.tickLabels.push(label);
      }
    });
  };
  
  /**
   * Updates active state of tick marks
   */
  const updateTicks = () => {
    if (!state.ticks || state.ticks.length === 0) return;
    
    const activeClass = `${state.component.getClass('slider-tick')}--active`;
    const inactiveClass = `${state.component.getClass('slider-tick')}--inactive`;
    const hiddenClass = `${state.component.getClass('slider-tick')}--hidden`;
    
    // Update active ticks based on current value
    state.ticks.forEach((tick, index) => {
      // Calculate the value for this tick based on its index
      const tickValue = state.min + (index * state.step);
      
      // First, reset visibility
      tick.classList.remove(hiddenClass);
      
      // Check if this tick should be hidden (matches exactly a selected value)
      const isExactlySelected = tickValue === state.value || 
        (config.range && state.secondValue !== null && tickValue === state.secondValue);
      
      if (isExactlySelected) {
        // Hide this tick as it exactly matches a selected value
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
    updateThumbPositions();
    updateStartTrack();
    updateActiveTrack();
    updateRemainingTrack();
    updateValueBubbles();
    updateTicks();
  };
  
  // Return helper methods
  return {
    getPercentage,
    getValueFromPosition,
    roundToStep,
    clamp,
    setThumbPosition,
    updateActiveTrack,
    updateStartTrack,
    updateRemainingTrack,
    updateThumbPositions,
    updateValueBubbles,
    showValueBubble,
    generateTicks,
    updateTicks,
    updateUi
  };
};