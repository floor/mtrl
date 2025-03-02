// src/components/slider/features/appearance.ts
import { SLIDER_COLORS, SLIDER_SIZES, SLIDER_ORIENTATIONS } from '../constants';
import { SliderConfig } from '../types';

/**
 * Add appearance management features to slider component
 * @param config Slider configuration
 * @returns Component enhancer with appearance features
 */
export const withAppearance = (config: SliderConfig) => component => {
  return {
    ...component,
    appearance: {
      /**
       * Sets slider color
       * @param color Color variant
       */
      setColor(color: keyof typeof SLIDER_COLORS | SLIDER_COLORS) {
        // Remove existing color classes
        Object.values(SLIDER_COLORS).forEach(colorName => {
          component.element.classList.remove(`${component.getClass('slider')}--${colorName}`);
        });
        
        // Add new color class if not primary (default)
        if (color !== SLIDER_COLORS.PRIMARY) {
          component.element.classList.add(`${component.getClass('slider')}--${color}`);
        }
      },
      
      /**
       * Gets slider color
       * @returns Current color name
       */
      getColor() {
        // Find which color class is active
        const colorClass = Object.values(SLIDER_COLORS).find(colorName => 
          component.element.classList.contains(`${component.getClass('slider')}--${colorName}`)
        );
        
        return colorClass || SLIDER_COLORS.PRIMARY;
      },
      
      /**
       * Sets slider size
       * @param size Size variant
       */
      setSize(size: keyof typeof SLIDER_SIZES | SLIDER_SIZES) {
        // Remove existing size classes
        Object.values(SLIDER_SIZES).forEach(sizeName => {
          component.element.classList.remove(`${component.getClass('slider')}--${sizeName}`);
        });
        
        // Add new size class if not medium (default)
        if (size !== SLIDER_SIZES.MEDIUM) {
          component.element.classList.add(`${component.getClass('slider')}--${size}`);
        }
      },
      
      /**
       * Gets slider size
       * @returns Current size name
       */
      getSize() {
        // Find which size class is active
        const sizeClass = Object.values(SLIDER_SIZES).find(sizeName => 
          component.element.classList.contains(`${component.getClass('slider')}--${sizeName}`)
        );
        
        return sizeClass || SLIDER_SIZES.MEDIUM;
      },
      
      /**
       * Sets slider orientation
       * @param orientation Orientation variant
       */
      setOrientation(orientation: keyof typeof SLIDER_ORIENTATIONS | SLIDER_ORIENTATIONS) {
        // Clear existing orientation class
        component.element.classList.remove(`${component.getClass('slider')}--${SLIDER_ORIENTATIONS.VERTICAL}`);
        
        // Add orientation class if vertical
        if (orientation === SLIDER_ORIENTATIONS.VERTICAL) {
          component.element.classList.add(`${component.getClass('slider')}--${SLIDER_ORIENTATIONS.VERTICAL}`);
        }
        
        // Update ARIA attribute
        component.element.setAttribute('aria-orientation', orientation);
        
        // Update visual elements
        if (component.slider) {
          const eventData = { slider: component, value: component.slider.getValue() };
          component.events.trigger('change', eventData);
        }
      },
      
      /**
       * Gets slider orientation
       * @returns Current orientation name
       */
      getOrientation() {
        return component.element.classList.contains(`${component.getClass('slider')}--${SLIDER_ORIENTATIONS.VERTICAL}`)
          ? SLIDER_ORIENTATIONS.VERTICAL
          : SLIDER_ORIENTATIONS.HORIZONTAL;
      },
      
      /**
       * Shows or hides tick marks
       * @param show Whether to show ticks
       */
      showTicks(show: boolean) {
        config.ticks = show;
        
        // Regenerate ticks if slider is initialized
        if (component.slider) {
          component.slider.regenerateTicks();
        }
      },
      
      /**
       * Shows or hides tick labels
       * @param show Whether to show labels or array of label texts
       */
      showTickLabels(show: boolean | string[]) {
        config.tickLabels = show;
        
        // Regenerate ticks if slider is initialized
        if (component.slider) {
          component.slider.regenerateTicks();
        }
      },
      
      /**
       * Shows or hides current value bubble while dragging
       * @param show Whether to show value bubble
       */
      showCurrentValue(show: boolean) {
        config.showValue = show;
      }
    }
  };
};