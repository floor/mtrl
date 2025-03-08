// src/components/slider/features/structure.ts
import { SLIDER_COLORS, SLIDER_SIZES } from '../constants';
import { SliderConfig } from '../types';

// Accessibility Enhancement: Focus directly on thumb

/**
 * Creates the slider DOM structure following MD3 principles with improved accessibility
 * @param config Slider configuration
 * @returns Component enhancer with DOM structure
 */
export const withStructure = (config: SliderConfig) => component => {
  // Set default values
  const min = config.min || 0;
  const max = config.max || 100;
  const range = max - min;
  const value = config.value !== undefined ? config.value : min;
  const secondValue = config.secondValue !== undefined ? config.secondValue : null;
  const isRangeSlider = config.range && secondValue !== null;
  
  // Helper function to calculate percentage
  const getPercentage = (val) => ((val - min) / range) * 100;
  const valuePercent = getPercentage(value);
  
  // Create track element and segments
  const track = createElement('slider-track');
  const remainingTrack = createElement('slider-remaining-track');
  const startTrack = createElement('slider-start-track');
  const activeTrack = createElement('slider-active-track');
  
  // Create ticks container
  const ticksContainer = createElement('slider-ticks-container');
  
  // Create dots for track ends
  const startDot = createElement('slider-dot');
  startDot.classList.add(component.getClass('slider-dot--start'));
  
  const endDot = createElement('slider-dot');
  endDot.classList.add(component.getClass('slider-dot--end'));
  
  // Create value bubble and format the value
  const formatter = config.valueFormatter || (val => val.toString());
  const valueBubble = createElement('slider-value');
  valueBubble.textContent = formatter(value);
  
  // Create thumb element with improved accessibility attributes
  const thumb = createElement('slider-thumb');
  thumb.setAttribute('tabindex', '0');
  thumb.setAttribute('role', 'slider');
  thumb.setAttribute('aria-valuemin', String(min));
  thumb.setAttribute('aria-valuemax', String(max));
  thumb.setAttribute('aria-valuenow', String(value));
  thumb.setAttribute('aria-orientation', 'horizontal');
  
  // Set initial thumb position
  thumb.style.left = `${valuePercent}%`;
  
  // Calculate padding adjustment (8px equivalent as percentage)
  const paddingAdjustment = 8; // 8px padding
  const estimatedTrackSize = 300; // A reasonable guess at track width
  const paddingPercent = (paddingAdjustment / estimatedTrackSize) * 100;
  
  // Create second thumb and value bubble for range slider
  let secondThumb = null;
  let secondValueBubble = null;
  
  if (isRangeSlider) {
    secondThumb = createElement('slider-thumb');
    secondThumb.setAttribute('tabindex', '0');
    secondThumb.setAttribute('role', 'slider');
    secondThumb.setAttribute('aria-valuemin', String(min));
    secondThumb.setAttribute('aria-valuemax', String(max));
    secondThumb.setAttribute('aria-valuenow', String(secondValue));
    secondThumb.setAttribute('aria-orientation', 'horizontal');
    
    const secondPercent = getPercentage(secondValue);
    secondThumb.style.left = `${secondPercent}%`;
    
    secondValueBubble = createElement('slider-value');
    secondValueBubble.textContent = formatter(secondValue);
  }
  
  // Set initial track segment dimensions
  setupInitialTrackSegments();
  
  // Add tracks to container
  track.appendChild(remainingTrack);
  track.appendChild(startTrack);
  track.appendChild(activeTrack);
  
  // Add elements to the slider
  component.element.classList.add(component.getClass('slider'));
  
  // Accessibility enhancement: Set the slider container to not be focusable
  component.element.setAttribute('tabindex', '-1');
  
  component.element.appendChild(track);
  component.element.appendChild(ticksContainer); // Add ticks container
  component.element.appendChild(startDot);
  component.element.appendChild(endDot);
  component.element.appendChild(thumb);
  component.element.appendChild(valueBubble);
  
  if (isRangeSlider && secondThumb && secondValueBubble) {
    component.element.classList.add(`${component.getClass('slider')}--range`);
    component.element.appendChild(secondThumb);
    component.element.appendChild(secondValueBubble);
  }
  
  // Apply styling classes
  applyStyleClasses();
  
  // Schedule UI update after DOM is attached
  setTimeout(() => {
    component.slider?.updateUi?.();
  }, 0);
  
  // Return enhanced component with structure
  return {
    ...component,
    structure: {
      track,
      activeTrack,
      startTrack,
      remainingTrack,
      ticksContainer,
      thumb,
      valueBubble,
      secondThumb,
      secondValueBubble,
      startDot,
      endDot
    }
  };
  
  /**
   * Creates DOM element with slider class
   * @param className Base class name
   * @returns DOM element
   */
  function createElement(className) {
    const element = document.createElement('div');
    element.classList.add(component.getClass(className));
    return element;
  }
  
  /**
   * Sets up initial track segment positions and dimensions
   */
  function setupInitialTrackSegments() {
    if (isRangeSlider) {
      // Range slider with two thumbs
      const lowerValue = Math.min(value, secondValue);
      const higherValue = Math.max(value, secondValue);
      const lowerPercent = getPercentage(lowerValue);
      const higherPercent = getPercentage(higherValue);
      
      // Adjust positions to account for spacing
      let adjustedLowerPercent = lowerPercent + paddingPercent;
      let adjustedHigherPercent = higherPercent - paddingPercent;
      
      // Handle case when thumbs are very close
      if (adjustedHigherPercent <= adjustedLowerPercent) {
        adjustedLowerPercent = (lowerPercent + higherPercent) / 2 - 1;
        adjustedHigherPercent = (lowerPercent + higherPercent) / 2 + 1;
      }
      
      // Calculate segment sizes
      const startWidth = Math.max(0, lowerPercent - paddingPercent);
      const activeWidth = Math.max(0, adjustedHigherPercent - adjustedLowerPercent);
      const remainingWidth = Math.max(0, 100 - higherPercent - paddingPercent);
      
      // Set styles
      startTrack.style.display = 'block';
      activeTrack.style.display = 'block';
      remainingTrack.style.display = 'block';
      
      // Horizontal orientation
      setTrackStyles(startTrack, startWidth, 0);
      setTrackStyles(activeTrack, activeWidth, adjustedLowerPercent);
      setTrackStyles(remainingTrack, remainingWidth, higherPercent + paddingPercent);
    } else {
      // Single thumb slider
      const adjustedWidth = Math.max(0, valuePercent - paddingPercent);
      const remainingWidth = Math.max(0, 100 - valuePercent - paddingPercent);
      
      // Hide start track for single thumb
      startTrack.style.display = 'none';
      activeTrack.style.display = 'block';
      remainingTrack.style.display = 'block';
      
      // Horizontal orientation
      setTrackStyles(activeTrack, adjustedWidth, 0);
      setTrackStyles(remainingTrack, remainingWidth, valuePercent + paddingPercent);
    }
  }
  
  /**
   * Sets styles for track segments
   * @param element Track segment element
   * @param width Width as percentage
   * @param left Left position as percentage
   */
  function setTrackStyles(element, width, left) {
    element.style.width = `${width}%`;
    element.style.left = `${left}%`;
    element.style.height = '100%';
  }
  
  /**
   * Applies style classes based on configuration
   */
  function applyStyleClasses() {
    const baseClass = component.getClass('slider');
    
    // Apply size class
    const size = config.size || SLIDER_SIZES.MEDIUM;
    if (size !== SLIDER_SIZES.MEDIUM) {
      component.element.classList.add(`${baseClass}--${size}`);
    }
    
    // Apply color class
    const color = config.color || SLIDER_COLORS.PRIMARY;
    if (color !== SLIDER_COLORS.PRIMARY) {
      component.element.classList.add(`${baseClass}--${color}`);
    }
    
    // Apply discrete class if step is specified
    if (config.step !== undefined && config.step > 0) {
      component.element.classList.add(`${baseClass}--discrete`);
    }
    
    // Apply disabled class if needed
    if (config.disabled) {
      component.element.classList.add(`${baseClass}--disabled`);
    }
  }
};