// src/components/carousel/carousel.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withSlides, withDrag } from './features';
import { withAPI } from './api';
import { CarouselConfig, CarouselComponent } from './types';
import { createBaseConfig, getElementConfig } from './config';

/**
 * Creates a new Carousel component with drag-based navigation
 * @param {CarouselConfig} config - Carousel configuration object
 * @returns {CarouselComponent} Carousel component instance
 * @example
 * ```typescript
 * // Create a carousel
 * const carousel = createCarousel({
 *   slides: [
 *     { image: 'image1.jpg', title: 'Recent highlights', accent: '#3C4043' },
 *     { image: 'image2.jpg', title: 'La Familia', accent: '#7E5260' }
 *   ],
 *   gap: 8
 * });
 * 
 * // Add the carousel to the DOM
 * document.getElementById('container').appendChild(carousel.element);
 * ```
 */
const createCarousel = (config: CarouselConfig = {}): CarouselComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Create a safer composition order to avoid circular dependencies
    // First build the core functionality
    const coreComponent = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig))
    )(baseConfig);
    
    // Define the enhanced component early to avoid circular references
    const enhancedComponent = { ...coreComponent };
    
    // Then add the features that depend on the core
    const slidesComponent = withSlides(baseConfig)(enhancedComponent);
    
    // Add drag navigation
    const withDragComponent = withDrag(baseConfig)(slidesComponent);
    const withLifecycleComponent = withLifecycle()(withDragComponent);
    
    // Create a simplified API config
    const apiConfig = {
      slides: {
        addSlide: withLifecycleComponent.slides.addSlide,
        removeSlide: withLifecycleComponent.slides.removeSlide,
        updateSlide: withLifecycleComponent.slides.updateSlide,
        getCount: withLifecycleComponent.slides.getCount,
        getElements: withLifecycleComponent.slides.getElements
      },
      lifecycle: {
        destroy: withLifecycleComponent.lifecycle.destroy
      }
    };
    
    // Add the API
    const carousel = withAPI(apiConfig)(withLifecycleComponent);

    return carousel;
  } catch (error) {
    console.error('Carousel creation error:', error);
    throw new Error(`Failed to create carousel: ${(error as Error).message}`);
  }
};

export default createCarousel;