// src/components/carousel/features/slides.ts
import { CAROUSEL_EVENTS, CAROUSEL_LAYOUTS, CAROUSEL_DEFAULTS, CAROUSEL_ITEM_SIZES } from '../constants';
import { CarouselConfig, CarouselSlide, CarouselLayout } from '../types';

/**
 * Adds slide functionality to the carousel component with Material Design 3 layout types support
 * 
 * @param {CarouselConfig} config - Carousel configuration
 * @returns {Function} Higher-order function that adds slides feature
 */
export const withSlides = (config: CarouselConfig) => (component) => {
  // Create the enhanced component to avoid circular references
  const enhancedComponent = { ...component };
  
  // Layout type from config (with default)
  const layout: CarouselLayout = config.layout || CAROUSEL_DEFAULTS.LAYOUT;
  
  // Create a wrapper for slides and "Show all" link
  const createSlidesWrapper = () => {
    const wrapper = document.createElement('div');
    wrapper.className = `${component.getClass('carousel')}-wrapper`;
    
    // Add a data attribute for the layout type
    wrapper.dataset.layout = layout;
    component.element.appendChild(wrapper);
    return wrapper;
  };
  
  // Container for all slides
  const slidesContainer = document.createElement('div');
  slidesContainer.className = `${component.getClass('carousel')}-slides`;
  slidesContainer.setAttribute('role', 'list');
  slidesContainer.setAttribute('aria-label', 'Carousel Slides');
  
  // Set scroll behavior
  if (config.scrollBehavior === 'snap') {
    slidesContainer.dataset.snapScroll = 'true';
  }
  
  // Set gap from config
  slidesContainer.dataset.gap = `${config.gap || CAROUSEL_DEFAULTS.GAP}`;
  
  // Create wrapper and add slides container first
  const wrapper = createSlidesWrapper();
  wrapper.appendChild(slidesContainer);
  
  // Current slide index
  let currentSlide = config.initialSlide || 0;
  let slideCount = 0;
  const slides: HTMLElement[] = [];
  const slideData: CarouselSlide[] = [];

  /**
   * Determine the size class for a slide based on layout and position
   * 
   * @param {number} index - Slide index
   * @returns {'large' | 'medium' | 'small'} Size class
   */
  function determineSlideSize(index: number): 'large' | 'medium' | 'small' {
    // If the slide has a predefined size, use it
    if (slideData[index]?.size) {
      return slideData[index].size as 'large' | 'medium' | 'small';
    }
    
    // Default sizing logic based on layout type
    switch (layout) {
      case 'multi-browse':
        // First 2 slides are large, next is medium, rest are small
        if (index === 0 || index === 1) return 'large';
        if (index === 2) return 'medium';
        return 'small';
        
      case 'uncontained':
        // All slides are the same size in uncontained layout
        return 'large';
        
      case 'hero':
        // First slide is large, rest are small
        return index === 0 ? 'large' : 'small';
        
      case 'full-screen':
        // All slides take full width in full-screen layout
        return 'large';
        
      default:
        return 'large';
    }
  }

  /**
   * Update slide sizes based on layout, window size, and position
   * This implements the responsive behavior where sizes adjust as window changes
   */
  function updateSlideSizes() {
    // Get the container width to calculate relative sizes
    const containerWidth = slidesContainer.clientWidth;
    
    // Default to the standard sizes from constants
    let largeWidth = typeof CAROUSEL_DEFAULTS.ITEM_WIDTHS[layout].LARGE === 'number' 
      ? CAROUSEL_DEFAULTS.ITEM_WIDTHS[layout].LARGE as number 
      : containerWidth;
      
    let mediumWidth = typeof CAROUSEL_DEFAULTS.ITEM_WIDTHS[layout].MEDIUM === 'number'
      ? CAROUSEL_DEFAULTS.ITEM_WIDTHS[layout].MEDIUM as number
      : containerWidth * 0.75;
      
    let smallWidth = typeof CAROUSEL_DEFAULTS.ITEM_WIDTHS[layout].SMALL === 'number'
      ? CAROUSEL_DEFAULTS.ITEM_WIDTHS[layout].SMALL as number
      : CAROUSEL_DEFAULTS.SMALL_ITEM_WIDTH;
    
    // Apply custom large item max width if specified
    if (config.largeItemMaxWidth && typeof config.largeItemMaxWidth === 'number') {
      largeWidth = Math.min(largeWidth, config.largeItemMaxWidth);
    }
    
    // Apply custom small item width if specified
    if (config.smallItemWidth && typeof config.smallItemWidth === 'number') {
      smallWidth = config.smallItemWidth;
    }
    
    // Adjust for full-screen layout
    if (layout === 'full-screen') {
      largeWidth = containerWidth;
      mediumWidth = containerWidth;
      smallWidth = containerWidth;
    }
    
    // Apply sizes to all slides
    slides.forEach((slideEl, index) => {
      const size = determineSlideSize(index);
      
      // Set width based on size class
      switch(size) {
        case 'large':
          slideEl.style.width = `${largeWidth}px`;
          break;
        case 'medium':
          slideEl.style.width = `${mediumWidth}px`;
          break;
        case 'small':
          slideEl.style.width = `${smallWidth}px`;
          break;
      }
      
      // Add size class for styling
      slideEl.className = `${component.getClass('carousel')}-slide ${component.getClass('carousel')}-slide--${size}`;
      
      // Handle text visibility based on size
      const titleEl = slideEl.querySelector(`.${component.getClass('carousel')}-slide-title`);
      const descEl = slideEl.querySelector(`.${component.getClass('carousel')}-slide-description`);
      
      if (titleEl) {
        if (size === 'small' && layout !== 'uncontained') {
          titleEl.classList.add('visually-hidden');
        } else {
          titleEl.classList.remove('visually-hidden');
        }
      }
      
      if (descEl) {
        if (size === 'small' || (size === 'medium' && layout === 'multi-browse')) {
          descEl.classList.add('visually-hidden');
        } else {
          descEl.classList.remove('visually-hidden');
        }
      }
    });
  }

  /**
   * Create a new slide element from CarouselSlide data
   * 
   * @param {CarouselSlide} slide - Slide data
   * @param {number} index - Optional position to insert at
   * @returns {HTMLElement} Created slide element
   */
  function addSlideElement(slide: CarouselSlide, index?: number): HTMLElement {
    const slideElement = document.createElement('div');
    slideElement.className = `${component.getClass('carousel')}-slide`;
    slideElement.setAttribute('role', 'listitem');
    slideElement.setAttribute('aria-roledescription', 'slide');
    
    // Set border radius from config
    slideElement.dataset.borderRadius = `${config.borderRadius || CAROUSEL_DEFAULTS.BORDER_RADIUS}`;
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = `${component.getClass('carousel')}-slide-image`;
    
    // Create image element
    const image = document.createElement('img');
    image.src = slide.image;
    image.alt = slide.title || 'Carousel slide';
    imageContainer.appendChild(image);
    
    // Add overlay with accent color if provided
    if (slide.accent) {
      const overlay = document.createElement('div');
      overlay.className = `${component.getClass('carousel')}-slide-overlay`;
      if (slide.accent) {
        overlay.style.backgroundColor = slide.accent;
      }
      imageContainer.appendChild(overlay);
    }
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = `${component.getClass('carousel')}-slide-content`;
    
    // Add title if provided
    if (slide.title) {
      const title = document.createElement('div');
      title.className = `${component.getClass('carousel')}-slide-title`;
      title.textContent = slide.title;
      
      // For full-screen layout, add title to content container
      // For others, add directly to image container for overlay effect
      if (layout === 'full-screen') {
        contentContainer.appendChild(title);
      } else {
        imageContainer.appendChild(title);
      }
    }
    
    // Add description if provided
    if (slide.description) {
      const description = document.createElement('div');
      description.className = `${component.getClass('carousel')}-slide-description`;
      description.textContent = slide.description;
      contentContainer.appendChild(description);
    }
    
    // Add button if provided
    if (slide.buttonText) {
      const button = document.createElement('a');
      button.className = `${component.getClass('carousel')}-slide-button`;
      button.textContent = slide.buttonText;
      
      if (slide.buttonUrl) {
        button.href = slide.buttonUrl;
      }
      
      if (slide.accent) {
        button.style.backgroundColor = slide.accent;
      }
      
      contentContainer.appendChild(button);
    }
    
    slideElement.appendChild(imageContainer);
    slideElement.appendChild(contentContainer);
    
    // Store the slide data
    if (index !== undefined && index >= 0 && index <= slideData.length) {
      slideData.splice(index, 0, slide);
    } else {
      slideData.push(slide);
    }
    
    // Insert at specific position or append
    if (index !== undefined && index >= 0 && index <= slides.length) {
      if (index < slides.length) {
        slidesContainer.insertBefore(slideElement, slides[index]);
        slides.splice(index, 0, slideElement);
      } else {
        slidesContainer.appendChild(slideElement);
        slides.push(slideElement);
      }
    } else {
      slidesContainer.appendChild(slideElement);
      slides.push(slideElement);
    }
    
    slideCount++;
    
    // Update sizes after adding a new slide
    updateSlideSizes();
    
    return slideElement;
  }
  
  /**
   * Add "Show all" link after the slides
   * Material Design 3 recommends this for accessibility on vertical scrolling pages
   */
  const addShowAllLink = () => {
    if (config.showAllLink === false) return;
    
    const showAllCard = document.createElement('div');
    showAllCard.className = `${component.getClass('carousel')}-show-all`;
    showAllCard.setAttribute('role', 'button');
    showAllCard.setAttribute('tabindex', '0');
    showAllCard.setAttribute('aria-label', 'Show all items');
    
    const showAllText = document.createElement('span');
    showAllText.textContent = 'Show all';
    
    showAllCard.appendChild(showAllText);
    wrapper.appendChild(showAllCard); // Add to wrapper after slides
    
    showAllCard.addEventListener('click', () => {
      if (config.onShowAll && typeof config.onShowAll === 'function') {
        config.onShowAll();
      }
    });
    
    // Add keyboard support
    showAllCard.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        if (config.onShowAll && typeof config.onShowAll === 'function') {
          config.onShowAll();
        }
        event.preventDefault();
      }
    });
  };
  
  // Add initial slides if provided
  if (config.slides && config.slides.length > 0) {
    config.slides.forEach((slide) => {
      addSlideElement(slide);
    });
  }
  
  // Add "Show all" link after all slides are added
  // This is recommended by MD3 for accessibility on vertical scrolling pages
  if (config.showAllLink !== false && layout !== 'full-screen') {
    addShowAllLink();
  }
  
  // Handle window resize events for responsive design
  const handleResize = () => {
    updateSlideSizes();
    
    // Dispatch resize event
    const resizeEvent = new CustomEvent(CAROUSEL_EVENTS.RESIZE, {
      detail: { width: slidesContainer.clientWidth }
    });
    component.element.dispatchEvent(resizeEvent);
  };
  
  // Add resize listener
  window.addEventListener('resize', handleResize);
  
  // Run initial size update
  setTimeout(updateSlideSizes, 0);
  
  /**
   * Navigate to a specific slide
   * 
   * @param {number} index - Target slide index
   * @returns {Object} Enhanced component for chaining
   */
  const goTo = (index: number) => {
    // Validate index
    if (index < 0 || index >= slideCount) {
      if (config.loop) {
        // Handle looping
        if (index < 0) {
          index = slideCount - 1;
        } else {
          index = 0;
        }
      } else {
        // Don't change if out of bounds and not looping
        return enhancedComponent;
      }
    }
    
    // Only trigger events if the slide actually changes
    if (currentSlide !== index) {
      // Dispatch event before changing
      const beforeEvent = new CustomEvent(CAROUSEL_EVENTS.SLIDE_CHANGE, {
        detail: { previousSlide: currentSlide, nextSlide: index }
      });
      component.element.dispatchEvent(beforeEvent);
      
      // Update current slide
      currentSlide = index;
      
      // Apply active state to current slide
      slides.forEach((slideEl, i) => {
        if (i === currentSlide) {
          slideEl.classList.add(`${component.getClass('carousel')}-slide--active`);
          slideEl.setAttribute('aria-current', 'true');
        } else {
          slideEl.classList.remove(`${component.getClass('carousel')}-slide--active`);
          slideEl.removeAttribute('aria-current');
        }
      });
      
      // Scroll behavior based on config
      const behavior = config.scrollBehavior === 'snap' ? 'smooth' : 'auto';
      
      // Scroll to the slide
      if (slides[index]) {
        // For center-aligned hero layout, adjust scroll position
        if (layout === 'hero' && config.centered) {
          const slideWidth = slides[index].offsetWidth;
          const containerWidth = slidesContainer.clientWidth;
          const offsetLeft = slides[index].offsetLeft;
          
          slidesContainer.scrollTo({
            left: offsetLeft - (containerWidth / 2) + (slideWidth / 2),
            behavior
          });
        } else {
          // Standard scrolling
          slides[index].scrollIntoView({
            behavior,
            block: 'nearest',
            inline: 'start'
          });
        }
      }
      
      // Dispatch event after changing
      const afterEvent = new CustomEvent(CAROUSEL_EVENTS.SLIDE_CHANGED, {
        detail: { currentSlide }
      });
      component.element.dispatchEvent(afterEvent);
    }
    
    return enhancedComponent;
  };
  
  // Define next and prev functions that use goTo
  const next = () => goTo(currentSlide + 1);
  const prev = () => goTo(currentSlide - 1);
  
  // Assign properties to the enhanced component
  Object.assign(enhancedComponent, {
    slides: {
      addSlide: (slide: CarouselSlide, index?: number) => {
        addSlideElement(slide, index);
        return enhancedComponent.slides;
      },
      
      removeSlide: (index: number) => {
        if (index >= 0 && index < slides.length) {
          slidesContainer.removeChild(slides[index]);
          slides.splice(index, 1);
          slideData.splice(index, 1);
          slideCount--;
          
          // Adjust current slide index if needed
          if (currentSlide >= slideCount) {
            currentSlide = slideCount - 1;
          }
          
          if (currentSlide < 0) {
            currentSlide = 0;
          }
          
          // Update sizes after removing a slide
          updateSlideSizes();
        }
        
        return enhancedComponent.slides;
      },
      
      updateSlide: (index: number, slide: CarouselSlide) => {
        if (index >= 0 && index < slides.length) {
          // Update slide data
          slideData[index] = slide;
          
          // Update visual elements
          const slideElement = slides[index];
          
          // Update image
          const imageElement = slideElement.querySelector('img');
          if (imageElement) {
            imageElement.src = slide.image;
            imageElement.alt = slide.title || 'Carousel slide';
          }
          
          // Update title
          const titleElement = slideElement.querySelector(`.${component.getClass('carousel')}-slide-title`);
          if (titleElement && slide.title) {
            titleElement.textContent = slide.title;
          }
          
          // Update description
          const descriptionElement = slideElement.querySelector(`.${component.getClass('carousel')}-slide-description`);
          if (descriptionElement && slide.description) {
            descriptionElement.textContent = slide.description;
          }
          
          // Update accent color
          const overlayElement = slideElement.querySelector(`.${component.getClass('carousel')}-slide-overlay`);
          if (overlayElement && slide.accent) {
            (overlayElement as HTMLElement).style.backgroundColor = slide.accent;
          }
          
          // Update button
          const buttonElement = slideElement.querySelector(`.${component.getClass('carousel')}-slide-button`);
          if (buttonElement) {
            if (slide.buttonText) {
              buttonElement.textContent = slide.buttonText;
              
              if (slide.buttonUrl) {
                (buttonElement as HTMLAnchorElement).href = slide.buttonUrl;
              }
              
              if (slide.accent) {
                (buttonElement as HTMLElement).style.backgroundColor = slide.accent;
              }
            } else {
              // Remove button if no text provided
              buttonElement.parentElement?.removeChild(buttonElement);
            }
          } else if (slide.buttonText) {
            // Add button if not present but now needed
            const contentContainer = slideElement.querySelector(`.${component.getClass('carousel')}-slide-content`);
            if (contentContainer) {
              const button = document.createElement('a');
              button.className = `${component.getClass('carousel')}-slide-button`;
              button.textContent = slide.buttonText;
              
              if (slide.buttonUrl) {
                button.href = slide.buttonUrl;
              }
              
              if (slide.accent) {
                button.style.backgroundColor = slide.accent;
              }
              
              contentContainer.appendChild(button);
            }
          }
          
          // Update sizes if size property changed
          if (slide.size) {
            updateSlideSizes();
          }
        }
        
        return enhancedComponent.slides;
      },
      
      getSlide: (index: number) => {
        if (index >= 0 && index < slideData.length) {
          return slideData[index];
        }
        return null;
      },
      
      getCount: () => slideCount,
      
      getElements: () => [...slides]
    },
    
    slidesContainer,
    slideData,
    wrapper,
    
    getCurrentSlide: () => currentSlide,
    
    goTo,
    next,
    prev,
    
    enableLoop: () => {
      config.loop = true;
      return enhancedComponent;
    },
    
    disableLoop: () => {
      config.loop = false;
      return enhancedComponent;
    },
    
    setBorderRadius: (radius: number) => {
      config.borderRadius = radius;
      slides.forEach(slide => {
        slide.dataset.borderRadius = `${radius}`;
      });
      return enhancedComponent;
    },
    
    setGap: (gap: number) => {
      config.gap = gap;
      slidesContainer.dataset.gap = `${gap}`;
      return enhancedComponent;
    },
    
    updateLayout: (newLayout: CarouselLayout) => {
      // Update layout setting
      config.layout = newLayout;
      
      // Update data attributes
      wrapper.dataset.layout = newLayout;
      component.element.dataset.layout = newLayout;
      
      // Remove previous layout classes
      Object.values(CAROUSEL_LAYOUTS).forEach(layoutValue => {
        component.element.classList.remove(`${component.getClass('carousel')}-layout--${layoutValue}`);
      });
      
      // Add new layout class
      component.element.classList.add(`${component.getClass('carousel')}-layout--${newLayout}`);
      
      // Update sizes based on new layout
      updateSlideSizes();
      
      return enhancedComponent;
    },
    
    // Add lifecycle cleanup for resize handler
    lifecycle: {
      ...(component.lifecycle || {}),
      destroy: () => {
        // Remove resize event listener
        window.removeEventListener('resize', handleResize);
        
        // Call original destroy if it exists
        if (component.lifecycle && component.lifecycle.destroy) {
          component.lifecycle.destroy();
        }
      }
    }
  });
  
  // Add necessary class for styling based on transition type
  if (config.transition) {
    component.element.classList.add(`${component.getClass('carousel')}-transition--${config.transition}`);
  }
  
  // Add scroll event listeners for detecting current slide when using snap-scroll
  if (config.scrollBehavior === 'snap') {
    slidesContainer.addEventListener('scroll', () => {
      // Debounce the scroll event
      clearTimeout(enhancedComponent['scrollTimeout']);
      
      enhancedComponent['scrollTimeout'] = setTimeout(() => {
        // Find the slide most in view
        let closestSlide = 0;
        let closestDistance = Infinity;
        
        const containerLeft = slidesContainer.scrollLeft;
        const containerWidth = slidesContainer.clientWidth;
        
        slides.forEach((slide, index) => {
          const slideLeft = slide.offsetLeft;
          const slideCenter = slideLeft + (slide.offsetWidth / 2);
          const containerCenter = containerLeft + (containerWidth / 2);
          
          const distance = Math.abs(slideCenter - containerCenter);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestSlide = index;
          }
        });
        
        // Only update if the slide has changed
        if (closestSlide !== currentSlide) {
          currentSlide = closestSlide;
          
          // Update active class
          slides.forEach((slideEl, i) => {
            if (i === currentSlide) {
              slideEl.classList.add(`${component.getClass('carousel')}-slide--active`);
              slideEl.setAttribute('aria-current', 'true');
            } else {
              slideEl.classList.remove(`${component.getClass('carousel')}-slide--active`);
              slideEl.removeAttribute('aria-current');
            }
          });
          
          // Dispatch event
          const event = new CustomEvent(CAROUSEL_EVENTS.SLIDE_CHANGED, {
            detail: { currentSlide }
          });
          component.element.dispatchEvent(event);
        }
      }, 150); // Debounce time
    });
  }
  
  return enhancedComponent;
};