// test/components/carousel.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import { 
  type CarouselComponent, 
  type CarouselConfig, 
  type CarouselSlide,
  type CarouselLayout,
  type CarouselScrollBehavior 
} from '../../src/components/carousel/types';

// Setup jsdom environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;

beforeAll(() => {
  // Create a new JSDOM instance
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true
  });
  
  // Get window and document from jsdom
  window = dom.window;
  document = window.document;
  
  // Store original globals
  originalGlobalDocument = global.document;
  originalGlobalWindow = global.window;
  
  // Set globals to use jsdom
  global.document = document;
  global.window = window;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.HTMLButtonElement = window.HTMLButtonElement;
  global.Event = window.Event;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  
  // Clean up jsdom
  window.close();
});

// Mock carousel implementation
const createMockCarousel = (config: CarouselConfig = {}): CarouselComponent => {
  const element = document.createElement('div');
  element.className = 'mtrl-carousel';
  
  // Default settings
  const settings = {
    initialSlide: config.initialSlide || 0,
    loop: config.loop !== undefined ? config.loop : true,
    transition: config.transition || 'slide',
    transitionDuration: config.transitionDuration || 300,
    borderRadius: config.borderRadius || 16,
    gap: config.gap || 8,
    layout: config.layout || 'multi-browse',
    scrollBehavior: config.scrollBehavior || 'snap',
    centered: config.centered || false,
    componentName: config.componentName || 'carousel',
    prefix: config.prefix || 'mtrl'
  };
  
  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  // Apply layout class
  if (settings.layout) {
    element.classList.add(`mtrl-carousel--${settings.layout}`);
  }
  
  // Apply scrollBehavior class
  if (settings.scrollBehavior) {
    element.classList.add(`mtrl-carousel--${settings.scrollBehavior}`);
  }
  
  // Create slides container
  const slidesContainer = document.createElement('div');
  slidesContainer.className = 'mtrl-carousel__slides';
  
  // Create slides elements
  const slideElements: HTMLElement[] = [];
  const slides: CarouselSlide[] = config.slides || [];
  
  // Setup slides
  slides.forEach((slide, index) => {
    const slideElement = document.createElement('div');
    slideElement.className = 'mtrl-carousel__slide';
    slideElement.setAttribute('data-index', index.toString());
    
    // Add slide content
    if (slide.image) {
      const img = document.createElement('img');
      img.className = 'mtrl-carousel__image';
      img.src = slide.image;
      img.alt = slide.title || `Slide ${index + 1}`;
      slideElement.appendChild(img);
    }
    
    if (slide.title) {
      const title = document.createElement('h3');
      title.className = 'mtrl-carousel__title';
      title.textContent = slide.title;
      slideElement.appendChild(title);
    }
    
    if (slide.description) {
      const desc = document.createElement('p');
      desc.className = 'mtrl-carousel__description';
      desc.textContent = slide.description;
      slideElement.appendChild(desc);
    }
    
    if (slide.buttonText && slide.buttonUrl) {
      const button = document.createElement('a');
      button.className = 'mtrl-carousel__button';
      button.textContent = slide.buttonText;
      button.href = slide.buttonUrl;
      slideElement.appendChild(button);
    }
    
    // Apply accent color if available
    if (slide.accent) {
      slideElement.style.setProperty('--carousel-accent-color', slide.accent);
    }
    
    // Apply size class if specified
    if (slide.size) {
      slideElement.classList.add(`mtrl-carousel__slide--${slide.size}`);
    }
    
    slidesContainer.appendChild(slideElement);
    slideElements.push(slideElement);
  });
  
  element.appendChild(slidesContainer);
  
  // Create navigation elements
  const prevButton = document.createElement('button');
  prevButton.className = 'mtrl-carousel__prev';
  prevButton.setAttribute('aria-label', 'Previous slide');
  
  const nextButton = document.createElement('button');
  nextButton.className = 'mtrl-carousel__next';
  nextButton.setAttribute('aria-label', 'Next slide');
  
  element.appendChild(prevButton);
  element.appendChild(nextButton);
  
  // Create indicators
  const indicators = document.createElement('div');
  indicators.className = 'mtrl-carousel__indicators';
  
  slides.forEach((_, index) => {
    const indicator = document.createElement('button');
    indicator.className = 'mtrl-carousel__indicator';
    indicator.setAttribute('data-index', index.toString());
    indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
    
    if (index === settings.initialSlide) {
      indicator.classList.add('mtrl-carousel__indicator--active');
    }
    
    indicators.appendChild(indicator);
  });
  
  element.appendChild(indicators);
  
  // Create Show All link if needed
  if (config.showAllLink !== false) {
    const showAllLink = document.createElement('a');
    showAllLink.className = 'mtrl-carousel__show-all';
    showAllLink.textContent = 'Show all';
    showAllLink.href = '#';
    showAllLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (config.onShowAll) {
        config.onShowAll();
      }
    });
    
    element.appendChild(showAllLink);
  }
  
  // Set up current slide
  let currentSlide = settings.initialSlide;
  
  // Set active slide
  const setActiveSlide = (index: number) => {
    // Update indicators
    const allIndicators = indicators.querySelectorAll('.mtrl-carousel__indicator');
    allIndicators.forEach((ind) => ind.classList.remove('mtrl-carousel__indicator--active'));
    
    const activeIndicator = indicators.querySelector(`.mtrl-carousel__indicator[data-index="${index}"]`);
    if (activeIndicator) {
      activeIndicator.classList.add('mtrl-carousel__indicator--active');
    }
    
    // Update carousel position
    slidesContainer.style.transform = `translateX(-${index * 100}%)`;
    
    // Update current slide
    currentSlide = index;
  };
  
  // Set initial active slide
  setActiveSlide(currentSlide);
  
  // Event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  const emit = (event: string, data?: any) => {
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(handler => handler(data));
    }
  };
  
  // Navigation event listeners
  prevButton.addEventListener('click', () => {
    carousel.prev();
  });
  
  nextButton.addEventListener('click', () => {
    carousel.next();
  });
  
  // Indicator event listeners
  const indicatorButtons = indicators.querySelectorAll('.mtrl-carousel__indicator');
  indicatorButtons.forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt(button.getAttribute('data-index') || '0');
      carousel.goTo(index);
    });
  });
  
  // Create the SlidesAPI
  const slidesAPI = {
    addSlide: (slide: CarouselSlide, index?: number) => {
      const slideElement = document.createElement('div');
      slideElement.className = 'mtrl-carousel__slide';
      
      // Add slide content
      if (slide.image) {
        const img = document.createElement('img');
        img.className = 'mtrl-carousel__image';
        img.src = slide.image;
        img.alt = slide.title || `Slide ${slides.length + 1}`;
        slideElement.appendChild(img);
      }
      
      if (slide.title) {
        const title = document.createElement('h3');
        title.className = 'mtrl-carousel__title';
        title.textContent = slide.title;
        slideElement.appendChild(title);
      }
      
      // Insert slide at specified index or append
      if (index !== undefined && index >= 0 && index <= slides.length) {
        slides.splice(index, 0, slide);
        const insertBeforeElement = index < slideElements.length ? slideElements[index] : null;
        
        if (insertBeforeElement) {
          slidesContainer.insertBefore(slideElement, insertBeforeElement);
          slideElements.splice(index, 0, slideElement);
        } else {
          slidesContainer.appendChild(slideElement);
          slideElements.push(slideElement);
        }
      } else {
        slides.push(slide);
        slidesContainer.appendChild(slideElement);
        slideElements.push(slideElement);
      }
      
      // Update data-index attributes
      slideElements.forEach((el, i) => {
        el.setAttribute('data-index', i.toString());
      });
      
      // Create new indicator
      const indicator = document.createElement('button');
      indicator.className = 'mtrl-carousel__indicator';
      indicator.setAttribute('data-index', (slides.length - 1).toString());
      indicator.setAttribute('aria-label', `Go to slide ${slides.length}`);
      
      indicator.addEventListener('click', () => {
        const indicatorIndex = parseInt(indicator.getAttribute('data-index') || '0');
        carousel.goTo(indicatorIndex);
      });
      
      indicators.appendChild(indicator);
      
      // Emit change event
      emit('slideAdded', { slide, index });
      
      return slidesAPI;
    },
    
    removeSlide: (index: number) => {
      if (index >= 0 && index < slides.length) {
        // Remove slide from arrays
        const [removedSlide] = slides.splice(index, 1);
        const [removedElement] = slideElements.splice(index, 1);
        
        // Remove slide element from DOM
        slidesContainer.removeChild(removedElement);
        
        // Remove indicator
        const indicatorToRemove = indicators.querySelector(`.mtrl-carousel__indicator[data-index="${index}"]`);
        if (indicatorToRemove) {
          indicators.removeChild(indicatorToRemove);
        }
        
        // Update remaining indicators
        const remainingIndicators = indicators.querySelectorAll('.mtrl-carousel__indicator');
        remainingIndicators.forEach((ind, i) => {
          ind.setAttribute('data-index', i.toString());
          ind.setAttribute('aria-label', `Go to slide ${i + 1}`);
        });
        
        // Update data-index attributes on remaining slides
        slideElements.forEach((el, i) => {
          el.setAttribute('data-index', i.toString());
        });
        
        // Adjust current slide if necessary
        if (currentSlide >= slides.length) {
          const newCurrentSlide = Math.max(0, slides.length - 1);
          setActiveSlide(newCurrentSlide);
        }
        
        // Emit change event
        emit('slideRemoved', { slide: removedSlide, index });
      }
      
      return slidesAPI;
    },
    
    updateSlide: (index: number, slide: CarouselSlide) => {
      if (index >= 0 && index < slides.length) {
        slides[index] = { ...slides[index], ...slide };
        const slideElement = slideElements[index];
        
        // Update image if provided
        if (slide.image) {
          let img = slideElement.querySelector('.mtrl-carousel__image');
          if (!img) {
            img = document.createElement('img');
            img.className = 'mtrl-carousel__image';
            slideElement.appendChild(img);
          }
          (img as HTMLImageElement).src = slide.image;
          (img as HTMLImageElement).alt = slide.title || `Slide ${index + 1}`;
        }
        
        // Update title if provided
        if (slide.title !== undefined) {
          let title = slideElement.querySelector('.mtrl-carousel__title');
          if (!title && slide.title) {
            title = document.createElement('h3');
            title.className = 'mtrl-carousel__title';
            slideElement.appendChild(title);
          }
          
          if (title) {
            if (slide.title) {
              title.textContent = slide.title;
            } else {
              slideElement.removeChild(title);
            }
          }
        }
        
        // Update accent color if provided
        if (slide.accent) {
          slideElement.style.setProperty('--carousel-accent-color', slide.accent);
        }
        
        // Emit change event
        emit('slideUpdated', { slide, index });
      }
      
      return slidesAPI;
    },
    
    getSlide: (index: number) => {
      return (index >= 0 && index < slides.length) ? slides[index] : null;
    },
    
    getCount: () => {
      return slides.length;
    },
    
    getElements: () => {
      return [...slideElements];
    }
  };
  
  // Create the carousel component
  const carousel: CarouselComponent = {
    element,
    slides: slidesAPI,
    
    lifecycle: {
      destroy: () => {
        // Clean up event listeners and remove element
        carousel.destroy();
      }
    },
    
    getClass: (name: string) => {
      return `${settings.prefix}-${name}`;
    },
    
    next: () => {
      let nextSlide = currentSlide + 1;
      
      if (nextSlide >= slides.length) {
        if (settings.loop) {
          nextSlide = 0;
        } else {
          nextSlide = slides.length - 1;
        }
      }
      
      setActiveSlide(nextSlide);
      emit('slideChange', { current: nextSlide, previous: currentSlide });
      
      return carousel;
    },
    
    prev: () => {
      let prevSlide = currentSlide - 1;
      
      if (prevSlide < 0) {
        if (settings.loop) {
          prevSlide = slides.length - 1;
        } else {
          prevSlide = 0;
        }
      }
      
      setActiveSlide(prevSlide);
      emit('slideChange', { current: prevSlide, previous: currentSlide });
      
      return carousel;
    },
    
    goTo: (index: number) => {
      if (index >= 0 && index < slides.length) {
        const previousSlide = currentSlide;
        setActiveSlide(index);
        emit('slideChange', { current: index, previous: previousSlide });
      }
      
      return carousel;
    },
    
    getCurrentSlide: () => {
      return currentSlide;
    },
    
    addSlide: (slide: CarouselSlide, index?: number) => {
      slidesAPI.addSlide(slide, index);
      return carousel;
    },
    
    removeSlide: (index: number) => {
      slidesAPI.removeSlide(index);
      return carousel;
    },
    
    enableLoop: () => {
      settings.loop = true;
      return carousel;
    },
    
    disableLoop: () => {
      settings.loop = false;
      return carousel;
    },
    
    setBorderRadius: (radius: number) => {
      settings.borderRadius = radius;
      element.style.setProperty('--carousel-border-radius', `${radius}px`);
      return carousel;
    },
    
    setGap: (gap: number) => {
      settings.gap = gap;
      element.style.setProperty('--carousel-gap', `${gap}px`);
      return carousel;
    },
    
    destroy: () => {
      // Clean up event listeners
      prevButton.removeEventListener('click', carousel.prev);
      nextButton.removeEventListener('click', carousel.next);
      
      // Remove the element from the DOM if it has a parent
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Clear event handlers
      for (const event in eventHandlers) {
        eventHandlers[event] = [];
      }
    },
    
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
      return carousel;
    },
    
    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      return carousel;
    },
    
    addClass: (...classes: string[]) => {
      classes.forEach(className => element.classList.add(className));
      return carousel;
    }
  };
  
  // Apply initial settings
  carousel.setBorderRadius(settings.borderRadius);
  carousel.setGap(settings.gap);
  
  return carousel;
};

describe('Carousel Component', () => {
  test('should create a carousel element', () => {
    const carousel = createMockCarousel();
    expect(carousel.element).toBeDefined();
    expect(carousel.element.tagName).toBe('DIV');
    expect(carousel.element.className).toContain('mtrl-carousel');
  });
  
  test('should create carousel with specified layout', () => {
    const layouts: CarouselLayout[] = ['multi-browse', 'uncontained', 'hero', 'full-screen'];
    
    layouts.forEach(layout => {
      const carousel = createMockCarousel({ layout });
      expect(carousel.element.className).toContain(`mtrl-carousel--${layout}`);
    });
  });
  
  test('should create carousel with specified scroll behavior', () => {
    const behaviors: CarouselScrollBehavior[] = ['default', 'snap'];
    
    behaviors.forEach(behavior => {
      const carousel = createMockCarousel({ scrollBehavior: behavior });
      expect(carousel.element.className).toContain(`mtrl-carousel--${behavior}`);
    });
  });
  
  test('should create carousel with slides', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg', title: 'Slide 1', description: 'Description 1' },
      { image: 'image2.jpg', title: 'Slide 2', description: 'Description 2' },
      { image: 'image3.jpg', title: 'Slide 3', description: 'Description 3' }
    ];
    
    const carousel = createMockCarousel({ slides });
    
    const slideElements = carousel.element.querySelectorAll('.mtrl-carousel__slide');
    expect(slideElements.length).toBe(3);
    
    const imageElements = carousel.element.querySelectorAll('.mtrl-carousel__image');
    expect(imageElements.length).toBe(3);
    
    const titleElements = carousel.element.querySelectorAll('.mtrl-carousel__title');
    expect(titleElements.length).toBe(3);
    expect(titleElements[0].textContent).toBe('Slide 1');
    expect(titleElements[1].textContent).toBe('Slide 2');
    expect(titleElements[2].textContent).toBe('Slide 3');
  });
  
  test('should create navigation controls', () => {
    const carousel = createMockCarousel();
    
    const prevButton = carousel.element.querySelector('.mtrl-carousel__prev');
    expect(prevButton).toBeDefined();
    
    const nextButton = carousel.element.querySelector('.mtrl-carousel__next');
    expect(nextButton).toBeDefined();
  });
  
  test('should create slide indicators', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' },
      { image: 'image3.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides });
    
    const indicators = carousel.element.querySelectorAll('.mtrl-carousel__indicator');
    expect(indicators.length).toBe(3);
  });
  
  test('should show "Show All" link by default', () => {
    const carousel = createMockCarousel();
    const showAllLink = carousel.element.querySelector('.mtrl-carousel__show-all');
    expect(showAllLink).toBeDefined();
  });
  
  test('should hide "Show All" link when specified', () => {
    const carousel = createMockCarousel({ showAllLink: false });
    const showAllLink = carousel.element.querySelector('.mtrl-carousel__show-all');
    expect(showAllLink).toBeNull();
  });
  
  test('should set initial slide', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' },
      { image: 'image3.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides, initialSlide: 1 });
    
    expect(carousel.getCurrentSlide()).toBe(1);
    
    const activeIndicator = carousel.element.querySelector('.mtrl-carousel__indicator--active');
    expect(activeIndicator).toBeDefined();
    expect(activeIndicator?.getAttribute('data-index')).toBe('1');
  });
  
  test('should navigate to next slide', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' },
      { image: 'image3.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides });
    
    expect(carousel.getCurrentSlide()).toBe(0);
    
    carousel.next();
    expect(carousel.getCurrentSlide()).toBe(1);
    
    carousel.next();
    expect(carousel.getCurrentSlide()).toBe(2);
  });
  
  test('should navigate to previous slide', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' },
      { image: 'image3.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides, initialSlide: 2 });
    
    expect(carousel.getCurrentSlide()).toBe(2);
    
    carousel.prev();
    expect(carousel.getCurrentSlide()).toBe(1);
    
    carousel.prev();
    expect(carousel.getCurrentSlide()).toBe(0);
  });
  
  test('should loop to first slide when reaching the end', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' },
      { image: 'image3.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides, loop: true });
    
    expect(carousel.getCurrentSlide()).toBe(0);
    
    carousel.next();
    expect(carousel.getCurrentSlide()).toBe(1);
    
    carousel.next();
    expect(carousel.getCurrentSlide()).toBe(2);
    
    carousel.next();
    expect(carousel.getCurrentSlide()).toBe(0);
  });
  
  test('should loop to last slide when going back from first', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' },
      { image: 'image3.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides, loop: true });
    
    expect(carousel.getCurrentSlide()).toBe(0);
    
    carousel.prev();
    expect(carousel.getCurrentSlide()).toBe(2);
  });
  
  test('should not loop when loop is disabled', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' },
      { image: 'image3.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides, loop: false });
    
    expect(carousel.getCurrentSlide()).toBe(0);
    
    carousel.prev();
    expect(carousel.getCurrentSlide()).toBe(0); // Stays at first slide
    
    carousel.next();
    carousel.next();
    expect(carousel.getCurrentSlide()).toBe(2);
    
    carousel.next();
    expect(carousel.getCurrentSlide()).toBe(2); // Stays at last slide
  });
  
  test('should go to specific slide', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' },
      { image: 'image3.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides });
    
    expect(carousel.getCurrentSlide()).toBe(0);
    
    carousel.goTo(2);
    expect(carousel.getCurrentSlide()).toBe(2);
    
    carousel.goTo(1);
    expect(carousel.getCurrentSlide()).toBe(1);
    
    // Should ignore invalid indices
    carousel.goTo(-1);
    expect(carousel.getCurrentSlide()).toBe(1); // Remains unchanged
    
    carousel.goTo(10);
    expect(carousel.getCurrentSlide()).toBe(1); // Remains unchanged
  });
  
  test('should add a new slide', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides });
    
    expect(carousel.slides.getCount()).toBe(2);
    
    const newSlide: CarouselSlide = { image: 'image3.jpg', title: 'New Slide' };
    carousel.addSlide(newSlide);
    
    expect(carousel.slides.getCount()).toBe(3);
    expect(carousel.slides.getSlide(2)).toEqual(newSlide);
    
    const slideElements = carousel.slides.getElements();
    expect(slideElements.length).toBe(3);
    
    const indicators = carousel.element.querySelectorAll('.mtrl-carousel__indicator');
    expect(indicators.length).toBe(3);
  });
  
  test('should add a slide at specific index', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg' },
      { image: 'image3.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides });
    
    const newSlide: CarouselSlide = { image: 'image2.jpg', title: 'Middle Slide' };
    carousel.addSlide(newSlide, 1);
    
    expect(carousel.slides.getCount()).toBe(3);
    expect(carousel.slides.getSlide(1)).toEqual(newSlide);
  });
  
  test('should remove a slide', () => {
    // Store the original slides separately for reference
    const originalSlides = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' },
      { image: 'image3.jpg' }
    ];
    
    // Create a copy for the carousel
    const slides = [...originalSlides];
    
    const carousel = createMockCarousel({ slides });
    
    expect(carousel.slides.getCount()).toBe(3);
    
    carousel.removeSlide(1);
    
    expect(carousel.slides.getCount()).toBe(2);
    
    // Check that the first and third slides from the original array remain
    expect(carousel.slides.getSlide(0)?.image).toBe('image1.jpg');
    expect(carousel.slides.getSlide(1)?.image).toBe('image3.jpg');
    
    const slideElements = carousel.slides.getElements();
    expect(slideElements.length).toBe(2);
    
    const indicators = carousel.element.querySelectorAll('.mtrl-carousel__indicator');
    expect(indicators.length).toBe(2);
  });
  
  test('should update a slide', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg', title: 'Original Title' },
      { image: 'image2.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides });
    
    const updatedSlide: CarouselSlide = { 
      title: 'Updated Title',
      accent: '#FF0000'
    };
    
    carousel.slides.updateSlide(0, updatedSlide);
    
    const updatedSlideData = carousel.slides.getSlide(0);
    expect(updatedSlideData?.image).toBe('image1.jpg'); // Original property
    expect(updatedSlideData?.title).toBe('Updated Title'); // Updated property
    expect(updatedSlideData?.accent).toBe('#FF0000'); // New property
    
    const slideElement = carousel.slides.getElements()[0];
    const title = slideElement.querySelector('.mtrl-carousel__title');
    expect(title?.textContent).toBe('Updated Title');
  });
  
  test('should enable and disable loop mode', () => {
    const slides: CarouselSlide[] = [
      { image: 'image1.jpg' },
      { image: 'image2.jpg' }
    ];
    
    const carousel = createMockCarousel({ slides, loop: false });
    
    // With loop disabled, we should stay at the first slide
    carousel.prev();
    expect(carousel.getCurrentSlide()).toBe(0);
    
    // Enable loop
    carousel.enableLoop();
    
    // Now we should loop to the last slide
    carousel.prev();
    expect(carousel.getCurrentSlide()).toBe(1);
    
    // Go back to the first slide
    carousel.next();
    expect(carousel.getCurrentSlide()).toBe(0);
    
    // Disable loop
    carousel.disableLoop();
    
    // Move to last slide
    carousel.next();
    expect(carousel.getCurrentSlide()).toBe(1);
    
    // With loop disabled, we should stay at the last slide
    carousel.next();
    expect(carousel.getCurrentSlide()).toBe(1);
  });
  
  test('should set border radius', () => {
    const carousel = createMockCarousel();
    
    carousel.setBorderRadius(24);
    expect(carousel.element.style.getPropertyValue('--carousel-border-radius')).toBe('24px');
  });
  
  test('should set gap between slides', () => {
    const carousel = createMockCarousel();
    
    carousel.setGap(16);
    expect(carousel.element.style.getPropertyValue('--carousel-gap')).toBe('16px');
  });
  
  test('should add event listener', () => {
    const carousel = createMockCarousel();
    let eventFired = false;
    
    carousel.on('slideChange', () => {
      eventFired = true;
    });
    
    carousel.next();
    expect(eventFired).toBe(true);
  });
  
  test('should remove event listener', () => {
    const carousel = createMockCarousel();
    let eventCount = 0;
    
    const handler = () => {
      eventCount++;
    };
    
    carousel.on('slideChange', handler);
    
    carousel.next();
    expect(eventCount).toBe(1);
    
    carousel.off('slideChange', handler);
    
    carousel.next();
    expect(eventCount).toBe(1); // Counter should not increase
  });
  
  test('should be properly destroyed', () => {
    const carousel = createMockCarousel();
    document.body.appendChild(carousel.element);
    
    expect(document.body.contains(carousel.element)).toBe(true);
    
    carousel.destroy();
    expect(document.body.contains(carousel.element)).toBe(false);
  });
});