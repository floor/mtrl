// src/components/carousel/api.ts
import { CarouselComponent, CarouselSlide } from "./types";

interface ApiOptions {
  slides: {
    addSlide: (slide: CarouselSlide, index?: number) => void;
    removeSlide: (index: number) => void;
    updateSlide: (index: number, slide: CarouselSlide) => void;
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
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  enableLoop: () => void;
  disableLoop: () => void;
  setBorderRadius?: (radius: number) => void;
  setGap?: (gap: number) => void;
  on?: (event: string, handler: Function) => void;
  off?: (event: string, handler: Function) => void;
  addClass?: (...classes: string[]) => void;
  slideData?: CarouselSlide[];
}

/**
 * Enhances a carousel component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Carousel component
 */
export const withAPI =
  (options: ApiOptions) =>
  (component: ComponentWithElements): CarouselComponent => {
    // Create the API component
    const apiComponent: CarouselComponent = {
      element: component.element,

      slides: {
        addSlide: (slide: CarouselSlide, index?: number) => {
          options.slides.addSlide(slide, index);
          return apiComponent.slides;
        },
        removeSlide: (index: number) => {
          options.slides.removeSlide(index);
          return apiComponent.slides;
        },
        updateSlide: (index: number, slide: CarouselSlide) => {
          options.slides.updateSlide(index, slide);
          return apiComponent.slides;
        },
        getSlide: (index: number): CarouselSlide | null => {
          if (
            component.slideData &&
            index >= 0 &&
            index < component.slideData.length
          ) {
            return component.slideData[index];
          }
          return null;
        },
        getCount: options.slides.getCount,
        getElements: options.slides.getElements,
      },

      lifecycle: {
        destroy: options.lifecycle.destroy,
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
        if (component.on) {
          component.on(event, handler);
        } else if (component.element.addEventListener) {
          component.element.addEventListener(event, handler as EventListener);
        }
        return this;
      },

      off(event: string, handler: Function) {
        if (component.off) {
          component.off(event, handler);
        } else if (component.element.removeEventListener) {
          component.element.removeEventListener(
            event,
            handler as EventListener
          );
        }
        return this;
      },

      addClass(...classes: string[]) {
        if (component.addClass) {
          component.addClass(...classes);
        } else {
          classes.forEach((cls) => component.element.classList.add(cls));
        }
        return this;
      },
    };

    return apiComponent;
  };
