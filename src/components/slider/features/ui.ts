// src/components/slider/features/ui.ts
/**
 * Enhanced UI helper functionality for the Slider component
 * Fixes the thumb positioning issue at the start and end of the slider
 */

import { SLIDER_ORIENTATIONS } from '../constants';
import { SliderConfig } from '../types';

/**
 * Create UI update helpers for slider component with improved thumb positioning
 * 
 * @param config Slider configuration
 * @param state Slider state object
 * @returns UI update helper methods
 */
export const createUiHelpers = (config: SliderConfig, state) => {
  // Make sure state.component.structure exists
  if (!state.component || !state.component.structure) {
    console.error('Cannot create UI helpers: component structure is missing');
    return {
      getPercentage: () => 0,
      getValueFromPosition: () => 0,
      roundToStep: (value) => value,
      clamp: (value, min, max) => Math.min(Math.max(value, min), max),
      setThumbPosition: () => {},
      updateActiveTrack: () => {},
      updateStartTrack: () => {},
      updateRemainingTrack: () => {},
      updateThumbPositions: () => {},
      updateValueBubbles: () => {},
      showValueBubble: () => {},
      generateTicks: () => {},
      updateTicks: () => {},
      updateUi: () => {}
    };
  }
  
  const {
    track,
    activeTrack,
    startTrack,
    remainingTrack,
    thumb,
    valueBubble,
    secondThumb,
    secondValueBubble,
    startDot,
    endDot
  } = state.component.structure;
  
  /**
   * Calculates percentage position for a value
   * @param value Value to convert to percentage
   * @returns Percentage position (0-100)
   */
  const getPercentage = (value) => {
    const range = state.max - state.min;
    if (range === 0) return 0;
    return ((value - state.min) / range) * 100;
  };
  
  /**
   * Gets slider value from a position on the track
   * @param position Screen coordinate (clientX/clientY)
   * @param vertical Whether slider is vertical
   * @returns Calculated value
   */
  const getValueFromPosition = (position, vertical = false) => {
    if (!track) return state.min;
    
    try {
      const trackRect = track.getBoundingClientRect();
      const range = state.max - state.min;
      
      if (vertical) {
        const trackHeight = trackRect.height;
        // For vertical sliders, 0% is at the bottom, 100% at the top
        const percentageFromBottom = 1 - ((position - trackRect.top) / trackHeight);
        // Clamp percentage between 0 and 1
        const clampedPercentage = Math.max(0, Math.min(1, percentageFromBottom));
        return state.min + clampedPercentage * range;
      } else {
        const trackWidth = trackRect.width;
        // For horizontal sliders, 0% is at the left, 100% at the right
        const percentageFromLeft = (position - trackRect.left) / trackWidth;
        // Clamp percentage between 0 and 1
        const clampedPercentage = Math.max(0, Math.min(1, percentageFromLeft));
        return state.min + clampedPercentage * range;
      }
    } catch (error) {
      console.warn('Error calculating value from position:', error);
      return state.min;
    }
  };
  
  /**
   * Rounds a value to the nearest step
   * @param value Value to round
   * @returns Rounded value
   */
  const roundToStep = (value) => {
    const step = state.step;
    if (step <= 0) return value;
    
    const steps = Math.round((value - state.min) / step);
    return state.min + (steps * step);
  };
  
  /**
   * Clamps a value between min and max
   * @param value Value to clamp
   * @param min Minimum allowed value
   * @param max Maximum allowed value
   * @returns Clamped value
   */
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  
  /**
   * Sets thumb position based on a value percentage with improved edge positioning
   * @param thumbElement Thumb element to position
   * @param valueBubbleElement Value bubble element to position
   * @param valuePercent Percentage position (0-100)
   */
  const setThumbPosition = (thumbElement, valueBubbleElement, valuePercent) => {
    if (!thumbElement) return;
    
    // Get track dimensions to calculate absolute positioning
    const trackRect = track.getBoundingClientRect();
    const isVertical = config.orientation === SLIDER_ORIENTATIONS.VERTICAL;
    
    // Calculate track length in pixels to handle thumb alignment at edges
    const trackLength = isVertical ? trackRect.height : trackRect.width;
    
    // Get thumb dimensions for edge positioning adjustment
    const thumbRect = thumbElement.getBoundingClientRect();
    const thumbSize = isVertical ? thumbRect.height : thumbRect.width;
    
    // Calculate the thumb offset needed at edges
    const thumbOffset = thumbSize / 2;
    
    // Adjust percentage for edge cases (min/max) to align with dots
    // This is the key change to fix alignment at the edges
    if (valuePercent === 0) {
      // At minimum value (left edge), position thumb directly over start dot
      if (isVertical) {
        thumbElement.style.bottom = '0';
        thumbElement.style.left = '50%';
        thumbElement.style.top = 'auto';
        thumbElement.style.transform = 'translate(-50%, 50%)';
      } else {
        thumbElement.style.left = '0';
        thumbElement.style.top = '50%';
        thumbElement.style.transform = 'translateY(-50%)';
      }
    } else if (valuePercent === 100) {
      // At maximum value (right edge), position thumb directly over end dot
      if (isVertical) {
        thumbElement.style.bottom = 'auto';
        thumbElement.style.top = '0';
        thumbElement.style.left = '50%';
        thumbElement.style.transform = 'translate(-50%, -50%)';
      } else {
        thumbElement.style.left = '100%';
        thumbElement.style.top = '50%';
        thumbElement.style.transform = 'translate(-100%, -50%)';
      }
    } else {
      // For normal positions, use the standard percentage positioning
      if (isVertical) {
        thumbElement.style.bottom = `${valuePercent}%`;
        thumbElement.style.left = '50%';
        thumbElement.style.top = 'auto';
        thumbElement.style.transform = 'translate(-50%, 50%)';
      } else {
        thumbElement.style.left = `${valuePercent}%`;
        thumbElement.style.top = '50%';
        thumbElement.style.transform = 'translate(-50%, -50%)';
      }
    }
    
    // Position the value bubble accordingly
    if (valueBubbleElement) {
      if (isVertical) {
        valueBubbleElement.style.bottom = `${valuePercent}%`;
        valueBubbleElement.style.top = 'auto';
      } else {
        valueBubbleElement.style.left = `${valuePercent}%`;
      }
    }
  };

  /**
   * Updates start track styles (before the first thumb for range slider)
   */
  const updateStartTrack = () => {
    if (!startTrack) return;
    
    if (config.range && state.secondValue !== null) {
      // For range slider, calculate the track from start to first thumb
      const lowerValue = Math.min(state.value, state.secondValue);
      const lowerPercent = getPercentage(lowerValue);
      
      // Get track width for pixel calculations 
      const trackRect = track.getBoundingClientRect();
      const isVertical = config.orientation === SLIDER_ORIENTATIONS.VERTICAL;
      const trackSize = isVertical ? trackRect.height : trackRect.width;
      
      // Calculate width with adjustment for thumb spacing - subtract 8px equivalent
      const paddingAdjustment = 8; // 8px padding
      const paddingPercent = (paddingAdjustment / trackSize) * 100;
      
      if (isVertical) {
        startTrack.style.display = 'block';
        startTrack.style.height = `${Math.max(0, lowerPercent - paddingPercent)}%`;
        startTrack.style.bottom = '0';
        startTrack.style.top = 'auto';
        startTrack.style.width = '100%';
        startTrack.style.left = '0';
      } else {
        startTrack.style.display = 'block';
        startTrack.style.width = `${Math.max(0, lowerPercent - paddingPercent)}%`;
        startTrack.style.left = '0';
        startTrack.style.height = '100%';
      }
    } else {
      // For single thumb slider, no start track needed
      startTrack.style.display = 'none';
    }
  };

  /**
   * Updates active track styles - with padding adjustments
   */
  const updateActiveTrack = () => {
    if (!activeTrack) return;
    
    // Get track width for pixel calculations
    const trackRect = track.getBoundingClientRect();
    const isVertical = config.orientation === SLIDER_ORIENTATIONS.VERTICAL;
    const trackSize = isVertical ? trackRect.height : trackRect.width;
    
    // Calculate padding adjustment
    const paddingAdjustment = 8; // 8px padding
    const paddingPercent = (paddingAdjustment / trackSize) * 100;
    
    if (config.range && state.secondValue !== null) {
      // Range slider (two thumbs)
      const lowerValue = Math.min(state.value, state.secondValue);
      const higherValue = Math.max(state.value, state.secondValue);
      const lowerPercent = getPercentage(lowerValue);
      const higherPercent = getPercentage(higherValue);
      
      // Adjust positions and width to account for spacing
      let adjustedLowerPercent = lowerPercent;
      let adjustedHigherPercent = higherPercent;
      
      if (higherPercent - lowerPercent > paddingPercent * 2) {
        // If there's enough space, add padding to both sides
        adjustedLowerPercent = lowerPercent + paddingPercent;
        adjustedHigherPercent = higherPercent - paddingPercent;
      }
      
      const trackLength = Math.max(0, adjustedHigherPercent - adjustedLowerPercent);
      
      if (isVertical) {
        activeTrack.style.display = 'block';
        activeTrack.style.height = `${trackLength}%`;
        activeTrack.style.bottom = `${adjustedLowerPercent}%`;
        activeTrack.style.top = 'auto';
        activeTrack.style.width = '100%';
      } else {
        activeTrack.style.display = 'block';
        activeTrack.style.width = `${trackLength}%`;
        activeTrack.style.left = `${adjustedLowerPercent}%`;
        activeTrack.style.height = '100%';
      }
    } else {
      // Single thumb slider
      const percent = getPercentage(state.value);
      
      // Special handling for min/max to ensure track aligns with dots
      if (state.value === state.min) {
        // At minimum, no active track
        activeTrack.style.display = 'none';
      } else if (state.value === state.max) {
        // At maximum, full width active track
        if (isVertical) {
          activeTrack.style.display = 'block';
          activeTrack.style.height = '100%';
          activeTrack.style.bottom = '0';
          activeTrack.style.top = 'auto';
          activeTrack.style.width = '100%';
        } else {
          activeTrack.style.display = 'block';
          activeTrack.style.width = '100%';
          activeTrack.style.left = '0';
          activeTrack.style.height = '100%';
        }
      } else {
        // For normal positions, adjust with padding
        const adjustedWidth = Math.max(0, percent - paddingPercent);
        
        if (isVertical) {
          activeTrack.style.display = 'block';
          activeTrack.style.height = `${adjustedWidth}%`;
          activeTrack.style.bottom = '0';
          activeTrack.style.top = 'auto';
          activeTrack.style.width = '100%';
        } else {
          activeTrack.style.display = 'block';
          activeTrack.style.width = `${adjustedWidth}%`;
          activeTrack.style.left = '0';
          activeTrack.style.height = '100%';
        }
      }
    }
  };

  /**
   * Updates remaining track styles - with padding adjustments
   */
  const updateRemainingTrack = () => {
    if (!remainingTrack) return;
    
    // Get track width for pixel calculations
    const trackRect = track.getBoundingClientRect();
    const isVertical = config.orientation === SLIDER_ORIENTATIONS.VERTICAL;
    const trackSize = isVertical ? trackRect.height : trackRect.width;
    
    // Calculate padding adjustment
    const paddingAdjustment = 8; // 8px padding
    const paddingPercent = (paddingAdjustment / trackSize) * 100;
    
    if (config.range && state.secondValue !== null) {
      // Range slider (two thumbs)
      const higherValue = Math.max(state.value, state.secondValue);
      const higherPercent = getPercentage(higherValue);
      
      // Special handling for max value to ensure track aligns with end dot
      if (higherValue === state.max) {
        remainingTrack.style.display = 'none';
      } else {
        // Adjust for right padding
        const adjustedPercent = higherPercent + paddingPercent;
        const adjustedWidth = Math.max(0, 100 - adjustedPercent);
        
        if (isVertical) {
          remainingTrack.style.display = 'block';
          remainingTrack.style.height = `${adjustedWidth}%`;
          remainingTrack.style.bottom = `${adjustedPercent}%`;
          remainingTrack.style.top = 'auto';
          remainingTrack.style.width = '100%';
        } else {
          remainingTrack.style.display = 'block';
          remainingTrack.style.width = `${adjustedWidth}%`;
          remainingTrack.style.left = `${adjustedPercent}%`;
          remainingTrack.style.height = '100%';
        }
      }
    } else {
      // Single thumb slider
      const percent = getPercentage(state.value);
      
      // Special handling for max value to ensure track aligns with end dot
      if (state.value === state.max) {
        remainingTrack.style.display = 'none';
      } else {
        // Adjust for right padding
        const adjustedPercent = percent + paddingPercent;
        const adjustedWidth = Math.max(0, 100 - adjustedPercent);
        
        if (isVertical) {
          remainingTrack.style.display = 'block';
          remainingTrack.style.height = `${adjustedWidth}%`;
          remainingTrack.style.bottom = `${adjustedPercent}%`;
          remainingTrack.style.top = 'auto';
          remainingTrack.style.width = '100%';
        } else {
          remainingTrack.style.display = 'block';
          remainingTrack.style.width = `${adjustedWidth}%`;
          remainingTrack.style.left = `${adjustedPercent}%`;
          remainingTrack.style.height = '100%';
        }
      }
    }
  };
  
  /**
   * Updates thumb positions with edge case correction
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
    const formattedValue = formatter(state.value);
    
    // Update main value bubble
    valueBubble.textContent = formattedValue;
    
    // Update second value bubble if range slider
    if (config.range && secondValueBubble && state.secondValue !== null) {
      const formattedSecondValue = formatter(state.secondValue);
      secondValueBubble.textContent = formattedSecondValue;
    }
  };
  
  /**
   * Shows or hides value bubble
   * @param bubbleElement Value bubble element
   * @param show Whether to show the bubble
   */
  const showValueBubble = (bubbleElement, show) => {
    if (!bubbleElement || !config.showValue) return;
    
    if (show) {
      bubbleElement.classList.add(`${state.component.getClass('slider-value')}--visible`);
    } else {
      bubbleElement.classList.remove(`${state.component.getClass('slider-value')}--visible`);
    }
  };
  
  /**
   * Generates tick marks and labels
   */
  const generateTicks = () => {
    // Remove existing ticks
    state.ticks.forEach(tick => {
      if (tick.parentNode) {
        tick.parentNode.removeChild(tick);
      }
    });
    
    state.tickLabels.forEach(label => {
      if (label.parentNode) {
        label.parentNode.removeChild(label);
      }
    });
    
    state.ticks = [];
    state.tickLabels = [];
    
    if (!config.ticks && !config.tickLabels) return;
    
    // Generate new ticks
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
    
    // Create ticks
    tickValues.forEach(value => {
      if (config.ticks) {
        const tick = document.createElement('div');
        tick.classList.add(state.component.getClass('slider-tick'));
        
        // Position tick
        const percent = getPercentage(value);
        if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
          tick.style.bottom = `${percent}%`;
        } else {
          tick.style.left = `${percent}%`;
        }
        
        // Set active class if value is in active range
        if (config.range && state.secondValue !== null) {
          const lowerValue = Math.min(state.value, state.secondValue);
          const higherValue = Math.max(state.value, state.secondValue);
          
          if (value >= lowerValue && value <= higherValue) {
            tick.classList.add(`${state.component.getClass('slider-tick')}--active`);
          }
        } else if (value <= state.value) {
          tick.classList.add(`${state.component.getClass('slider-tick')}--active`);
        }
        
        state.component.element.appendChild(tick);
        state.ticks.push(tick);
      }
      
      if (config.tickLabels) {
        const label = document.createElement('div');
        label.classList.add(state.component.getClass('slider-label'));
        
        // Position label
        const percent = getPercentage(value);
        if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
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
    // Update active ticks based on current value
    state.ticks.forEach((tick, index) => {
      const tickValue = state.min + (index * state.step);
      
      if (config.range && state.secondValue !== null) {
        // Range slider - ticks between the two values should be active
        const lowerValue = Math.min(state.value, state.secondValue);
        const higherValue = Math.max(state.value, state.secondValue);
        
        if (tickValue >= lowerValue && tickValue <= higherValue) {
          tick.classList.add(`${state.component.getClass('slider-tick')}--active`);
        } else {
          tick.classList.remove(`${state.component.getClass('slider-tick')}--active`);
        }
      } else {
        // Single slider - ticks below or equal to value should be active
        if (tickValue <= state.value) {
          tick.classList.add(`${state.component.getClass('slider-tick')}--active`);
        } else {
          tick.classList.remove(`${state.component.getClass('slider-tick')}--active`);
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