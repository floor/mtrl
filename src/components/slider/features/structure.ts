// src/components/slider/features/structure.ts
import { SLIDER_COLORS, SLIDER_SIZES, SLIDER_ORIENTATIONS } from '../constants';
import { SliderConfig } from '../types';

/**
 * Creates the slider DOM structure
 * @param config Slider configuration
 * @returns Component enhancer with DOM structure
 */
export const withStructure = (config: SliderConfig) => component => {
  // Create track element
  const track = document.createElement('div');
  track.classList.add(component.getClass('slider-track'));
  
  // Create active track element
  const activeTrack = document.createElement('div');
  activeTrack.classList.add(component.getClass('slider-active-track'));
  track.appendChild(activeTrack);
  
  // Create thumb element
  const thumb = document.createElement('div');
  thumb.classList.add(component.getClass('slider-thumb'));
  thumb.setAttribute('tabindex', '0');
  thumb.setAttribute('role', 'slider');
  
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
      thumb,
      valueBubble,
      secondThumb,
      secondValueBubble
    }
  };
};