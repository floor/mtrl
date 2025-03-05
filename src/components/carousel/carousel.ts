// src/components/carousel/factory.ts
/**
 * Carousel Factory - Creates different types of carousel layouts based on Material Design 3 guidelines
 * 
 * This factory implements four carousel layout types:
 * - Multi-browse: For browsing many visual items at once (photos, event feeds)
 * - Uncontained: For highly customized or text-heavy carousels (traditional behavior)
 * - Hero: For spotlighting very large visual items (featured content)
 * - Full-screen: For immersive vertical-scrolling experiences
 * 
 * @module CarouselFactory
 */

import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withSlides, withDrag } from './features';
import { withAPI } from './api';
import { 
  CarouselConfig, 
  CarouselComponent, 
  CarouselLayout,
  CarouselScrollBehavior
} from './types';
import { createBaseConfig, getElementConfig } from './config';
import { CAROUSEL_DEFAULTS } from './constants';

/**
 * Creates a new carousel with specified layout and scroll behavior
 * 
 * @param {CarouselConfig} config - Carousel configuration
 * @returns {CarouselComponent} The configured carousel component
 * 
 * @example
 * ```typescript
 * // Create a multi-browse carousel with snap scrolling
 * const carousel = createCarousel({
 *   layout: 'multi-browse',
 *   scrollBehavior: 'snap',
 *   slides: [
 *     { image: 'image1.jpg', title: 'Recent highlights', accent: '#3C4043' },
 *     { image: 'image2.jpg', title: 'La Familia', accent: '#7E5260' }
 *   ],
 *   showAllLink: true
 * });
 * 
 * // Add the carousel to the DOM
 * document.getElementById('container').appendChild(carousel.element);
 * ```
 */
export const createCarousel = (config: CarouselConfig = {}): CarouselComponent => {
  // Ensure layout and scrollBehavior have defaults
  config.layout = config.layout || 'multi-browse';
  config.scrollBehavior = config.scrollBehavior || getDefaultScrollBehavior(config.layout);
  
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
    
    // Apply layout-specific adjustments
    applyLayoutConfig(enhancedComponent, config);
    
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

    // Add layout data attribute for CSS targeting
    carousel.element.dataset.layout = config.layout;
    carousel.element.dataset.scrollBehavior = config.scrollBehavior;

    return carousel;
  } catch (error) {
    console.error('Carousel creation error:', error);
    throw new Error(`Failed to create carousel: ${(error as Error).message}`);
  }
};

/**
 * Get default scroll behavior based on layout type
 * 
 * @param {CarouselLayout} layout - Carousel layout type
 * @returns {CarouselScrollBehavior} Recommended scroll behavior
 */
function getDefaultScrollBehavior(layout: CarouselLayout): CarouselScrollBehavior {
  switch (layout) {
    case 'multi-browse':
    case 'hero':
    case 'full-screen':
      return 'snap';
    case 'uncontained':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Apply layout-specific configurations to the component
 * 
 * @param {any} component - The component to configure
 * @param {CarouselConfig} config - Carousel configuration
 */
function applyLayoutConfig(component: any, config: CarouselConfig): void {
  // Add layout-specific class
  component.element.classList.add(`${component.getClass('carousel')}-layout--${config.layout}`);
  
  // Apply additional layout-specific styling
  switch (config.layout) {
    case 'multi-browse':
      // Configure for browsing many items with different sizes
      component.element.dataset.enableParallax = 'true';
      break;
      
    case 'uncontained':
      // Configure for same-sized items that flow past edge
      component.element.style.overflow = 'visible';
      break;
      
    case 'hero':
      // Configure for spotlight content with preview of next item
      component.element.dataset.largeItemFocus = 'true';
      
      // Apply center alignment if specified
      if (config.centered) {
        component.element.dataset.centered = 'true';
      }
      break;
      
    case 'full-screen':
      // Configure for immersive experience
      component.element.style.width = '100%';
      component.element.style.height = '100%';
      component.element.style.maxWidth = '100vw';
      component.element.style.maxHeight = '100vh';
      component.element.dataset.verticalScroll = 'true';
      
      // Force snap scrolling for full-screen layout
      config.scrollBehavior = 'snap';
      break;
  }
  
  // Apply scroll behavior
  if (config.scrollBehavior === 'snap') {
    component.element.dataset.snapScroll = 'true';
  }
}

export default createCarousel;