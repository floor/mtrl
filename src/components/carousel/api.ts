// src/components/carousel/api.ts
import { CarouselComponent, CarouselSlide, CarouselVariant, SlidesAPI } from "./types";

interface ApiComponent {
  element: HTMLElement;
  slides: SlidesAPI;
  getClass: (name: string) => string;
  getCurrentSlide: () => number;
  getVariant: () => CarouselVariant;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  lifecycle?: { destroy: () => void };
  on?: (event: string, handler: Function) => unknown;
  off?: (event: string, handler: Function) => unknown;
}

export const withAPI = () => (component: ApiComponent): CarouselComponent => {
  const api: CarouselComponent = {
    element: component.element,
    slides: component.slides,
    lifecycle: { destroy: () => component.lifecycle?.destroy() },
    getClass: component.getClass,

    next() {
      component.next();
      return api;
    },
    prev() {
      component.prev();
      return api;
    },
    goTo(index: number) {
      component.goTo(index);
      return api;
    },
    getCurrentSlide: () => component.getCurrentSlide(),
    getVariant: () => component.getVariant(),

    addSlide(slide: CarouselSlide, index?: number) {
      component.slides.addSlide(slide, index);
      return api;
    },
    removeSlide(index: number) {
      component.slides.removeSlide(index);
      return api;
    },

    destroy() {
      component.lifecycle?.destroy();
    },
    on(event: string, handler: Function) {
      component.on?.(event, handler);
      return api;
    },
    off(event: string, handler: Function) {
      component.off?.(event, handler);
      return api;
    },
    addClass(...classes: string[]) {
      component.element.classList.add(...classes);
      return api;
    },
  };
  return api;
};
