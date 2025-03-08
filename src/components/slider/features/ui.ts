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
  // Early return with empty methods if component structure is missing
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
  
  // Extract component elements
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
   */
  const getPercentage = (value) => {
    const range = state.max - state.min;
    return range === 0 ? 0 : ((value - state.min) / range) * 100;
  };
  
  /**
   * Gets slider value from a position on the track
   */
  const getValueFromPosition = (position, vertical = false) => {
    if (!track) return state.min;
    
    try {
      const trackRect = track.getBoundingClientRect();
      const range = state.max - state.min;
      
      // Get thumb dimensions
      const thumbRect = thumb.getBoundingClientRect();
      const thumbSize = thumbRect.width || 20;
      
      if (vertical) {
        // Calculate edge boundaries for vertical slider
        const topEdge = trackRect.top + (thumbSize / 2);
        const bottomEdge = trackRect.bottom - (thumbSize / 2);
        const effectiveHeight = bottomEdge - topEdge;
        
        // Adjust position within track area
        const adjustedPosition = Math.max(topEdge, Math.min(bottomEdge, position));
        const percentageFromTop = (adjustedPosition - topEdge) / effectiveHeight;
        
        // Map percentage to value (reversed for vertical)
        return state.min + (1 - percentageFromTop) * range;
      } else {
        // Calculate edge boundaries for horizontal slider
        const leftEdge = trackRect.left + (thumbSize / 2);
        const rightEdge = trackRect.right - (thumbSize / 2);
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
   * Maps value percentage to visual percentage with edge constraints
   */
  const mapToVisualPercent = (valuePercent, thumbSize, trackSize) => {
    // Calculate edge constraint as percentage
    const edgeConstraint = (thumbSize / 2) / trackSize * 100;
    
    // Set edge boundaries
    const minEdge = edgeConstraint;
    const maxEdge = 100 - edgeConstraint;
    const visualRange = maxEdge - minEdge;
    
    // Map value to visual range
    if (valuePercent <= 0) return minEdge;
    if (valuePercent >= 100) return maxEdge;
    return minEdge + (valuePercent / 100) * visualRange;
  };
  
  /**
   * Gets track dimensions and constraints for positioning calculations
   */
  const getTrackDimensions = () => {
    if (!track || !thumb) return null;
    
    // Get dimensions
    const thumbRect = thumb.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const thumbSize = isVertical ? thumbRect.height || 20 : thumbRect.width || 20;
    const trackSize = isVertical ? trackRect.height : trackRect.width;
    
    // Calculate constraints
    const edgeConstraint = (thumbSize / 2) / trackSize * 100;
    const paddingAdjustment = 8; // 8px padding
    const paddingPercent = (paddingAdjustment / trackSize) * 100;
    
    return { thumbSize, trackSize, edgeConstraint, paddingPercent };
  };
  
  /**
   * Sets thumb position based on a value percentage
   */
  const setThumbPosition = (thumbElement, valueBubbleElement, valuePercent) => {
    if (!thumbElement || !track) return;
    
    // Get dimensions
    const dims = getTrackDimensions();
    if (!dims) return;
    
    // Map value to visual range
    const adjustedPercent = mapToVisualPercent(valuePercent, dims.thumbSize, dims.trackSize);
    
    if (isVertical) {
      // Position from bottom for vertical
      thumbElement.style.bottom = `${adjustedPercent}%`;
      thumbElement.style.left = '50%';
      thumbElement.style.top = 'auto';
      thumbElement.style.transform = 'translate(-50%, 50%)';
      
      // Position value bubble if it exists
      if (valueBubbleElement) {
        valueBubbleElement.style.bottom = `${adjustedPercent}%`;
        valueBubbleElement.style.top = 'auto';
        valueBubbleElement.style.transform = 'translateY(50%)';
      }
    } else {
      // Position from left for horizontal
      thumbElement.style.left = `${adjustedPercent}%`;
      thumbElement.style.transform = 'translate(-50%, -50%)';
      
      // Position value bubble if it exists
      if (valueBubbleElement) {
        valueBubbleElement.style.left = `${adjustedPercent}%`;
        valueBubbleElement.style.transform = 'translateX(-50%)';
      }
    }
  };
  
  /**
   * Updates start track styles (from beginning to first thumb in range slider)
   */
  const updateStartTrack = () => {
    if (!startTrack || !track || !thumb) return;
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    if (config.range && state.secondValue !== null) {
      // For range slider, calculate the track from start to first thumb
      const lowerValue = Math.min(state.value, state.secondValue);
      const lowerPercent = getPercentage(lowerValue);
      
      // Map percentage to visual range and add padding
      const adjustedPercent = Math.max(0, 
        mapToVisualPercent(lowerPercent, dims.thumbSize, dims.trackSize) - dims.paddingPercent
      );
      
      startTrack.style.display = 'block';
      
      if (isVertical) {
        startTrack.style.height = `${adjustedPercent}%`;
        startTrack.style.bottom = '0';
        startTrack.style.top = 'auto';
        startTrack.style.width = '100%';
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
   * Updates active track styles
   */
  const updateActiveTrack = () => {
    if (!activeTrack || !track || !thumb) return;
    
    const dims = getTrackDimensions();
    if (!dims) return;
    
    if (config.range && state.secondValue !== null) {
      // Range slider (two thumbs)
      const lowerValue = Math.min(state.value, state.secondValue);
      const higherValue = Math.max(state.value, state.secondValue);
      const lowerPercent = getPercentage(lowerValue);
      const higherPercent = getPercentage(higherValue);
      
      // Map percentages to visual range with padding
      const adjustedLowerPercent = mapToVisualPercent(lowerPercent, dims.thumbSize, dims.trackSize) + dims.paddingPercent;
      const adjustedHigherPercent = mapToVisualPercent(higherPercent, dims.thumbSize, dims.trackSize) - dims.paddingPercent;
      
      // Calculate track length
      let trackLength = Math.max(0, adjustedHigherPercent - adjustedLowerPercent);
      if (higherPercent - lowerPercent < dims.paddingPercent * 2) {
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
      const valuePercent = getPercentage(state.value);
      const adjustedWidth = Math.max(0, 
        mapToVisualPercent(valuePercent, dims.thumbSize, dims.trackSize) - dims.paddingPercent
      );
      
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
    
    if (config.range && state.secondValue !== null) {
      // Range slider (two thumbs)
      const higherValue = Math.max(state.value, state.secondValue);
      const higherPercent = getPercentage(higherValue);
      
      // Map percentage to visual range with padding
      const adjustedPercent = mapToVisualPercent(higherPercent, dims.thumbSize, dims.trackSize) + dims.paddingPercent;
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
      const valuePercent = getPercentage(state.value);
      const adjustedPercent = mapToVisualPercent(valuePercent, dims.thumbSize, dims.trackSize) + dims.paddingPercent;
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