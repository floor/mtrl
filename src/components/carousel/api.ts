// src/components/carousel/api.ts
import { CarouselComponent, CarouselSlide } from './types';

interface ApiOptions {
  slides: {
    addSlide: (slide: CarouselSlide, index?: number) => any;
    removeSlide: (index: number) => any;
    updateSlide: (index: number, slide: CarouselSlide) => any;
    getCount: () => number;
    getElements: () => HTMLElement[];
  };
  lifecycle: {
    destroy: () => void;
  };
}

interface ComponentWithElements {
  element: HTMLElement;
  getClass: (name: string) => string;
  getCurrentSlide: () => number;
  goTo: (index: number) => any;
  next: () => any;
  prev: () => any;
  enableLoop: () => any;
  disableLoop: () => any;
  setBorderRadius?: (radius: number) => any;
  setGap?: (gap: number) => any;
}

/**
 * Enhances a carousel component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Carousel component
 */
export const withAPI = (options: ApiOptions) => 
  (component: ComponentWithElements): CarouselComponent => {
    // Create the API component
    const apiComponent: CarouselComponent = {
      element: component.element,
      
      slides: {
        addSlide: options.slides.addSlide,
        removeSlide: options.slides.removeSlide,
        updateSlide: options.slides.updateSlide,
        getSlide: (index: number): CarouselSlide | null => {
          if (component['slideData'] && index >= 0 && index < component['slideData'].length) {
            return component['slideData'][index];
          }
          return null;
        },
        getCount: options.slides.getCount,
        getElements: options.slides.getElements
      },
      
      lifecycle: {
        destroy: options.lifecycle.destroy
      },
      
      getClass: component.getClass,
      
      next() {
        component.next();
        return this;
      },
      
      prev() {
        component.prev();
        return this;
      },
      
      goTo(index: number) {
        component.goTo(index);
        return this;
      },
      
      getCurrentSlide: component.getCurrentSlide,
      
      addSlide(slide: CarouselSlide, index?: number) {
        options.slides.addSlide(slide, index);
        return this;
      },
      
      removeSlide(index: number) {
        options.slides.removeSlide(index);
        return this;
      },
      
      enableLoop() {
        component.enableLoop();
        return this;
      },
      
      disableLoop() {
        component.disableLoop();
        return this;
      },
      
      setBorderRadius(radius: number) {
        if (component.setBorderRadius) {
          component.setBorderRadius(radius);
        }
        return this;
      },
      
      setGap(gap: number) {
        if (component.setGap) {
          component.setGap(gap);
        }
        return this;
      },
      
      destroy() {
        options.lifecycle.destroy();
      },
      
      // Add event handling and class methods from component
      on(event: string, handler: Function) {
        if (typeof (component as any).on === 'function') {
          (component as any).on(event, handler);
        } else if (component.element.addEventListener) {
          component.element.addEventListener(event, handler as EventListener);
        }
        return this;
      },
      
      off(event: string, handler: Function) {
        if (typeof (component as any).off === 'function') {
          (component as any).off(event, handler);
        } else if (component.element.removeEventListener) {
          component.element.removeEventListener(event, handler as EventListener);
        }
        return this;
      },
      
      addClass(...classes: string[]) {
        if (typeof (component as any).addClass === 'function') {
          (component as any).addClass(...classes);
        } else {
          classes.forEach(cls => component.element.classList.add(cls));
        }
        return this;
      }
    };
    
    return apiComponent;
  };