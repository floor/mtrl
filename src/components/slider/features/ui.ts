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
  if (!state.component?.structure) {
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
    secondValueBubble
  } = state.component.structure;
  
  const isVertical = config.orientation === SLIDER_ORIENTATIONS.VERTICAL;
  
  /**
   * Calculates percentage position for a value
   * @param value Value to convert to percentage
   * @returns Percentage position (0-100)
   */
  const getPercentage = (value) => {
    const range = state.max - state.min;
    return range === 0 ? 0 : ((value - state.min) / range) * 100;
  };
  
  /**
   * Gets slider value from a position on the track, accounting for thumb edge constraints
   * @param position Screen coordinate (clientX/clientY)
   * @param vertical Whether slider is vertical
   * @returns Calculated value
   */
  const getValueFromPosition = (position, vertical = false) => {
    if (!track) return state.min;
    
    try {
      const trackRect = track.getBoundingClientRect();
      const range = state.max - state.min;
      
      // Get thumb dimensions
      const thumbRect = thumb.getBoundingClientRect();
      const thumbWidth = thumbRect.width || 20;
      const thumbHeight = vertical ? thumbRect.width || 20 : thumbRect.height || 20;
      
      if (vertical) {
        // Calculate edge boundaries for vertical slider
        const topEdge = trackRect.top + (thumbWidth / 2);
        const bottomEdge = trackRect.bottom - (thumbWidth / 2);
        const effectiveHeight = bottomEdge - topEdge;
        
        // Adjust position within track area
        const adjustedPosition = Math.max(topEdge, Math.min(bottomEdge, position));
        const percentageFromTop = (adjustedPosition - topEdge) / effectiveHeight;
        
        // Map percentage to value (reversed for vertical)
        return state.min + (1 - percentageFromTop) * range;
      } else {
        // Calculate edge boundaries for horizontal slider
        const leftEdge = trackRect.left + (thumbWidth / 2);
        const rightEdge = trackRect.right - (thumbWidth / 2);
        const effectiveWidth = rightEdge - leftEdge;
        
        // Adjust position within track area
        const adjustedPosition = Math.max(leftEdge, Math.min(rightEdge, position));
        const percentageFromLeft = (adjustedPosition - leftEdge) / effectiveWidth;
        
        // Map percentage to value
        return state.min + percentageFromLeft * range;
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
   * Maps value percentage to visual percentage considering edge constraints
   * @param valuePercent Value percentage (0-100)
   * @param isVertical Whether orientation is vertical
   * @param thumbSize Thumb size for constraints
   * @param trackSize Track size for constraints
   * @returns Adjusted visual percentage
   */
  const mapValueToVisualPercent = (valuePercent, isVertical, thumbSize, trackSize) => {
    // Calculate edge constraint as percentage
    const edgeConstraint = (thumbSize / 2) / trackSize * 100;
    
    // Set edge boundaries based on orientation
    const minEdge = edgeConstraint;
    const maxEdge = 100 - edgeConstraint;
    const visualRange = maxEdge - minEdge;
    
    // Map value to visual range
    if (valuePercent <= 0) {
      return minEdge;
    } else if (valuePercent >= 100) {
      return maxEdge;
    } else {
      return minEdge + (valuePercent / 100) * visualRange;
    }
  };
  
  /**
   * Sets thumb position based on a value percentage with proper edge mapping
   * @param thumbElement Thumb element to position
   * @param valueBubbleElement Value bubble element to position
   * @param valuePercent Percentage position (0-100)
   */
  const setThumbPosition = (thumbElement, valueBubbleElement, valuePercent) => {
    if (!thumbElement || !track) return;
    
    // Get dimensions
    const thumbRect = thumbElement.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const thumbSize = thumbRect.width || 20;
    const trackSize = isVertical ? trackRect.height : trackRect.width;
    
    // Map value percentage to visual percentage
    const adjustedPercent = mapValueToVisualPercent(valuePercent, isVertical, thumbSize, trackSize);
    
    if (isVertical) {
      // Position from bottom for vertical
      thumbElement.style.bottom = `${adjustedPercent}%`;
      thumbElement.style.left = '50%';
      thumbElement.style.top = 'auto';
      
      // Position value bubble if it exists
      if (valueBubbleElement) {
        valueBubbleElement.style.bottom = `${adjustedPercent}%`;
        valueBubbleElement.style.top = 'auto';
      }
    } else {
      // Position from left for horizontal
      thumbElement.style.left = `${adjustedPercent}%`;
      
      // Position value bubble if it exists
      if (valueBubbleElement) {
        valueBubbleElement.style.left = `${adjustedPercent}%`;
      }
    }
  };

  /**
   * Gets track dimensions and constraints for positioning calculations
   * @returns Object with track dimensions and constraints
   */
  const getTrackDimensions = () => {
    if (!track || !thumb) return null;
    
    // Get dimensions
    const thumbRect = thumb.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const thumbSize = isVertical ? thumbRect.width || 20 : thumbRect.width || 20;
    const trackSize = isVertical ? trackRect.height : trackRect.width;
    
    // Calculate constraints
    const edgeConstraint = (thumbSize / 2) / trackSize * 100;
    const paddingAdjustment = 8; // 8px padding
    const paddingPercent = (paddingAdjustment / trackSize) * 100;
    
    return { thumbSize, trackSize, edgeConstraint, paddingPercent };
  };

  /**
   * Updates start track styles - with proper thumb padding
   */
  const updateStartTrack = () => {
    if (!startTrack || !track || !thumb) return;
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    const { paddingPercent } = dims;
    
    if (config.range && state.secondValue !== null) {
      // For range slider, calculate the track from start to first thumb
      const lowerValue = Math.min(state.value, state.secondValue);
      let lowerPercent = getPercentage(lowerValue);
      
      // Map value percentage to visual percentage
      const { thumbSize, trackSize } = dims;
      lowerPercent = mapValueToVisualPercent(lowerPercent, isVertical, thumbSize, trackSize);
      
      // Add padding between track and thumb
      const adjustedPercent = Math.max(0, lowerPercent - paddingPercent);
      
      startTrack.style.display = 'block';
      
      if (isVertical) {
        startTrack.style.height = `${adjustedPercent}%`;
        startTrack.style.bottom = '0';
        startTrack.style.top = 'auto';
        startTrack.style.width = '100%';
        startTrack.style.left = '0';
      } else {
        startTrack.style.width = `${adjustedPercent}%`;
        startTrack.style.left = '0';
        startTrack.style.height = '100%';
      }
    } else {
      // For single thumb slider, no start track needed
      startTrack.style.display = 'none';
    }
  };

  /**
   * Updates active track styles - aligned with the new thumb positioning and with padding
   */
  const updateActiveTrack = () => {
    if (!activeTrack || !track || !thumb) return;
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    const { thumbSize, trackSize, paddingPercent } = dims;
    
    if (config.range && state.secondValue !== null) {
      // Range slider (two thumbs)
      let lowerValue = Math.min(state.value, state.secondValue);
      let higherValue = Math.max(state.value, state.secondValue);
      let lowerPercent = getPercentage(lowerValue);
      let higherPercent = getPercentage(higherValue);
      
      // Map value percentages to visual percentages
      lowerPercent = mapValueToVisualPercent(lowerPercent, isVertical, thumbSize, trackSize);
      higherPercent = mapValueToVisualPercent(higherPercent, isVertical, thumbSize, trackSize);
      
      // Add padding between track and thumbs
      const adjustedLowerPercent = lowerPercent + paddingPercent;
      const adjustedHigherPercent = higherPercent - paddingPercent;
      
      // Ensure there's at least a minimal gap even when thumbs are close
      let trackLength = Math.max(0, adjustedHigherPercent - adjustedLowerPercent);
      if (higherPercent - lowerPercent < paddingPercent * 2) {
        // Thumbs are very close, show minimal track
        trackLength = Math.max(0, higherPercent - lowerPercent);
      }
      
      activeTrack.style.display = 'block';
      
      if (isVertical) {
        activeTrack.style.height = `${trackLength}%`;
        activeTrack.style.bottom = `${adjustedLowerPercent}%`;
        activeTrack.style.top = 'auto';
        activeTrack.style.width = '100%';
      } else {
        activeTrack.style.width = `${trackLength}%`;
        activeTrack.style.left = `${adjustedLowerPercent}%`;
        activeTrack.style.height = '100%';
      }
    } else {
      // Single thumb slider
      let valuePercent = getPercentage(state.value);
      
      // Map to visual percentage
      valuePercent = mapValueToVisualPercent(valuePercent, isVertical, thumbSize, trackSize);
      
      // Add padding between track and thumb
      const adjustedWidth = Math.max(0, valuePercent - paddingPercent);
      
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
   * Updates remaining track styles - with proper thumb padding
   */
  const updateRemainingTrack = () => {
    if (!remainingTrack || !track || !thumb) return;
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    const { thumbSize, trackSize, paddingPercent } = dims;
    
    if (config.range && state.secondValue !== null) {
      // Range slider (two thumbs)
      let higherValue = Math.max(state.value, state.secondValue);
      let higherPercent = getPercentage(higherValue);
      
      // Map value percentage to visual percentage
      higherPercent = mapValueToVisualPercent(higherPercent, isVertical, thumbSize, trackSize);
      
      // Add padding between track and thumb
      const adjustedPercent = higherPercent + paddingPercent;
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
    } else {
      // Single thumb slider
      let valuePercent = getPercentage(state.value);
      
      // Map value percentage to visual percentage
      valuePercent = mapValueToVisualPercent(valuePercent, isVertical, thumbSize, trackSize);
      
      // Add padding between track and thumb
      const adjustedPercent = valuePercent + paddingPercent;
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
    
    const visibleClass = `${state.component.getClass('slider-value')}--visible`;
    bubbleElement.classList[show ? 'add' : 'remove'](visibleClass);
  };
  
  /**
   * Generates tick marks and labels
   */
  const generateTicks = () => {
    // Remove existing ticks
    state.ticks.forEach(tick => tick.parentNode?.removeChild(tick));
    state.tickLabels.forEach(label => label.parentNode?.removeChild(label));
    
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
    
    // Create ticks and labels
    tickValues.forEach(value => {
      // Get tick position
      const percent = getPercentage(value);
      
      // Create tick mark if enabled
      if (config.ticks) {
        const tick = document.createElement('div');
        tick.classList.add(state.component.getClass('slider-tick'));
        
        // Position tick
        if (isVertical) {
          tick.style.bottom = `${percent}%`;
        } else {
          tick.style.left = `${percent}%`;
        }
        
        // Set active class
        const activeClass = `${state.component.getClass('slider-tick')}--active`;
        if (config.range && state.secondValue !== null) {
          const lowerValue = Math.min(state.value, state.secondValue);
          const higherValue = Math.max(state.value, state.secondValue);
          
          if (value >= lowerValue && value <= higherValue) {
            tick.classList.add(activeClass);
          }
        } else if (value <= state.value) {
          tick.classList.add(activeClass);
        }
        
        state.component.element.appendChild(tick);
        state.ticks.push(tick);
      }
      
      // Create label if enabled
      if (config.tickLabels) {
        const label = document.createElement('div');
        label.classList.add(state.component.getClass('slider-label'));
        
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
    // Update active ticks based on current value
    state.ticks.forEach((tick, index) => {
      const tickValue = state.min + (index * state.step);
      const activeClass = `${state.component.getClass('slider-tick')}--active`;
      
      if (config.range && state.secondValue !== null) {
        // Range slider - ticks between values should be active
        const lowerValue = Math.min(state.value, state.secondValue);
        const higherValue = Math.max(state.value, state.secondValue);
        
        if (tickValue >= lowerValue && tickValue <= higherValue) {
          tick.classList.add(activeClass);
        } else {
          tick.classList.remove(activeClass);
        }
      } else {
        // Single slider - ticks below value should be active
        if (tickValue <= state.value) {
          tick.classList.add(activeClass);
        } else {
          tick.classList.remove(activeClass);
        }
      }
    });
  };
  
  /**
   * Updates all UI elements
   */
  const updateUi = () => {
    updateThumbPositions();
    updateStartTrack(); // Call BEFORE updateActiveTrack
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