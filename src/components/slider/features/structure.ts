// src/components/slider/features/structure.ts - additional fixes
import { SLIDER_COLORS, SLIDER_SIZES, SLIDER_ORIENTATIONS } from '../constants';
import { SliderConfig } from '../types';

/**
 * Creates the slider DOM structure following MD3 principles
 * @param config Slider configuration
 * @returns Component enhancer with DOM structure
 */
export const withStructure = (config: SliderConfig) => component => {
  // Create track element (now transparent as per MD3)
  const track = document.createElement('div');
  track.classList.add(component.getClass('slider-track'));
  
  // Create remaining track element (new addition for MD3)
  // Place it first in track to ensure it's at the bottom z-layer
  const remainingTrack = document.createElement('div');
  remainingTrack.classList.add(component.getClass('slider-remaining-track'));
  remainingTrack.style.width = '100%'; // Ensure initial full width
  remainingTrack.style.height = '100%'; // Ensure initial full height
  track.appendChild(remainingTrack);
  
  // Create active track element (filled part)
  const activeTrack = document.createElement('div');
  activeTrack.classList.add(component.getClass('slider-active-track'));
  track.appendChild(activeTrack);
  
  // Create thumb element
  const thumb = document.createElement('div');
  thumb.classList.add(component.getClass('slider-thumb'));
  thumb.setAttribute('tabindex', '0');
  thumb.setAttribute('role', 'slider');
  
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
  
  // Create second thumb and value bubble for range slider
  let secondThumb = null;
  let secondValueBubble = null;
  
  if (config.range) {
    secondThumb = document.createElement('div');
    secondThumb.classList.add(component.getClass('slider-thumb'));
    secondThumb.setAttribute('tabindex', '0');
    secondThumb.setAttribute('role', 'slider');
    
    secondValueBubble = document.createElement('div');
    secondValueBubble.classList.add(component.getClass('slider-value'));
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
  
  // Store elements in component
  return {
    ...component,
    structure: {
      track,
      activeTrack,
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