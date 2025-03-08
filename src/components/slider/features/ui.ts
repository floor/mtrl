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
      const thumbHeight = vertical ? thumbRect.width || 20 : thumbRect.height || 20; // For vertical slider, the T-shape width is key
      
      if (vertical) {
        const trackHeight = trackRect.height;
        
        // Calculate edge boundaries - account for the T-shaped thumb in vertical orientation
        // In vertical mode we need to use thumb's width as the constraint size
        const topEdge = trackRect.top + (thumbWidth / 2);
        const bottomEdge = trackRect.bottom - (thumbWidth / 2);
        const effectiveHeight = bottomEdge - topEdge;
        
        // Adjust the position to be within the effective track area
        const adjustedPosition = Math.max(topEdge, Math.min(bottomEdge, position));
        
        // For vertical sliders, the percentage increases from top to bottom but the value increases from bottom to top
        const percentageFromTop = (adjustedPosition - topEdge) / effectiveHeight;
        const percentageFromBottom = 1 - percentageFromTop;
        
        // Map the constrained percentage to the full value range
        return state.min + percentageFromBottom * range;
      } else {
        const trackWidth = trackRect.width;
        
        // Calculate edge boundaries
        const leftEdge = trackRect.left + (thumbWidth / 2);
        const rightEdge = trackRect.right - (thumbWidth / 2);
        const effectiveWidth = rightEdge - leftEdge;
        
        // Adjust the position to be within the effective track area
        const adjustedPosition = Math.max(leftEdge, Math.min(rightEdge, position));
        
        // Calculate percentage based on effective track area
        const percentageFromLeft = (adjustedPosition - leftEdge) / effectiveWidth;
        
        // Map the constrained percentage to the full value range
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
   * Sets thumb position based on a value percentage with proper edge mapping
   * @param thumbElement Thumb element to position
   * @param valueBubbleElement Value bubble element to position
   * @param valuePercent Percentage position (0-100)
   */
  const setThumbPosition = (thumbElement, valueBubbleElement, valuePercent) => {
    if (!thumbElement) return;
    
    // Determine the thumb width (needed for containment calculations)
    const thumbRect = thumbElement.getBoundingClientRect();
    const thumbWidth = thumbRect.width || 20; // Default to 20px if not available
    
    // Get track dimensions
    const trackRect = track.getBoundingClientRect();
    const trackWidth = trackRect.width;
    const trackHeight = trackRect.height;
    
    if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
      // For vertical T-shaped thumb, we need to use the width as the constraint dimension
      // since in vertical orientation, the thumb's horizontal bar becomes the vertical one
      const thumbConstraintSize = thumbRect.width || 20;
      
      // Calculate edge boundaries (accounting for the T-shaped thumb)
      const topEdge = 100 - ((thumbConstraintSize / 2) / trackHeight) * 100;
      const bottomEdge = ((thumbConstraintSize / 2) / trackHeight) * 100;
      
      // Calculate the visual range (the range where the thumb can visibly move)
      const visualRange = topEdge - bottomEdge;
      
      // Map the full value range (0-100) to the visual range
      // This ensures the thumb stays visually within bounds while the value covers the full range
      let adjustedPercent;
      if (valuePercent <= 0) {
        // At minimum value (bottom of slider)
        adjustedPercent = bottomEdge;
      } else if (valuePercent >= 100) {
        // At maximum value (top of slider)
        adjustedPercent = topEdge;
      } else {
        // Map value to visual range
        adjustedPercent = bottomEdge + (valuePercent / 100) * visualRange;
      }
      
      // Position from bottom
      thumbElement.style.bottom = `${adjustedPercent}%`;
      thumbElement.style.left = '50%'; // Keep it centered horizontally
      thumbElement.style.top = 'auto'; // Clear top property
      
      // Position value bubble if it exists
      if (valueBubbleElement) {
        valueBubbleElement.style.bottom = `${adjustedPercent}%`;
        valueBubbleElement.style.top = 'auto';
      }
    } else {
      // Calculate edge boundaries for horizontal slider
      const leftEdge = ((thumbWidth / 2) / trackWidth) * 100;
      const rightEdge = 100 - ((thumbWidth / 2) / trackWidth) * 100;
      
      // Calculate the visual range (the range where the thumb can visibly move)
      const visualRange = rightEdge - leftEdge;
      
      // Map the full value range (0-100) to the visual range
      // This ensures the thumb stays visually within bounds while the value covers the full range
      let adjustedPercent;
      if (valuePercent <= 0) {
        // At minimum value
        adjustedPercent = leftEdge;
      } else if (valuePercent >= 100) {
        // At maximum value
        adjustedPercent = rightEdge;
      } else {
        // Map value to visual range
        adjustedPercent = leftEdge + (valuePercent / 100) * visualRange;
      }
      
      // Position from left
      thumbElement.style.left = `${adjustedPercent}%`;
      
      // Position value bubble if it exists
      if (valueBubbleElement) {
        valueBubbleElement.style.left = `${adjustedPercent}%`;
      }
    }
  };

  /**
   * Updates start track styles - with proper thumb padding
   */
  const updateStartTrack = () => {
    if (!startTrack) return;
    
    // Get thumb dimensions
    const thumbRect = thumb.getBoundingClientRect();
    const thumbSize = config.orientation === SLIDER_ORIENTATIONS.VERTICAL 
      ? thumbRect.width || 20 
      : thumbRect.width || 20;
    
    // Get track dimensions
    const trackRect = track.getBoundingClientRect();
    const trackSize = config.orientation === SLIDER_ORIENTATIONS.VERTICAL 
      ? trackRect.height 
      : trackRect.width;
    
    // Calculate edge constraints
    const edgeConstraint = (thumbSize / 2) / trackSize * 100;
    
    // Add track-thumb padding (8px equivalent in percentage)
    const paddingAdjustment = 8; // 8px padding
    const paddingPercent = (paddingAdjustment / trackSize) * 100;
    
    if (config.range && state.secondValue !== null) {
      // For range slider, calculate the track from start to first thumb
      const lowerValue = Math.min(state.value, state.secondValue);
      let lowerPercent = getPercentage(lowerValue);
      
      // Map value percentage to visual percentage
      if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
        const bottomEdge = edgeConstraint;
        const topEdge = 100 - edgeConstraint;
        const visualRange = topEdge - bottomEdge;
        
        if (lowerPercent <= 0) {
          lowerPercent = bottomEdge;
        } else if (lowerPercent >= 100) {
          lowerPercent = topEdge;
        } else {
          lowerPercent = bottomEdge + (lowerPercent / 100) * visualRange;
        }
        
        // Add padding between track and thumb
        const adjustedPercent = Math.max(0, lowerPercent - paddingPercent);
        
        startTrack.style.display = 'block';
        startTrack.style.height = `${adjustedPercent}%`;
        startTrack.style.bottom = '0';
        startTrack.style.top = 'auto';
        startTrack.style.width = '100%';
        startTrack.style.left = '0';
      } else {
        const leftEdge = edgeConstraint;
        const rightEdge = 100 - edgeConstraint;
        const visualRange = rightEdge - leftEdge;
        
        if (lowerPercent <= 0) {
          lowerPercent = leftEdge;
        } else if (lowerPercent >= 100) {
          lowerPercent = rightEdge;
        } else {
          lowerPercent = leftEdge + (lowerPercent / 100) * visualRange;
        }
        
        // Add padding between track and thumb
        const adjustedPercent = Math.max(0, lowerPercent - paddingPercent);
        
        startTrack.style.display = 'block';
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
    if (!activeTrack) return;
    
    // Get thumb dimensions
    const thumbRect = thumb.getBoundingClientRect();
    const thumbSize = config.orientation === SLIDER_ORIENTATIONS.VERTICAL 
      ? thumbRect.width || 20 
      : thumbRect.width || 20;
    
    // Get track dimensions
    const trackRect = track.getBoundingClientRect();
    const trackSize = config.orientation === SLIDER_ORIENTATIONS.VERTICAL 
      ? trackRect.height 
      : trackRect.width;
    
    // Calculate edge constraints
    const edgeConstraint = (thumbSize / 2) / trackSize * 100;
    
    // Add track-thumb padding (8px equivalent in percentage)
    const paddingAdjustment = 8; // 8px padding
    const paddingPercent = (paddingAdjustment / trackSize) * 100;
    
    const isVertical = config.orientation === SLIDER_ORIENTATIONS.VERTICAL;
    
    if (config.range && state.secondValue !== null) {
      // Range slider (two thumbs)
      let lowerValue = Math.min(state.value, state.secondValue);
      let higherValue = Math.max(state.value, state.secondValue);
      let lowerPercent = getPercentage(lowerValue);
      let higherPercent = getPercentage(higherValue);
      
      // Map value percentages to visual percentages
      if (isVertical) {
        const bottomEdge = edgeConstraint;
        const topEdge = 100 - edgeConstraint;
        const visualRange = topEdge - bottomEdge;
        
        // Map lower value
        if (lowerPercent <= 0) {
          lowerPercent = bottomEdge;
        } else if (lowerPercent >= 100) {
          lowerPercent = topEdge;
        } else {
          lowerPercent = bottomEdge + (lowerPercent / 100) * visualRange;
        }
        
        // Map higher value
        if (higherPercent <= 0) {
          higherPercent = bottomEdge;
        } else if (higherPercent >= 100) {
          higherPercent = topEdge;
        } else {
          higherPercent = bottomEdge + (higherPercent / 100) * visualRange;
        }
        
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
        activeTrack.style.height = `${trackLength}%`;
        activeTrack.style.bottom = `${adjustedLowerPercent}%`;
        activeTrack.style.top = 'auto';
        activeTrack.style.width = '100%';
      } else {
        const leftEdge = edgeConstraint;
        const rightEdge = 100 - edgeConstraint;
        const visualRange = rightEdge - leftEdge;
        
        // Map lower value
        if (lowerPercent <= 0) {
          lowerPercent = leftEdge;
        } else if (lowerPercent >= 100) {
          lowerPercent = rightEdge;
        } else {
          lowerPercent = leftEdge + (lowerPercent / 100) * visualRange;
        }
        
        // Map higher value
        if (higherPercent <= 0) {
          higherPercent = leftEdge;
        } else if (higherPercent >= 100) {
          higherPercent = rightEdge;
        } else {
          higherPercent = leftEdge + (higherPercent / 100) * visualRange;
        }
        
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
        activeTrack.style.width = `${trackLength}%`;
        activeTrack.style.left = `${adjustedLowerPercent}%`;
        activeTrack.style.height = '100%';
      }
    } else {
      // Single thumb slider
      let valuePercent = getPercentage(state.value);
      
      if (isVertical) {
        const bottomEdge = edgeConstraint;
        const topEdge = 100 - edgeConstraint;
        const visualRange = topEdge - bottomEdge;
        
        // Map to visual percentage
        let visualPercent;
        if (valuePercent <= 0) {
          visualPercent = bottomEdge;
        } else if (valuePercent >= 100) {
          visualPercent = topEdge;
        } else {
          visualPercent = bottomEdge + (valuePercent / 100) * visualRange;
        }
        
        // Add padding between track and thumb
        const adjustedWidth = Math.max(0, visualPercent - paddingPercent);
        
        activeTrack.style.display = 'block';
        activeTrack.style.height = `${adjustedWidth}%`;
        activeTrack.style.bottom = '0';
        activeTrack.style.top = 'auto';
        activeTrack.style.width = '100%';
      } else {
        const leftEdge = edgeConstraint;
        const rightEdge = 100 - edgeConstraint;
        const visualRange = rightEdge - leftEdge;
        
        // Map to visual percentage
        let visualPercent;
        if (valuePercent <= 0) {
          visualPercent = leftEdge;
        } else if (valuePercent >= 100) {
          visualPercent = rightEdge;
        } else {
          visualPercent = leftEdge + (valuePercent / 100) * visualRange;
        }
        
        // Add padding between track and thumb
        const adjustedWidth = Math.max(0, visualPercent - paddingPercent);
        
        activeTrack.style.display = 'block';
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
    if (!remainingTrack) return;
    
    // Get thumb dimensions
    const thumbRect = thumb.getBoundingClientRect();
    const thumbSize = config.orientation === SLIDER_ORIENTATIONS.VERTICAL 
      ? thumbRect.width || 20 
      : thumbRect.width || 20;
    
    // Get track dimensions
    const trackRect = track.getBoundingClientRect();
    const trackSize = config.orientation === SLIDER_ORIENTATIONS.VERTICAL 
      ? trackRect.height 
      : trackRect.width;
    
    // Calculate edge constraints
    const edgeConstraint = (thumbSize / 2) / trackSize * 100;
    
    // Add track-thumb padding (8px equivalent in percentage)
    const paddingAdjustment = 8; // 8px padding
    const paddingPercent = (paddingAdjustment / trackSize) * 100;
    
    const isVertical = config.orientation === SLIDER_ORIENTATIONS.VERTICAL;
    
    if (config.range && state.secondValue !== null) {
      // Range slider (two thumbs)
      let higherValue = Math.max(state.value, state.secondValue);
      let higherPercent = getPercentage(higherValue);
      
      // Map value percentage to visual percentage
      if (isVertical) {
        const bottomEdge = edgeConstraint;
        const topEdge = 100 - edgeConstraint;
        const visualRange = topEdge - bottomEdge;
        
        // Map higher value
        let visualPercent;
        if (higherPercent <= 0) {
          visualPercent = bottomEdge;
        } else if (higherPercent >= 100) {
          visualPercent = topEdge;
        } else {
          visualPercent = bottomEdge + (higherPercent / 100) * visualRange;
        }
        
        // Add padding between track and thumb
        const adjustedPercent = visualPercent + paddingPercent;
        const remainingHeight = Math.max(0, 100 - adjustedPercent);
        
        remainingTrack.style.display = 'block';
        remainingTrack.style.height = `${remainingHeight}%`;
        remainingTrack.style.bottom = `${adjustedPercent}%`;
        remainingTrack.style.top = 'auto';
        remainingTrack.style.width = '100%';
      } else {
        const leftEdge = edgeConstraint;
        const rightEdge = 100 - edgeConstraint;
        const visualRange = rightEdge - leftEdge;
        
        // Map higher value
        let visualPercent;
        if (higherPercent <= 0) {
          visualPercent = leftEdge;
        } else if (higherPercent >= 100) {
          visualPercent = rightEdge;
        } else {
          visualPercent = leftEdge + (higherPercent / 100) * visualRange;
        }
        
        // Add padding between track and thumb
        const adjustedPercent = visualPercent + paddingPercent;
        const remainingWidth = Math.max(0, 100 - adjustedPercent);
        
        remainingTrack.style.display = 'block';
        remainingTrack.style.width = `${remainingWidth}%`;
        remainingTrack.style.left = `${adjustedPercent}%`;
        remainingTrack.style.height = '100%';
      }
    } else {
      // Single thumb slider
      let valuePercent = getPercentage(state.value);
      
      // Map value percentage to visual percentage
      if (isVertical) {
        const bottomEdge = edgeConstraint;
        const topEdge = 100 - edgeConstraint;
        const visualRange = topEdge - bottomEdge;
        
        // Map value
        let visualPercent;
        if (valuePercent <= 0) {
          visualPercent = bottomEdge;
        } else if (valuePercent >= 100) {
          visualPercent = topEdge;
        } else {
          visualPercent = bottomEdge + (valuePercent / 100) * visualRange;
        }
        
        // Add padding between track and thumb
        const adjustedPercent = visualPercent + paddingPercent;
        const remainingHeight = Math.max(0, 100 - adjustedPercent);
        
        remainingTrack.style.display = 'block';
        remainingTrack.style.height = `${remainingHeight}%`;
        remainingTrack.style.bottom = `${adjustedPercent}%`;
        remainingTrack.style.top = 'auto';
        remainingTrack.style.width = '100%';
      } else {
        const leftEdge = edgeConstraint;
        const rightEdge = 100 - edgeConstraint;
        const visualRange = rightEdge - leftEdge;
        
        // Map value
        let visualPercent;
        if (valuePercent <= 0) {
          visualPercent = leftEdge;
        } else if (valuePercent >= 100) {
          visualPercent = rightEdge;
        } else {
          visualPercent = leftEdge + (valuePercent / 100) * visualRange;
        }
        
        // Add padding between track and thumb
        const adjustedPercent = visualPercent + paddingPercent;
        const remainingWidth = Math.max(0, 100 - adjustedPercent);
        
        remainingTrack.style.display = 'block';
        remainingTrack.style.width = `${remainingWidth}%`;
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