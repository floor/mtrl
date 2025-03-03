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
      updateRemainingTrack: () => {}, // New method for remaining track
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
    remainingTrack,
    thumb,
    valueBubble,
    secondThumb,
    secondValueBubble
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
    
    const remainder = (value - state.min) % step;
    if (remainder === 0) return value;
    
    const roundedValue = remainder >= step / 2
      ? value + step - remainder
      : value - remainder;
    
    return clamp(roundedValue, state.min, state.max);
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
   * Sets thumb position based on a value percentage
   * @param thumbElement Thumb element to position
   * @param valueBubbleElement Value bubble element to position
   * @param valuePercent Percentage position (0-100)
   */
  const setThumbPosition = (thumbElement, valueBubbleElement, valuePercent) => {
    if (!thumbElement) return;
    
    if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
      // Fix for vertical slider - position from bottom using absolute positioning
      thumbElement.style.bottom = `${valuePercent}%`;
      thumbElement.style.left = '50%'; // Keep it centered horizontally
      thumbElement.style.top = 'auto'; // Clear top property to prevent conflicts
      
      if (valueBubbleElement) {
        valueBubbleElement.style.bottom = `${valuePercent}%`;
        valueBubbleElement.style.top = 'auto';
      }
    } else {
      thumbElement.style.left = `${valuePercent}%`;
      if (valueBubbleElement) {
        valueBubbleElement.style.left = `${valuePercent}%`;
      }
    }
  };
  
  /**
   * Updates active track styles
   */
  const updateActiveTrack = () => {
    if (!activeTrack) return;
    
    if (config.range && state.secondValue !== null) {
      // Range slider (two thumbs)
      const lowerValue = Math.min(state.value, state.secondValue);
      const higherValue = Math.max(state.value, state.secondValue);
      const lowerPercent = getPercentage(lowerValue);
      const higherPercent = getPercentage(higherValue);
      const trackLength = higherPercent - lowerPercent;
      
      if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
        activeTrack.style.height = `${trackLength}%`;
        activeTrack.style.bottom = `${lowerPercent}%`;
        activeTrack.style.top = 'auto'; // Clear top property
      } else {
        activeTrack.style.width = `${trackLength}%`;
        activeTrack.style.left = `${lowerPercent}%`;
      }
    } else {
      // Single thumb slider
      const percent = getPercentage(state.value);
      
      if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
        activeTrack.style.height = `${percent}%`;
        activeTrack.style.bottom = '0';
        activeTrack.style.top = 'auto'; // Clear top property
      } else {
        activeTrack.style.width = `${percent}%`;
        activeTrack.style.left = '0';
      }
    }
  };
  
  /**
   * Updates remaining track styles (new for MD3)
   */
  const updateRemainingTrack = () => {
    if (!remainingTrack) return;
    
    if (config.range && state.secondValue !== null) {
      // Range slider (two thumbs)
      const lowerValue = Math.min(state.value, state.secondValue);
      const higherValue = Math.max(state.value, state.secondValue);
      const lowerPercent = getPercentage(lowerValue);
      const higherPercent = getPercentage(higherValue);
      
      if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
        // Bottom part
        remainingTrack.style.height = `${lowerPercent}%`;
        remainingTrack.style.bottom = '0';
        remainingTrack.style.top = 'auto';
      } else {
        // Right part
        remainingTrack.style.width = `${100 - higherPercent}%`;
        remainingTrack.style.left = `${higherPercent}%`;
      }
    } else {
      // Single thumb slider
      const percent = getPercentage(state.value);
      
      if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
        // Top part
        remainingTrack.style.height = `${100 - percent}%`;
        remainingTrack.style.bottom = `${percent}%`;
        remainingTrack.style.top = 'auto';
        remainingTrack.style.width = '100%'; // Ensure width is set
      } else {
        // Right part
        remainingTrack.style.width = `${100 - percent}%`;
        remainingTrack.style.left = `${percent}%`;
        remainingTrack.style.height = '100%'; // Ensure height is set
        remainingTrack.style.display = 'block'; // Force display
      }
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
    updateActiveTrack();
    updateRemainingTrack(); // Add remaining track update
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
    updateRemainingTrack, // Add new method to public API
    updateThumbPositions,
    updateValueBubbles,
    showValueBubble,
    generateTicks,
    updateTicks,
    updateUi
  };
};