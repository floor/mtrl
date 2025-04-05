// src/components/carousel/carousel.ts
/**
 * Creates carousels with different layouts based on Material Design 3 guidelines.
 * 
 * This module implements a carousel component that supports four layout types:
 * - Multi-browse: For browsing many visual items at once (photos, feeds)
 * - Uncontained: For customized or text-heavy carousels (traditional)
 * - Hero: For spotlighting large visual items (featured content)
 * - Full-screen: For immersive vertical-scrolling experiences
 * 
 * Each layout is optimized for different content types and presentation needs,
 * following the Material Design 3 component guidelines.
 * 
 * @module components/carousel
 * @category Components
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
 * Creates a new carousel component with the specified configuration.
 * 
 * The carousel supports different layout types for various content
 * presentation needs, from image galleries to full-screen experiences.
 * It handles gesture interactions, keyboard navigation, and responsive
 * behavior following Material Design 3 guidelines.
 * 
 * @param {CarouselConfig} config - Configuration options for the carousel
 * @returns {CarouselComponent} A fully configured carousel component instance
 * @throws {Error} Throws an error if carousel creation fails
 * 
 * @category Components
 * 
 * @example
 * // Create a multi-browse carousel for a photo gallery
 * const photoGallery = fCarousel({
 *   layout: 'multi-browse',
 *   scrollBehavior: 'snap',
 *   slides: [
 *     { image: 'image1.jpg', title: 'Recent highlights', accent: '#3C4043' },
 *     { image: 'image2.jpg', title: 'La Familia', accent: '#7E5260' }
 *   ],
 *   showAllLink: true
 * });
 * 
 * document.getElementById('gallery-container').appendChild(photoGallery.element);
 * 
 * @example
 * // Create a hero carousel for featured content
 * const featuredContent = fCarousel({
 *   layout: 'hero',
 *   centered: true,
 *   gap: 16,
 *   slides: [
 *     { image: 'hero1.jpg', title: 'Featured Story', buttonText: 'Read More' },
 *     { image: 'hero2.jpg', title: 'Special Offer', buttonText: 'Shop Now' }
 *   ]
 * });
 * 
 * // Listen for slide changes
 * featuredContent.on('slide-changed', (index) => {
 *   console.log(`Now showing featured item ${index}`);
 * });
 * 
 * @example
 * // Create a full-screen immersive carousel
 * const storyViewer = fCarousel({
 *   layout: 'full-screen',
 *   loop: false,
 *   transition: 'fade',
 *   slides: [
 *     { image: 'story1.jpg', description: 'Chapter 1' },
 *     { image: 'story2.jpg', description: 'Chapter 2' }
 *   ]
 * });
 */
export const fCarousel = (config: CarouselConfig = {}): CarouselComponent => {
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
 * Determines the optimal scroll behavior based on the selected layout type.
 * 
 * Material Design 3 recommendations suggest different scroll behaviors
 * for each layout type to provide the best user experience.
 * 
 * @param {CarouselLayout} layout - Carousel layout type
 * @returns {CarouselScrollBehavior} The recommended scroll behavior
 * @category Components
 * @internal
 */
function getDefaultScrollBehavior(layout: CarouselLayout): CarouselScrollBehavior {
  switch (layout) {
    // These layouts work best with snap scrolling for defined stops
    case 'multi-browse':
    case 'hero':
    case 'full-screen':
      return 'snap';
      
    // Uncontained layout works best with standard scrolling
    case 'uncontained':
      return 'default';
      
    // Default to standard scrolling for unknown layouts
    default:
      return 'default';
  }
}

/**
 * Applies layout-specific configurations and styling to the carousel component.
 * 
 * Each carousel layout has specific CSS properties, data attributes,
 * and behaviors that optimize it for different content types.
 * This function sets up those properties based on the selected layout.
 * 
 * @param {any} component - The component to configure
 * @param {CarouselConfig} config - Carousel configuration
 * @category Components
 * @internal
 */
function applyLayoutConfig(component: any, config: CarouselConfig): void {
  // Add layout-specific class for CSS targeting
  component.element.classList.add(`${component.getClass('carousel')}-layout--${config.layout}`);
  
  // Apply layout-specific configurations
  switch (config.layout) {
    case 'multi-browse':
      // Multi-browse layout: For browsing many visual items at once
      // Shows items of varying sizes with parallax scrolling effect
      component.element.dataset.enableParallax = 'true';
      component.element.dataset.layout = 'multi-browse';
      break;
      
    case 'uncontained':
      // Uncontained layout: For text-heavy or consistent-sized items
      // Allows content to flow past the viewport edges
      component.element.style.overflow = 'visible';
      component.element.dataset.layout = 'uncontained';
      break;
      
    case 'hero':
      // Hero layout: For spotlighting featured content
      // Large central item with preview of adjacent items
      component.element.dataset.largeItemFocus = 'true';
      component.element.dataset.layout = 'hero';
      
      // Optionally center items for balanced presentation
      if (config.centered) {
        component.element.dataset.centered = 'true';
      }
      break;
      
    case 'full-screen':
      // Full-screen layout: For immersive experiences
      // Takes up entire viewport and supports vertical scrolling
      component.element.style.width = '100%';
      component.element.style.height = '100%';
      component.element.style.maxWidth = '100vw';
      component.element.style.maxHeight = '100vh';
      component.element.dataset.verticalScroll = 'true';
      component.element.dataset.layout = 'full-screen';
      
      // Full-screen layout always uses snap scrolling for controlled navigation
      config.scrollBehavior = 'snap';
      break;
  }
  
  // Apply scroll behavior data attribute for CSS targeting
  if (config.scrollBehavior === 'snap') {
    component.element.dataset.snapScroll = 'true';
  } else {
    component.element.dataset.snapScroll = 'false';
  }
}

export default fCarousel;