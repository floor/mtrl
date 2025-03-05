// src/components/slider/features/structure.ts - Fixed track initialization
import { SLIDER_COLORS, SLIDER_SIZES, SLIDER_ORIENTATIONS } from '../constants';
import { SliderConfig } from '../types';

/**
 * Creates the slider DOM structure following MD3 principles
 * @param config Slider configuration
 * @returns Component enhancer with DOM structure
 */
export const withStructure = (config: SliderConfig) => component => {
  // Create track element
  const track = document.createElement('div');
  track.classList.add(component.getClass('slider-track'));
  
  // Calculate initial percentages based on values
  const min = config.min || 0;
  const max = config.max || 100;
  const range = max - min;
  
  // Set default values
  const value = config.value !== undefined ? config.value : min;
  const secondValue = config.secondValue !== undefined ? config.secondValue : null;
  
  // Calculate percentages
  const getPercentage = (val) => ((val - min) / range) * 100;
  const valuePercent = getPercentage(value);
  
  // Create remaining track element (fills entire width initially)
  const remainingTrack = document.createElement('div');
  remainingTrack.classList.add(component.getClass('slider-remaining-track'));
  
  // Create start track element (for range slider)
  const startTrack = document.createElement('div');
  startTrack.classList.add(component.getClass('slider-start-track'));
  
  // Create active track element (filled part)
  const activeTrack = document.createElement('div');
  activeTrack.classList.add(component.getClass('slider-active-track'));
  
  // Calculate padding adjustment (8px equivalent as percentage)
  // We'll do a rough estimate initially, then recalculate once rendered
  const paddingAdjustment = 8; // 8px padding
  const estimatedTrackSize = 300; // A reasonable guess at track width
  const paddingPercent = (paddingAdjustment / estimatedTrackSize) * 100;
  
  // Set initial dimensions for all track segments
  if (config.range && secondValue !== null) {
    // Range slider
    const lowerValue = Math.min(value, secondValue);
    const higherValue = Math.max(value, secondValue);
    const lowerPercent = getPercentage(lowerValue);
    const higherPercent = getPercentage(higherValue);
    
    // Adjust positions and width to account for spacing
    let adjustedLowerPercent = lowerPercent + paddingPercent;
    let adjustedHigherPercent = higherPercent - paddingPercent;
    
    if (adjustedHigherPercent <= adjustedLowerPercent) {
      adjustedLowerPercent = (lowerPercent + higherPercent) / 2 - 1;
      adjustedHigherPercent = (lowerPercent + higherPercent) / 2 + 1;
    }
    
    // Calculate track segment sizes
    const startWidth = Math.max(0, lowerPercent - paddingPercent);
    const activeWidth = Math.max(0, adjustedHigherPercent - adjustedLowerPercent);
    const remainingWidth = Math.max(0, 100 - higherPercent - paddingPercent);
    
    if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
      // Vertical orientation
      startTrack.style.display = 'block';
      startTrack.style.height = `${startWidth}%`;
      startTrack.style.bottom = '0';
      startTrack.style.width = '100%';
      
      activeTrack.style.display = 'block';
      activeTrack.style.height = `${activeWidth}%`;
      activeTrack.style.bottom = `${adjustedLowerPercent}%`;
      activeTrack.style.width = '100%';
      
      remainingTrack.style.display = 'block';
      remainingTrack.style.height = `${remainingWidth}%`;
      remainingTrack.style.bottom = `${higherPercent + paddingPercent}%`;
      remainingTrack.style.width = '100%';
    } else {
      // Horizontal orientation
      startTrack.style.display = 'block';
      startTrack.style.width = `${startWidth}%`;
      startTrack.style.left = '0';
      startTrack.style.height = '100%';
      
      activeTrack.style.display = 'block';
      activeTrack.style.width = `${activeWidth}%`;
      activeTrack.style.left = `${adjustedLowerPercent}%`;
      activeTrack.style.height = '100%';
      
      remainingTrack.style.display = 'block';
      remainingTrack.style.width = `${remainingWidth}%`;
      remainingTrack.style.left = `${higherPercent + paddingPercent}%`;
      remainingTrack.style.height = '100%';
    }
  } else {
    // Single thumb slider
    const adjustedWidth = Math.max(0, valuePercent - paddingPercent);
    const remainingWidth = Math.max(0, 100 - valuePercent - paddingPercent);
    
    if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
      // Vertical orientation
      startTrack.style.display = 'none';
      
      activeTrack.style.display = 'block';
      activeTrack.style.height = `${adjustedWidth}%`;
      activeTrack.style.bottom = '0';
      activeTrack.style.width = '100%';
      
      remainingTrack.style.display = 'block';
      remainingTrack.style.height = `${remainingWidth}%`;
      remainingTrack.style.bottom = `${valuePercent + paddingPercent}%`;
      remainingTrack.style.width = '100%';
    } else {
      // Horizontal orientation
      startTrack.style.display = 'none';
      
      activeTrack.style.display = 'block';
      activeTrack.style.width = `${adjustedWidth}%`;
      activeTrack.style.left = '0';
      activeTrack.style.height = '100%';
      
      remainingTrack.style.display = 'block';
      remainingTrack.style.width = `${remainingWidth}%`;
      remainingTrack.style.left = `${valuePercent + paddingPercent}%`;
      remainingTrack.style.height = '100%';
    }
  }
  
  // Add tracks to container
  track.appendChild(remainingTrack);
  track.appendChild(startTrack);
  track.appendChild(activeTrack);
  
  // Create thumb element
  const thumb = document.createElement('div');
  thumb.classList.add(component.getClass('slider-thumb'));
  thumb.setAttribute('tabindex', '0');
  thumb.setAttribute('role', 'slider');
  
  // Set initial thumb position
  if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
    thumb.style.bottom = `${valuePercent}%`;
    thumb.style.left = '50%';
    thumb.style.top = 'auto';
  } else {
    thumb.style.left = `${valuePercent}%`;
  }
  
  // Create dots for the track ends
  const startDot = document.createElement('div');
  startDot.classList.add(component.getClass('slider-dot'));
  startDot.classList.add(component.getClass('slider-dot--start'));
  
  const endDot = document.createElement('div');
  endDot.classList.add(component.getClass('slider-dot'));
  endDot.classList.add(component.getClass('slider-dot--end'));
  
  // Create value bubble element
  const valueBubble = document.createElement('div');
  valueBubble.classList.add(component.getClass('slider-value'));
  
  // Format value and set initial bubble text
  const formatter = config.valueFormatter || (val => val.toString());
  valueBubble.textContent = formatter(value);
  
  // For range slider: Create second thumb and value bubble
  let secondThumb = null;
  let secondValueBubble = null;
  
  if (config.range && secondValue !== null) {
    // Create second thumb
    secondThumb = document.createElement('div');
    secondThumb.classList.add(component.getClass('slider-thumb'));
    secondThumb.setAttribute('tabindex', '0');
    secondThumb.setAttribute('role', 'slider');
    
    // Set initial second thumb position
    const secondPercent = getPercentage(secondValue);
    if (config.orientation === SLIDER_ORIENTATIONS.VERTICAL) {
      secondThumb.style.bottom = `${secondPercent}%`;
      secondThumb.style.left = '50%';
      secondThumb.style.top = 'auto';
    } else {
      secondThumb.style.left = `${secondPercent}%`;
    }
    
    // Create second value bubble
    secondValueBubble = document.createElement('div');
    secondValueBubble.classList.add(component.getClass('slider-value'));
    secondValueBubble.textContent = formatter(secondValue);
  }
  
  // Add elements to the slider
  component.element.classList.add(component.getClass('slider'));
  component.element.appendChild(track);
  component.element.appendChild(startDot);
  component.element.appendChild(endDot);
  component.element.appendChild(thumb);
  component.element.appendChild(valueBubble);
  
  if (config.range && secondThumb && secondValueBubble) {
    component.element.classList.add(`${component.getClass('slider')}--range`);
    component.element.appendChild(secondThumb);
    component.element.appendChild(secondValueBubble);
  }
  
  // Apply size class
  const size = config.size || SLIDER_SIZES.MEDIUM;
  if (size !== SLIDER_SIZES.MEDIUM) {
    component.element.classList.add(`${component.getClass('slider')}--${size}`);
  }
  
  // Apply color class
  const color = config.color || SLIDER_COLORS.PRIMARY;
  if (color !== SLIDER_COLORS.PRIMARY) {
    component.element.classList.add(`${component.getClass('slider')}--${color}`);
  }
  
  // Apply orientation class
  const orientation = config.orientation || SLIDER_ORIENTATIONS.HORIZONTAL;
  if (orientation === SLIDER_ORIENTATIONS.VERTICAL) {
    component.element.classList.add(`${component.getClass('slider')}--vertical`);
  }
  
  // Apply discrete class if step is specified
  if (config.step !== undefined && config.step > 0) {
    component.element.classList.add(`${component.getClass('slider')}--discrete`);
  }
  
  // Apply disabled class if needed
  if (config.disabled) {
    component.element.classList.add(`${component.getClass('slider')}--disabled`);
  }
  
  // Ensure proper initialization after DOM is attached by scheduling a UI update
  setTimeout(() => {
    if (component.slider && typeof component.slider.updateUi === 'function') {
      component.slider.updateUi();
    }
  }, 0);
  
  // Store elements in component
  return {
    ...component,
    structure: {
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
    }
  };
};