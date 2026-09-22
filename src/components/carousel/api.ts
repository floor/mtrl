// src/components/carousel/api.ts
import type { CarouselComponent, CarouselSlide, CarouselVariant, SlidesAPI, CarouselEvents } from "./types";

import type { EventCallback } from "../../core/state/emitter";

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
  on?: (event: string, handler: EventCallback) => unknown;
  off?: (event: string, handler: EventCallback) => unknown;
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
    on<K extends keyof CarouselEvents>(event: K, handler: CarouselEvents[K]) {
      component.on?.(event, handler);
      return api;
    },
    off<K extends keyof CarouselEvents>(event: K, handler: CarouselEvents[K]) {
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
