// src/components/slider/features/structure.ts
import { SLIDER_COLORS, SLIDER_SIZES } from '../constants';
import { SliderConfig } from '../types';

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
  const isDisabled = config.disabled === true;
  
  // Helper function to calculate percentage
  const getPercentage = (val) => ((val - min) / range) * 100;
  const valuePercent = getPercentage(value);
  
  // Create container for all slider elements
  const container = createElement('slider-container');
  
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
  
  // Create handle element with improved accessibility attributes
  const handle = createElement('slider-handle');
  handle.setAttribute('role', 'slider');
  handle.setAttribute('aria-valuemin', String(min));
  handle.setAttribute('aria-valuemax', String(max));
  handle.setAttribute('aria-valuenow', String(value));
  handle.setAttribute('aria-orientation', 'horizontal');
  
  // Set tabindex based on disabled state
  handle.setAttribute('tabindex', isDisabled ? '-1' : '0');
  if (isDisabled) {
    handle.setAttribute('aria-disabled', 'true');
  }
  
  // Set initial handle position
  handle.style.left = `${valuePercent}%`;
  
  // Calculate padding adjustment (8px equivalent as percentage)
  const paddingAdjustment = 8; // 8px padding
  const estimatedTrackSize = 300; // A reasonable guess at track width
  const paddingPercent = (paddingAdjustment / estimatedTrackSize) * 100;
  
  // Create second handle and value bubble for range slider
  let secondHandle = null;
  let secondValueBubble = null;
  
  if (isRangeSlider) {
    secondHandle = createElement('slider-handle');
    secondHandle.setAttribute('role', 'slider');
    secondHandle.setAttribute('aria-valuemin', String(min));
    secondHandle.setAttribute('aria-valuemax', String(max));
    secondHandle.setAttribute('aria-valuenow', String(secondValue));
    secondHandle.setAttribute('aria-orientation', 'horizontal');
    
    // Set tabindex based on disabled state
    secondHandle.setAttribute('tabindex', isDisabled ? '-1' : '0');
    if (isDisabled) {
      secondHandle.setAttribute('aria-disabled', 'true');
    }
    
    const secondPercent = getPercentage(secondValue);
    secondHandle.style.left = `${secondPercent}%`;
    
    secondValueBubble = createElement('slider-value');
    secondValueBubble.textContent = formatter(secondValue);
  }
  
  // Set initial track segment dimensions
  setupInitialTrackSegments();
  
  // Add tracks to container
  track.appendChild(remainingTrack);
  track.appendChild(startTrack);
  track.appendChild(activeTrack);
  
  // Add elements to the slider container
  container.appendChild(track);
  container.appendChild(ticksContainer); // Add ticks container
  container.appendChild(startDot);
  container.appendChild(endDot);
  container.appendChild(handle);
  container.appendChild(valueBubble);
  
  if (isRangeSlider && secondHandle && secondValueBubble) {
    container.appendChild(secondHandle);
    container.appendChild(secondValueBubble);
  }
  
  // Add component base class
  component.element.classList.add(component.getClass('slider'));
  
  // Accessibility enhancement: Container is not focusable
  component.element.setAttribute('tabindex', '-1');
  
  // Set container aria attributes
  component.element.setAttribute('role', 'none');
  component.element.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
  
  // Check if there's an icon and ensure it's positioned properly
  const iconElement = component.element.querySelector(`.${component.getClass('icon')}`);
  if (iconElement && config.label) {
    // Add class to help position the icon correctly
    iconElement.classList.add(component.getClass('slider-icon'));
    
    // If icon should be positioned at start, ensure it's the first element
    if (iconElement) {
      // Set left spacing class
      component.element.classList.add(component.getClass('slider--icon'));
    } else {
      // Set right spacing class
      component.element.classList.add(component.getClass('slider--with-end-icon'));
    }
  }
  
  // Add the slider container
  component.element.appendChild(container);
  
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
      container,
      track,
      activeTrack,
      startTrack,
      remainingTrack,
      ticksContainer,
      handle,
      valueBubble,
      secondHandle,
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
      // Range slider with two handles
      const lowerValue = Math.min(value, secondValue);
      const higherValue = Math.max(value, secondValue);
      const lowerPercent = getPercentage(lowerValue);
      const higherPercent = getPercentage(higherValue);
      
      // Adjust positions to account for spacing
      let adjustedLowerPercent = lowerPercent + paddingPercent;
      let adjustedHigherPercent = higherPercent - paddingPercent;
      
      // Handle case when handles are very close
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
      // Single handle slider
      const adjustedWidth = Math.max(0, valuePercent - paddingPercent);
      const remainingWidth = Math.max(0, 100 - valuePercent - paddingPercent);
      
      // Hide start track for single handle
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
    if (isDisabled) {
      component.element.classList.add(`${baseClass}--disabled`);
    }
    
    // Apply range class if needed
    if (isRangeSlider) {
      component.element.classList.add(`${baseClass}--range`);
    }
  }
};