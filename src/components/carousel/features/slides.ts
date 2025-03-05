// src/components/carousel/features/slides.ts
import { CAROUSEL_EVENTS } from '../constants';
import { CarouselConfig, CarouselSlide } from '../types';

/**
 * Adds slide functionality to the carousel component
 * @param {CarouselConfig} config - Carousel configuration
 * @returns {Function} Higher-order function that adds slides feature
 */
export const withSlides = (config: CarouselConfig) => (component) => {
  // Create the enhanced component to avoid circular references
  const enhancedComponent = { ...component };
  
  // Create a wrapper for slides and "Show all" link
  const createSlidesWrapper = () => {
    const wrapper = document.createElement('div');
    wrapper.className = `${component.getClass('carousel')}-wrapper`;
    component.element.appendChild(wrapper);
    return wrapper;
  };
  
  // Container for all slides
  const slidesContainer = document.createElement('div');
  slidesContainer.className = `${component.getClass('carousel')}-slides`;
  slidesContainer.setAttribute('role', 'list');
  slidesContainer.setAttribute('aria-label', 'Carousel Slides');
  
  // Set gap from config
  slidesContainer.dataset.gap = `${config.gap || 8}`;
  
  // Create wrapper and add slides container first
  const wrapper = createSlidesWrapper();
  wrapper.appendChild(slidesContainer);
  
  // Current slide index
  let currentSlide = config.initialSlide || 0;
  let slideCount = 0;
  const slides: HTMLElement[] = [];
  const slideData: CarouselSlide[] = [];

  // Create a new slide element from CarouselSlide data
  function addSlideElement(slide: CarouselSlide, index?: number): HTMLElement {
    const slideElement = document.createElement('div');
    slideElement.className = `${component.getClass('carousel')}-slide`;
    slideElement.setAttribute('role', 'listitem');
    slideElement.setAttribute('aria-roledescription', 'slide');
    
    // Set border radius from config
    slideElement.dataset.borderRadius = `${config.borderRadius || 16}`;
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = `${component.getClass('carousel')}-slide-image`;
    
    // Create image element
    const image = document.createElement('img');
    image.src = slide.image;
    image.alt = slide.title || 'Carousel slide';
    imageContainer.appendChild(image);
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = `${component.getClass('carousel')}-slide-content`;
    
    // Add title if provided
    if (slide.title) {
      const title = document.createElement('div');
      title.className = `${component.getClass('carousel')}-slide-title`;
      title.textContent = slide.title;
      contentContainer.appendChild(title);
    }
    
    // Add description if provided
    if (slide.description) {
      const description = document.createElement('div');
      description.className = `${component.getClass('carousel')}-slide-description`;
      description.textContent = slide.description;
      contentContainer.appendChild(description);
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
    
    return slideElement;
  }
  
  // Add "Show all" link after the slides
  const addShowAllLink = () => {
    if (!config.showAllLink) return;
    
    const showAllCard = document.createElement('div');
    showAllCard.className = `${component.getClass('carousel')}-show-all`;
    
    const showAllText = document.createElement('span');
    showAllText.textContent = 'Show all';
    
    showAllCard.appendChild(showAllText);
    wrapper.appendChild(showAllCard); // Add to wrapper after slides
    
    showAllCard.addEventListener('click', () => {
      if (config.onShowAll && typeof config.onShowAll === 'function') {
        config.onShowAll();
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
  if (config.showAllLink) {
    addShowAllLink();
  }
  
  // Initialize slides
  // component.element.appendChild(slidesContainer);
  // Already appended to wrapper
  
  // Define goTo function that will be used by next and prev
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
      
      // Scroll to the slide with no animation or smooth behavior
      if (slides[index]) {
        slides[index].scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'start'
        });
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
  const next = () => {
    return goTo(currentSlide + 1);
  };
  
  const prev = () => {
    return goTo(currentSlide - 1);
  };
  
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
    }
  });
  
  // Add necessary class for styling based on transition type
  if (config.transition) {
    component.element.classList.add(`${component.getClass('carousel')}-transition--${config.transition}`);
  }
  
  // Add scroll event listeners for detecting current slide
  slidesContainer.addEventListener('scroll', () => {
    // We don't need to update currentSlide on every scroll with this implementation
    // as we're using native scroll behavior
  });
  
  return enhancedComponent;
};