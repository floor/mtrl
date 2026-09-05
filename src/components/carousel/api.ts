// src/components/carousel/api.ts
import { CarouselComponent, CarouselSlide } from "./types";

export const withAPI = () => (component: any): CarouselComponent => {
  const api: CarouselComponent = {
    element: component.element,

    slides: component.slides,

    lifecycle: {
      destroy: () => component.lifecycle?.destroy(),
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

    getCurrentSlide: () => component.getCurrentSlide(),

    addSlide(slide: CarouselSlide, index?: number) {
      component.slides.addSlide(slide, index);
      return this;
    },

    removeSlide(index: number) {
      component.slides.removeSlide(index);
      return this;
    },

    destroy() {
      component.lifecycle?.destroy();
    },

    on(event: string, handler: Function) {
      component.element.addEventListener(event, handler as EventListener);
      return this;
    },

    off(event: string, handler: Function) {
      component.element.removeEventListener(event, handler as EventListener);
      return this;
    },

    addClass(...classes: string[]) {
      classes.forEach((cls) => component.element.classList.add(cls));
      return this;
    },
  };

  return api;
};
